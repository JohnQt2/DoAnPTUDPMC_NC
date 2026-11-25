import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

async function runMockExamTests() {
  console.log('🧪 Bắt đầu Bộ Kiểm Thử Giai Đoạn 3: API Backend Phân Hệ Luyện Thi Thử HSK...\n');

  let server: http.Server | null = null;
  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address() as any;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const timestamp = Date.now();

    // 1. Khởi tạo tài khoản Giáo viên (ADMIN) và Học viên (STUDENT)
    const teacherUser = await prisma.users.create({
      data: {
        email: `teacher_${timestamp}@hanzi4u.test`,
        display_name: 'Thầy Giáo Vương',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const studentUser = await prisma.users.create({
      data: {
        email: `student_${timestamp}@hanzi4u.test`,
        display_name: 'Học Viên Lan Anh',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    const teacherToken = signAccessToken({
      userId: teacherUser.user_id,
      email: teacherUser.email,
      role: teacherUser.role,
    });

    const studentToken = signAccessToken({
      userId: studentUser.user_id,
      email: studentUser.email,
      role: studentUser.role,
    });

    console.log('▶ [PHẦN 1] KIỂM TRA UPLOAD & STATIC AUDIO STREAMING (ACCEPT-RANGES)');

    // 1.1 Kiểm tra static route /uploads hỗ trợ header Accept-Ranges để tua MP3
    console.log('  • Test 1.1: Kiểm tra Express Static phục vụ /uploads hỗ trợ Accept-Ranges: bytes');
    const staticRes = await fetch(`${baseUrl}/uploads/`);
    // Static response header check
    const acceptRanges = staticRes.headers.get('accept-ranges');
    assert.strictEqual(acceptRanges, 'bytes', 'Express static /uploads phải có header Accept-Ranges: bytes để tua MP3');
    console.log('    ✔ Header Accept-Ranges: bytes sẵn sàng phục vụ trình phát Audio.');

    console.log('\n▶ [PHẦN 2] QUẢN LÝ ĐỀ THI CHO GIÁO VIÊN (POST/PUT/PATCH/DELETE /api/exams)');

    // 2.1 Chặn học viên tạo đề
    console.log('  • Test 2.1: Chặn học viên tạo đề thi (403 Forbidden)');
    const forbiddenRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        code: `H3_${timestamp}`,
        title: 'Đề thi thử',
        hsk_level: 'HSK3',
        exam_pdf_url: '/uploads/exams/sample.pdf',
      }),
    });
    assert.strictEqual(forbiddenRes.status, 403, 'STUDENT phải bị từ chối 403');
    console.log('    ✔ RBAC chặn vai trò STUDENT thành công.');

    // 2.2 Giáo viên tạo đề thi HSK 3 trọn gói gồm cả 3 phần: Nghe, Đọc, Viết
    console.log('  • Test 2.2: Giáo viên tạo đề HSK 3 gồm cả 3 phần: Nghe, Đọc, Viết kèm thang điểm');
    const examCode = `H3_${timestamp}`;
    const createExamRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        code: examCode,
        title: `Đề thi thử HSK 3 - Mã ${examCode}`,
        description: 'Đề thi chuẩn HSK 3 gồm Nghe, Đọc và Viết.',
        hsk_level: 'HSK3',
        exam_pdf_url: `/uploads/exams/${examCode}.pdf`,
        audio_url: `/uploads/exams/${examCode}.mp3`,
        answer_pdf_url: `/uploads/exams/${examCode}_answer.pdf`,
        duration_minutes: 85,
        pass_score: 60,
        status: 'PUBLISHED',
        sections: [
          {
            section_type: 'LISTENING',
            title: 'Phần 1: Nghe hiểu (听力)',
            instructions: 'Nghe đoạn hội thoại và chọn đáp án.',
            order_index: 0,
            questions: [
              {
                question_number: 1,
                question_type: 'TRUE_FALSE',
                options: ['✓', '✗'],
                correct_answer: 'TRUE',
                points: 5.0,
                explanation: 'Đúng theo đoạn nghe 1.',
              },
              {
                question_number: 2,
                question_type: 'MCQ_ABCD',
                options: ['A', 'B', 'C', 'D'],
                correct_answer: 'C',
                points: 5.0,
                explanation: 'Đáp án là C.',
              },
            ],
          },
          {
            section_type: 'READING',
            title: 'Phần 2: Đọc hiểu (阅读)',
            instructions: 'Đọc đoạn văn và điền đáp án.',
            order_index: 1,
            questions: [
              {
                question_number: 3,
                question_type: 'MCQ_ABCDEF',
                options: ['A', 'B', 'C', 'D', 'E', 'F'],
                correct_answer: 'B',
                points: 5.0,
                explanation: 'Nối vào tranh B.',
              },
              {
                question_number: 4,
                question_type: 'WRITING_FILL',
                correct_answer: '北京 | 北京市',
                points: 5.0,
                explanation: 'Điền từ Bắc Kinh (北京).',
              },
            ],
          },
          {
            section_type: 'WRITING',
            title: 'Phần 3: Viết (书写)',
            instructions: 'Sắp xếp câu hoặc viết đoạn văn ngắn.',
            order_index: 2,
            questions: [
              {
                question_number: 5,
                question_type: 'WRITING_ESSAY',
                correct_answer: '喜欢 | 汉语 | 学习', // từ khóa bắt buộc
                sample_answer: '我很喜欢学习汉语。',
                points: 10.0,
                explanation: 'Câu văn mẫu có chứa các từ khóa 喜欢, 汉语, 学习.',
              },
            ],
          },
        ],
      }),
    });

    assert.strictEqual(createExamRes.status, 201);
    const createdExamJson = ((await createExamRes.json()) as any).data;
    const examId = createdExamJson.id;
    // Tổng điểm tự động cộng từ các câu: 5 + 5 + 5 + 5 + 10 = 30 điểm
    assert.strictEqual(createdExamJson.total_score, 30.0);
    console.log(`    ✔ Đề thi tạo thành công ID=${examId}, Tổng điểm tự động tính=${createdExamJson.total_score}đ.`);

    // 2.3 PATCH /api/exams/:examId/publish (Chuyển trạng thái DRAFT <-> PUBLISHED)
    console.log('  • Test 2.3: PATCH /api/exams/:examId/publish chuyển trạng thái DRAFT <-> PUBLISHED');
    const toggleToDraftRes = await fetch(`${baseUrl}/api/exams/${examId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ status: 'DRAFT' }),
    });
    assert.strictEqual(toggleToDraftRes.status, 200);
    const draftData = (await toggleToDraftRes.json()) as any;
    assert.strictEqual(draftData.status, 'DRAFT');

    // Chuyển lại về PUBLISHED
    const toggleToPubRes = await fetch(`${baseUrl}/api/exams/${examId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    assert.strictEqual(toggleToPubRes.status, 200);
    const pubData = (await toggleToPubRes.json()) as any;
    assert.strictEqual(pubData.status, 'PUBLISHED');
    console.log('    ✔ Chuyển đổi trạng thái DRAFT <-> PUBLISHED thành công.');

    console.log('\n▶ [PHẦN 3] HỌC VIÊN LẤY ĐỀ THI & LÀM BÀI CHỐNG GIAN LẬN');

    // 3.1 GET /api/exams?level=HSK3
    console.log('  • Test 3.1: GET /api/exams?level=HSK3 lấy danh sách đề HSK 3');
    const listRes = await fetch(`${baseUrl}/api/exams?level=HSK3`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listData = ((await listRes.json()) as any).data;
    const currentExamInList = listData.find((e: any) => e.id === examId);
    assert(currentExamInList, 'Đề thi phải có trong danh sách');
    assert.strictEqual(currentExamInList.hsk_level, 'HSK3');
    console.log('    ✔ Danh sách đề thi trả về đầy đủ.');

    // 3.2 GET /api/exams/:examId/take (Lấy đề làm bài: Bảo mật chống gian lận)
    console.log('  • Test 3.2: GET /api/exams/:examId/take kiểm tra bảo mật chống gian lận');
    const takeRes = await fetch(`${baseUrl}/api/exams/${examId}/take`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(takeRes.status, 200);
    const takeData = ((await takeRes.json()) as any).data;

    // Phải ẩn answer_pdf_url
    assert.strictEqual(takeData.answer_pdf_url, null, 'answer_pdf_url phải là null');

    // Mọi câu hỏi không được chứa correct_answer, sample_answer
    for (const sec of takeData.sections) {
      for (const q of sec.questions) {
        assert.strictEqual(q.correct_answer, undefined, `Câu ${q.question_number} không được có correct_answer`);
        assert.strictEqual(q.sample_answer, undefined, `Câu ${q.question_number} không được có sample_answer`);
      }
    }
    console.log('    ✔ Bảo mật chống gian lận hoàn hảo: Ẩn 100% đáp án đúng, câu văn mẫu và file đáp án PDF.');

    console.log('\n▶ [PHẦN 4] CHẤM ĐIỂM TỰ ĐỘNG & NỘP BÀI (POST /api/exams/:examId/submit)');

    // 4.1 Học viên nộp bài làm:
    // Q1 (TRUE_FALSE): đúng ('TRUE') -> +5đ
    // Q2 (MCQ_ABCD): sai ('A' thay vì 'C') -> 0đ
    // Q3 (MCQ_ABCDEF): đúng ('B') -> +5đ
    // Q4 (WRITING_FILL): đúng ('北京。' có dấu chấm cuối câu, hệ thống tự chuẩn hóa) -> +5đ
    // Q5 (WRITING_ESSAY): viết '我非常喜欢学习汉语，很有趣。' (chứa đủ cả 3 từ khóa 喜欢, 学习, 汉语) -> đạt sơ bộ +10đ
    console.log('  • Test 4.1: Nộp bài kiểm tra chuẩn hóa câu điền (WRITING_FILL) và từ khóa câu viết (WRITING_ESSAY)');
    const q1 = createdExamJson.sections[0].questions[0];
    const q2 = createdExamJson.sections[0].questions[1];
    const q3 = createdExamJson.sections[1].questions[0];
    const q4 = createdExamJson.sections[1].questions[1];
    const q5 = createdExamJson.sections[2].questions[0];

    const submitRes = await fetch(`${baseUrl}/api/exams/${examId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        answers: [
          { questionId: q1.id, answer: 'TRUE' },
          { questionId: q2.id, answer: 'A' }, // sai
          { questionId: q3.id, answer: 'B' },
          { questionId: q4.id, answer: '北京。' }, // có dấu chấm cuối câu
          { questionId: q5.id, answer: '我非常喜欢学习汉语，很有趣。' }, // đủ từ khóa
        ],
      }),
    });

    assert.strictEqual(submitRes.status, 200);
    const submitResult = ((await submitRes.json()) as any).data;

    assert.strictEqual(submitResult.listening_score, 5.0, 'Nghe đúng Q1 (5đ)');
    assert.strictEqual(submitResult.reading_score, 10.0, 'Đọc đúng Q3 (5đ) và Q4 (5đ)');
    assert.strictEqual(submitResult.writing_score, 10.0, 'Viết đúng Q5 (10đ)');
    assert.strictEqual(submitResult.total_score, 25.0, 'Tổng điểm là 25đ');
    assert.strictEqual(submitResult.correct_count, 4);
    assert.strictEqual(submitResult.wrong_count, 1);

    // Mở khóa answer_pdf_url
    assert(submitResult.answer_pdf_url, 'Đã mở khóa file đáp án PDF');
    assert(submitResult.answer_pdf_url.includes(`${examCode}_answer.pdf`));

    // Mở khóa correct_answer và sample_answer
    const q5Res = submitResult.answers.find((a: any) => a.question_id === q5.id);
    assert(q5Res.sample_answer, 'Mở khóa sample_answer cho câu viết');
    assert.strictEqual(q5Res.is_correct, true);

    const attemptId = submitResult.attempt_id;
    console.log(`    ✔ Kết quả chấm tự động: 25/30đ (4 câu đúng, 1 câu sai).`);
    console.log(`    ✔ Mở khóa file đáp án PDF gốc: ${submitResult.answer_pdf_url}`);

    console.log('\n▶ [PHẦN 5] GIÁO VIÊN CHẤM & ĐIỀU CHỈNH ĐIỂM (PATCH /api/exams/attempts/:attemptId/grade)');

    // 5.1 Giáo viên điều chỉnh điểm câu viết Q5 từ 10đ thành 8.5đ và ghi nhận nhận xét
    console.log('  • Test 5.1: Giáo viên điều chỉnh điểm câu viết Q5 từ 10đ thành 8.5đ kèm lời phê');
    const gradeRes = await fetch(`${baseUrl}/api/exams/attempts/${attemptId}/grade`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        grades: [
          {
            question_id: q5.id,
            earned_score: 8.5,
            teacher_feedback: 'Bài viết tốt, dùng đúng ngữ pháp nhưng cần chú ý chữ Hán viết nắn nót hơn.',
          },
        ],
      }),
    });

    assert.strictEqual(gradeRes.status, 200);
    const gradedAttempt = ((await gradeRes.json()) as any).data;
    assert.strictEqual(gradedAttempt.writing_score, 8.5, 'Điểm viết cập nhật thành 8.5đ');
    // Tổng điểm mới: 5 (nghe) + 10 (đọc) + 8.5 (viết) = 23.5đ
    assert.strictEqual(gradedAttempt.total_score, 23.5, 'Tổng điểm tự động tính lại thành 23.5đ');

    const updatedQ5 = gradedAttempt.answers.find((a: any) => a.question_id === q5.id);
    assert.strictEqual(updatedQ5.earned_score, 8.5);
    assert(updatedQ5.teacher_feedback.includes('Bài viết tốt'));
    console.log(`    ✔ Giáo viên chấm lại thành công: Điểm viết=8.5đ, Tổng điểm mới=${gradedAttempt.total_score}đ.`);

    // 5.2 Học viên xem lại lịch sử chi tiết (GET /api/exams/attempts/:attemptId)
    console.log('  • Test 5.2: Học viên xem lại kết quả đã được giáo viên chấm (GET /api/exams/attempts/:attemptId)');
    const studentViewRes = await fetch(`${baseUrl}/api/exams/attempts/${attemptId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(studentViewRes.status, 200);
    const studentViewData = ((await studentViewRes.json()) as any).data;
    assert.strictEqual(studentViewData.total_score, 23.5);
    console.log('    ✔ Học viên nhận được phản hồi và điểm cập nhật từ giáo viên.');

    console.log('\n▶ [PHẦN 6] DỌN DẸP DỮ LIỆU KIỂM THỬ');
    await fetch(`${baseUrl}/api/exams/${examId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    await prisma.users.deleteMany({
      where: { user_id: { in: [teacherUser.user_id, studentUser.user_id] } },
    });
    console.log('    ✔ Đã xóa đề thi và tài khoản kiểm thử sạch sẽ.');

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ GIAI ĐOẠN 3 MOCK EXAM ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runMockExamTests().catch((err) => {
  console.error('❌ MOCK EXAM GIAI ĐOẠN 3 TEST FAILED:', err);
  process.exit(1);
});
