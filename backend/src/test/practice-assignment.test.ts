import assert from 'node:assert/strict';
import { prisma } from '../shared/database/prisma.client';
import { practiceAdminService } from '../modules/practice-admin/practice-admin.service';
import { AppError } from '../shared/errors/app-error';

async function run() {
  console.log('--- STARTING PRACTICE ASSIGNMENT & OWNERSHIP TESTS ---');

  const timestamp = Date.now();

  // 1. Setup Test Users
  const adminUser = await prisma.users.upsert({
    where: { email: `test_admin_assign_${timestamp}@chinaeasy.test` },
    update: {},
    create: {
      email: `test_admin_assign_${timestamp}@chinaeasy.test`,
      password_hash: 'hashed_pw',
      display_name: 'Test Admin Assign',
      role: 'ADMIN',
      status: 'ACTIVE',
      is_verified: true,
    },
  });

  const editorUser1 = await prisma.users.upsert({
    where: { email: `test_editor1_assign_${timestamp}@chinaeasy.test` },
    update: {},
    create: {
      email: `test_editor1_assign_${timestamp}@chinaeasy.test`,
      password_hash: 'hashed_pw',
      display_name: 'Test Editor 1 Assign',
      role: 'CONTENT_EDITOR',
      status: 'ACTIVE',
      is_verified: true,
    },
  });

  const editorUser2 = await prisma.users.upsert({
    where: { email: `test_editor2_assign_${timestamp}@chinaeasy.test` },
    update: {},
    create: {
      email: `test_editor2_assign_${timestamp}@chinaeasy.test`,
      password_hash: 'hashed_pw',
      display_name: 'Test Editor 2 Assign',
      role: 'CONTENT_EDITOR',
      status: 'ACTIVE',
      is_verified: true,
    },
  });

  const studentUser = await prisma.users.upsert({
    where: { email: `test_student_assign_${timestamp}@chinaeasy.test` },
    update: {},
    create: {
      email: `test_student_assign_${timestamp}@chinaeasy.test`,
      password_hash: 'hashed_pw',
      display_name: 'Test Student Assign',
      role: 'STUDENT',
      status: 'ACTIVE',
      is_verified: true,
    },
  });

  const level = await prisma.practiceLevel.findFirst({ where: { code: 'HSK1' } });
  assert.ok(level, 'HSK1 level must exist');

  // Tạo Collection bởi Admin (createdById = adminUser.user_id)
  const collectionCode = `ASSIGN-TEST-${timestamp}`;
  const createdRes = await practiceAdminService.createCollection(
    {
      levelId: level.id,
      code: collectionCode,
      category: 'WORKBOOK_LESSON',
      titleZh: '测试分配所有权',
      titleVi: 'Kiểm tra phân công quyền',
      orderIndex: 99,
    },
    { userId: adminUser.user_id, role: 'ADMIN' }
  );

  const collectionId = createdRes.collection.id;
  const initialVersionId = createdRes.initialVersion.id;

  // Thêm 1 ExerciseSet và 1 Question hợp lệ vào version để test submit-review
  const setRes = await practiceAdminService.createExerciseSet(
    initialVersionId,
    {
      code: `${collectionCode}-SET1`,
      skill: 'READING',
      titleZh: '阅读部分',
      titleVi: 'Phần đọc',
      estimatedMinutes: 15,
    },
    { userId: adminUser.user_id, role: 'ADMIN' }
  );

  await practiceAdminService.createQuestion(
    setRes.id,
    {
      code: `${collectionCode}-SET1-Q01`,
      type: 'TRUE_FALSE',
      prompt: { textZh: '你好' },
      answer: { value: true },
      score: 5,
    },
    { userId: adminUser.user_id, role: 'ADMIN' }
  );

  console.log('✅ Test setup completed. Collection ID:', collectionId);

  // ----------------------------------------------------
  // TEST 1: Editor gọi assign-editor -> 403 Forbidden
  // ----------------------------------------------------
  try {
    await practiceAdminService.assignEditor(
      collectionId,
      editorUser1.user_id,
      { userId: editorUser1.user_id, role: 'CONTENT_EDITOR' }
    );
    assert.fail('Editor must not be allowed to assign-editor');
  } catch (err: any) {
    assert.equal(err.statusCode, 403, 'Editor calling assign-editor must get 403');
    console.log('✅ Test 1 Passed: Editor gọi assign-editor nhận 403');
  }

  // ----------------------------------------------------
  // TEST 1.1: Phân công cho STUDENT -> 400 Bad Request
  // ----------------------------------------------------
  try {
    await practiceAdminService.assignEditor(
      collectionId,
      studentUser.user_id,
      { userId: adminUser.user_id, role: 'ADMIN' }
    );
    assert.fail('Assigning editor to a STUDENT must fail with 400');
  } catch (err: any) {
    assert.equal(err.statusCode, 400, 'Assigning to STUDENT must get 400');
    console.log('✅ Test 1.1 Passed: Phân công cho role không phải EDITOR/ADMIN nhận 400');
  }

  // ----------------------------------------------------
  // TEST 2: Admin assign CONTENT_EDITOR -> 200
  // ----------------------------------------------------
  const assignRes = await practiceAdminService.assignEditor(
    collectionId,
    editorUser1.user_id,
    { userId: adminUser.user_id, role: 'ADMIN' }
  );
  assert.ok(assignRes, 'assignEditor should return result');
  console.log('✅ Test 2 Passed: Admin assign CONTENT_EDITOR thành công (200)');

  // ----------------------------------------------------
  // TEST 3: createdById không đổi
  // ----------------------------------------------------
  const collectionAfterAssign = await prisma.practiceCollection.findUnique({
    where: { id: collectionId },
    include: { versions: true },
  });
  assert.equal(
    collectionAfterAssign?.createdById,
    adminUser.user_id,
    'Collection createdById must remain original Admin user ID'
  );
  assert.equal(
    collectionAfterAssign?.versions[0]?.createdById,
    adminUser.user_id,
    'Version createdById must remain original Admin user ID'
  );
  console.log('✅ Test 3 Passed: createdById bất biến, giữ nguyên người tạo ban đầu');

  // ----------------------------------------------------
  // TEST 4: assignedEditorId được cập nhật
  // ----------------------------------------------------
  assert.equal(
    collectionAfterAssign?.assignedEditorId,
    editorUser1.user_id,
    'Collection assignedEditorId must be editorUser1'
  );
  assert.equal(
    collectionAfterAssign?.versions[0]?.assignedEditorId,
    editorUser1.user_id,
    'Version 1 assignedEditorId must be editorUser1'
  );
  console.log('✅ Test 4 Passed: assignedEditorId được cập nhật trên cả Collection và Version DRAFT');

  // ----------------------------------------------------
  // TEST 5: AuditLog được tạo
  // ----------------------------------------------------
  const auditLog = await prisma.auditLogs.findFirst({
    where: {
      action_type: 'ASSIGN_PRACTICE_EDITOR',
      target_id: String(collectionId),
    },
    orderBy: { created_at: 'desc' },
  });
  assert.ok(auditLog, 'ASSIGN_PRACTICE_EDITOR audit log must be created');
  assert.equal(auditLog.user_id, adminUser.user_id);
  const auditNewVal = JSON.parse(auditLog.new_value || '{}');
  assert.equal(auditNewVal.newEditorId, editorUser1.user_id);
  console.log('✅ Test 5 Passed: AuditLog ASSIGN_PRACTICE_EDITOR được ghi chuẩn');

  // ----------------------------------------------------
  // TEST 6: Editor được assign -> có thể sửa DRAFT
  // ----------------------------------------------------
  const updatedVersion = await practiceAdminService.updateVersion(
    initialVersionId,
    {
      changeSummary: 'Editor 1 updated summary',
      expectedUpdatedAt: collectionAfterAssign!.versions[0].updatedAt.toISOString(),
    },
    { userId: editorUser1.user_id, role: 'CONTENT_EDITOR' }
  );
  assert.equal(updatedVersion.changeSummary, 'Editor 1 updated summary');
  console.log('✅ Test 6 Passed: Editor được assign có thể sửa DRAFT');

  // ----------------------------------------------------
  // TEST 8: Editor khác chưa được assign -> 403
  // ----------------------------------------------------
  try {
    await practiceAdminService.updateVersion(
      initialVersionId,
      {
        changeSummary: 'Malicious update by Editor 2',
        expectedUpdatedAt: new Date().toISOString(),
      },
      { userId: editorUser2.user_id, role: 'CONTENT_EDITOR' }
    );
    assert.fail('Unassigned Editor 2 must not be allowed to update version');
  } catch (err: any) {
    assert.equal(err.statusCode, 403, 'Unassigned editor must get 403');
    console.log('✅ Test 8 Passed: Editor khác chưa được assign bị chặn 403');
  }

  // ----------------------------------------------------
  // TEST 7: Editor được assign -> submit-review được
  // ----------------------------------------------------
  const submitRes = await practiceAdminService.submitForReview(
    initialVersionId,
    { reviewNotes: 'Editor 1 ready for review' },
    { userId: editorUser1.user_id, role: 'CONTENT_EDITOR' }
  );
  assert.equal(submitRes.status, 'IN_REVIEW');
  console.log('✅ Test 7 Passed: Editor được assign submit-review thành công');

  // ----------------------------------------------------
  // TEST 9: Version PUBLISHED không bị đổi assignedEditorId
  // ----------------------------------------------------
  // Publish version này bởi Admin
  const publishRes = await practiceAdminService.publishVersion(
    initialVersionId,
    { notes: 'Publishing for testing immutability' },
    { userId: adminUser.user_id, role: 'ADMIN' }
  );
  assert.equal(publishRes.status, 'PUBLISHED');

  // Giờ Admin re-assign collection sang Editor 2
  await practiceAdminService.assignEditor(
    collectionId,
    editorUser2.user_id,
    { userId: adminUser.user_id, role: 'ADMIN' }
  );

  const publishedVersionAfter = await prisma.practiceCollectionVersion.findUnique({
    where: { id: initialVersionId },
  });
  const collectionAfter = await prisma.practiceCollection.findUnique({
    where: { id: collectionId },
  });

  assert.equal(collectionAfter?.assignedEditorId, editorUser2.user_id, 'Collection assigned to editor 2');
  assert.equal(
    publishedVersionAfter?.assignedEditorId,
    editorUser1.user_id,
    'PUBLISHED version assignedEditorId must NOT be changed to editor 2'
  );
  console.log('✅ Test 9 Passed: Version PUBLISHED bất biến, không bị đổi assignedEditorId khi re-assign');

  // ----------------------------------------------------
  // TEST 10: Collection không tồn tại -> 404
  // ----------------------------------------------------
  try {
    await practiceAdminService.assignEditor(
      99999999,
      editorUser1.user_id,
      { userId: adminUser.user_id, role: 'ADMIN' }
    );
    assert.fail('Assigning non-existent collection must throw 404');
  } catch (err: any) {
    assert.equal(err.statusCode, 404, 'Non-existent collection must get 404');
    console.log('✅ Test 10 Passed: Collection không tồn tại trả về 404');
  }

  // Cleanup test sandbox records
  await prisma.practiceQuestion.deleteMany({ where: { exerciseSet: { versionId: initialVersionId } } });
  await prisma.practiceExerciseSet.deleteMany({ where: { versionId: initialVersionId } });
  await prisma.practiceCollection.update({ where: { id: collectionId }, data: { currentVersionId: null } });
  await prisma.practiceCollectionVersion.deleteMany({ where: { collectionId } });
  await prisma.practiceCollection.delete({ where: { id: collectionId } });
  await prisma.auditLogs.deleteMany({ where: { target_id: String(collectionId) } });
  await prisma.users.deleteMany({
    where: { user_id: { in: [adminUser.user_id, editorUser1.user_id, editorUser2.user_id, studentUser.user_id] } },
  });

  console.log('--- ALL 10 TESTS IN PRACTICE ASSIGNMENT PASSED SUCCESSFULLY ---');
}

run()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
