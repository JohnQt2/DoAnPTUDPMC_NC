import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import {
  RoadmapRuleEngine,
  CourseCurriculumItem,
} from './roadmap-rule.engine';
import { OnboardingSurveyInput } from './user.dto';

export class UserService {
  async getProfile(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        notificationSettings: true,
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          take: 1,
        },
        avatarResource: true,
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    // Calculate completed lessons and active streak
    const completedLessonsCount = await prisma.userLessonProgress.count({
      where: { user_id: userId, is_completed: true },
    });

    let activeRoadmapData: any = null;
    if (user.roadmaps.length > 0) {
      const activeRoadmap = user.roadmaps[0];

      // Đếm tổng số bài học đã xuất bản trong khóa học
      const totalRoadmapLessons = await prisma.lessons.count({
        where: {
          chapter: { course_id: activeRoadmap.course_id },
          status: 'PUBLISHED',
        },
      });

      // Đếm số bài học của khóa học này mà học viên đã hoàn thành
      const completedRoadmapLessons = await prisma.userLessonProgress.count({
        where: {
          user_id: userId,
          is_completed: true,
          lesson: {
            chapter: { course_id: activeRoadmap.course_id },
            status: 'PUBLISHED',
          },
        },
      });

      const roadmapCompletionPercentage =
        totalRoadmapLessons > 0
          ? Math.round((completedRoadmapLessons / totalRoadmapLessons) * 100)
          : 0;

      // Tìm bài học hiện tại cần học tiếp: Ưu tiên bài đang học dở ('IN_PROGRESS') trước; nếu chưa có, tìm bài mới mở khóa ('UNLOCKED')
      let currentProgress = await prisma.userLessonProgress.findFirst({
        where: {
          user_id: userId,
          status: 'IN_PROGRESS',
          is_completed: false,
          lesson: {
            chapter: { course_id: activeRoadmap.course_id },
            status: 'PUBLISHED',
          },
        },
        include: {
          lesson: {
            include: { chapter: true },
          },
        },
        orderBy: [
          { lesson: { chapter: { order_index: 'asc' } } },
          { lesson: { order_index: 'asc' } },
        ],
      });

      if (!currentProgress) {
        currentProgress = await prisma.userLessonProgress.findFirst({
          where: {
            user_id: userId,
            status: 'UNLOCKED',
            is_completed: false,
            lesson: {
              chapter: { course_id: activeRoadmap.course_id },
              status: 'PUBLISHED',
            },
          },
          include: {
            lesson: {
              include: { chapter: true },
            },
          },
          orderBy: [
            { lesson: { chapter: { order_index: 'asc' } } },
            { lesson: { order_index: 'asc' } },
          ],
        });
      }

      const currentLesson = currentProgress
        ? {
            lessonId: currentProgress.lesson.lesson_id,
            title: currentProgress.lesson.title,
            orderIndex: currentProgress.lesson.order_index,
            chapterTitle: currentProgress.lesson.chapter.title,
            estimatedDurationMins: currentProgress.lesson.estimated_duration_mins,
            status: currentProgress.status,
          }
        : null;

      activeRoadmapData = {
        // Giữ nguyên toàn bộ định dạng và thuộc tính cũ
        roadmapId: activeRoadmap.roadmap_id,
        courseId: activeRoadmap.course_id,
        courseTitle: activeRoadmap.course.title,
        courseLevel: activeRoadmap.course.level,
        startingLevel: activeRoadmap.starting_level,
        targetGoal: activeRoadmap.target_goal,
        dailyCommitmentMins: activeRoadmap.daily_commitment_mins,
        // Bổ sung thêm các trường dữ liệu tiến độ thực tế (cả camelCase và snake_case)
        completed_lessons_count: completedRoadmapLessons,
        total_lessons_count: totalRoadmapLessons,
        completion_percentage: roadmapCompletionPercentage,
        completedLessonsCount: completedRoadmapLessons,
        totalLessonsCount: totalRoadmapLessons,
        completionPercentage: roadmapCompletionPercentage,
        current_lesson: currentLesson,
        currentLesson: currentLesson,
      };
    }

