import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

async function runPracticeVersionE2ETests() {
  console.log('🧪 Starting Practice Versioning E2E & Student Integration Tests (12 criteria)...\n');

  let server: http.Server | null = null;
  const testCollectionCodes: string[] = [];

  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const rawRequest = async (urlPath: string, options: RequestInit = {}) => {
      const url = new URL(urlPath, baseUrl);
      const headers = new Headers(options.headers);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url.toString(), {
        ...options,
        headers,
      });
      const body: any = await res.json().catch(() => null);
      return { status: res.status, body };
    };

    // 0. Setup test users: Student A, Student B, Admin
    const studentA = await prisma.users.upsert({
      where: { email: 'student_a_e2e@chinaeasy.test' },
      create: {
        email: 'student_a_e2e@chinaeasy.test',
        display_name: 'Student A',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      update: { role: 'STUDENT', status: 'ACTIVE' },
    });

    const studentB = await prisma.users.upsert({
      where: { email: 'student_b_e2e@chinaeasy.test' },
      create: {
        email: 'student_b_e2e@chinaeasy.test',
        display_name: 'Student B',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      update: { role: 'STUDENT', status: 'ACTIVE' },
    });

    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_e2e@chinaeasy.test' },
      create: {
        email: 'admin_e2e@chinaeasy.test',
        display_name: 'Admin E2E',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      update: { role: 'ADMIN', status: 'ACTIVE' },
    });

    const studentAToken = signAccessToken({ userId: studentA.user_id, email: studentA.email, role: 'STUDENT' });
    const studentBToken = signAccessToken({ userId: studentB.user_id, email: studentB.email, role: 'STUDENT' });
    const adminToken = signAccessToken({ userId: adminUser.user_id, email: adminUser.email, role: 'ADMIN' });

    const authHeaders = (token?: string): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

    const level = await prisma.practiceLevel.findFirst({ where: { code: 'HSK1' } });
    assert(level, 'HSK1 level must exist');

    // -------------------------------------------------------------
    // Criterion 1: Collection DRAFT bị ẩn khỏi Student catalog & detail
    // -------------------------------------------------------------
    console.log('Test 1: Collection DRAFT bị ẩn hoàn toàn khỏi Student catalog & detail');
    const draftCode = `TEST-DRAFT-${Date.now()}`;
    testCollectionCodes.push(draftCode);
    const draftCreateRes = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        code: draftCode,
        levelId: level.id,
        category: 'SKILL_PRACTICE',
        titleZh: '草稿练习',
        titleVi: 'Bài luyện nháp',
      }),
    });
    if (draftCreateRes.status !== 201) {
      console.error('draftCreateRes error:', draftCreateRes.body);
    }
    assert.strictEqual(draftCreateRes.status, 201);
    const draftCollectionId = draftCreateRes.body.data.collection.id;
    const draftVersionId = draftCreateRes.body.data.initialVersion.id;

    const draftSetRes = await rawRequest(`/api/v1/practice/admin/versions/${draftVersionId}/exercise-sets`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        code: `${draftCode}-SET`,
        skill: 'READING',
        titleZh: '草稿部分',
        titleVi: 'Phần nháp',
        sortOrder: 1,
      }),
    });
    assert.strictEqual(draftSetRes.status, 201);
    const draftSetId = draftSetRes.body.data.id;
    const publishedLesson = await prisma.practiceLesson.findFirst({
      where: { levelId: level.id, status: 'PUBLISHED', isPublished: true },
    });
    assert(publishedLesson, 'A published lesson must exist for legacy route visibility checks');
    await prisma.practiceExerciseSet.update({
      where: { id: draftSetId },
      data: { lessonId: publishedLesson.id },
    });

    // Student calls catalog
    const studentCatalogRes1 = await rawRequest('/api/v1/practice/collections?search=' + draftCode, {
      method: 'GET',
      headers: authHeaders(studentAToken),
    });
    assert.strictEqual(studentCatalogRes1.status, 200);
    assert.strictEqual(studentCatalogRes1.body.data.items.length, 0, 'DRAFT collection must not appear in student catalog');

    // Student calls detail of DRAFT
    const studentDetailRes1 = await rawRequest(`/api/v1/practice/collections/${draftCollectionId}`, {
      method: 'GET',
      headers: authHeaders(studentAToken),
    });
    assert.strictEqual(studentDetailRes1.status, 404, 'DRAFT collection detail must return 404 for student');
    const studentDraftSetRes = await rawRequest(`/api/v1/practice/exercise-sets/${draftSetId}`);
    assert.strictEqual(studentDraftSetRes.status, 404, 'DRAFT exercise set must not be directly accessible');
    const legacyLessonSetsRes = await rawRequest(
      `/api/v1/practice/lessons/${publishedLesson.id}/exercise-sets`
    );
    assert.strictEqual(legacyLessonSetsRes.status, 200);
    assert(
      !legacyLessonSetsRes.body.data.some((set: any) => set.id === draftSetId),
      'Legacy lesson route must not list a DRAFT version exercise set'
    );
    const levelLessonsRes = await rawRequest('/api/v1/practice/levels/HSK1/lessons');
    assert.strictEqual(levelLessonsRes.status, 200);
    const lessonFromLevel = levelLessonsRes.body.data.find(
      (lesson: any) => lesson.id === publishedLesson.id
    );
    assert(lessonFromLevel);
    assert(
      !lessonFromLevel.exerciseSets.some((set: any) => set.id === draftSetId),
      'Level lesson list must not include a DRAFT version exercise set'
    );
    const lessonDetailRes = await rawRequest(`/api/v1/practice/lessons/${publishedLesson.id}`);
    assert.strictEqual(lessonDetailRes.status, 200);
    assert(
      !lessonDetailRes.body.data.exerciseSets.some((set: any) => set.id === draftSetId),
      'Lesson detail must not include a DRAFT version exercise set'
    );
    const studentDraftAttemptRes = await rawRequest('/api/v1/practice/attempts', {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ exerciseSetId: draftSetId }),
    });
    assert.strictEqual(studentDraftAttemptRes.status, 409);
    console.log('  ✅ Criterion 1 Passed');

    // -------------------------------------------------------------
    // Criterion 2: Collection sau khi PUBLISHED xuất hiện đúng danh mục
    // -------------------------------------------------------------
    console.log('Test 2: Collection PUBLISHED xuất hiện đúng danh mục, HSK level, search');
    const pubCode = `TEST-E2E-${Date.now()}`;
    testCollectionCodes.push(pubCode);
    const createPubRes = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        code: pubCode,
        levelId: level.id,
        category: 'MIXED_PRACTICE',
        titleZh: '发布练习一',
        titleVi: 'Bộ bài tập xuất bản 1',
      }),
    });
    if (createPubRes.status !== 201) {
      console.error('createPubRes error:', createPubRes.body);
    }
    assert.strictEqual(createPubRes.status, 201);
    const pubCollectionId = createPubRes.body.data.collection.id;
    const v1Id = createPubRes.body.data.initialVersion.id;

    // Add Section to V1
    const setCode = `SET-READING-${Date.now()}`;
    const addSectionRes = await rawRequest(`/api/v1/practice/admin/versions/${v1Id}/exercise-sets`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        code: setCode,
        skill: 'READING',
        titleZh: '阅读部分',
        titleVi: 'Phần đọc hiểu',
        sortOrder: 1,
        estimatedMinutes: 10,
      }),
    });
    if (addSectionRes.status !== 201) {
      console.error('addSectionRes error:', addSectionRes.body);
    }
    assert.strictEqual(addSectionRes.status, 201);
    const set1Id = addSectionRes.body.data.id;

    // Add Question to Section
    const qCode = `Q-E2E-1-${Date.now()}`;
    const addQRes = await rawRequest(`/api/v1/practice/admin/exercise-sets/${set1Id}/questions`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        code: qCode,
        type: 'SINGLE_CHOICE',
        prompt: {
          text: 'Chọn đáp án đúng',
          options: [
            { key: 'A', text: '你好' },
            { key: 'B', text: '再见' },
          ],
        },
        answer: { value: 'A' },
        explanation: 'Giải thích bí mật của giáo viên',
        score: 10,
        sortOrder: 1,
      }),
    });
    if (addQRes.status !== 201) {
      console.error('addQRes error:', addQRes.body);
    }
    assert.strictEqual(addQRes.status, 201);
    const q1Id = addQRes.body.data.id;

    // Submit V1 for review then Publish
    const reviewV1Res = await rawRequest(`/api/v1/practice/admin/versions/${v1Id}/submit-review`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ reviewNotes: 'Sẵn sàng duyệt' }),
    });
    assert.strictEqual(reviewV1Res.status, 200);

    const pubV1Res = await rawRequest(`/api/v1/practice/admin/versions/${v1Id}/publish`, {
      method: 'POST',
      headers: authHeaders(adminToken),
    });
    if (pubV1Res.status !== 200) {
      console.error('pubV1Res error:', pubV1Res.body);
    }
    assert.strictEqual(pubV1Res.status, 200);

    // Student search catalog
    const studentCatalogRes2 = await rawRequest(`/api/v1/practice/collections?levelCode=HSK1&category=MIXED_PRACTICE&search=${pubCode}`, {
      method: 'GET',
      headers: authHeaders(studentAToken),
    });
    assert.strictEqual(studentCatalogRes2.status, 200);
    assert.strictEqual(studentCatalogRes2.body.data.items.length, 1);
    assert.strictEqual(studentCatalogRes2.body.data.items[0].code, pubCode);
    assert.strictEqual(studentCatalogRes2.body.data.items[0].currentVersionNumber, 1);
    assert.strictEqual(studentCatalogRes2.body.data.items[0].userStatus, 'NOT_STARTED');
    console.log('  ✅ Criterion 2 Passed');

    // -------------------------------------------------------------
    // Criterion 3: Student API không lộ answer / explanation / internal draft
    // -------------------------------------------------------------
    console.log('Test 3: Student API bảo mật tuyệt đối answer, explanation');
    const studentDetailRes2 = await rawRequest(`/api/v1/practice/collections/${pubCollectionId}`, {
      method: 'GET',
      headers: authHeaders(studentAToken),
    });
    assert.strictEqual(studentDetailRes2.status, 200);
    const detailData = studentDetailRes2.body.data;
    assert.strictEqual(detailData.exerciseSets.length, 1);
    assert.strictEqual(detailData.exerciseSets[0].answer, undefined);
    assert.strictEqual(detailData.exerciseSets[0].explanation, undefined);

    // Get exercise set for student
    const setRes = await rawRequest(`/api/v1/practice/exercise-sets/${set1Id}`, {
      method: 'GET',
      headers: authHeaders(studentAToken),
    });
    assert.strictEqual(setRes.status, 200);
    const qInSet = setRes.body.data.questions[0];
    assert.strictEqual(qInSet.answer, undefined, 'Student must not see answer');
    assert.strictEqual(qInSet.explanation, undefined, 'Student must not see explanation');
    console.log('  ✅ Criterion 3 Passed');

    // -------------------------------------------------------------
    // Criterion 4: Student A tạo attempt trên Version 1 (PUBLISHED)
    // -------------------------------------------------------------
    console.log('Test 4: Student A tạo attempt trên Version 1, snapshotData & versionId được lưu chuẩn');
    const startAttemptRes = await rawRequest(`/api/v1/practice/collections/${pubCollectionId}/attempts`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ exerciseSetId: set1Id }),
    });
    assert.strictEqual(startAttemptRes.status, 200);
    const attempt1Id = startAttemptRes.body.data.attemptId;
    assert(attempt1Id, 'Attempt ID must be returned');

    // Verify in DB directly
    const dbAttempt1 = await prisma.practiceAttempt.findUnique({
      where: { id: attempt1Id },
    });
    assert(dbAttempt1, 'Attempt must exist in DB');
    assert.strictEqual(dbAttempt1.versionId, v1Id, 'Attempt must bind to v1Id');
    assert.strictEqual(dbAttempt1.status, 'IN_PROGRESS');
    assert(dbAttempt1.snapshotData, 'Snapshot data must be captured at creation');
    const snap1 = typeof dbAttempt1.snapshotData === 'string'
      ? JSON.parse(dbAttempt1.snapshotData)
      : (dbAttempt1.snapshotData as any);
    assert.strictEqual(snap1.version?.id, v1Id);
    assert.strictEqual(snap1.questions.length, 1);
    console.log('  ✅ Criterion 4 Passed');

    // -------------------------------------------------------------
    // Criterion 5: Resume attempt IN_PROGRESS trả về đúng attempt cũ
    // -------------------------------------------------------------
    console.log('Test 5: Resume attempt IN_PROGRESS trả về đúng attempt cũ, không sinh duplicate');
    const resumeRes = await rawRequest(`/api/v1/practice/collections/${pubCollectionId}/attempts`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ exerciseSetId: set1Id }),
    });
    assert.strictEqual(resumeRes.status, 200);
    assert.strictEqual(resumeRes.body.data.attemptId, attempt1Id, 'Must return same attemptId');

    // Save answer 'A'
    const saveAnsRes = await rawRequest(`/api/v1/practice/attempts/${attempt1Id}/answers/${q1Id}`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ answer: 'A' }),
    });
    assert.strictEqual(saveAnsRes.status, 200);
    console.log('  ✅ Criterion 5 Passed');

    // -------------------------------------------------------------
    // Criterion 6 & 7: Admin tạo Version 2, publish Version 2 -> Version 1 RETIRED
    // -------------------------------------------------------------
    console.log('Test 6 & 7: Admin clone Version 2, sửa câu hỏi, publish Version 2 -> Version 1 RETIRED');
    const cloneRes = await rawRequest(`/api/v1/practice/admin/collections/${pubCollectionId}/versions`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        sourceVersionId: v1Id,
        changeSummary: 'Cập nhật phiên bản 2 cho đề thi',
      }),
    });
    if (cloneRes.status !== 201) {
      console.error('cloneRes error:', cloneRes.body);
    }
    assert.strictEqual(cloneRes.status, 201);
    const v2Id = cloneRes.body.data.id;
    assert.strictEqual(cloneRes.body.data.versionNumber, 2);

    // Get v2 sets
    const v2DetailRes = await rawRequest(`/api/v1/practice/admin/versions/${v2Id}`, {
      method: 'GET',
      headers: authHeaders(adminToken),
    });
    assert.strictEqual(v2DetailRes.status, 200);
    const v2Set1 = v2DetailRes.body.data.exerciseSets[0];
    const v2Q1 = v2Set1.questions[0];

    // Modify Question in V2: change score to 20, correct answer to 'B'
    const editQRes = await rawRequest(`/api/v1/practice/admin/questions/${v2Q1.id}`, {
      method: 'PUT',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        score: 20,
        answer: { value: 'B' },
      }),
    });
    if (editQRes.status !== 200) {
      console.error('editQRes error:', editQRes.body);
    }
    assert.strictEqual(editQRes.status, 200);
    const updatedQuestionAudit = await prisma.auditLogs.findFirst({
      where: {
        action_type: 'UPDATE_PRACTICE_QUESTION',
        target_entity: 'PracticeQuestion',
        target_id: String(v2Q1.id),
      },
      orderBy: { created_at: 'desc' },
    });
    assert(updatedQuestionAudit?.old_value && updatedQuestionAudit.new_value);
    assert.strictEqual(JSON.parse(updatedQuestionAudit.old_value).answer, undefined);
    assert.strictEqual(JSON.parse(updatedQuestionAudit.old_value).explanation, undefined);
    assert.strictEqual(JSON.parse(updatedQuestionAudit.new_value).answer, undefined);
    assert.strictEqual(JSON.parse(updatedQuestionAudit.new_value).explanation, undefined);

    // Submit V2 for review then Publish
    const reviewV2Res = await rawRequest(`/api/v1/practice/admin/versions/${v2Id}/submit-review`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ reviewNotes: 'Sẵn sàng duyệt V2' }),
    });
    assert.strictEqual(reviewV2Res.status, 200);

    // Publish V2
    const pubV2Res = await rawRequest(`/api/v1/practice/admin/versions/${v2Id}/publish`, {
      method: 'POST',
      headers: authHeaders(adminToken),
    });
    if (pubV2Res.status !== 200) {
      console.error('pubV2Res error:', pubV2Res.body);
    }
    assert.strictEqual(pubV2Res.status, 200);

    // Verify V1 status is now RETIRED
    const dbV1 = await prisma.practiceCollectionVersion.findUnique({ where: { id: v1Id } });
    assert.strictEqual(dbV1?.status, 'RETIRED', 'V1 must transition to RETIRED');
    const dbV2 = await prisma.practiceCollectionVersion.findUnique({ where: { id: v2Id } });
    assert.strictEqual(dbV2?.status, 'PUBLISHED', 'V2 must transition to PUBLISHED');
    console.log('  ✅ Criteria 6 & 7 Passed');

    // -------------------------------------------------------------
    // Criterion 8: Attempt cũ trên Version 1 (đang IN_PROGRESS) vẫn resume và submit chấm theo Snapshot V1
    // -------------------------------------------------------------
    console.log('Test 8: Attempt cũ trên Version 1 vẫn resume & submit chấm theo đúng Snapshot V1 (đáp án A = đúng, 10 điểm)');
    // Student A submits attempt1 (which had answer 'A')
    const submitAttempt1Res = await rawRequest(`/api/v1/practice/attempts/${attempt1Id}/submit`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({}),
    });
    assert.strictEqual(submitAttempt1Res.status, 200);
    const resData1 = submitAttempt1Res.body.data;
    assert.strictEqual(resData1.status, 'COMPLETED');
    assert.strictEqual(resData1.earnedScore, 10, 'Must earn 10 points based on V1 snapshot where answer was A');
    assert.strictEqual(resData1.totalScore, 10);
    assert.strictEqual(resData1.percentage, 100);
    console.log('  ✅ Criterion 8 Passed');

    // -------------------------------------------------------------
    // Criterion 9: Attempt mới trên Collection bây giờ dùng Version 2
    // -------------------------------------------------------------
    console.log('Test 9: Attempt mới trên Collection dùng Version 2 (đáp án B = 20 điểm)');
    const startAttempt2Res = await rawRequest(`/api/v1/practice/collections/${pubCollectionId}/attempts`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ exerciseSetId: v2Set1.id }),
    });
    assert.strictEqual(startAttempt2Res.status, 200);
    const attempt2Id = startAttempt2Res.body.data.attemptId;
    assert.notStrictEqual(attempt2Id, attempt1Id, 'Must be a new attempt');

    const dbAttempt2 = await prisma.practiceAttempt.findUnique({ where: { id: attempt2Id } });
    assert.strictEqual(dbAttempt2?.versionId, v2Id, 'New attempt must bind to V2');

    // Save answer 'B' for V2 question
    await rawRequest(`/api/v1/practice/attempts/${attempt2Id}/answers/${v2Q1.id}`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ answer: 'B' }),
    });

    const submitAttempt2Res = await rawRequest(`/api/v1/practice/attempts/${attempt2Id}/submit`, {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({}),
    });
    assert.strictEqual(submitAttempt2Res.status, 200);
    assert.strictEqual(submitAttempt2Res.body.data.earnedScore, 20, 'V2 has score 20');
    console.log('  ✅ Criterion 9 Passed');

    // -------------------------------------------------------------
    // Criterion 10: Không thể tạo attempt mới trên Version 1 RETIRED trực tiếp
    // -------------------------------------------------------------
    console.log('Test 10: startOrCreateAttempt từ chối tạo attempt mới trên set1Id của Version RETIRED (409)');
    const retiredAttemptRes = await rawRequest('/api/v1/practice/attempts', {
      method: 'POST',
      headers: authHeaders(studentAToken),
      body: JSON.stringify({ exerciseSetId: set1Id }),
    });
    assert.strictEqual(retiredAttemptRes.status, 409, 'Must return 409 Conflict for retired version');
    assert.strictEqual(retiredAttemptRes.body.error?.code, 'VERSION_NOT_PUBLISHED');
    const retiredSetRes = await rawRequest(`/api/v1/practice/exercise-sets/${set1Id}`);
    assert.strictEqual(retiredSetRes.status, 404, 'RETIRED exercise set must not be directly accessible');
    console.log('  ✅ Criterion 10 Passed');

    // -------------------------------------------------------------
    // Criterion 11: Security & Isolation - Student B không truy cập được attempt/result của Student A
    // -------------------------------------------------------------
    console.log('Test 11: Security & Isolation: Student B không xem được attempt detail / result của Student A (403)');
    const bAttemptDetailRes = await rawRequest(`/api/v1/practice/attempts/${attempt1Id}`, {
      method: 'GET',
      headers: authHeaders(studentBToken),
    });
    assert.strictEqual(bAttemptDetailRes.status, 403, 'Must return 403 Forbidden');

    const bAttemptResultRes = await rawRequest(`/api/v1/practice/attempts/${attempt1Id}/result`, {
      method: 'GET',
      headers: authHeaders(studentBToken),
    });
    assert.strictEqual(bAttemptResultRes.status, 403, 'Must return 403 Forbidden');
    console.log('  ✅ Criterion 11 Passed');

    // -------------------------------------------------------------
    // Criterion 12: Student History endpoint trả đúng danh sách của user với versionNumber, phân trang, lọc
    // -------------------------------------------------------------
    console.log('Test 12: Student History endpoint trả đúng danh sách attempt của Student A kèm versionNumber');
    const historyRes = await rawRequest('/api/v1/practice/history?page=1&limit=10', {
      method: 'GET',
      headers: authHeaders(studentAToken),
    });
    assert.strictEqual(historyRes.status, 200);
    const historyItems = historyRes.body.data.items;
    assert(historyItems.length >= 2, 'Student A must have at least 2 attempts in history');

    // Verify versionNumber presence
    const attV1 = historyItems.find((h: any) => h.attemptId === attempt1Id);
    const attV2 = historyItems.find((h: any) => h.attemptId === attempt2Id);
    assert(attV1, 'Attempt 1 must be in history');
    assert(attV2, 'Attempt 2 must be in history');
    assert.strictEqual(attV1.versionNumber, 1);
    assert.strictEqual(attV2.versionNumber, 2);
    assert.strictEqual(attV1.earnedScore, 10);
    assert.strictEqual(attV2.earnedScore, 20);

    // Verify Student B history is empty for this collection
    const bHistoryRes = await rawRequest('/api/v1/practice/history?page=1&limit=10', {
      method: 'GET',
      headers: authHeaders(studentBToken),
    });
    assert.strictEqual(bHistoryRes.status, 200);
    const bItems = bHistoryRes.body.data.items.filter((h: any) => h.collectionId === pubCollectionId);
    assert.strictEqual(bItems.length, 0, 'Student B history must have 0 attempts on this collection');
    console.log('  ✅ Criterion 12 Passed');

    console.log('\n🎉 ALL 12 PRACTICE VERSIONING E2E & STUDENT INTEGRATION CRITERIA PASSED!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runPracticeVersionE2ETests()
  .catch((err) => {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
