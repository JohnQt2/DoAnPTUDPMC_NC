/**
 * auth-profile-onboarding.test.ts
 *
 * Kiểm thử toàn bộ luồng (Service Layer — nhất quán với integration.test.ts):
 *   A. Auth: OTP Register → Login Password → Refresh Token → Logout
 *   B. Survey: submitSurveyAndRoadmap() → kiểm tra DB (UserLearningSurveys + UserRoadmaps)
 *   C. Profile: patchProfile() + getProfile() + getActiveRoadmap()
 *   D. Security: Zod .strict() chặn trường nhạy cảm
 *   E. Auth Middleware: authenticate() — 401 khi thiếu/sai token
 *
 * Chạy: node dist/test/auth-profile-onboarding.test.js
 */

import assert from 'assert';
import { prisma } from '../shared/database/prisma.client';
import { redisService } from '../shared/redis/redis.service';
import { ZodError } from 'zod';

async function runTests() {
  console.log('\n🧪 Auth · Profile · Onboarding Integration Tests\n');

  const { authService } = await import('../modules/auth/auth.service');
  const { userService } = await import('../modules/user/user.service');
  const {
    SurveyOnboardingDto,
    PatchProfileDto,
    UpsertLearningSurveyDto,
  } = await import('../modules/user/user.dto');
  const { authenticate } = await import('../shared/middleware/auth.middleware');
  const { verifyAccessToken, signAccessToken } = await import('../shared/utils/crypto');
  const { AppError } = await import('../shared/errors/app-error');

  const testEmail = `auth_onboarding_${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';
  const testName = 'Test Student';

  let accessToken = '';
  let refreshToken = '';
  let userId = 0;

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // ─── NHÓM A: XÁC THỰC ───────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    // A1. Gửi OTP đăng ký (mode=register)
    console.log('▶ A1: Gửi OTP đăng ký tài khoản');
    const sendRes = await authService.sendEmailOtp(testEmail, {
      password: testPassword,
      displayName: testName,
      mode: 'register',
    });
    assert.strictEqual(sendRes.expiresIn, 300, 'OTP TTL phải là 300 giây');
    assert(sendRes.devOtp, 'devOtp phải có trong môi trường dev/test');

    // Kiểm tra Redis lưu OTP
    const otpTtl = await redisService.ttl(`otp:${testEmail}`);
    assert(otpTtl > 0 && otpTtl <= 300, `OTP TTL trong Redis phải 1–300, got ${otpTtl}`);
    console.log('  ✔ OTP gửi OK, TTL=300s, devOtp có mặt trong môi trường dev');

    // A2. Xác thực OTP → nhận token (đăng ký người dùng mới)
    console.log('▶ A2: Xác thực OTP → Đăng ký & nhận token');
    const verifyResult = await authService.verifyEmailOtp(
      testEmail,
      sendRes.devOtp!,
      { ip: '127.0.0.1', userAgent: 'test-runner' }
    );
    assert.strictEqual(verifyResult.user.email, testEmail);
    assert.strictEqual(verifyResult.user.role, 'STUDENT');
    assert(verifyResult.accessToken, 'Phải có accessToken');
    assert(verifyResult.refreshToken, 'Phải có refreshToken');
    assert.strictEqual(verifyResult.isNewUser, true, 'Phải là người dùng mới');

    accessToken = verifyResult.accessToken;
    refreshToken = verifyResult.refreshToken;
    userId = verifyResult.user.userId;
    console.log(`  ✔ Đăng ký thành công, userId=${userId}, isNewUser=true`);

    // A3. Đăng nhập bằng mật khẩu
    console.log('▶ A3: Đăng nhập bằng email + password');
    const loginResult = await authService.loginWithPassword(
      testEmail,
      testPassword,
      { ip: '127.0.0.1', userAgent: 'test-runner' }
    );
    assert.strictEqual(loginResult.user.email, testEmail);
    assert(loginResult.accessToken, 'Login phải trả accessToken');
    assert(loginResult.refreshToken, 'Login phải trả refreshToken');
    accessToken = loginResult.accessToken;
    refreshToken = loginResult.refreshToken;
    console.log('  ✔ Đăng nhập email+password thành công');

    // A4. Làm mới token (Refresh Token Rotation)
    console.log('▶ A4: Refresh Token Rotation');
    const refreshResult = await authService.rotateRefreshToken(
      refreshToken,
      { ip: '127.0.0.1', userAgent: 'test-runner' }
    );
    assert(refreshResult.accessToken, 'Phải có accessToken mới');
    assert(refreshResult.refreshToken, 'Phải có refreshToken mới');
    assert.notStrictEqual(refreshResult.accessToken, accessToken, 'accessToken phải đổi mới');
    assert.notStrictEqual(refreshResult.refreshToken, refreshToken, 'refreshToken phải đổi mới');
    const prevRefresh = refreshToken;
    accessToken = refreshResult.accessToken;
    refreshToken = refreshResult.refreshToken;
    console.log('  ✔ Token làm mới thành công, cả access và refresh đều mới');

    // A5. Token Reuse Detection
    console.log('▶ A5: Reuse Detection — dùng lại token cũ phải bị từ chối');
    try {
      await authService.rotateRefreshToken(prevRefresh, { ip: '127.0.0.1' });
      assert.fail('Phải throw TOKEN_FAMILY_REVOKED khi dùng lại token cũ');
    } catch (err: any) {
      assert.strictEqual(err.code, 'TOKEN_FAMILY_REVOKED', `Expect TOKEN_FAMILY_REVOKED, got ${err.code}`);
    }
    console.log('  ✔ Token reuse bị phát hiện, toàn bộ session family bị thu hồi');

    // Đăng nhập lại để lấy token mới (session family cũ đã bị revoke)
    const reloginResult = await authService.loginWithPassword(testEmail, testPassword, { ip: '127.0.0.1' });
    accessToken = reloginResult.accessToken;
    refreshToken = reloginResult.refreshToken;

    // A6. Auth Middleware: 401 khi thiếu token
    console.log('▶ A6: Auth Middleware — 401 khi thiếu hoặc sai token');

    // Trường hợp 1: không có Authorization header
    await new Promise<void>((resolve) => {
      const req = { headers: {} } as any;
      const res = {} as any;
      const next = (err?: any) => {
        assert(err, 'Phải có lỗi khi không có token');
        assert.strictEqual(err.statusCode, 401, `Expect 401, got ${err.statusCode}`);
        resolve();
      };
      authenticate(req, res, next);
    });
    console.log('  ✔ 401 khi thiếu Authorization header');

    // Trường hợp 2: token không hợp lệ
    await new Promise<void>((resolve) => {
      const req = {
        headers: { authorization: 'Bearer invalid.jwt.token' },
      } as any;
      const res = {} as any;
      const next = (err?: any) => {
        assert(err, 'Phải có lỗi khi token sai');
        assert.strictEqual(err.statusCode, 401);
        resolve();
      };
      authenticate(req, res, next);
    });
    console.log('  ✔ 401 khi token không hợp lệ');

    // Trường hợp 3: token hợp lệ → authenticate() gắn req.user
    const payload = verifyAccessToken(accessToken);
    await new Promise<void>((resolve) => {
      const req = {
        headers: { authorization: `Bearer ${accessToken}` },
      } as any;
      const res = {} as any;
      const next = (err?: any) => {
        if (err) {
          assert.fail(`Không nên có lỗi với token hợp lệ: ${err.message}`);
        }
        assert(req.user, 'req.user phải được gắn');
        assert.strictEqual(req.user.userId, userId);
        assert.strictEqual(req.user.role, 'STUDENT');
        resolve();
      };
      authenticate(req, res, next);
    });
    console.log('  ✔ Token hợp lệ: req.user được gắn đúng (userId, role)');

    // ══════════════════════════════════════════════════════════════════════════
    // ─── NHÓM B: KHẢO SÁT & LỘ TRÌNH ───────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    // B1. Validation DTO: thiếu trường bắt buộc → ZodError
    console.log('\n▶ B1: Validation SurveyOnboardingDto — thiếu trường bắt buộc');
    try {
      SurveyOnboardingDto.parse({ goal: 'HSK2' }); // thiếu 3 trường
      assert.fail('Phải throw ZodError khi thiếu trường');
    } catch (err: any) {
      assert(err instanceof ZodError, 'Phải là ZodError');
      const fields = err.errors.map((e: any) => e.path[0]);
      assert(fields.includes('current_level'), 'Phải báo lỗi trường current_level');
      assert(fields.includes('expected_duration'), 'Phải báo lỗi trường expected_duration');
      assert(fields.includes('daily_study_minutes'), 'Phải báo lỗi trường daily_study_minutes');
    }
    console.log('  ✔ ZodError khi thiếu current_level, expected_duration, daily_study_minutes');

    // B2. Validation: daily_study_minutes âm
    console.log('▶ B2: Validation — daily_study_minutes âm → ZodError');
    try {
      SurveyOnboardingDto.parse({
        goal: 'HSK2',
        current_level: 'ZERO',
        expected_duration: 3,
        daily_study_minutes: -10,
      });
      assert.fail('Phải throw ZodError');
    } catch (err: any) {
      assert(err instanceof ZodError, 'Phải là ZodError');
      const hasPositiveError = err.errors.some(
        (e: any) => e.path.includes('daily_study_minutes')
      );
      assert(hasPositiveError, 'Phải báo lỗi daily_study_minutes');
    }
    console.log('  ✔ ZodError khi daily_study_minutes = -10');

    // B3. Validation: mục tiêu không cao hơn trình độ hiện tại
    console.log('▶ B3: Validation — goal ≤ current_level → ZodError');
    try {
      SurveyOnboardingDto.parse({
        goal: 'HSK1',
        current_level: 'HSK2',
        expected_duration: 3,
        daily_study_minutes: 30,
      });
      assert.fail('Phải throw ZodError');
    } catch (err: any) {
      assert(err instanceof ZodError, 'Phải là ZodError');
      assert(
        err.errors.some((e: any) => e.path.includes('goal')),
        'Phải báo lỗi trường goal'
      );
    }
    console.log('  ✔ ZodError khi goal (HSK1) ≤ current_level (HSK2)');

    // B4. Hỗ trợ người mới (ZERO) có thể chọn bất kỳ mục tiêu nào
    console.log('▶ B4: Người mới (ZERO) có thể chọn HSK1 hoặc cao hơn');
    const zeroParsed = SurveyOnboardingDto.parse({
      goal: 'HSK1',
      current_level: 'ZERO',
      expected_duration: 3,
      daily_study_minutes: 30,
    });
    assert.strictEqual(zeroParsed.current_level, 'ZERO');
    assert.strictEqual(zeroParsed.goal, 'HSK1');
    console.log('  ✔ ZERO → HSK1 hợp lệ');

    // B5. POST /users/survey — Gọi service, lưu khảo sát + tạo lộ trình
    console.log('▶ B5: submitSurveyAndRoadmap() — 4 trường chính');
    const surveyInput = SurveyOnboardingDto.parse({
      goal: 'HSK3',
      current_level: 'HSK1',
      expected_duration: 6,
      daily_study_minutes: 45,
    });

    const surveyResult = await userService.submitSurveyAndRoadmap(userId, surveyInput);

    assert.strictEqual(surveyResult.survey.goal, 'HSK3', 'goal phải là HSK3');
    assert.strictEqual(surveyResult.survey.currentLevel, 'HSK1', 'currentLevel phải là HSK1');
    assert.strictEqual(surveyResult.survey.expectedDurationMonths, 6);
    assert.strictEqual(surveyResult.survey.dailyStudyMinutes, 45);
    assert(surveyResult.roadmap.roadmapId, 'Phải có roadmapId');
    assert.strictEqual(surveyResult.roadmap.status, 'CONFIRMED');
    assert.strictEqual(surveyResult.roadmap.isActive, true);
    console.log(`  ✔ submitSurveyAndRoadmap OK, roadmapId=${surveyResult.roadmap.roadmapId}`);

    // B6. Kiểm tra dữ liệu trong DB — UserLearningSurveys
    console.log('▶ B6: Kiểm tra UserLearningSurveys trong DB');
    const dbSurvey = await prisma.userLearningSurveys.findUnique({
      where: { user_id: userId },
    });
    assert(dbSurvey, 'UserLearningSurveys phải được lưu trong DB');
    assert.strictEqual(dbSurvey.current_level, 'HSK1');
    assert.strictEqual(dbSurvey.target_goal, 'HSK3');
    assert.strictEqual(dbSurvey.expected_duration_months, 6);
    assert.strictEqual(dbSurvey.daily_available_minutes, 45);
    console.log('  ✔ UserLearningSurveys lưu đúng 4 trường trong DB');

    // B7. Kiểm tra dữ liệu trong DB — UserRoadmaps
    console.log('▶ B7: Kiểm tra UserRoadmaps trong DB');
    const dbRoadmap = await prisma.userRoadmaps.findFirst({
      where: { user_id: userId, is_active: true },
      include: { course: true },
    });
    assert(dbRoadmap, 'UserRoadmaps phải được tạo trong DB');
    assert.strictEqual(dbRoadmap.starting_level, 'HSK1');
    assert.strictEqual(dbRoadmap.target_goal, 'HSK3');
    assert.strictEqual(dbRoadmap.daily_commitment_mins, 45);
    assert.strictEqual(dbRoadmap.expected_duration_months, 6);
    assert.strictEqual(dbRoadmap.status, 'CONFIRMED');
    assert.strictEqual(dbRoadmap.is_active, true);
    assert(dbRoadmap.confirmed_at, 'confirmed_at phải được set');
    console.log(`  ✔ UserRoadmaps lưu đúng trong DB (roadmapId=${dbRoadmap.roadmap_id})`);

    // B8. Gọi lại survey lần 2 → upsert, roadmap cũ bị REPLACED
    console.log('▶ B8: Gọi lại survey lần 2 → upsert, roadmap cũ bị REPLACED');
    const surveyInput2 = SurveyOnboardingDto.parse({
      goal: 'HSK4',
      current_level: 'HSK2',
      expected_duration: 12,
      daily_study_minutes: 60,
    });
    const surveyResult2 = await userService.submitSurveyAndRoadmap(userId, surveyInput2);
    assert.strictEqual(surveyResult2.roadmap.targetGoal, 'HSK4');
    assert.strictEqual(surveyResult2.roadmap.isActive, true);

    // Roadmap cũ phải bị REPLACED
    const oldRoadmap = await prisma.userRoadmaps.findUnique({
      where: { roadmap_id: dbRoadmap.roadmap_id },
    });
    assert.strictEqual(oldRoadmap?.status, 'REPLACED', 'Roadmap cũ phải có status=REPLACED');
    assert.strictEqual(oldRoadmap?.is_active, false, 'Roadmap cũ phải is_active=false');
    console.log('  ✔ Roadmap cũ bị REPLACED, roadmap mới CONFIRMED và is_active=true');

    // B9. getActiveRoadmap() — lấy lộ trình đang hoạt động
    console.log('▶ B9: getActiveRoadmap() — lấy lộ trình đang hoạt động');
    const activeRoadmap = await userService.getActiveRoadmap(userId);
    assert(activeRoadmap.roadmapId, 'Phải có roadmapId');
    assert.strictEqual(activeRoadmap.targetGoal, 'HSK4');
    assert.strictEqual(activeRoadmap.isActive, true);
    assert(activeRoadmap.survey, 'Phải kèm thông tin survey');
    assert.strictEqual(activeRoadmap.survey!.goal, 'HSK4');
    console.log('  ✔ getActiveRoadmap() trả về lộ trình đang hoạt động kèm survey');

    // B10. 404 khi người dùng mới chưa survey
    // Tạo user mới → xóa roadmap mặc định → test đúng case 404
    console.log('▶ B10: 404 (SURVEY_NOT_FOUND) khi người dùng chưa survey và không có roadmap');
    const newEmail = `no_survey_${Date.now()}@example.com`;
    const { devOtp: newOtp } = await authService.sendEmailOtp(newEmail);
    const newAuth = await authService.verifyEmailOtp(newEmail, newOtp!, { ip: '127.0.0.1' });
    const newUserId = newAuth.user.userId;

    // Xóa roadmap mặc định được tạo khi đăng ký (nếu có) để test đúng case
    await prisma.userRoadmaps.deleteMany({ where: { user_id: newUserId } });

    try {
      await userService.getActiveRoadmap(newUserId);
      assert.fail('Phải throw NOT_FOUND khi chưa survey và không có roadmap');
    } catch (err: any) {
      const statusCode = err.statusCode ?? err.status;
      const code = err.code;
      assert.strictEqual(statusCode, 404, `Expect 404, got ${statusCode}`);
      assert.strictEqual(code, 'SURVEY_NOT_FOUND', `Expect SURVEY_NOT_FOUND, got ${code}`);
    }
    console.log('  ✔ 404 SURVEY_NOT_FOUND khi chưa làm khảo sát và không có roadmap');

    // ══════════════════════════════════════════════════════════════════════════
    // ─── NHÓM C: HỒ SƠ CÁ NHÂN ─────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    // C1. getProfile()
    console.log('\n▶ C1: getProfile() — Xem hồ sơ cá nhân');
    const profile = await userService.getProfile(userId);
    assert.strictEqual(profile.userId, userId, 'userId phải khớp');
    assert.strictEqual(profile.email, testEmail, 'email phải khớp');
    assert(profile.role, 'Phải có role');
    assert(profile.activeRoadmap, 'Phải có activeRoadmap sau khi khảo sát');
    assert.strictEqual(profile.activeRoadmap!.targetGoal, 'HSK4', 'activeRoadmap phải khớp lộ trình mới nhất');
    console.log('  ✔ getProfile() trả về đầy đủ: userId, email, role, activeRoadmap');

    // C2. PatchProfileDto — Validation .strict() chặn trường nhạy cảm
    console.log('▶ C2: Bảo mật — PatchProfileDto.strict() chặn trường nhạy cảm');

    const dangerousFields = [
      { role: 'ADMIN' },
      { password_hash: 'hacked_hash' },
      { status: 'ACTIVE' },
      { is_verified: true },
      { user_id: 999 },
      { id: 999 },
    ];

    for (const badBody of dangerousFields) {
      try {
        PatchProfileDto.parse(badBody);
        assert.fail(`Phải throw ZodError khi gửi trường: ${JSON.stringify(badBody)}`);
      } catch (err: any) {
        assert(err instanceof ZodError, `Phải là ZodError, got ${err.constructor.name}`);
      }
    }
    console.log('  ✔ ZodError khi gửi role / password_hash / status / is_verified / id');

    // C3. PatchProfileDto — Trường hợp hợp lệ
    console.log('▶ C3: PatchProfileDto — Dữ liệu hợp lệ');
    const validPatch = PatchProfileDto.parse({
      display_name: 'Updated Name',
      daily_available_minutes: 60,
      reminder_time: '21:00',
    });
    assert.strictEqual(validPatch.display_name, 'Updated Name');
    assert.strictEqual(validPatch.daily_available_minutes, 60);
    assert.strictEqual(validPatch.reminder_time, '21:00');
    console.log('  ✔ PatchProfileDto hợp lệ parse OK');

    // C4. patchProfile() — Cập nhật display_name + daily_available_minutes
    console.log('▶ C4: patchProfile() — Cập nhật thông tin cá nhân');
    const patchResult = await userService.patchProfile(userId, {
      display_name: 'Updated Student Name',
      daily_available_minutes: 60,
      reminder_time: '21:00',
    });
    assert.strictEqual(patchResult.displayName, 'Updated Student Name');
    console.log('  ✔ patchProfile() cập nhật displayName thành công');

    // C5. Kiểm tra DB — daily_commitment_mins roadmap đồng bộ
    console.log('▶ C5: Kiểm tra DB — daily_commitment_mins roadmap đồng bộ sau PATCH');
    const updatedRoadmapDb = await prisma.userRoadmaps.findFirst({
      where: { user_id: userId, is_active: true },
    });
    assert(updatedRoadmapDb, 'Phải tìm thấy roadmap');
    assert.strictEqual(
      updatedRoadmapDb.daily_commitment_mins,
      60,
      'daily_commitment_mins phải đồng bộ sang UserRoadmaps'
    );
    console.log('  ✔ daily_commitment_mins=60 đồng bộ sang UserRoadmaps trong DB');

    // C6. getProfile() sau PATCH — phản ánh thông tin mới
    console.log('▶ C6: getProfile() sau PATCH — xác nhận thông tin đã cập nhật');
    const profileAfterPatch = await userService.getProfile(userId);
    assert.strictEqual(profileAfterPatch.displayName, 'Updated Student Name');
    assert.strictEqual(
      profileAfterPatch.activeRoadmap!.dailyCommitmentMins,
      60,
      'dailyCommitmentMins trong profile phải là 60'
    );
    console.log('  ✔ getProfile() phản ánh thay đổi sau PATCH');

    // A7. Logout
    console.log('\n▶ A7: logout() — Đăng xuất phiên hiện tại');
    const sessionsBefore = await authService.listUserSessions(userId);
    await authService.logout(userId, undefined, refreshToken);
    const sessionsAfter = await authService.listUserSessions(userId);
    assert(
      sessionsAfter.length < sessionsBefore.length || sessionsAfter.length === 0,
      'Số session phải giảm sau logout'
    );
    console.log('  ✔ Đăng xuất thành công, session bị thu hồi');

    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ TẤT CẢ KIỂM THỬ PASS — Auth · Profile · Onboarding (13 assertions)');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err: any) {
    console.error('\n❌ Kiểm thử thất bại:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
