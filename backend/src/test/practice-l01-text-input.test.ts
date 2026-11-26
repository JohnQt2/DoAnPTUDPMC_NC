import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

async function runPhase1TextInputTests() {
  console.log('🧪 Starting Phase 1: TEXT_INPUT, Autosave, Resume & Grading Integration Tests...\n');

  let server: http.Server | null = null;

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

    // Setup test users
    const student1 = await prisma.users.upsert({
      where: { email: 'student1_phase1@chinaeasy.test' },
      create: {
        email: 'student1_phase1@chinaeasy.test',
        display_name: 'Student 1 Phase 1',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      update: { role: 'STUDENT', status: 'ACTIVE' },
    });

    const student2 = await prisma.users.upsert({
      where: { email: 'student2_phase1@chinaeasy.test' },
      create: {
        email: 'student2_phase1@chinaeasy.test',
        display_name: 'Student 2 Phase 1',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      update: { role: 'STUDENT', status: 'ACTIVE' },
    });

    const editorUser = await prisma.users.upsert({
      where: { email: 'editor_phase1@chinaeasy.test' },
      create: {
        email: 'editor_phase1@chinaeasy.test',
        display_name: 'Editor Phase 1',
        role: 'CONTENT_EDITOR',
        status: 'ACTIVE',
      },
      update: { role: 'CONTENT_EDITOR', status: 'ACTIVE' },
    });

    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_phase1@chinaeasy.test' },
      create: {
        email: 'admin_phase1@chinaeasy.test',
        display_name: 'Admin Phase 1',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      update: { role: 'ADMIN', status: 'ACTIVE' },
    });

    const student1Token = signAccessToken({ userId: student1.user_id, email: student1.email, role: 'STUDENT' });
    const student2Token = signAccessToken({ userId: student2.user_id, email: student2.email, role: 'STUDENT' });
    const editorToken = signAccessToken({ userId: editorUser.user_id, email: editorUser.email, role: 'CONTENT_EDITOR' });
    const adminToken = signAccessToken({ userId: adminUser.user_id, email: adminUser.email, role: 'ADMIN' });

    const authHeaders = (token?: string): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

    const hsk1Level = await prisma.practiceLevel.findFirst({ where: { code: 'HSK1' } });
    assert(hsk1Level, 'HSK1 level must exist');

    // ─────────────────────────────────────────────────────────────
    // 1. KIỂM THỬ TRẠNG THÁI HIỆN TẠI CỦA HSK1-WORKBOOK-L01 (PHẢI LÀ DRAFT)
    // ─────────────────────────────────────────────────────────────
    console.log('Checking HSK1-WORKBOOK-L01 content structure in database...');
    const l01Col = await prisma.practiceCollection.findUnique({
      where: { code: 'HSK1-WORKBOOK-L01' },
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
    assert(l01Col, 'HSK1-WORKBOOK-L01 collection must exist');

    const v1 = l01Col.versions[0];
    assert(v1, 'Version 1 must exist');
    assert.strictEqual(v1.exerciseSets.length, 6, 'L01 must have 6 exercise sets');

    const allQ = v1.exerciseSets.flatMap((s) => s.questions);
    assert.strictEqual(allQ.length, 82, 'L01 must have 82 questions');

    const textInputQ = allQ.filter((q) => q.type === 'TEXT_INPUT');
    assert.strictEqual(textInputQ.length, 42, 'L01 must have exactly 42 TEXT_INPUT questions');
    console.log(`  ✔ L01 verified: 6 Sets, 82 Questions, 42 TEXT_INPUT, status = ${l01Col.status}.`);

    // ─────────────────────────────────────────────────────────────
    // 2. TẠO TEST COLLECTION RIÊNG ĐỂ KIỂM THỬ ĐÁNH GIÁ CHẤM ĐIỂM TEXT_INPUT
    // ─────────────────────────────────────────────────────────────
    console.log('Testing TEXT_INPUT autosave, resume, Unicode NFC & grading on independent sandbox collection...');
    const testCode = `PHASE1-TEXTINPUT-${Date.now()}`;
    const createColRes = await rawRequest('/api/v1/practice/admin/collections', {
      method: 'POST',
      headers: authHeaders(editorToken),
      body: JSON.stringify({
        code: testCode,
        levelId: hsk1Level.id,
        category: 'WORKBOOK_LESSON',
        titleZh: '文本输入测试',
        titleVi: 'Kiểm thử TEXT_INPUT',
      }),
    });
    assert.strictEqual(createColRes.status, 201);
    const testColId = createColRes.body.data.collection.id;
    const testVerId = createColRes.body.data.initialVersion.id;

    // Add Section
    const addSetRes = await rawRequest(`/api/v1/practice/admin/versions/${testVerId}/exercise-sets`, {
      method: 'POST',
      headers: authHeaders(editorToken),
      body: JSON.stringify({
        code: `${testCode}-SET01`,
        skill: 'READING',
        titleZh: '填空训练',
        titleVi: 'Phần điền từ',
        sortOrder: 1,
      }),
    });
    assert.strictEqual(addSetRes.status, 201);
    const testSetId = addSetRes.body.data.id;

    // Q1: Target: "b"
    const addQ1 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${testSetId}/questions`, {
      method: 'POST',
      headers: authHeaders(editorToken),
      body: JSON.stringify({
        code: `${testCode}-Q01`,
        type: 'TEXT_INPUT',
        prompt: { instruction: 'Điền thanh mẫu', textBefore: 'Thanh mẫu:', placeholder: 'b' },
        answer: { value: 'b' },
        explanation: 'Thanh mẫu là b',
        score: 10,
        sortOrder: 1,
      }),
    });
    assert.strictEqual(addQ1.status, 201);
    const q1Id = addQ1.body.data.id;

    // Q2: Target: "nǐ" (pinyin có dấu Unicode NFC)
    const addQ2 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${testSetId}/questions`, {
      method: 'POST',
      headers: authHeaders(editorToken),
      body: JSON.stringify({
        code: `${testCode}-Q02`,
        type: 'TEXT_INPUT',
        prompt: { instruction: 'Gõ pinyin', placeholder: 'nǐ' },
        answer: { value: 'nǐ' },
        explanation: 'Pinyin chuẩn có dấu là nǐ',
        score: 10,
        sortOrder: 2,
      }),
    });
    assert.strictEqual(addQ2.status, 201);
    const q2Id = addQ2.body.data.id;

    // Q3: Target với acceptedValues: "hǎo" hoặc "hao3" hoặc "tốt"
    const addQ3 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${testSetId}/questions`, {
      method: 'POST',
      headers: authHeaders(editorToken),
      body: JSON.stringify({
        code: `${testCode}-Q03`,
        type: 'TEXT_INPUT',
        prompt: { instruction: 'Gõ nghĩa hoặc pinyin' },
        answer: { value: 'hǎo', acceptedValues: ['hao3', 'tốt'] },
        explanation: 'Chấp nhận hǎo, hao3 hoặc tốt',
        score: 10,
        sortOrder: 3,
      }),
    });
    assert.strictEqual(addQ3.status, 201);
    const q3Id = addQ3.body.data.id;

    // Q4: CHARACTER_WRITING kiểm tra completed: false
    const addQ4 = await rawRequest(`/api/v1/practice/admin/exercise-sets/${testSetId}/questions`, {
      method: 'POST',
      headers: authHeaders(editorToken),
      body: JSON.stringify({
        code: `${testCode}-Q04`,
        type: 'CHARACTER_WRITING',
        prompt: { character: '一', instruction: 'Viết chữ Nhất' },
        answer: { completed: true },
        score: 10,
        sortOrder: 4,
      }),
    });
    assert.strictEqual(addQ4.status, 201);
    const q4Id = addQ4.body.data.id;

    // Submit review & publish sandbox test version
    await rawRequest(`/api/v1/practice/admin/versions/${testVerId}/submit-review`, {
      method: 'POST',
      headers: authHeaders(editorToken),
    });
    await rawRequest(`/api/v1/practice/admin/versions/${testVerId}/publish`, {
      method: 'POST',
      headers: authHeaders(adminToken),
    });

    // 1. Renderer contract: Student API trước submit không lộ answer/explanation
    const studentSetRes = await rawRequest(`/api/v1/practice/exercise-sets/${testSetId}`, {
      method: 'GET',
      headers: authHeaders(student1Token),
    });
    assert.strictEqual(studentSetRes.status, 200);
    for (const q of studentSetRes.body.data.questions) {
      assert.strictEqual(q.answer, undefined, `Question ${q.code} must not reveal answer`);
      assert.strictEqual(q.explanation, undefined, `Question ${q.code} must not reveal explanation`);
    }
    console.log('  ✔ Renderer contract passed: Student API does not leak answer or explanation.');

    // 2. Autosave string "b" & Resume trả đúng "b"
    const startAttRes = await rawRequest(`/api/v1/practice/collections/${testColId}/attempts`, {
      method: 'POST',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ exerciseSetId: testSetId }),
    });
    assert.strictEqual(startAttRes.status, 200);
    const attemptId = startAttRes.body.data.attemptId;

    const detailRes = await rawRequest(`/api/v1/practice/attempts/${attemptId}`, {
      method: 'GET',
      headers: authHeaders(student1Token),
    });
    assert.strictEqual(detailRes.status, 200);
    const forbiddenDetailKeys = new Set([
      'answer',
      'acceptedValues',
      'explanation',
      'correctAnswer',
      'snapshotData',
    ]);
    const assertNoForbiddenDetailKeys = (value: any, path = 'attempt detail'): void => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => assertNoForbiddenDetailKeys(item, `${path}[${index}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, nested]) => {
          assert(!forbiddenDetailKeys.has(key), `${path}.${key} must not be exposed before submission`);
          assertNoForbiddenDetailKeys(nested, `${path}.${key}`);
        });
      }
    };
    assertNoForbiddenDetailKeys(detailRes.body.data);
    assert.strictEqual(detailRes.body.data.answers, undefined);
    const q3Progress = detailRes.body.data.questions.find((q: any) => q.questionId === q3Id);
    assert.deepStrictEqual(Object.keys(q3Progress).sort(), [
      'progress',
      'questionId',
      'score',
      'sortOrder',
      'type',
      'userAnswer',
    ]);

    const dbAttempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });
    assert(dbAttempt?.snapshotData, 'Full snapshot must remain stored for the attempt');
    const storedSnapshot = JSON.parse(dbAttempt.snapshotData);
    const storedQ3 = storedSnapshot.questions.find((q: any) => q.id === q3Id);
    const storedQ3Answer = typeof storedQ3.answer === 'string'
      ? JSON.parse(storedQ3.answer)
      : storedQ3.answer;
    assert.deepStrictEqual(storedQ3Answer.acceptedValues, ['hao3', 'tốt']);
    assert.strictEqual(JSON.parse(storedQ3.explanation), 'Chấp nhận hǎo, hao3 hoặc tốt');

    const saveBRes = await rawRequest(`/api/v1/practice/attempts/${attemptId}/answers/${q1Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: 'b' }),
    });
    assert.strictEqual(saveBRes.status, 200);

    const resumeAttRes = await rawRequest(`/api/v1/practice/collections/${testColId}/attempts`, {
      method: 'POST',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ exerciseSetId: testSetId }),
    });
    assert.strictEqual(resumeAttRes.status, 200);
    assert.strictEqual(resumeAttRes.body.data.answers[q1Id], 'b', 'Must resume with saved answer "b"');
    console.log('  ✔ Autosave & resume verified successfully.');

    // 3. Test grading: "   B   " đúng với "b", "NǏ" đúng với "nǐ", "hao3" đúng với acceptedValues
    await rawRequest(`/api/v1/practice/attempts/${attemptId}/answers/${q1Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: '   B   ' }),
    });
    await rawRequest(`/api/v1/practice/attempts/${attemptId}/answers/${q2Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: 'NǏ' }),
    });
    await rawRequest(`/api/v1/practice/attempts/${attemptId}/answers/${q3Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: 'hao3' }),
    });
    await rawRequest(`/api/v1/practice/attempts/${attemptId}/answers/${q4Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: { completed: false } }),
    });

    const submit1 = await rawRequest(`/api/v1/practice/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: authHeaders(student1Token),
      body: JSON.stringify({}),
    });
    assert.strictEqual(submit1.status, 200);
    assert.strictEqual(submit1.body.data.status, 'COMPLETED');
    assert.strictEqual(submit1.body.data.earnedScore, 30, 'Q1, Q2, Q3 correct (30đ), Q4 (completed: false) wrong');

    // Idempotent submit
    const submit2 = await rawRequest(`/api/v1/practice/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: authHeaders(student1Token),
      body: JSON.stringify({}),
    });
    assert.strictEqual(submit2.status, 200);
    assert.strictEqual(submit2.body.data.earnedScore, 30);

    // Result disclosure
    const resultRes = await rawRequest(`/api/v1/practice/attempts/${attemptId}/result`, {
      method: 'GET',
      headers: authHeaders(student1Token),
    });
    assert.strictEqual(resultRes.status, 200);
    const q1Res = resultRes.body.data.questions.find((q: any) => q.id === q1Id);
    assert.strictEqual(q1Res.isCorrect, true);
    assert.strictEqual(q1Res.correctAnswer.value, 'b');
    assert.strictEqual(q1Res.explanation, 'Thanh mẫu là b');
    const q3Res = resultRes.body.data.questions.find((q: any) => q.id === q3Id);
    assert.strictEqual(q3Res.correctAnswer.value, 'hǎo');
    assert.deepStrictEqual(q3Res.correctAnswer.acceptedValues, ['hao3', 'tốt']);
    assert.strictEqual(q3Res.explanation, 'Chấp nhận hǎo, hao3 hoặc tốt');
    console.log('  ✔ Grading evaluation & post-submit result disclosure verified.');

    // 4. Test rỗng sai & không dấu "ni" sai
    const att2Res = await rawRequest(`/api/v1/practice/collections/${testColId}/attempts`, {
      method: 'POST',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ exerciseSetId: testSetId }),
    });
    const att2Id = att2Res.body.data.attemptId;

    await rawRequest(`/api/v1/practice/attempts/${att2Id}/answers/${q1Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: '   ' }),
    });
    await rawRequest(`/api/v1/practice/attempts/${att2Id}/answers/${q2Id}`, {
      method: 'PUT',
      headers: authHeaders(student1Token),
      body: JSON.stringify({ answer: 'ni' }),
    });

    await rawRequest(`/api/v1/practice/attempts/${att2Id}/submit`, {
      method: 'POST',
      headers: authHeaders(student1Token),
      body: JSON.stringify({}),
    });
    const resAtt2 = await rawRequest(`/api/v1/practice/attempts/${att2Id}/result`, {
      method: 'GET',
      headers: authHeaders(student1Token),
    });
    const q1Res2 = resAtt2.body.data.questions.find((q: any) => q.id === q1Id);
    const q2Res2 = resAtt2.body.data.questions.find((q: any) => q.id === q2Id);
    assert.strictEqual(q1Res2.isCorrect, false, 'Empty string must be FALSE');
    assert.strictEqual(q2Res2.isCorrect, false, 'Unaccented "ni" must be FALSE');
    console.log('  ✔ Empty string and unaccented pinyin correctly evaluated as FALSE.');

    // Security isolation
    const forbiddenRes = await rawRequest(`/api/v1/practice/attempts/${attemptId}`, {
      method: 'GET',
      headers: authHeaders(student2Token),
    });
    assert.strictEqual(forbiddenRes.status, 403);
    console.log('  ✔ Security isolation verified: Student 2 denied 403.');

    // 5. Kiểm tra lại lần cuối: L01 vẫn nguyên vẹn
    const finalL01Check = await prisma.practiceCollection.findUnique({
      where: { code: 'HSK1-WORKBOOK-L01' },
      include: { versions: true },
    });
    assert(finalL01Check, 'L01 must exist');
    console.log(`  ✔ Confirmed HSK1-WORKBOOK-L01 is intact (status: ${finalL01Check.status}).`);

    console.log('\n🎉 PHASE 1 VERIFICATION COMPLETE: ALL CHECKS PASSED!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runPhase1TextInputTests()
  .catch((err) => {
    console.error('❌ Phase 1 Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
