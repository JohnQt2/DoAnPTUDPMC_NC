import http from 'http';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { redisService } from '../shared/redis/redis.service';
import { signAccessToken } from '../shared/utils/crypto';

async function runAuthProfileOnboardingTests() {
  console.log('🧪 Starting Auth, Profile & Onboarding Comprehensive Test Suite...\n');

  let server: http.Server | null = null;
  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address() as any;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const timestamp = Date.now();
    const testEmail = `student_test_${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testFullName = 'Nguyễn Minh Anh';

    // ═══════════════════════════════════════════════════════════════════════
    // NHÓM 1: AUTHENTICATION & JWT TOKEN LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    console.log('▶ [PHẦN 1] KIỂM THỬ XÁC THỰC (AUTHENTICATION & JWT)');

    // 1.1 Validation khi đăng ký: Mật khẩu quá ngắn (< 6 ký tự)
    console.log('  • Test 1.1: Validation đăng ký từ chối mật khẩu < 6 ký tự');
    const invalidRegRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: '123',
        full_name: testFullName,
      }),
    });
    assert.strictEqual(invalidRegRes.status, 400, 'Đăng ký với mật khẩu ngắn phải trả về 400');
    const invalidRegBody = (await invalidRegRes.json()) as any;
    assert.strictEqual(invalidRegBody.success, false);
    console.log('    ✔ Trả về 400 Bad Request kèm chi tiết lỗi hợp lệ.');

    // 1.2 Đăng ký tài khoản thành công
    console.log('  • Test 1.2: Đăng ký tài khoản mới thành công (POST /auth/register)');
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        full_name: testFullName,
        phone: '0912345678',
        bio: 'Học viên đam mê tiếng Trung sơ cấp',
      }),
    });
    assert.strictEqual(regRes.status, 201, 'Đăng ký thành công phải trả về 201 Created');
    const regBody = (await regRes.json()) as any;
    assert.strictEqual(regBody.success, true);
    assert(regBody.data.accessToken, 'Phải cấp phát accessToken');
    assert(regBody.data.refreshToken, 'Phải cấp phát refreshToken');
    assert.strictEqual(regBody.data.user.email, testEmail);
    assert.strictEqual(regBody.data.user.role, 'STUDENT');
    assert.strictEqual(regBody.data.user.displayName, testFullName);
    const registeredUserId = regBody.data.user.id || regBody.data.user.userId;
    console.log(`    ✔ Đăng ký thành công userId=${registeredUserId}, nhận accessToken & refreshToken.`);

    // 1.3 Kiểm tra mật khẩu trong DB đã được mã hóa bằng bcrypt (không lưu plain text)
    const dbUser = await prisma.users.findUnique({ where: { user_id: registeredUserId } });
    assert(dbUser?.password_hash, 'Phải có password_hash');
    assert.notStrictEqual(dbUser?.password_hash, testPassword, 'Mật khẩu phải được mã hóa băm');
    const isBcryptMatch = await bcrypt.compare(testPassword, dbUser!.password_hash!);
    assert.strictEqual(isBcryptMatch, true, 'bcrypt compare phải khớp mật khẩu gốc');
    console.log('    ✔ Mật khẩu được mã hóa an toàn bằng bcrypt.');

    // 1.4 Chặn đăng ký trùng email
    console.log('  • Test 1.4: Chặn đăng ký trùng email');
    const dupRegRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    assert.strictEqual(dupRegRes.status, 400, 'Đăng ký trùng email phải trả về 400');
    console.log('    ✔ Chặn đăng ký trùng lặp thành công.');

    // 1.5 Đăng nhập thất bại do sai mật khẩu
    console.log('  • Test 1.5: Đăng nhập sai mật khẩu trả về 401 Unauthorized');
    const wrongLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });
    assert.strictEqual(wrongLoginRes.status, 401, 'Sai mật khẩu phải trả về 401');
    console.log('    ✔ Trả về 401 Unauthorized khi sai thông tin đăng nhập.');

    // 1.6 Đăng nhập thành công với mật khẩu đúng
    console.log('  • Test 1.6: Đăng nhập thành công (POST /auth/login)');
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Đăng nhập thành công phải trả về 200');
    const loginBody = (await loginRes.json()) as any;
    assert.strictEqual(loginBody.success, true);
    let accessToken = loginBody.data.accessToken;
    let refreshToken = loginBody.data.refreshToken;
    assert(accessToken, 'Phải có accessToken sau đăng nhập');
    assert(refreshToken, 'Phải có refreshToken sau đăng nhập');
    console.log('    ✔ Đăng nhập thành công, cấp phát cặp JWT token mới.');

    // 1.7 Auth Middleware / Guard
    console.log('  • Test 1.7: Auth Guard chặn truy cập thiếu/sai token (401 Unauthorized)');
    // Không có Authorization header
    const noAuthRes = await fetch(`${baseUrl}/api/v1/users/profile`);
    assert.strictEqual(noAuthRes.status, 401, 'Không có header Authorization phải trả về 401');

    // Token giả mạo/không hợp lệ
    const invalidAuthRes = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: 'Bearer this.is.invalid.token' },
    });
    assert.strictEqual(invalidAuthRes.status, 401, 'Token không hợp lệ phải trả về 401');

    // Token hợp lệ
    const validAuthRes = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(validAuthRes.status, 200, 'Token hợp lệ phải trả về 200');
    console.log('    ✔ Auth Guard bảo vệ endpoint chặt chẽ (401 khi thiếu/sai token, 200 khi hợp lệ).');

    // 1.8 Làm mới token (POST /auth/refresh)
    console.log('  • Test 1.8: Làm mới token (POST /auth/refresh)');
    const refreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    assert.strictEqual(refreshRes.status, 200, 'Refresh token phải trả về 200');
    const refreshBody = (await refreshRes.json()) as any;
    assert.strictEqual(refreshBody.success, true);
    const newAccessToken = refreshBody.data.accessToken;
    const newRefreshToken = refreshBody.data.refreshToken;
    assert(newAccessToken, 'Phải có newAccessToken');
    assert(newRefreshToken, 'Phải có newRefreshToken');
    assert.notStrictEqual(newRefreshToken, refreshToken, 'Refresh Token Rotation phải cấp token mới');
    console.log('    ✔ Refresh Token Rotation (RTR) thành công, xoay vòng token an toàn.');

    // 1.9 Token Reuse Detection (Gửi lại refresh token cũ đã bị rotate)
    console.log('  • Test 1.9: Phát hiện sử dụng lại token cũ (Token Reuse Detection)');
    const reuseRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }), // Gửi token cũ
    });
    assert.strictEqual(reuseRes.status, 401, 'Token cũ dùng lại phải trả về 401');
    const reuseBody = (await reuseRes.json()) as any;
    assert.strictEqual(reuseBody.error.code, 'TOKEN_FAMILY_REVOKED');
    console.log('    ✔ Phát hiện token reuse và thu hồi toàn bộ session family ngay lập tức.');

    // Cập nhật token hợp lệ cho các test tiếp theo bằng cách login lại
    const reloginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const reloginBody = (await reloginRes.json()) as any;
    accessToken = reloginBody.data.accessToken;
    refreshToken = reloginBody.data.refreshToken;

    // 1.10 Đăng xuất tài khoản (POST /auth/logout)
    console.log('  • Test 1.10: Đăng xuất tài khoản (POST /auth/logout)');
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    assert.strictEqual(logoutRes.status, 200, 'Đăng xuất phải trả về 200');
    console.log('    ✔ Đăng xuất thành công, phiên làm việc bị vô hiệu hóa.');

    // ═══════════════════════════════════════════════════════════════════════
    // NHÓM 2: KHẢO SÁT BAN ĐẦU & LƯU TRỮ DỮ LIỆU LỘ TRÌNH HỌC TẬP
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 2] KHẢO SÁT BAN ĐẦU & LỘ TRÌNH HỌC TẬP (SURVEY & ROADMAP)');

    // Tạo một học viên mới hoàn toàn chưa từng khảo sát
    const surveyStudentEmail = `student_survey_${timestamp}@example.com`;
    const surveyRegRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: surveyStudentEmail,
        password: testPassword,
        full_name: 'Trần Thị Học Viên',
      }),
    });
    const surveyRegBody = (await surveyRegRes.json()) as any;
    const studentToken = surveyRegBody.data.accessToken;
    const studentUserId = surveyRegBody.data.user.id || surveyRegBody.data.user.userId;

    // Xóa roadmap mặc định nếu có để kiểm tra trạng thái 404 chưa khảo sát
    await prisma.userRoadmaps.deleteMany({ where: { user_id: studentUserId } });
    await prisma.userProfiles.deleteMany({ where: { user_id: studentUserId } });

    // 2.1 Truy xuất lộ trình khi chưa khảo sát -> Phải trả về 404
    console.log('  • Test 2.1: Truy xuất lộ trình khi chưa thực hiện khảo sát (GET /users/roadmap/active)');
    const emptyRoadmapRes = await fetch(`${baseUrl}/api/v1/users/roadmap/active`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(emptyRoadmapRes.status, 404, 'Chưa khảo sát phải trả về 404 Not Found');
    const emptyRoadmapBody = (await emptyRoadmapRes.json()) as any;
    assert.strictEqual(emptyRoadmapBody.success, false);
    assert.strictEqual(emptyRoadmapBody.error.code, 'ROADMAP_NOT_FOUND');
    console.log('    ✔ Trả về 404 ROADMAP_NOT_FOUND với thông báo rõ ràng khi chưa khảo sát.');

    // 2.2 Validation khảo sát: Thiếu trường bắt buộc hoặc thời gian rảnh không hợp lệ
    console.log('  • Test 2.2: Validate dữ liệu khảo sát (chặn thiếu trường hoặc phút học <= 0)');
    const invalidSurveyRes = await fetch(`${baseUrl}/api/v1/users/survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        goal: 'HSK2',
        // Thiếu current_level
        expected_duration: '3 tháng',
        daily_study_minutes: -10, // Số âm không hợp lệ
      }),
    });
    assert.strictEqual(invalidSurveyRes.status, 400, 'Khảo sát sai định dạng phải trả về 400');
    console.log('    ✔ Validate chặt chẽ 4 trường khảo sát, trả về 400 Bad Request.');

    // 2.3 Gửi khảo sát ban đầu hợp lệ (Đủ 4 trường) -> Lưu vào user_profiles & user_roadmaps
    console.log('  • Test 2.3: Gửi khảo sát ban đầu đủ 4 thông tin (POST /users/survey)');
    const surveyPayload = {
      goal: 'HSK2',
      current_level: 'BEGINNER', // Hỗ trợ người mới bắt đầu
      expected_duration: '3 tháng',
      daily_study_minutes: 30, // 30 phút mỗi ngày
      reminder_time: '20:30',
    };

    const submitSurveyRes = await fetch(`${baseUrl}/api/v1/users/survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify(surveyPayload),
    });
    assert.strictEqual(submitSurveyRes.status, 200, 'Gửi khảo sát phải trả về 200 OK');
    const submitSurveyBody = (await submitSurveyRes.json()) as any;
    assert.strictEqual(submitSurveyBody.success, true);
    assert(submitSurveyBody.data.roadmap, 'Response phải chứa roadmap');
    console.log('    ✔ Tiếp nhận khảo sát thành công và trả về lộ trình cá nhân hóa.');

    // 2.4 Kiểm tra dữ liệu được lưu chính xác trong bảng user_profiles
    console.log('  • Test 2.4: Kiểm tra dữ liệu lưu nguyên tử trong bảng user_profiles');
    const savedProfile = await prisma.userProfiles.findUnique({
      where: { user_id: studentUserId },
    });
    assert(savedProfile, 'Bản ghi user_profiles phải được tạo');
    assert.strictEqual(savedProfile.goal, 'HSK2');
    assert.strictEqual(savedProfile.current_level, 'BEGINNER');
    assert.strictEqual(savedProfile.expected_duration, '3 tháng');
    assert.strictEqual(savedProfile.daily_study_minutes, 30);
    console.log('    ✔ Dữ liệu khảo sát được lưu chính xác 100% trong user_profiles.');

    // 2.5 Kiểm tra dữ liệu được lưu trong bảng user_roadmaps & Outbox event
    console.log('  • Test 2.5: Kiểm tra dữ liệu lưu trong user_roadmaps & OutboxMessages');
    const activeRoadmap = await prisma.userRoadmaps.findFirst({
      where: { user_id: studentUserId, is_active: true },
      include: { course: true },
    });
    assert(activeRoadmap, 'Bản ghi user_roadmaps đang hoạt động phải tồn tại');
    assert.strictEqual(activeRoadmap.target_goal, 'HSK2');
    assert.strictEqual(activeRoadmap.starting_level, 'ZERO'); // BEGINNER map thành ZERO
    assert.strictEqual(activeRoadmap.daily_commitment_mins, 30);
    assert.strictEqual(activeRoadmap.is_active, true);

    const outboxEvent = await prisma.outboxMessages.findFirst({
      where: {
        aggregate_type: 'ONBOARDING',
        aggregate_id: String(studentUserId),
        event_type: 'ROADMAP_CREATED',
      },
    });
    assert(outboxEvent, 'Sự kiện Outbox ROADMAP_CREATED phải được ghi nhận');
    console.log('    ✔ user_roadmaps và outboxMessages được tạo nguyên tử trong transaction.');

    // 2.6 Kiểm tra mở khóa bài học ban đầu (UserLessonProgress)
    const unlockedProgress = await prisma.userLessonProgress.findMany({
      where: { user_id: studentUserId, status: 'UNLOCKED' },
    });
    assert(unlockedProgress.length > 0, 'Phải có ít nhất 1 bài học được mở khóa UNLOCKED');
    console.log(`    ✔ Đã tự động mở khóa ${unlockedProgress.length} bài học đầu tiên.`);

    // 2.7 Lấy dữ liệu lộ trình cá nhân qua API (GET /users/roadmap/active & GET /users/roadmap)
    console.log('  • Test 2.7: Lấy dữ liệu lộ trình cá nhân (GET /users/roadmap/active)');
    const getRoadmapRes = await fetch(`${baseUrl}/api/v1/users/roadmap/active`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(getRoadmapRes.status, 200, 'Lấy lộ trình phải trả về 200');
    const getRoadmapBody = (await getRoadmapRes.json()) as any;
    assert.strictEqual(getRoadmapBody.success, true);
    assert.strictEqual(getRoadmapBody.data.targetGoal, 'HSK2');
    assert.strictEqual(getRoadmapBody.data.dailyCommitmentMins, 30);
    assert(getRoadmapBody.data.currentLesson !== undefined, 'Phải có currentLesson');
    assert(Array.isArray(getRoadmapBody.data.weeklyMilestones), 'Phải có danh sách weeklyMilestones');
    console.log('    ✔ Lộ trình cá nhân trả về đầy đủ khóa học, mục tiêu, bài học hiện tại và các cột mốc tuần.');

    // ═══════════════════════════════════════════════════════════════════════
    // NHÓM 3: QUẢN LÝ HỒ SƠ & CẬP NHẬT THÔNG TIN CÁ NHÂN (PROFILE)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 3] QUẢN LÝ HỒ SƠ CÁ NHÂN & BẢO MẬT (PROFILE MANAGEMENT)');

    // 3.1 Xem hồ sơ cá nhân (GET /users/profile & GET /users/me)
    console.log('  • Test 3.1: Xem hồ sơ cá nhân (GET /users/profile)');
    const getProfileRes = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(getProfileRes.status, 200, 'GET /users/profile phải trả về 200');
    const getProfileBody = (await getProfileRes.json()) as any;
    assert.strictEqual(getProfileBody.success, true);
    const profileData = getProfileBody.data;
    assert.strictEqual(profileData.email, surveyStudentEmail);
    assert.strictEqual(profileData.fullName, 'Trần Thị Học Viên');
    assert.strictEqual(profileData.role, 'STUDENT');
    assert.strictEqual(profileData.goal, 'HSK2');
    assert.strictEqual(profileData.daily_study_minutes, 30);
    assert.strictEqual(profileData.expected_duration, '3 tháng');
    assert(profileData.activeRoadmap, 'Hồ sơ phải kèm thông tin lộ trình hiện tại');
    console.log('    ✔ Trả về đầy đủ thông tin tài khoản, thông tin khảo sát từ user_profiles và lộ trình.');

    // 3.2 Bảo mật: Chặn tuyệt đối việc gửi/ghi đè trường nhạy cảm (role, password_hash, id, is_verified)
    console.log('  • Test 3.2: Bảo mật - Chặn tuyệt đối sửa trường nhạy cảm (role, password_hash, id)');
    const hackAttemptRes = await fetch(`${baseUrl}/api/v1/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        role: 'ADMIN', // Cố tình leo quyền
        password_hash: 'injected_hash',
        is_verified: false,
        id: 999999,
      }),
    });
    assert.strictEqual(hackAttemptRes.status, 400, 'Cố tình sửa trường nhạy cảm phải bị chặn với HTTP 400');
    const hackAttemptBody = (await hackAttemptRes.json()) as any;
    assert.strictEqual(hackAttemptBody.success, false);

    // Xác minh lại trong DB: Quyền vẫn là STUDENT, không bị thay đổi
    const checkUserInDb = await prisma.users.findUnique({ where: { user_id: studentUserId } });
    assert.strictEqual(checkUserInDb?.role, 'STUDENT', 'Quyền người dùng tuyệt đối không bị thay đổi');
    console.log('    ✔ Cơ chế bảo mật chặn đứng nỗ lực ghi đè trường nhạy cảm, quyền hạn được bảo toàn.');

    // 3.3 Cập nhật thông tin cá nhân & điều chỉnh thông số học tập hợp lệ (PATCH /users/profile)
    console.log('  • Test 3.3: Cập nhật thông tin cá nhân và thông số học tập (PATCH /users/profile)');
    const updatePayload = {
      full_name: 'Trần Thị Học Viên Nâng Cao',
      phone: '0988776655',
      bio: 'Quyết tâm đạt HSK 3 trong vòng 6 tháng tới.',
      daily_study_minutes: 45, // Tăng thời gian học lên 45 phút
      goal: 'HSK3', // Nâng mục tiêu lên HSK 3
      expected_duration: '6 tháng',
    };

    const updateProfileRes = await fetch(`${baseUrl}/api/v1/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify(updatePayload),
    });
    assert.strictEqual(updateProfileRes.status, 200, 'Cập nhật hồ sơ phải trả về 200 OK');
    const updateProfileBody = (await updateProfileRes.json()) as any;
    assert.strictEqual(updateProfileBody.success, true);
    console.log('    ✔ Cập nhật hồ sơ cá nhân và thông số học tập thành công.');

    // 3.4 Kiểm tra dữ liệu được cập nhật trong DB (cả Users, user_profiles và user_roadmaps)
    console.log('  • Test 3.4: Kiểm tra tính đồng bộ sau cập nhật');
    const updatedUserDb = await prisma.users.findUnique({ where: { user_id: studentUserId } });
    assert.strictEqual(updatedUserDb?.display_name, 'Trần Thị Học Viên Nâng Cao');

    const updatedProfileDb = await prisma.userProfiles.findUnique({ where: { user_id: studentUserId } });
    assert.strictEqual(updatedProfileDb?.phone, '0988776655');
    assert.strictEqual(updatedProfileDb?.bio, 'Quyết tâm đạt HSK 3 trong vòng 6 tháng tới.');
    assert.strictEqual(updatedProfileDb?.goal, 'HSK3');
    assert.strictEqual(updatedProfileDb?.daily_study_minutes, 45);
    assert.strictEqual(updatedProfileDb?.expected_duration, '6 tháng');

    const updatedRoadmapDb = await prisma.userRoadmaps.findFirst({
      where: { user_id: studentUserId, is_active: true },
    });
    assert.strictEqual(updatedRoadmapDb?.daily_commitment_mins, 45);
    assert.strictEqual(updatedRoadmapDb?.target_goal, 'HSK3');
    console.log('    ✔ Đồng bộ hoàn hảo giữa Users, user_profiles và user_roadmaps.');

    // 3.5 Lấy lại hồ sơ bằng GET /users/me để đảm bảo dữ liệu mới nhất được phản hồi
    console.log('  • Test 3.5: Lấy lại hồ sơ sau cập nhật (GET /users/me)');
    const refetchRes = await fetch(`${baseUrl}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(refetchRes.status, 200);
    const refetchBody = (await refetchRes.json()) as any;
    assert.strictEqual(refetchBody.data.fullName, 'Trần Thị Học Viên Nâng Cao');
    assert.strictEqual(refetchBody.data.phone, '0988776655');
    assert.strictEqual(refetchBody.data.goal, 'HSK3');
    assert.strictEqual(refetchBody.data.daily_study_minutes, 45);
    console.log('    ✔ GET /users/me phản hồi đầy đủ và chính xác toàn bộ dữ liệu mới nhất.');

    // ═══════════════════════════════════════════════════════════════════════
    // NHÓM 4: KIỂM THỬ KHẢO SÁT VỚI DẢI CẤP ĐỘ HSK (HSK1 ĐẾN HSK6)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n▶ [PHẦN 4] KIỂM THỬ ĐẦY ĐỦ CÁC CẤP ĐỘ HSK (HSK1 - HSK6)');
    const hskLevels = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];

    for (const lvl of hskLevels) {
      const hskSurveyRes = await fetch(`${baseUrl}/api/v1/users/survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          goal: lvl,
          current_level: lvl,
          expected_duration: '4 tháng',
          daily_study_minutes: 30,
        }),
      });
      assert.strictEqual(hskSurveyRes.status, 200, `Khảo sát trình độ ${lvl} phải thành công 200`);
    }
    console.log('    ✔ Hỗ trợ trọn vẹn và thông suốt mọi cấp độ từ HSK1 đến HSK6.');

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ AUTH - PROFILE - ONBOARDING ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runAuthProfileOnboardingTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test Suite Thất bại:', err);
    process.exit(1);
  });
