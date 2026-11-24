import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../shared/database/prisma.client';
import { mailerService } from '../shared/mail/mailer.service';
import { webPushService } from '../shared/push/web-push.service';
import { srsService } from '../modules/srs/srs.service';

export interface VietnamTimeInfo {
  studyDate: string; // YYYY-MM-DD
  hours: number;
  minutes: number;
  totalMinutes: number;
  timeStr: string; // HH:mm
}

export function getVietnamTime(date: Date = new Date()): VietnamTimeInfo {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  const studyDate = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const hours = parseInt(partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const totalMinutes = hours * 60 + minutes;
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return { studyDate, hours, minutes, totalMinutes, timeStr };
}

export function parseReminderTime(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

export class StudyReminderJob {
  private isRunning = false;
  private cronTask: ScheduledTask | null = null;

  start() {
    if (this.cronTask) return;
    // Chạy mỗi 1 phút
    this.cronTask = cron.schedule('* * * * *', async () => {
      await this.runReminderCycle();
    });
    console.log('⏰ [StudyReminderJob] Started recurring cron scheduler (every 1 min, Asia/Ho_Chi_Minh)');
  }

  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
  }

  /**
   * Kiểm tra học viên đã học hoặc ôn bài trong ngày hay chưa (sau mốc T - 15 phút)
   */
  async hasUserStudiedToday(userId: number, referenceDate: Date = new Date()): Promise<boolean> {
    const vnTime = getVietnamTime(referenceDate);
    // Bắt đầu ngày theo giờ VN (00:00:00 Asia/Ho_Chi_Minh)
    const dayStartStr = `${vnTime.studyDate}T00:00:00+07:00`;
    const dayStartDate = new Date(dayStartStr);

    const [lessonProg, submission, srsItem, practice] = await Promise.all([
      prisma.userLessonProgress.findFirst({
        where: {
          user_id: userId,
          last_studied_at: { gte: dayStartDate },
        },
      }),
      prisma.testSubmissions.findFirst({
        where: {
          user_id: userId,
          submitted_at: { gte: dayStartDate },
        },
      }),
      prisma.userSrsItems.findFirst({
        where: {
          user_id: userId,
          last_reviewed_at: { gte: dayStartDate },
        },
      }),
      prisma.userSkillPractices.findFirst({
        where: {
          user_id: userId,
          practiced_at: { gte: dayStartDate },
        },
      }),
    ]);

    return Boolean(lessonProg || submission || srsItem || practice);
  }

  /**
   * Xóa log nhắc học của ngày hiện tại khi học viên đổi sang giờ nhắc mới
   */
  async clearDailyReminderLogs(userId: number, studyDate?: string) {
    const dateStr = studyDate || getVietnamTime().studyDate;
    await prisma.reminderDeliveryLogs.deleteMany({
      where: {
        user_id: userId,
        study_date: dateStr,
      },
    });
  }

  /**
   * Chạy 1 chu kỳ kiểm tra & gửi nhắc học (có thể truyền date giả định để test)
   */
  async runReminderCycle(currentDate: Date = new Date(), targetUserId?: number): Promise<{
    processedUsers: number;
    sentEmails: number;
    sentPushes: number;
    cancelledLateReminders: number;
  }> {
    if (this.isRunning) {
      return { processedUsers: 0, sentEmails: 0, sentPushes: 0, cancelledLateReminders: 0 };
    }
    this.isRunning = true;

    let processedUsers = 0;
    let sentEmails = 0;
    let sentPushes = 0;
    let cancelledLateReminders = 0;

    try {
      const vnTime = getVietnamTime(currentDate);

      // Lấy danh sách người dùng đang hoạt động có bật ít nhất 1 kênh nhắc học
      const users = await prisma.users.findMany({
        where: {
          status: 'ACTIVE',
          ...(targetUserId ? { user_id: targetUserId } : {}),
        },
        include: {
          profile: true,
          notificationSettings: true,
          roadmaps: {
            where: { is_active: true },
            include: { course: true },
            take: 1,
          },
        },
      });

      for (const u of users) {
        // Xác định giờ nhắc học T
        const reminderTimeStr =
          u.profile?.reminder_time ||
          u.notificationSettings?.reminder_time ||
          '20:00';
        const targetMinutes = parseReminderTime(reminderTimeStr);
        if (targetMinutes === null) continue;

        // Xác định kênh bật
        const emailEnabled =
          (u.profile?.email_reminder_enabled !== null && u.profile?.email_reminder_enabled !== undefined)
            ? u.profile.email_reminder_enabled
            : (u.notificationSettings?.notify_email ?? true);

        const pushEnabled =
          (u.profile?.browser_notification_enabled !== null && u.profile?.browser_notification_enabled !== undefined)
            ? u.profile.browser_notification_enabled
            : (u.notificationSettings?.notify_webpush ?? false);

        if (!emailEnabled && !pushEnabled) continue;

        // Tính hiệu số phút: diffMinutes = currentMinutes - targetMinutes
        const diffMinutes = vnTime.totalMinutes - targetMinutes;

        // 5 mốc chính xác: -15, -5, 0, 5, 15
        const validOffsets = [-15, -5, 0, 5, 15];
        if (!validOffsets.includes(diffMinutes)) continue;

        const offset = diffMinutes as -15 | -5 | 0 | 5 | 15;
        processedUsers++;

        // Điều kiện cho mốc nhắc trễ (+5 và +15):
        // Nếu học viên đã học/ôn tập trong ngày -> TỰ ĐỘNG HỦY các mốc nhắc trễ còn lại trên cả 2 kênh
        if (offset === 5 || offset === 15) {
          const hasStudied = await this.hasUserStudiedToday(u.user_id, currentDate);
          if (hasStudied) {
            cancelledLateReminders++;
            continue;
          }
        }

        // Lấy thông tin bài học gợi ý & từ vựng cần ôn để chèn vào nội dung nhắc
        let lessonTitle = u.roadmaps[0]?.course?.title || 'Khóa học tiếng Trung HSK';
        let lessonId: number | undefined = undefined;

        // Lấy bài học UNLOCKED tiếp theo chưa xong
        const nextLessonProgress = await prisma.userLessonProgress.findFirst({
          where: {
            user_id: u.user_id,
            status: { in: ['IN_PROGRESS', 'UNLOCKED'] },
            is_completed: false,
          },
          include: { lesson: true },
          orderBy: { lesson: { order_index: 'asc' } },
        });

        if (nextLessonProgress) {
          lessonTitle = nextLessonProgress.lesson.title;
          lessonId = nextLessonProgress.lesson.lesson_id;
        }

        // Lấy 3-5 thẻ từ vựng đến hạn ôn
        let vocabList: Array<{ character: string; pinyin: string; meaning: string }> = [];
        try {
          const srsQueue = await srsService.getDailyQueue(u.user_id, 5);
          if (srsQueue?.cards) {
            vocabList = srsQueue.cards.slice(0, 5).map((c: any) => ({
              character: c.character,
              pinyin: c.pinyin,
              meaning: c.meaning,
            }));
          }
        } catch {
          // Bỏ qua nếu chưa có dữ liệu SRS
        }

        // ── 1. GỬI EMAIL (nếu bật email_reminder_enabled) ──
        if (emailEnabled) {
          const existingEmailLog = await prisma.reminderDeliveryLogs.findUnique({
            where: {
              user_id_study_date_channel_offset_minutes: {
                user_id: u.user_id,
                study_date: vnTime.studyDate,
                channel: 'EMAIL',
                offset_minutes: offset,
              },
            },
          });

          if (!existingEmailLog) {
            try {
              await mailerService.sendReminderEmail({
                toEmail: u.email,
                displayName: u.display_name,
                reminderTime: reminderTimeStr,
                offsetMinutes: offset,
                lessonTitle,
                lessonId,
                vocabList,
              });

              await prisma.reminderDeliveryLogs.create({
                data: {
                  user_id: u.user_id,
                  study_date: vnTime.studyDate,
                  channel: 'EMAIL',
                  offset_minutes: offset,
                },
              });
              sentEmails++;
            } catch (err: any) {
              console.error(`[StudyReminderJob] Error sending email to ${u.email}:`, err.message);
            }
          }
        }

        // ── 2. GỬI THÔNG BÁO TRÌNH DUYỆT (nếu bật browser_notification_enabled) ──
        if (pushEnabled) {
          const existingPushLog = await prisma.reminderDeliveryLogs.findUnique({
            where: {
              user_id_study_date_channel_offset_minutes: {
                user_id: u.user_id,
                study_date: vnTime.studyDate,
                channel: 'BROWSER',
                offset_minutes: offset,
              },
            },
          });

          if (!existingPushLog) {
            try {
              const pushContent = this.formatPushContent(offset, reminderTimeStr, lessonTitle, vocabList);
              const pushRes = await webPushService.sendToUser(u.user_id, {
                title: pushContent.title,
                body: pushContent.body,
                icon: '/pwa-192x192.png',
                badge: '/favicon.ico',
                tag: `reminder-${vnTime.studyDate}-${offset}`,
                data: {
                  url: lessonId ? `/#/lessons/${lessonId}` : '/#/today',
                  offsetMinutes: offset,
                  timestamp: Date.now(),
                },
              });

              // Ghi log để chống gửi trùng lặp
              await prisma.reminderDeliveryLogs.create({
                data: {
                  user_id: u.user_id,
                  study_date: vnTime.studyDate,
                  channel: 'BROWSER',
                  offset_minutes: offset,
                },
              });

              if (pushRes.sentCount > 0) {
                sentPushes++;
              }
            } catch (err: any) {
              console.error(`[StudyReminderJob] Error sending push to user ${u.user_id}:`, err.message);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[StudyReminderJob] Error in runReminderCycle:', err.message);
    } finally {
      this.isRunning = false;
    }

    return { processedUsers, sentEmails, sentPushes, cancelledLateReminders };
  }

  private formatPushContent(
    offset: -15 | -5 | 0 | 5 | 15,
    reminderTime: string,
    lessonTitle?: string,
    vocabList?: Array<{ character: string; pinyin: string; meaning: string }>
  ): { title: string; body: string } {
    let title = `Nhắc lịch học tiếng Trung (${reminderTime})`;
    let body = `Đã đến giờ học tiếng Trung theo kế hoạch của bạn.`;

    const sampleVocab = vocabList && vocabList.length > 0
      ? ` 📖 Ôn nhanh: ${vocabList.map((v) => `${v.character} (${v.pinyin})`).join(', ')}`
      : '';

    if (offset === -15) {
      title = `Còn 15 phút nữa đến giờ học tiếng Trung (${reminderTime})`;
      body = `Chuẩn bị bài học nào! Buổi học sẽ bắt đầu lúc ${reminderTime}.${sampleVocab}`;
    } else if (offset === -5) {
      title = `Còn 5 phút nữa đến giờ học tiếng Trung (${reminderTime})`;
      body = `Chỉ còn 5 phút nữa! Vào ngay để duy trì chuỗi học tập hàng ngày.${sampleVocab}`;
    } else if (offset === 0) {
      title = `Đến giờ học tiếng Trung rồi (${reminderTime})!`;
      body = `Bắt đầu học ngay hôm nay: "${lessonTitle || 'Khóa học HSK'}".${sampleVocab}`;
    } else if (offset === 5) {
      title = `Bạn đã trễ 5 phút so với lịch học ${reminderTime} hôm nay!`;
      body = `Hôm nay bạn chưa vào học. Chỉ 15 phút mỗi ngày để không đứt streak!${sampleVocab}`;
    } else if (offset === 15) {
      title = `Bạn đã trễ 15 phút so với lịch học ${reminderTime} hôm nay!`;
      body = `Đừng bỏ lỡ ngày hôm nay! Vào học ngay một bài ngắn để giữ vững phong độ.${sampleVocab}`;
    }

    return { title, body };
  }
}

export const studyReminderJob = new StudyReminderJob();
