import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';
import { studyReminderJob, getVietnamTime } from '../jobs/study-reminder.job';

async function runStudyReminderTestSuite() {
  console.log('🧪 Bắt đầu Bộ Kiểm Thử Hệ Thống Nhắc Lịch Học Hằng Ngày (Email & Web Push)...\n');

  let server: http.Server | null = null;
  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address() as any;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const timestamp = Date.now();
    const testEmail = `student_remind_${timestamp}@example.com`;

    // Tạo học viên phục vụ kiểm thử
    const testUser = await prisma.users.create({
      data: {
        email: testEmail,
        password_hash: 'dummyhash123',
        display_name: 'Nguyễn Văn Nhắc Học',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    const accessToken = signAccessToken({
      userId: testUser.user_id,
      email: testUser.email,
      role: testUser.role,
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 1: API QUẢN LÝ CÀI ĐẶT NHẮC HỌC & ĐĂNG KÝ WEB PUSH
    // ═══════════════════════════════════════════════════════════════════════
    console.log('▶ [PHẦN 1] API CÀI ĐẶT NHẮC HỌC & WEB PUSH SUBSCRIPTION');

    // 1.1 Lấy VAPID public key
    console.log('  • Test 1.1: GET /users/push/vapid-public-key');
    const vapidRes = await fetch(`${baseUrl}/api/v1/users/push/vapid-public-key`, {
      method: 'GET',
      headers: authHeaders,
    });
    assert.strictEqual(vapidRes.status, 200);
    const vapidJson = (await vapidRes.json()) as any;
    assert.strictEqual(vapidJson.success, true);
    assert(typeof vapidJson.data?.publicKey === 'string' && vapidJson.data.publicKey.length > 20);
    console.log('    ✔ Trả về VAPID Public Key hợp lệ cho client.');

    // 1.2 Đăng ký Web Push subscription
    console.log('  • Test 1.2: POST /users/push/subscribe');
    const dummyEndpoint = `https://fcm.googleapis.com/fcm/send/test-sub-${timestamp}`;
    const subRes = await fetch(`${baseUrl}/api/v1/users/push/subscribe`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        endpoint: dummyEndpoint,
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t044814Uc2xCAsPsZSqFixS3e0',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
        userAgent: 'Mozilla/5.0 TestBrowser',
      }),
    });
    assert.strictEqual(subRes.status, 200);
    const subJson = (await subRes.json()) as any;
    assert.strictEqual(subJson.success, true);

    const savedSub = await prisma.pushSubscriptions.findUnique({
      where: { endpoint: dummyEndpoint },
    });
    assert(savedSub !== null);
    assert.strictEqual(savedSub.user_id, testUser.user_id);
    console.log('    ✔ Lưu PushSubscription của trình duyệt vào database thành công.');

    // 1.3 Cập nhật giờ nhắc học và bật cả 2 kênh (Email & Browser)
    console.log('  • Test 1.3: PATCH /users/reminder-settings (20:00, cả 2 kênh)');
    const updateRes = await fetch(`${baseUrl}/api/v1/users/reminder-settings`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        reminder_time: '20:00',
        email_reminder_enabled: true,
        browser_notification_enabled: true,
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    const userProfile = await prisma.userProfiles.findUnique({
      where: { user_id: testUser.user_id },
    });
    const notifSettings = await prisma.notificationSettings.findUnique({
      where: { user_id: testUser.user_id },
    });
    assert.strictEqual(userProfile?.reminder_time, '20:00');
    assert.strictEqual(userProfile?.email_reminder_enabled, true);
    assert.strictEqual(userProfile?.browser_notification_enabled, true);
    assert.strictEqual(notifSettings?.reminder_time, '20:00');
    assert.strictEqual(notifSettings?.notify_email, true);
    assert.strictEqual(notifSettings?.notify_webpush, true);
    console.log('    ✔ Cập nhật & đồng bộ cài đặt nhắc học sang cả UserProfiles và NotificationSettings.');

    // 1.4 Gửi thử thông báo mẫu (POST /users/reminder-settings/test)
    console.log('  • Test 1.4: POST /users/reminder-settings/test');
    const testRemindRes = await fetch(`${baseUrl}/api/v1/users/reminder-settings/test`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.strictEqual(testRemindRes.status, 200);
    const testRemindJson = (await testRemindRes.json()) as any;
    assert.strictEqual(testRemindJson.success, true);
    assert(testRemindJson.data?.email !== undefined);
    assert(testRemindJson.data?.push !== undefined);
    console.log('    ✔ Gửi thử nghiệm mẫu thành công cho cả 2 kênh Email và Web Push.');

    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 2: TÍNH TOÁN 5 MỐC THỜI GIAN THEO MÚI GIỜ ASIA/HO_CHI_MINH
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 2] KIỂM TRA 5 MỐC THỜI GIAN NHẮC HỌC (-15, -5, 0, +5, +15)');

    // Tạo helper sinh Date theo giờ Việt Nam: YYYY-MM-DDTHH:mm:00+07:00
    const todayVn = getVietnamTime().studyDate;
    const makeVnDate = (timeStr: string) => new Date(`${todayVn}T${timeStr}:00+07:00`);

    // Dọn dẹp log trước khi test mốc
    await studyReminderJob.clearDailyReminderLogs(testUser.user_id, todayVn);

    // Mốc 1: T - 15 phút (19:45)
    console.log('  • Test 2.1: Mốc T - 15 phút (19:45)');
    const resMinus15 = await studyReminderJob.runReminderCycle(makeVnDate('19:45'), testUser.user_id);
    assert(resMinus15.processedUsers >= 1);
    const logMinus15 = await prisma.reminderDeliveryLogs.findMany({
      where: { user_id: testUser.user_id, offset_minutes: -15, study_date: todayVn },
    });
    assert.strictEqual(logMinus15.length, 2, 'Phải có 2 log cho Email và Browser tại mốc -15p');
    console.log('    ✔ Gửi đồng thời Email + Browser notification tại mốc -15 phút.');

    // Mốc 2: T - 5 phút (19:55)
    console.log('  • Test 2.2: Mốc T - 5 phút (19:55)');
    const resMinus5 = await studyReminderJob.runReminderCycle(makeVnDate('19:55'), testUser.user_id);
    assert(resMinus5.processedUsers >= 1);
    const logMinus5 = await prisma.reminderDeliveryLogs.findMany({
      where: { user_id: testUser.user_id, offset_minutes: -5, study_date: todayVn },
    });
    assert.strictEqual(logMinus5.length, 2);
    console.log('    ✔ Gửi đồng thời Email + Browser notification tại mốc -5 phút.');

    // Mốc 3: Đúng giờ học T (20:00)
    console.log('  • Test 2.3: Mốc đúng giờ học T (20:00)');
    const resZero = await studyReminderJob.runReminderCycle(makeVnDate('20:00'), testUser.user_id);
    assert(resZero.processedUsers >= 1);
    const logZero = await prisma.reminderDeliveryLogs.findMany({
      where: { user_id: testUser.user_id, offset_minutes: 0, study_date: todayVn },
    });
    assert.strictEqual(logZero.length, 2);
    console.log('    ✔ Gửi đồng thời Email + Browser notification đúng tại mốc T (0 phút).');

    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 3: CƠ CHẾ CHỐNG GỬI TRÙNG LẶP (DEDUPLICATION)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 3] KIỂM TRA CHỐNG GỬI TRÙNG LẶP TRONG NGÀY (DEDUPLICATION)');
    console.log('  • Test 3.1: Chạy lại đúng mốc 20:00 lần thứ hai trong ngày');
    const duplicateCycle = await studyReminderJob.runReminderCycle(makeVnDate('20:00'), testUser.user_id);
    // Không gửi thêm bất kỳ email hay push nào vì đã có log trong ngày
    assert.strictEqual(duplicateCycle.sentEmails, 0, 'Không được gửi lại email đã gửi trong ngày');
    assert.strictEqual(duplicateCycle.sentPushes, 0, 'Không được gửi lại push đã gửi trong ngày');
    console.log('    ✔ Đã chặn gửi trùng lặp thành công nhờ ReminderDeliveryLogs.');

    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 4: ĐIỀU KIỆN TỰ ĐỘNG DỪNG NHẮC TRỄ (+5, +15) KHI HỌC VIÊN ĐÃ HỌC
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 4] KIỂM TRA ĐIỀU KIỆN TỰ ĐỘNG DỪNG NHẮC TRỄ (+5, +15)');

    // 4.1 Khi học viên CHƯA học: Gửi nhắc trễ bình thường
    console.log('  • Test 4.1: Học viên chưa học -> Gửi nhắc trễ mốc +5 (20:05) và +15 (20:15)');
    const resPlus5 = await studyReminderJob.runReminderCycle(makeVnDate('20:05'), testUser.user_id);
    assert(resPlus5.sentEmails >= 1 || resPlus5.sentPushes >= 1 || resPlus5.processedUsers >= 1);
    const logPlus5 = await prisma.reminderDeliveryLogs.findMany({
      where: { user_id: testUser.user_id, offset_minutes: 5, study_date: todayVn },
    });
    assert.strictEqual(logPlus5.length, 2, 'Phải gửi nhắc trễ 5p cho cả 2 kênh khi chưa học');
    console.log('    ✔ Đã gửi nhắc trễ +5 phút khi học viên chưa học.');

    // 4.2 Khi học viên ĐÃ VÀO HỌC trong ngày -> Tự động HỦY nhắc trễ
    console.log('  • Test 4.2: Học viên đã vào học -> Tự động hủy toàn bộ các mốc nhắc trễ còn lại');
    // Tạo 1 học viên mới đã có tiến độ học tập trong ngày
    const studiedUser = await prisma.users.create({
      data: {
        email: `student_already_studied_${timestamp}@example.com`,
        password_hash: 'dummyhash123',
        display_name: 'Học Viên Đã Học',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            reminder_time: '20:00',
            email_reminder_enabled: true,
            browser_notification_enabled: true,
          },
        },
        notificationSettings: {
          create: {
            reminder_time: '20:00',
            notify_email: true,
            notify_webpush: true,
          },
        },
      },
    });

    // Giả lập học viên đã học 1 bài học lúc 19:50
    const sampleLesson = await prisma.lessons.findFirst();
    if (sampleLesson) {
      await prisma.userLessonProgress.upsert({
        where: {
          user_id_lesson_id: {
            user_id: studiedUser.user_id,
            lesson_id: sampleLesson.lesson_id,
          },
        },
        create: {
          user_id: studiedUser.user_id,
          lesson_id: sampleLesson.lesson_id,
          status: 'COMPLETED',
          is_completed: true,
          last_studied_at: makeVnDate('19:50'),
        },
        update: {
          status: 'COMPLETED',
          is_completed: true,
          last_studied_at: makeVnDate('19:50'),
        },
      });
    }

    // Chạy mốc trễ 15 phút (20:15)
    const resPlus15 = await studyReminderJob.runReminderCycle(makeVnDate('20:15'), studiedUser.user_id);
    assert(resPlus15.cancelledLateReminders >= 1, 'Hệ thống phải ghi nhận hủy nhắc trễ cho học viên đã học');

    // Xác nhận không có log +15p nào được tạo cho studiedUser
    const logStudiedUser15 = await prisma.reminderDeliveryLogs.findMany({
      where: { user_id: studiedUser.user_id, offset_minutes: 15, study_date: todayVn },
    });
    assert.strictEqual(
      logStudiedUser15.length,
      0,
      'Tuyệt đối không gửi nhắc trễ (+15) cho học viên đã học bài trong ngày'
    );
    console.log('    ✔ Tự động dừng và hủy toàn bộ các mốc nhắc trễ còn lại trên cả 2 kênh thành công!');

    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 5: ĐỔI GIỜ NHẮC HỌC TRONG NGÀY
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 5] ĐỔI GIỜ NHẮC HỌC TRONG NGÀY (RESET LOGS ĐỂ KÍCH HOẠT LỊCH MỚI)');
    console.log('  • Test 5.1: Đổi giờ nhắc từ 20:00 sang 21:00');

    // Đang có 8 log cho testUser (tương ứng các mốc vừa chạy)
    const logsBefore = await prisma.reminderDeliveryLogs.count({
      where: { user_id: testUser.user_id, study_date: todayVn },
    });
    assert(logsBefore > 0);

    // Cập nhật giờ nhắc mới
    await fetch(`${baseUrl}/api/v1/users/reminder-settings`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ reminder_time: '21:00' }),
    });

    const logsAfter = await prisma.reminderDeliveryLogs.count({
      where: { user_id: testUser.user_id, study_date: todayVn },
    });
    assert.strictEqual(logsAfter, 0, 'Các log cũ trong ngày phải được dọn sạch để lịch mới hoạt động');
    console.log('    ✔ Đã dọn sạch log cũ trong ngày, sẵn sàng phục vụ khung giờ mới 21:00.');

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ STUDY REMINDER JOB ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runStudyReminderTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ STUDY REMINDER:', err);
    process.exit(1);
  });