    return {
      userId: user.user_id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarResource?.public_url || null,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      completedLessonsCount,
      activeRoadmap: activeRoadmapData,
      notificationSettings: user.notificationSettings
        ? {
            reminderTime: user.notificationSettings.reminder_time,
            notifyEmail: user.notificationSettings.notify_email,
            notifyWebpush: user.notificationSettings.notify_webpush,
          }
        : null,
    };
  }

  /**
   * UC04: Tổng hợp bức tranh tiến độ toàn diện của học viên
   * - active_roadmap
   * - course_progress (tổng bài PUBLISHED, số bài COMPLETED, IN_PROGRESS, % hoàn thành, điểm quiz TB)
   * - lessons_progress (từng bài kèm status, highest_score, completed_at)
   * - next_recommended_lesson (bài IN_PROGRESS hoặc UNLOCKED có thứ tự nhỏ nhất)
   */
  async getUserProgressOverview(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy tài khoản người dùng.');
    }

    const activeRoadmap = user.roadmaps[0] || null;

    let targetCourseId: number | null | undefined = activeRoadmap?.course_id;

    if (!targetCourseId) {
      const firstCourse = await prisma.courses.findFirst({
        where: { is_published: true },
        orderBy: { course_id: 'asc' },
      });
      targetCourseId = firstCourse?.course_id ?? null;
    }

    if (!targetCourseId) {
      return {
        active_roadmap: null,
        activeRoadmap: null,
        course_progress: null,
        courseProgress: null,
        next_recommended_lesson: null,
        nextRecommendedLesson: null,
        lessons_progress: [],
        lessonsProgress: [],
      };
    }

    const course = await prisma.courses.findUnique({
      where: { course_id: targetCourseId },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học.');
    }

    // Flatten all published lessons in sequential order
    const orderedLessons: Array<{
      lesson_id: number;
      chapter_id: number;
      chapter_title: string;
      title: string;
      order_index: number;
      estimated_duration_mins: number;
    }> = [];

    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        orderedLessons.push({
          lesson_id: l.lesson_id,
          chapter_id: ch.chapter_id,
          chapter_title: ch.title,
          title: l.title,
          order_index: l.order_index,
          estimated_duration_mins: l.estimated_duration_mins,
        });
      }
    }

    // Fetch user lesson progress
    const lessonIds = orderedLessons.map((l) => l.lesson_id);
    const progressList = await prisma.userLessonProgress.findMany({
      where: {
        user_id: userId,
        lesson_id: { in: lessonIds },
      },
    });

    const progressMap = new Map<number, any>();
    progressList.forEach((p) => {
      progressMap.set(p.lesson_id, p);
    });

    // Fetch test submissions to compute average_quiz_score
    const submissions = await prisma.testSubmissions.findMany({
      where: {
        user_id: userId,
        test: {
          lesson_id: { in: lessonIds },
        },
      },
      select: { score: true },
    });

    const averageQuizScore =
      submissions.length > 0
        ? Number(
            (submissions.reduce((acc, cur) => acc + cur.score, 0) / submissions.length).toFixed(1)
          )
        : 0;

    // Compute progress & unlock status for each lesson
    const lessonProgressItems: Array<{
      lesson_id: number;
      lessonId: number;
      title: string;
      order_index: number;
      chapter_id: number;
      chapter_title: string;
      estimated_duration_mins: number;
      status: string;
      is_unlocked: boolean;
      is_completed: boolean;
      highest_score: number;
      completed_at: Date | null;
      last_studied_at: Date | null;
    }> = [];

    for (let i = 0; i < orderedLessons.length; i++) {
      const cur = orderedLessons[i];
      const prog = progressMap.get(cur.lesson_id);

      let isUnlocked = false;
      if (i === 0) {
        isUnlocked = true;
      } else if (
        prog?.is_completed ||
        (prog?.status && ['UNLOCKED', 'IN_PROGRESS', 'COMPLETED'].includes(prog.status.toUpperCase()))
      ) {
        isUnlocked = true;
      } else {
        const prev = orderedLessons[i - 1];
        const prevProg = progressMap.get(prev.lesson_id);
        if (prevProg?.is_completed) {
          isUnlocked = true;
        }
      }

      let computedStatus = 'LOCKED';
      if (prog?.is_completed) {
        computedStatus = 'COMPLETED';
      } else if (prog?.status === 'IN_PROGRESS') {
        computedStatus = 'IN_PROGRESS';
      } else if (prog?.status === 'UNLOCKED' || isUnlocked) {
        computedStatus = 'UNLOCKED';
      } else {
        computedStatus = 'LOCKED';
      }

      lessonProgressItems.push({
        lesson_id: cur.lesson_id,
        lessonId: cur.lesson_id,
        title: cur.title,
        order_index: cur.order_index,
        chapter_id: cur.chapter_id,
        chapter_title: cur.chapter_title,
        estimated_duration_mins: cur.estimated_duration_mins,
        status: computedStatus,
        is_unlocked: isUnlocked,
        is_completed: Boolean(prog?.is_completed),
        highest_score: prog?.highest_score || 0,
        completed_at: prog?.completed_at || null,
        last_studied_at: prog?.last_studied_at || null,
      });
    }

    const totalLessons = orderedLessons.length;
    const completedLessons = lessonProgressItems.filter((l) => l.is_completed).length;
    const inProgressLessons = lessonProgressItems.filter((l) => l.status === 'IN_PROGRESS').length;
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Tìm bài học tiếp theo cần học ngay: bài đang ở trạng thái 'IN_PROGRESS' hoặc 'UNLOCKED' có thứ tự nhỏ nhất
    let nextRecommended = lessonProgressItems.find(
      (l) => l.status === 'IN_PROGRESS' && !l.is_completed
    );

    if (!nextRecommended) {
      nextRecommended = lessonProgressItems.find(
        (l) => l.status === 'UNLOCKED' && !l.is_completed
      );
    }

    if (!nextRecommended && lessonProgressItems.length > 0) {
      nextRecommended = lessonProgressItems[lessonProgressItems.length - 1];
    }

    const nextRecommendedLesson = nextRecommended
      ? {
          lesson_id: nextRecommended.lesson_id,
          lessonId: nextRecommended.lesson_id,
          title: nextRecommended.title,
          order_index: nextRecommended.order_index,
          chapter_id: nextRecommended.chapter_id,
          chapter_title: nextRecommended.chapter_title,
          estimated_duration_mins: nextRecommended.estimated_duration_mins,
          status: nextRecommended.status,
          highest_score: nextRecommended.highest_score,
        }
      : null;

    return {
      active_roadmap: activeRoadmap
        ? {
            roadmap_id: activeRoadmap.roadmap_id,
            roadmapId: activeRoadmap.roadmap_id,
            course_id: activeRoadmap.course_id,
            courseId: activeRoadmap.course_id,
            course_title: activeRoadmap.course.title,
            courseTitle: activeRoadmap.course.title,
            course_code: activeRoadmap.course.code,
            courseCode: activeRoadmap.course.code,
            course_level: activeRoadmap.course.level,
            courseLevel: activeRoadmap.course.level,
            starting_level: activeRoadmap.starting_level,
            target_goal: activeRoadmap.target_goal,
            daily_commitment_mins: activeRoadmap.daily_commitment_mins,
            is_active: activeRoadmap.is_active,
            created_at: activeRoadmap.created_at,
          }
        : null,
      course_progress: {
        course_id: course.course_id,
        course_title: course.title,
        total_lessons: totalLessons,
        totalLessons: totalLessons,
        completed_lessons: completedLessons,
        completedLessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        inProgressLessons: inProgressLessons,
        completion_percentage: completionPercentage,
        completionPercentage: completionPercentage,
        average_quiz_score: averageQuizScore,
        averageQuizScore: averageQuizScore,
      },
      next_recommended_lesson: nextRecommendedLesson,
      nextRecommendedLesson: nextRecommendedLesson,
      lessons_progress: lessonProgressItems,
      lessonsProgress: lessonProgressItems,
    };
  }

  async updateProfile(
    userId: number,
    data: { display_name?: string; avatar_url?: string; avatar_resource_id?: number }
  ) {
    let avatarResourceId = data.avatar_resource_id;

    if (data.avatar_url && !avatarResourceId) {
      const media = await prisma.mediaResources.create({
        data: {
          file_name: `avatar_${userId}_${Date.now()}.jpg`,
          storage_key: `avatars/user_${userId}_${Date.now()}`,
          public_url: data.avatar_url,
          mime_type: 'image/jpeg',
          resource_type: 'IMAGE',
          uploaded_by: userId,
        },
      });
      avatarResourceId = media.resource_id;
    }

    const user = await prisma.users.update({
      where: { user_id: userId },
      data: {
        ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
        ...(avatarResourceId !== undefined ? { avatar_resource_id: avatarResourceId } : {}),
      },
      include: { avatarResource: true },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'UPDATE_PROFILE',
        target_entity: 'Users',
        target_id: userId.toString(),
        new_value: JSON.stringify(data),
      },
    });

    return {
      userId: user.user_id,
      displayName: user.display_name,
      avatarUrl: user.avatarResource?.public_url || null,
    };
  }

  /**
   * UC02: Khảo sát mục tiêu và thiết lập lộ trình cá nhân hóa (RoadmapRuleEngine)
   */
  async submitOnboarding(userId: number, data: OnboardingSurveyInput) {
    // 1. Lấy danh sách khóa học, chương học và bài học đã phát hành để làm dữ liệu cho engine
    const courses = (await prisma.courses.findMany({
      where: { is_published: true },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
      orderBy: { course_id: 'asc' },
    })) as CourseCurriculumItem[];

    if (courses.length === 0) {
      throw AppError.badRequest('Hệ thống hiện chưa có khóa học nào được kích hoạt.');
    }

    // 2. Chạy thuật toán khớp lộ trình cá nhân hóa
    const matched = RoadmapRuleEngine.matchRoadmap(data, courses);

    // 3. Thực thi lưu trữ nguyên tử trong transaction
    const result = await prisma.$transaction(async (tx) => {
      // 3.1. Vô hiệu hóa lộ trình đang hoạt động trước đó (nếu có)
      await tx.userRoadmaps.updateMany({
        where: { user_id: userId, is_active: true },
        data: { is_active: false },
      });

      // 3.2. Tạo lộ trình cá nhân hóa mới
      const roadmap = await tx.userRoadmaps.create({
        data: {
          user_id: userId,
          course_id: matched.courseId,
          starting_level: data.starting_level,
          target_goal: data.target_goal,
          daily_commitment_mins: matched.dailyCommitmentMins,
          is_active: true,
        },
        include: { course: true },
      });

      // 3.3. Cập nhật hoặc khởi tạo cài đặt nhắc học
      const notifSettings = await tx.notificationSettings.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          reminder_time: matched.reminderTime,
          notify_email: true,
          notify_webpush: false,
        },
        update: {
          reminder_time: matched.reminderTime,
        },
      });

      // 3.4. Khởi tạo trạng thái tiến độ bài học (UserLessonProgress)
      // Mở khóa các bài học ban đầu (UNLOCKED) nếu chưa COMPLETED
      for (const lessonId of matched.initialUnlockedLessonIds) {
        const existing = await tx.userLessonProgress.findUnique({
          where: {
            user_id_lesson_id: {
              user_id: userId,
              lesson_id: lessonId,
            },
          },
        });

        if (!existing) {
          await tx.userLessonProgress.create({
            data: {
              user_id: userId,
              lesson_id: lessonId,
              status: 'UNLOCKED',
              is_completed: false,
              highest_score: 0,
            },
          });
        } else if (!existing.is_completed && (existing.status === 'LOCKED' || !existing.status)) {
          await tx.userLessonProgress.update({
            where: { progress_id: existing.progress_id },
            data: { status: 'UNLOCKED' },
          });
        }
      }

      // 3.5. Ghi sự kiện vào bảng OutboxMessages (Transactional Outbox Pattern)
      await tx.outboxMessages.create({
        data: {
          aggregate_type: 'ONBOARDING',
          aggregate_id: String(userId),
          event_type: 'ROADMAP_CREATED',
          payload: JSON.stringify({
            userId,
            roadmapId: roadmap.roadmap_id,
            courseId: matched.courseId,
            courseTitle: matched.courseTitle,
            courseCode: matched.courseCode,
            courseLevel: matched.courseLevel,
            startingLevel: data.starting_level,
            targetGoal: data.target_goal,
            dailyCommitmentMins: matched.dailyCommitmentMins,
            reminderTime: matched.reminderTime,
            recommendedFirstLessonId: matched.recommendedFirstLessonId,
            initialUnlockedLessonIds: matched.initialUnlockedLessonIds,
            estimatedDays: matched.estimatedDays,
            lessonsPerWeek: matched.lessonsPerWeek,
            weeklyMilestones: matched.weeklyMilestones,
            isSkip: Boolean(data.skip),
            timestamp: new Date().toISOString(),
          }),
          status: 'PENDING',
        },
      });

      // 3.6. Ghi nhật ký kiểm toán (AuditLogs)
      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: 'ONBOARDING_SURVEY_COMPLETED',
          target_entity: 'UserRoadmaps',
          target_id: roadmap.roadmap_id.toString(),
          new_value: JSON.stringify({
            roadmapId: roadmap.roadmap_id,
            courseId: matched.courseId,
            recommendedFirstLessonId: matched.recommendedFirstLessonId,
            initialUnlockedLessonIds: matched.initialUnlockedLessonIds,
            estimatedDays: matched.estimatedDays,
            isSkip: Boolean(data.skip),
          }),
        },
      });

      // 3.7. Lấy chi tiết bài học khuyến nghị bắt đầu
      let recommendedFirstLessonDetail: any = null;
      if (matched.recommendedFirstLessonId) {
        const lesson = await tx.lessons.findUnique({
          where: { lesson_id: matched.recommendedFirstLessonId },
          include: { chapter: true },
        });
        if (lesson) {
          recommendedFirstLessonDetail = {
            lessonId: lesson.lesson_id,
            title: lesson.title,
            orderIndex: lesson.order_index,
            chapterId: lesson.chapter_id,
            chapterTitle: lesson.chapter.title,
            estimatedDurationMins: lesson.estimated_duration_mins,
            status: 'UNLOCKED',
          };
        }
      }

      return {
        roadmap: {
          roadmapId: roadmap.roadmap_id,
          courseId: matched.courseId,
          courseTitle: matched.courseTitle,
          courseCode: matched.courseCode,
          courseLevel: matched.courseLevel,
          startingLevel: roadmap.starting_level,
          targetGoal: roadmap.target_goal,
          dailyCommitmentMins: roadmap.daily_commitment_mins,
          isActive: roadmap.is_active,
          createdAt: roadmap.created_at,
          estimatedDays: matched.estimatedDays,
          lessonsPerWeek: matched.lessonsPerWeek,
          totalLessons: matched.totalLessons,
          learningFocus: matched.learningFocus,
        },
        notification_settings: {
          reminderTime: notifSettings.reminder_time,
          notifyEmail: notifSettings.notify_email,
          notifyWebpush: notifSettings.notify_webpush,
        },
        recommended_first_lesson: recommendedFirstLessonDetail,
        recommendedFirstLessonId: matched.recommendedFirstLessonId,
        initial_unlocked_lesson_ids: matched.initialUnlockedLessonIds,
        weekly_milestones: matched.weeklyMilestones,
      };
    });

    return result;
  }

  /**
   * Xem trước lộ trình đề xuất (Preview Onboarding Roadmap) - Không ghi vào DB
   */
  async previewOnboarding(data: OnboardingSurveyInput) {
    const courses = (await prisma.courses.findMany({
      where: { is_published: true },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
      orderBy: { course_id: 'asc' },
    })) as CourseCurriculumItem[];

    if (courses.length === 0) {
      throw AppError.badRequest('Hệ thống hiện chưa có khóa học nào được kích hoạt.');
    }

    const matched = RoadmapRuleEngine.matchRoadmap(data, courses);

    let recommendedFirstLessonDetail: any = null;
    if (matched.recommendedFirstLessonId) {
      const lesson = await prisma.lessons.findUnique({
        where: { lesson_id: matched.recommendedFirstLessonId },
        include: { chapter: true },
      });
      if (lesson) {
        recommendedFirstLessonDetail = {
          lessonId: lesson.lesson_id,
          title: lesson.title,
          orderIndex: lesson.order_index,
          chapterId: lesson.chapter_id,
          chapterTitle: lesson.chapter.title,
          estimatedDurationMins: lesson.estimated_duration_mins,
          status: 'UNLOCKED',
        };
      }
    }

    return {
      courseId: matched.courseId,
      courseTitle: matched.courseTitle,
      courseCode: matched.courseCode,
      courseLevel: matched.courseLevel,
      startingLevel: matched.startingLevel,
      targetGoal: matched.targetGoal,
      dailyCommitmentMins: matched.dailyCommitmentMins,
      reminderTime: matched.reminderTime,
      estimatedDays: matched.estimatedDays,
      lessonsPerWeek: matched.lessonsPerWeek,
      totalLessons: matched.totalLessons,
      learningFocus: matched.learningFocus,
      initialUnlockedLessonIds: matched.initialUnlockedLessonIds,
      recommended_first_lesson: recommendedFirstLessonDetail,
      recommendedFirstLessonId: matched.recommendedFirstLessonId,
      weekly_milestones: matched.weeklyMilestones,
    };
  }

  /**
   * Truy xuất lộ trình đang hoạt động (Active Roadmap) kèm tiến độ học tập thực tế
   */
  async getActiveRoadmap(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          take: 1,
        },
        notificationSettings: true,
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy tài khoản người dùng.');
    }

    const activeRoadmap = user.roadmaps[0];
    if (!activeRoadmap) {
      return null;
    }

    // Lấy thông tin chi tiết khóa học, chương và các bài học PUBLISHED
    const course = await prisma.courses.findUnique({
      where: { course_id: activeRoadmap.course_id },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học của lộ trình.');
    }

    // Lấy danh sách khóa học để chạy engine tính milestone chuẩn
    const courses = (await prisma.courses.findMany({
      where: { is_published: true },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
      orderBy: { course_id: 'asc' },
    })) as CourseCurriculumItem[];

    const matched = RoadmapRuleEngine.matchRoadmap(
      {
        starting_level: activeRoadmap.starting_level as any,
        target_goal: activeRoadmap.target_goal as any,
        daily_commitment_mins: activeRoadmap.daily_commitment_mins,
        reminder_time: user.notificationSettings?.reminder_time || '20:00',
        course_id: activeRoadmap.course_id,
      },
      courses
    );

    // Thu thập toàn bộ bài học theo thứ tự học
    const flatLessons: Array<{
      lesson_id: number;
      chapter_id: number;
      chapter_title: string;
      title: string;
      order_index: number;
      estimated_duration_mins: number;
    }> = [];

    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        flatLessons.push({
          lesson_id: l.lesson_id,
          chapter_id: ch.chapter_id,
          chapter_title: ch.title,
          title: l.title,
          order_index: l.order_index,
          estimated_duration_mins: l.estimated_duration_mins,
        });
      }
    }

    // Lấy tiến độ học tập thực tế của học viên trên các bài học này
    const lessonIds = flatLessons.map((l) => l.lesson_id);
    const progressList = await prisma.userLessonProgress.findMany({
      where: {
        user_id: userId,
        lesson_id: { in: lessonIds },
      },
    });

    const progressMap = new Map<
      number,
      {
        status: string;
        is_completed: boolean;
        highest_score: number | null;
        completed_at: Date | null;
        last_studied_at: Date;
      }
    >();

    progressList.forEach((p) => {
      progressMap.set(p.lesson_id, {
        status: p.status || (p.is_completed ? 'COMPLETED' : 'LOCKED'),
        is_completed: p.is_completed,
        highest_score: p.highest_score,
        completed_at: p.completed_at,
        last_studied_at: p.last_studied_at,
      });
    });

    const totalLessonsCount = flatLessons.length;
    const completedLessonsCount = flatLessons.filter(
      (l) => progressMap.get(l.lesson_id)?.is_completed
    ).length;
    const completionPercentage =
      totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    // Xác định bài học hiện tại (current_lesson): bài UNLOCKED đầu tiên chưa hoàn thành
    let currentLessonItem = flatLessons.find((l) => {
      const p = progressMap.get(l.lesson_id);
      return !p?.is_completed && p?.status === 'UNLOCKED';
    });

    if (!currentLessonItem) {
      currentLessonItem = flatLessons.find((l) => !progressMap.get(l.lesson_id)?.is_completed);
    }
    if (!currentLessonItem && flatLessons.length > 0) {
      currentLessonItem = flatLessons[flatLessons.length - 1];
    }

    const currentLesson = currentLessonItem
      ? {
          lessonId: currentLessonItem.lesson_id,
          title: currentLessonItem.title,
          orderIndex: currentLessonItem.order_index,
          chapterId: currentLessonItem.chapter_id,
          chapterTitle: currentLessonItem.chapter_title,
          estimatedDurationMins: currentLessonItem.estimated_duration_mins,
          status: progressMap.get(currentLessonItem.lesson_id)?.status || 'UNLOCKED',
          isCompleted: progressMap.get(currentLessonItem.lesson_id)?.is_completed || false,
          highestScore: progressMap.get(currentLessonItem.lesson_id)?.highest_score || 0,
        }
      : null;

    // Tiến độ theo từng chương (chapters_progress)
    const chaptersProgress = course.chapters.map((ch) => {
      const chLessons = ch.lessons;
      const chCompleted = chLessons.filter(
        (l) => progressMap.get(l.lesson_id)?.is_completed
      ).length;
      return {
        chapterId: ch.chapter_id,
        title: ch.title,
        orderIndex: ch.order_index,
        totalLessons: chLessons.length,
        completedLessons: chCompleted,
        isCompleted: chLessons.length > 0 && chCompleted === chLessons.length,
      };
    });

    // Làm giàu weekly_milestones với dữ liệu tiến độ thực tế của từng bài
    const enrichedMilestones = matched.weeklyMilestones.map((m) => {
      const milestoneLessons = m.lessonIds.map((id) => {
        const l = flatLessons.find((item) => item.lesson_id === id);
        const p = progressMap.get(id);
        return {
          lessonId: id,
          title: l?.title || '',
          chapterTitle: l?.chapter_title || '',
          estimatedDurationMins: l?.estimated_duration_mins || 15,
          status: p?.status || 'LOCKED',
          isCompleted: p?.is_completed || false,
          highestScore: p?.highest_score || 0,
        };
      });
      const compCount = milestoneLessons.filter((l) => l.isCompleted).length;
      return {
        ...m,
        completedLessonsCount: compCount,
        isCompleted: milestoneLessons.length > 0 && compCount === milestoneLessons.length,
        lessons: milestoneLessons,
      };
    });

    return {
      roadmapId: activeRoadmap.roadmap_id,
      courseId: activeRoadmap.course_id,
      courseTitle: activeRoadmap.course.title,
      courseCode: activeRoadmap.course.code,
      courseLevel: activeRoadmap.course.level,
      startingLevel: activeRoadmap.starting_level,
      targetGoal: activeRoadmap.target_goal,
      dailyCommitmentMins: activeRoadmap.daily_commitment_mins,
      isActive: activeRoadmap.is_active,
      createdAt: activeRoadmap.created_at,
      completed_lessons_count: completedLessonsCount,
      total_lessons_count: totalLessonsCount,
      completion_percentage: completionPercentage,
      completedLessonsCount,
      totalLessonsCount,
      completionPercentage,
      current_lesson: currentLesson,
      currentLesson,
      estimatedDays: matched.estimatedDays,
      lessonsPerWeek: matched.lessonsPerWeek,
      learningFocus: matched.learningFocus,
      chaptersProgress,
      weekly_milestones: enrichedMilestones,
      weeklyMilestones: enrichedMilestones,
      notificationSettings: user.notificationSettings
        ? {
            reminderTime: user.notificationSettings.reminder_time,
            notifyEmail: user.notificationSettings.notify_email,
            notifyWebpush: user.notificationSettings.notify_webpush,
          }
        : null,
    };
  }

  /**
   * UC03: Cập nhật cài đặt thông báo nhắc học
   */
  async updateNotificationSettings(
    userId: number,
    data: { reminder_time?: string; notify_email?: boolean; notify_webpush?: boolean }
  ) {
    const settings = await prisma.notificationSettings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        reminder_time: data.reminder_time || '20:00',
        notify_email: data.notify_email ?? true,
        notify_webpush: data.notify_webpush ?? false,
      },
      update: {
        reminder_time: data.reminder_time,
        notify_email: data.notify_email,
        notify_webpush: data.notify_webpush,
      },
    });

    return settings;
  }

  /**
   * RBAC Admin: Quản lý danh sách người dùng và phân quyền
   */
  async adminListUsers(query: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { display_name: { contains: query.search } },
      ];
    }

    const [total, users, totalUsers, activeUsers, adminCount, editorCount, lockedCount] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          email: true,
          display_name: true,
          role: true,
          status: true,
          created_at: true,
          last_login_at: true,
        },
      }),
      prisma.users.count(),
      prisma.users.count({ where: { status: 'ACTIVE' } }),
      prisma.users.count({ where: { role: 'ADMIN' } }),
      prisma.users.count({ where: { role: 'CONTENT_EDITOR' } }),
      prisma.users.count({ where: { status: { in: ['LOCKED', 'BANNED'] } } }),
    ]);

    return {
      users,
      summary: {
        totalUsers,
        activeUsers,
        adminCount,
        editorCount,
        lockedCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * RBAC Admin: Truy xuất nhật ký kiểm toán bảo mật & phân quyền (Audit Logs)
   */
  async adminListAuditLogs(limit: number = 25) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const logs = await prisma.auditLogs.findMany({
      take: safeLimit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            display_name: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      logId: log.log_id,
      actionType: log.action_type,
      targetEntity: log.target_entity,
      targetId: log.target_id,
      oldValue: log.old_value,
      newValue: log.new_value,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      actor: log.user
        ? {
            userId: log.user.user_id,
            email: log.user.email,
            displayName: log.user.display_name,
            role: log.user.role,
          }
        : null,
    }));
  }

  async adminUpdateUser(adminId: number, targetUserId: number, data: { role?: string; status?: string }) {
    // Prevent self-demotion or self-lockout
    if (adminId === targetUserId) {
      if (data.status === 'LOCKED' || data.status === 'BANNED') {
        throw AppError.badRequest('Quản trị viên không thể tự khóa tài khoản của chính mình.');
      }
      if (data.role && data.role !== 'ADMIN') {
        throw AppError.badRequest('Quản trị viên không thể tự hạ quyền của chính mình.');
      }
    }

    const existingTarget = await prisma.users.findUnique({
      where: { user_id: targetUserId },
      select: { role: true, status: true },
    });

    if (!existingTarget) {
      throw AppError.notFound('Không tìm thấy tài khoản người dùng cần cập nhật.');
    }

    const user = await prisma.users.update({
      where: { user_id: targetUserId },
      data: {
        role: data.role,
        status: data.status,
      },
    });

    // If account was locked or banned, revoke all their active sessions immediately
    if (data.status === 'LOCKED' || data.status === 'BANNED') {
      await prisma.userSessions.updateMany({
        where: { user_id: targetUserId },
        data: { is_revoked: true },
      });
    }

    await prisma.auditLogs.create({
      data: {
        user_id: adminId,
        action_type: 'ADMIN_UPDATE_USER',
        target_entity: 'Users',
        target_id: targetUserId.toString(),
        old_value: JSON.stringify(existingTarget),
        new_value: JSON.stringify(data),
      },
    });

    return user;
  }
}

export const userService = new UserService();
