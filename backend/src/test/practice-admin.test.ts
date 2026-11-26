import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

async function runPracticeAdminTests() {
  console.log('🧪 Starting Practice CMS Admin Integration Tests (30 verification criteria)...\n');

  let server: http.Server | null = null;
  const createdTestCollectionCodes: string[] = [];

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

    // 0. Setup test users: Student, Editor 1, Editor 2, Admin
    const studentUser = await prisma.users.upsert({
      where: { email: 'student_admin_test@chinaeasy.test' },
      create: {
        email: 'student_admin_test@chinaeasy.test',
        display_name: 'Student Tester',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      update: { role: 'STUDENT', status: 'ACTIVE' },
    });

    const editor1User = await prisma.users.upsert({
      where: { email: 'editor1_admin_test@chinaeasy.test' },
      create: {
        email: 'editor1_admin_test@chinaeasy.test',
        display_name: 'Editor One',
        role: 'CONTENT_EDITOR',
        status: 'ACTIVE',
      },
      update: { role: 'CONTENT_EDITOR', status: 'ACTIVE' },
    });

    const editor2User = await prisma.users.upsert({
      where: { email: 'editor2_admin_test@chinaeasy.test' },
      create: {
        email: 'editor2_admin_test@chinaeasy.test',
        display_name: 'Editor Two',
        role: 'CONTENT_EDITOR',
        status: 'ACTIVE',
      },
      update: { role: 'CONTENT_EDITOR', status: 'ACTIVE' },
    });

    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_cms_test@chinaeasy.test' },
      create: {
        email: 'admin_cms_test@chinaeasy.test',
        display_name: 'Admin Tester',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      update: { role: 'ADMIN', status: 'ACTIVE' },
    });

    const studentToken = signAccessToken({ userId: studentUser.user_id, email: studentUser.email, role: 'STUDENT' });
    const editor1Token = signAccessToken({ userId: editor1User.user_id, email: editor1User.email, role: 'CONTENT_EDITOR' });
    const editor2Token = signAccessToken({ userId: editor2User.user_id, email: editor2User.email, role: 'CONTENT_EDITOR' });
    const adminToken = signAccessToken({ userId: adminUser.user_id, email: adminUser.email, role: 'ADMIN' });

    const studentHeaders = { Authorization: `Bearer ${studentToken}` };
    const editor1Headers = { Authorization: `Bearer ${editor1Token}` };
    const editor2Headers = { Authorization: `Bearer ${editor2Token}` };
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Get HSK1 level id
    const hsk1Level = await prisma.practiceLevel.findUnique({ where: { code: 'HSK1' } });
    assert(hsk1Level, 'HSK1 Level must exist');

    const testCollectionCode = `TEST-CMS-${Date.now().toString().slice(-6)}`;
    createdTestCollectionCodes.push(testCollectionCode);

    // ─── TEST 1: STUDENT GET admin collections → 403 ───
    console.log('▶ Test 1: STUDENT GET admin collections → 403');
    const t1 = await rawRequest('/api/v1/practice/admin/collections', { headers: studentHeaders });
    assert.strictEqual(t1.status, 403);
    console.log('  ✔ Student denied with 403.');

    // ─── TEST 2: CONTENT_EDITOR tạo collection và Version 1 DRAFT → 201 ───
    console.log('▶ Test 2: CONTENT_EDITOR tạo collection và Version 1 DRAFT → 201');
    const t2 = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        levelId: hsk1Level.id,
        code: testCollectionCode,
        category: 'WORKBOOK_LESSON',
        titleZh: '测试练习集',
        titleVi: 'Bộ đề luyện tập thử nghiệm CMS',
        orderIndex: 99,
      }),
    });
    assert.strictEqual(t2.status, 201);
    assert.strictEqual(t2.body.data.collection.status, 'DRAFT');
    assert.strictEqual(t2.body.data.initialVersion.versionNumber, 1);
    assert.strictEqual(t2.body.data.initialVersion.status, 'DRAFT');
    const collectionId = t2.body.data.collection.id;
    const version1Id = t2.body.data.initialVersion.id;
    console.log(`  ✔ Created collection ID ${collectionId}, version ID ${version1Id}.`);

    // ─── TEST 3: Code trùng → 409 ───
    console.log('▶ Test 3: Trùng code collection → 409');
    const t3 = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        levelId: hsk1Level.id,
        code: testCollectionCode,
        category: 'WORKBOOK_LESSON',
        titleZh: '测试练习集重复',
        titleVi: 'Bộ đề trùng',
      }),
    });
    assert.strictEqual(t3.status, 409);
    console.log('  ✔ Duplicate code rejected with 409.');

    // ─── TEST 4: Editor khác không sửa draft → 403 ───
    console.log('▶ Test 4: Editor khác không sửa draft của editor 1 → 403');
    const colDetail = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}`, { headers: editor1Headers });
    const colUpdatedAt = colDetail.body.data.updatedAt;

    // ─── TEST 4a: Collection and version access follow editor ownership ───
    console.log('▶ Test 4a: CONTENT_EDITOR list, summary, pagination, search and detail scope');
    const t4aList = await rawRequest(
      `/api/v1/practice/admin/collections?search=${encodeURIComponent(testCollectionCode)}&page=1&limit=1`,
      { headers: editor2Headers }
    );
    assert.strictEqual(t4aList.status, 200);
    assert.strictEqual(t4aList.body.data.items.length, 0);
    assert.strictEqual(t4aList.body.data.pagination.total, 0);
    assert.deepStrictEqual(t4aList.body.data.summary, {
      draft: 0,
      inReview: 0,
      revisionRequired: 0,
      published: 0,
      archived: 0,
    });

    const t4aOwnerList = await rawRequest(
      `/api/v1/practice/admin/collections?search=${encodeURIComponent(testCollectionCode)}&page=1&limit=1`,
      { headers: editor1Headers }
    );
    assert.strictEqual(t4aOwnerList.status, 200);
    assert.strictEqual(t4aOwnerList.body.data.items.length, 1);
    assert.strictEqual(t4aOwnerList.body.data.pagination.total, 1);
    assert.strictEqual(t4aOwnerList.body.data.summary.draft, 1);

    const editor1ScopeWhere = {
      OR: [
        { createdById: editor1User.user_id },
        { assignedEditorId: editor1User.user_id },
        { versions: { some: { createdById: editor1User.user_id } } },
        { versions: { some: { assignedEditorId: editor1User.user_id } } },
      ],
    };
    const editor1AccessibleTotal = await prisma.practiceCollection.count({ where: editor1ScopeWhere });
    const t4aPagination = await rawRequest(
      '/api/v1/practice/admin/collections?page=1&limit=1',
      { headers: editor1Headers }
    );
    assert.strictEqual(t4aPagination.status, 200);
    assert.strictEqual(t4aPagination.body.data.pagination.total, editor1AccessibleTotal);
    assert.ok(t4aPagination.body.data.items.length <= 1);

    const t4aCollection = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aCollection.status, 403);

    const t4aVersions = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/versions`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aVersions.status, 403);

    const t4aVersion = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aVersion.status, 403);
    const t4aPreview = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/preview`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aPreview.status, 403);

    const t4aAdminList = await rawRequest(
      `/api/v1/practice/admin/collections?search=${encodeURIComponent(testCollectionCode)}`,
      { headers: adminHeaders }
    );
    assert.strictEqual(t4aAdminList.status, 200);
    assert.strictEqual(t4aAdminList.body.data.pagination.total, 1);
    const t4aAdminCollection = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}`, {
      headers: adminHeaders,
    });
    assert.strictEqual(t4aAdminCollection.status, 200);
    const t4aAdminVersions = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/versions`, {
      headers: adminHeaders,
    });
    assert.strictEqual(t4aAdminVersions.status, 200);
    const t4aAdminVersion = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}`, {
      headers: adminHeaders,
    });
    assert.strictEqual(t4aAdminVersion.status, 200);

    const assignedCollectionCode = `TEST-CMS-ASSIGNED-${Date.now().toString().slice(-6)}`;
    createdTestCollectionCodes.push(assignedCollectionCode);
    const assignedCollectionResponse = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        levelId: hsk1Level.id,
        code: assignedCollectionCode,
        category: 'WORKBOOK_LESSON',
        titleZh: '分配给编辑的测试内容',
        titleVi: 'Nội dung kiểm tra được giao cho biên tập viên',
      }),
    });
    assert.strictEqual(assignedCollectionResponse.status, 201);
    const assignedCollectionId = assignedCollectionResponse.body.data.collection.id;
    const assignedVersionId = assignedCollectionResponse.body.data.initialVersion.id;
    await prisma.practiceCollectionVersion.update({
      where: { id: assignedVersionId },
      data: { assignedEditorId: editor2User.user_id },
    });

    const t4aAssignedList = await rawRequest(
      `/api/v1/practice/admin/collections?search=${encodeURIComponent(assignedCollectionCode)}&page=1&limit=1`,
      { headers: editor2Headers }
    );
    assert.strictEqual(t4aAssignedList.status, 200);
    assert.strictEqual(t4aAssignedList.body.data.pagination.total, 1);
    assert.strictEqual(t4aAssignedList.body.data.summary.draft, 1);
    assert.strictEqual(t4aAssignedList.body.data.items[0].id, assignedCollectionId);

    const t4aAssignedCollection = await rawRequest(`/api/v1/practice/admin/collections/${assignedCollectionId}`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aAssignedCollection.status, 200);
    const t4aAssignedVersions = await rawRequest(`/api/v1/practice/admin/collections/${assignedCollectionId}/versions`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aAssignedVersions.status, 200);
    const t4aAssignedVersion = await rawRequest(`/api/v1/practice/admin/versions/${assignedVersionId}`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aAssignedVersion.status, 200);
    const t4aAssignedPreview = await rawRequest(`/api/v1/practice/admin/versions/${assignedVersionId}/preview`, {
      headers: editor2Headers,
    });
    assert.strictEqual(t4aAssignedPreview.status, 200);
    const t4aUnassignedDetail = await rawRequest(`/api/v1/practice/admin/collections/${assignedCollectionId}`, {
      headers: editor1Headers,
    });
    assert.strictEqual(t4aUnassignedDetail.status, 403);
    const t4aUnassignedVersion = await rawRequest(`/api/v1/practice/admin/versions/${assignedVersionId}`, {
      headers: editor1Headers,
    });
    assert.strictEqual(t4aUnassignedVersion.status, 403);

    const createScopeFixture = async (code: string, headers: Record<string, string>) => {
      createdTestCollectionCodes.push(code);
      const response = await rawRequest('/api/v1/practice/admin/collections', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          levelId: hsk1Level.id,
          code,
          category: 'WORKBOOK_LESSON',
          titleZh: '权限范围测试',
          titleVi: 'Bộ kiểm tra quyền truy cập',
        }),
      });
      assert.strictEqual(response.status, 201);
      return {
        collectionId: response.body.data.collection.id,
        versionId: response.body.data.initialVersion.id,
      };
    };
    const assertEditor2CanFindScopeFixture = async (code: string, expectedId: number) => {
      const response = await rawRequest(
        `/api/v1/practice/admin/collections?search=${encodeURIComponent(code)}&page=1&limit=1`,
        { headers: editor2Headers }
      );
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.data.pagination.total, 1);
      assert.strictEqual(response.body.data.summary.draft, 1);
      assert.strictEqual(response.body.data.items[0].id, expectedId);
    };

    const collectionCreatorOnlyCode = `TEST-CMS-CREATOR-${Date.now().toString().slice(-6)}`;
    const collectionCreatorOnly = await createScopeFixture(collectionCreatorOnlyCode, editor2Headers);
    await prisma.practiceCollectionVersion.update({
      where: { id: collectionCreatorOnly.versionId },
      data: { createdById: adminUser.user_id },
    });
    await assertEditor2CanFindScopeFixture(collectionCreatorOnlyCode, collectionCreatorOnly.collectionId);

    const collectionAssigneeOnlyCode = `TEST-CMS-COLASSIGN-${Date.now().toString().slice(-6)}`;
    const collectionAssigneeOnly = await createScopeFixture(collectionAssigneeOnlyCode, adminHeaders);
    await prisma.practiceCollection.update({
      where: { id: collectionAssigneeOnly.collectionId },
      data: { assignedEditorId: editor2User.user_id },
    });
    await assertEditor2CanFindScopeFixture(collectionAssigneeOnlyCode, collectionAssigneeOnly.collectionId);

    const versionCreatorOnlyCode = `TEST-CMS-VERCREATOR-${Date.now().toString().slice(-6)}`;
    const versionCreatorOnly = await createScopeFixture(versionCreatorOnlyCode, adminHeaders);
    await prisma.practiceCollectionVersion.update({
      where: { id: versionCreatorOnly.versionId },
      data: { createdById: editor2User.user_id },
    });
    await assertEditor2CanFindScopeFixture(versionCreatorOnlyCode, versionCreatorOnly.collectionId);
    console.log('  ✔ Ownership scopes all four ownership paths and protects detail endpoints.');

    const t4 = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}`, {
      method: 'PUT',
      headers: editor2Headers,
      body: JSON.stringify({
        titleVi: 'Hack title by editor 2',
        expectedUpdatedAt: colUpdatedAt,
      }),
    });
    assert.strictEqual(t4.status, 403);
    console.log('  ✔ Editor 2 forbidden from modifying Editor 1 collection.');

    // ─── TEST 5: ADMIN sửa được draft → 200 ───
    console.log('▶ Test 5: ADMIN sửa được draft của bất kỳ editor nào → 200');
    const t5 = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        titleVi: 'Bộ đề thử nghiệm CMS (Admin cập nhật tiêu đề)',
        expectedUpdatedAt: colUpdatedAt,
      }),
    });
    assert.strictEqual(t5.status, 200);
    assert.strictEqual(t5.body.data.titleVi, 'Bộ đề thử nghiệm CMS (Admin cập nhật tiêu đề)');
    console.log('  ✔ Admin successfully updated collection metadata.');

    // ─── TEST 6: Editor thêm exercise set vào version ───
    console.log('▶ Test 6: Editor thêm exercise set vào version → 201');
    const exerciseSetCode = `${testCollectionCode}-LISTENING`;
    const t6 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/exercise-sets`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        code: exerciseSetCode,
        skill: 'LISTENING',
        titleZh: '第一部分 听力',
        titleVi: 'Phần 1: Nghe hiểu',
        sortOrder: 1,
      }),
    });
    assert.strictEqual(t6.status, 201);
    const exerciseSetId = t6.body.data.id;
    console.log(`  ✔ Added exercise set ID ${exerciseSetId}.`);

    // ─── TEST 7: Editor thêm question đúng type SINGLE_CHOICE ───
    console.log('▶ Test 7: Editor thêm question đúng type SINGLE_CHOICE → 201');
    const q1Code = `${exerciseSetCode}-Q01`;
    const t7 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${exerciseSetId}/questions`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        code: q1Code,
        type: 'SINGLE_CHOICE',
        prompt: {
          text: 'Chọn đáp án đúng',
          options: [
            { key: 'A', text: '你好' },
            { key: 'B', text: '再见' },
          ],
        },
        answer: { value: 'A' },
        explanation: 'Đáp án là A vì chào gặp mặt là 你好.',
        score: 2,
        sortOrder: 1,
      }),
    });
    assert.strictEqual(t7.status, 201);
    const question1Id = t7.body.data.id;
    const questionAudit = await prisma.auditLogs.findFirst({
      where: {
        action_type: 'CREATE_PRACTICE_QUESTION',
        target_entity: 'PracticeQuestion',
        target_id: String(question1Id),
      },
    });
    assert(questionAudit?.new_value, 'Question creation must be audited');
    const auditedQuestion = JSON.parse(questionAudit.new_value);
    assert.strictEqual(auditedQuestion.answer, undefined);
    assert.strictEqual(auditedQuestion.explanation, undefined);
    console.log(`  ✔ Added question ID ${question1Id}.`);

    // ─── TEST 8: Prompt chứa correctAnswer (answer leak) → 400 ───
    console.log('▶ Test 8: Prompt chứa key correctAnswer (answer leakage) → 400');
    const t8 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${exerciseSetId}/questions`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        code: `${exerciseSetCode}-QLEAK`,
        type: 'SINGLE_CHOICE',
        prompt: {
          text: 'Câu hỏi lộ đáp án',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswer: 'A',
        },
        answer: { value: 'A' },
      }),
    });
    assert.strictEqual(t8.status, 400);
    console.log('  ✔ Answer leak in prompt rejected with 400.');

    // ─── TEST 9: Answer SINGLE_CHOICE không thuộc options → 400 ───
    console.log('▶ Test 9: Answer SINGLE_CHOICE không thuộc options → 400');
    const t9 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${exerciseSetId}/questions`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        code: `${exerciseSetCode}-QINVALID`,
        type: 'SINGLE_CHOICE',
        prompt: {
          text: 'Câu hỏi option',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
        },
        answer: { value: 'Z' }, // Invalid option
      }),
    });
    assert.strictEqual(t9.status, 400);
    console.log('  ✔ Invalid answer option rejected with 400.');

    // ─── TEST 10: Submit-review version rỗng hoặc lỗi → 400 ───
    console.log('▶ Test 10: Submit-review version rỗng chưa có exercise set → 400');
    // Tạo 1 version rỗng riêng để test
    const emptyCollectionCode = `TEST-EMPTY-${Date.now().toString().slice(-6)}`;
    createdTestCollectionCodes.push(emptyCollectionCode);
    const emptyColRes = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        levelId: hsk1Level.id,
        code: emptyCollectionCode,
        category: 'WORKBOOK_LESSON',
        titleZh: '空集合',
        titleVi: 'Bộ đề rỗng',
      }),
    });
    const emptyVersionId = emptyColRes.body.data.initialVersion.id;
    const t10 = await rawRequest(`/api/v1/practice/admin/versions/${emptyVersionId}/submit-review`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({ reviewNotes: 'Gửi duyệt bài rỗng' }),
    });
    assert.strictEqual(t10.status, 400);
    console.log('  ✔ Empty version review submission rejected with 400.');

    // ─── TEST 11: Editor submit-review version 1 hợp lệ → IN_REVIEW ───
    console.log('▶ Test 11: Editor submit-review version 1 hợp lệ → 200 (IN_REVIEW)');
    const t11 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/submit-review`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({ reviewNotes: 'Kính gửi Admin kiểm duyệt' }),
    });
    assert.strictEqual(t11.status, 200);
    assert.strictEqual(t11.body.data.status, 'IN_REVIEW');
    console.log('  ✔ Version successfully submitted for review (IN_REVIEW).');

    // ─── TEST 12: CONTENT_EDITOR publish → 403 ───
    console.log('▶ Test 12: CONTENT_EDITOR publish → 403');
    const t12 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/publish`, {
      method: 'POST',
      headers: editor1Headers,
    });
    assert.strictEqual(t12.status, 403);
    console.log('  ✔ Content editor publish denied with 403.');

    // ─── TEST 13: Request changes không có lý do hoặc < 5 ký tự → 400 ───
    console.log('▶ Test 13: Request changes không có lý do hợp lệ → 400');
    const t13 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/request-changes`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reviewNote: 'Ngắn' }),
    });
    assert.strictEqual(t13.status, 400);
    console.log('  ✔ Short/empty review note rejected with 400.');

    // ─── TEST 14: ADMIN request changes với lý do rõ ràng → REVISION_REQUIRED ───
    console.log('▶ Test 14: ADMIN request changes với lý do rõ ràng → 200 (REVISION_REQUIRED)');
    const t14 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/request-changes`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reviewNote: 'Vui lòng bổ sung thêm câu hỏi số 2 và chỉnh sửa giải thích chi tiết hơn.' }),
    });
    assert.strictEqual(t14.status, 200);
    assert.strictEqual(t14.body.data.status, 'REVISION_REQUIRED');
    console.log('  ✔ Version status changed to REVISION_REQUIRED.');

    // ─── TEST 15: Editor sửa revision và submit lại ───
    console.log('▶ Test 15: Editor sửa revision (thêm câu 2) và submit lại review → 200');
    const q2Code = `${exerciseSetCode}-Q02`;
    await rawRequest(`/api/v1/practice/admin/exercise-sets/${exerciseSetId}/questions`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        code: q2Code,
        type: 'TRUE_FALSE',
        prompt: { text: '你好 nghĩa là Tạm biệt?' },
        answer: { value: false },
        score: 2,
        sortOrder: 2,
      }),
    });
    const t15 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/submit-review`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({ reviewNotes: 'Đã bổ sung câu 2 đầy đủ.' }),
    });
    assert.strictEqual(t15.status, 200);
    assert.strictEqual(t15.body.data.status, 'IN_REVIEW');
    console.log('  ✔ Resubmitted for review successfully.');

    // ─── TEST 16: ADMIN publish → PUBLISHED ───
    console.log('▶ Test 16: ADMIN publish → 200 (PUBLISHED)');
    const t16 = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/publish`, {
      method: 'POST',
      headers: adminHeaders,
    });
    assert.strictEqual(t16.status, 200);
    assert.strictEqual(t16.body.data.status, 'PUBLISHED');
    console.log('  ✔ Version 1 published successfully.');

    // ─── TEST 17: Collection.currentVersionId trỏ đúng Version 1 ───
    console.log('▶ Test 17: Collection.currentVersionId trỏ đúng Version 1');
    const colCheck = await prisma.practiceCollection.findUnique({ where: { id: collectionId } });
    assert.strictEqual(colCheck?.status, 'PUBLISHED');
    assert.strictEqual(colCheck?.currentVersionId, version1Id);
    console.log('  ✔ Collection status is PUBLISHED and currentVersionId matches.');

    // ─── TEST 18: PUBLISHED version update metadata/set/question → 409 ───
    console.log('▶ Test 18: Sửa trực tiếp version đã PUBLISHED → 409 (VERSION_IMMUTABLE)');
    const v1Detail = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}`, { headers: adminHeaders });
    const t18a = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        changeSummary: 'Cố tình sửa version đã publish',
        expectedUpdatedAt: v1Detail.body.data.updatedAt,
      }),
    });
    assert.strictEqual(t18a.status, 409);

    const t18b = await rawRequest(`/api/v1/practice/admin/versions/${version1Id}/exercise-sets`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        code: `${testCollectionCode}-FAIL-SET`,
        skill: 'READING',
        titleZh: '阅读',
      }),
    });
    assert.strictEqual(t18b.status, 409);
    console.log('  ✔ Published version is strictly immutable (409 on set/version update).');

    // ─── TEST 19: Tạo Revision mới (Version 2) deep clone đủ sets/questions ───
    console.log('▶ Test 19: Tạo Revision mới (Version 2) deep clone đủ sets & questions → 201');
    const t19 = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/versions`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        sourceVersionId: version1Id,
        changeSummary: 'Tạo revision Version 2 để cập nhật nội dung mới',
      }),
    });
    assert.strictEqual(t19.status, 201);
    assert.strictEqual(t19.body.data.versionNumber, 2);
    assert.strictEqual(t19.body.data.status, 'DRAFT');

    const v2Detail = await rawRequest(`/api/v1/practice/admin/versions/${t19.body.data.id}`, { headers: editor1Headers });
    assert.strictEqual(v2Detail.body.data.exerciseSets.length, 1);
    assert.strictEqual(v2Detail.body.data.exerciseSets[0].questions.length, 2);
    const version2Id = t19.body.data.id;
    console.log(`  ✔ Version 2 created with cloned 1 set and 2 questions.`);

    // ─── TEST 20: Version cũ PUBLISHED chuyển RETIRED khi publish revision mới ───
    console.log('▶ Test 20: Submit review và Publish Version 2 → Version 1 chuyển RETIRED');
    await rawRequest(`/api/v1/practice/admin/versions/${version2Id}/submit-review`, {
      method: 'POST',
      headers: editor1Headers,
    });
    const t20 = await rawRequest(`/api/v1/practice/admin/versions/${version2Id}/publish`, {
      method: 'POST',
      headers: adminHeaders,
    });
    assert.strictEqual(t20.status, 200);

    const oldV1 = await prisma.practiceCollectionVersion.findUnique({ where: { id: version1Id } });
    assert.strictEqual(oldV1?.status, 'RETIRED');
    const newV2 = await prisma.practiceCollectionVersion.findUnique({ where: { id: version2Id } });
    assert.strictEqual(newV2?.status, 'PUBLISHED');
    const colCheck2 = await prisma.practiceCollection.findUnique({ where: { id: collectionId } });
    assert.strictEqual(colCheck2?.currentVersionId, version2Id);
    console.log('  ✔ Version 1 retired, Version 2 published and becomes currentVersion.');

    // ─── TEST 21: Attempt cũ vẫn trỏ version cũ ───
    console.log('▶ Test 21: Attempt cũ bảo toàn versionId và snapshotData');
    const attempts = await prisma.practiceAttempt.findMany({
      where: { versionId: { not: null }, snapshotData: { not: null } },
      take: 1,
    });
    assert(attempts.length > 0, 'Must have at least 1 backfilled attempt');
    assert(attempts[0].versionId !== null);
    assert(typeof attempts[0].snapshotData === 'string');
    console.log('  ✔ Old attempts reliably retain their specific versionId and immutable snapshot.');

    // ─── TEST 22: Student API không thấy collection DRAFT ───
    console.log('▶ Test 22: Student API không nhìn thấy collection DRAFT');
    const draftColCode = `TEST-DRAFT-${Date.now().toString().slice(-6)}`;
    createdTestCollectionCodes.push(draftColCode);
    await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({
        levelId: hsk1Level.id,
        code: draftColCode,
        category: 'WORKBOOK_LESSON',
        titleZh: '草稿',
        titleVi: 'Bản nháp ẩn',
      }),
    });
    // Student list
    const studentLessons = await rawRequest('/api/v1/practice/levels/HSK1/lessons');
    assert(studentLessons.body.data.every((l: any) => l.code !== draftColCode));
    console.log('  ✔ Student catalog completely excludes DRAFT collections.');

    // ─── TEST 23: Student exercise API không lộ answer/explanation ───
    console.log('▶ Test 23: Student exercise API không lộ answer/explanation');
    const pubSet = v2Detail.body.data.exerciseSets[0];
    const studentSetRes = await rawRequest(`/api/v1/practice/exercise-sets/${pubSet.id}`);
    if (studentSetRes.status === 200 && studentSetRes.body.data?.questions) {
      for (const q of studentSetRes.body.data.questions) {
        assert.strictEqual(q.answer, undefined);
        assert.strictEqual(q.explanation, undefined);
      }
    }
    console.log('  ✔ Student response is cleanly stripped of answers.');

    // ─── TEST 24: Reorder set/question hợp lệ ───
    console.log('▶ Test 24: Reorder questions hợp lệ → 200');
    // Tạo version 3 draft để test reorder
    const t24VersionRes = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/versions`, {
      method: 'POST',
      headers: editor1Headers,
      body: JSON.stringify({ changeSummary: 'Test reorder' }),
    });
    const version3Id = t24VersionRes.body.data.id;
    const v3Detail = await rawRequest(`/api/v1/practice/admin/versions/${version3Id}`, { headers: editor1Headers });
    const v3Set = v3Detail.body.data.exerciseSets[0];
    const qA = v3Set.questions[0];
    const qB = v3Set.questions[1];

    const t24 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${v3Set.id}/questions/reorder`, {
      method: 'PUT',
      headers: editor1Headers,
      body: JSON.stringify({
        items: [
          { id: qA.id, sortOrder: 2 },
          { id: qB.id, sortOrder: 1 },
        ],
      }),
    });
    assert.strictEqual(t24.status, 200);
    console.log('  ✔ Reorder questions executed successfully.');

    // ─── TEST 25: Reorder ID ngoài version → 400 ───
    console.log('▶ Test 25: Reorder với ID không thuộc set → 400');
    const t25 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${v3Set.id}/questions/reorder`, {
      method: 'PUT',
      headers: editor1Headers,
      body: JSON.stringify({
        items: [
          { id: 999999, sortOrder: 1 },
          { id: qB.id, sortOrder: 2 },
        ],
      }),
    });
    assert.strictEqual(t25.status, 400);
    console.log('  ✔ Foreign ID rejected with 400.');

    // ─── TEST 26: Optimistic concurrency mismatch (expectedUpdatedAt cũ) → 409 ───
    console.log('▶ Test 26: Optimistic concurrency mismatch → 409 (EDIT_CONFLICT)');
    const t26 = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        titleVi: 'Conflict attempt',
        expectedUpdatedAt: new Date('2020-01-01T00:00:00Z').toISOString(),
      }),
    });
    assert.strictEqual(t26.status, 409);
    assert.strictEqual(t26.body.error.code, 'EDIT_CONFLICT');
    console.log('  ✔ Stale expectedUpdatedAt rejected with 409 EDIT_CONFLICT.');

    // ─── TEST 27: Archive collection chỉ ADMIN ───
    console.log('▶ Test 27: Archive collection chỉ dành cho ADMIN (Editor → 403, Admin → 200)');
    const t27a = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/archive`, {
      method: 'POST',
      headers: editor1Headers,
    });
    assert.strictEqual(t27a.status, 403);

    const t27b = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/archive`, {
      method: 'POST',
      headers: adminHeaders,
    });
    assert.strictEqual(t27b.status, 200);
    assert.strictEqual(t27b.body.data.status, 'ARCHIVED');
    console.log('  ✔ Archive permission checked strictly.');

    // ─── TEST 28: AuditLogs có các action ───
    console.log('▶ Test 28: AuditLogs ghi nhận đầy đủ các action');
    const publishAudit = await prisma.auditLogs.findFirst({
      where: { action_type: 'PUBLISH_PRACTICE_VERSION' },
    });
    assert(publishAudit, 'PUBLISH_PRACTICE_VERSION must be logged in AuditLogs');

    const legacyQuestionAudit = await prisma.auditLogs.create({
      data: {
        user_id: adminUser.user_id,
        action_type: 'UPDATE_PRACTICE_QUESTION',
        target_entity: 'PracticeQuestion',
        target_id: `legacy-redaction-${Date.now()}`,
        old_value: JSON.stringify({
          score: 2,
          answer: { value: 'A', acceptedValues: ['B'] },
          explanation: 'Sensitive old explanation',
          correctAnswer: 'A',
        }),
        new_value: JSON.stringify({
          score: 3,
          answer: { value: 'B' },
          explanation: 'Sensitive new explanation',
        }),
      },
    });
    try {
      const auditList = await rawRequest('/api/v1/users/admin/audit-logs?limit=100', {
        headers: adminHeaders,
      });
      assert.strictEqual(auditList.status, 200);
      const legacyAuditEntry = auditList.body.data.find(
        (entry: any) => entry.logId === legacyQuestionAudit.log_id
      );
      assert(legacyAuditEntry, 'Legacy question audit entry must be returned to ADMIN');
      assert.deepStrictEqual(JSON.parse(legacyAuditEntry.oldValue), { score: 2 });
      assert.deepStrictEqual(JSON.parse(legacyAuditEntry.newValue), { score: 3 });
    } finally {
      await prisma.auditLogs.delete({ where: { log_id: legacyQuestionAudit.log_id } });
    }
    console.log('  ✔ Verified publish logging and answer redaction in AuditLogs.');

    // ─── TEST 29: Duplicate collection không clone attempts ───
    console.log('▶ Test 29: Duplicate collection tạo bản sao DRAFT độc lập');
    const dupCode = `TEST-DUP-${Date.now().toString().slice(-6)}`;
    createdTestCollectionCodes.push(dupCode);
    const t29 = await rawRequest(`/api/v1/practice/admin/collections/${collectionId}/duplicate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ newCode: dupCode, titleVi: 'Bản sao kiểm tra' }),
    });
    assert.strictEqual(t29.status, 201);
    assert.strictEqual(t29.body.data.collection.status, 'DRAFT');
    console.log('  ✔ Collection duplicated cleanly.');

    // ─── TEST 30: Preview version có showAnswers mode ───
    console.log('▶ Test 30: CMS Preview version hỗ trợ showAnswers=true');
    const t30NoAns = await rawRequest(`/api/v1/practice/admin/versions/${version2Id}/preview`, {
      headers: editor1Headers,
    });
    assert.strictEqual(t30NoAns.body.data.exerciseSets[0].questions[0].answer, undefined);

    const t30WithAns = await rawRequest(`/api/v1/practice/admin/versions/${version2Id}/preview?showAnswers=true`, {
      headers: editor1Headers,
    });
    assert(t30WithAns.body.data.exerciseSets[0].questions[0].answer !== undefined);
    console.log('  ✔ Preview endpoint properly toggles answer visibility for CMS users.');

    console.log('\n===============================================================');
    console.log('🎉 ALL 30 PRACTICE CMS ADMIN INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('===============================================================\n');
  } finally {
    // Cleanup test collections safely
    if (createdTestCollectionCodes.length > 0) {
      console.log('🧹 Cleaning up CMS test collections...');
      for (const code of createdTestCollectionCodes) {
        try {
          const col = await prisma.practiceCollection.findUnique({
            where: { code },
            include: {
              versions: {
                include: {
                  exerciseSets: {
                    include: { questions: true },
                  },
                },
              },
            },
          });
          if (col) {
            await prisma.practiceCollection.update({
              where: { id: col.id },
              data: { currentVersionId: null },
            });

            for (const v of col.versions) {
              for (const s of v.exerciseSets) {
                await prisma.practiceQuestion.deleteMany({ where: { exerciseSetId: s.id } });
                await prisma.practiceExerciseSet.delete({ where: { id: s.id } });
              }
              await prisma.practiceCollectionVersion.delete({ where: { id: v.id } });
            }
            await prisma.practiceCollection.delete({ where: { id: col.id } });
          }
        } catch (cleanupErr) {
          console.error(`Failed to cleanup ${code}:`, cleanupErr);
        }
      }
      console.log('✓ Cleanup completed.');
    }

    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runPracticeAdminTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
