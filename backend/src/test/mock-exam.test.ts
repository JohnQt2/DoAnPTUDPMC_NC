import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

async function runMockExamTests() {
  console.log('🧪 Bắt đầu Bộ Kiểm Thử Phân Hệ Luyện Thi Thử HSK (Mock Exam PDF + Audio)...\n');

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

    console.log('▶ [PHẦN 1] TẠO ĐỀ THI THỬ HSK (GIÁO VIÊN / ADMIN)');

    // 1.1 Chặn học viên thường không được tạo đề thi
    console.log('  • Test 1.1: Chặn vai trò STUDENT gọi API tạo đề thi (403 Forbidden)');
    const forbiddenRes = await fetch(`${baseUrl}/api/v1/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        code: `H2_${timestamp}`,
        title: 'Đề thi trái phép',
        hsk_level: 'HSK2',
        exam_pdf_url: '/uploads/exams/test.pdf',
      }),
    });
    assert.strictEqual(forbiddenRes.status, 403, 'STUDENT phải bị từ chối với mã 403');
    console.log('    ✔ Auth guard chặn học viên thành công.');

    // 1.2 Giáo viên tạo đề thi thử HSK 2 mới kèm 2 phần Nghe & Đọc
    console.log('  • Test 1.2: Giáo viên tạo đề thi thử HSK 2 kèm cấu hình câu hỏi và thang điểm');
    const examCode = `H2_${timestamp}`;
    const createExamRes = await fetch(`${baseUrl}/api/v1/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        code: examCode,
        title: `Đề thi thử HSK 2 - Mã ${examCode}`,
        description: 'Đề thi thử chuẩn HSK 2 gồm Nghe hiểu (10 câu) và Đọc hiểu (10 câu).',
        hsk_level: 'HSK2',
        exam_pdf_url: `/uploads/exams/${examCode}.pdf`,
        audio_url: `/uploads/exams/${examCode}.mp3`,
        answer_pdf_url: `/uploads/exams/${examCode}_answer.pdf`,
        duration_minutes: 50,
        pass_score: 60,
        status: 'PUBLISHED',
        sections: [
          {
            section_type: 'LISTENING',
            title: 'Phần 1: Nghe hiểu (听力)',
            instructions: 'Nghe audio và chọn đáp án đúng.',
            order_index: 0,
            questions: [
              {
                question_number: 1,
                question_type: 'TRUE_FALSE',
                options: ['✓', '✗'],
                correct_answer: 'TRUE',
                points: 5.0,
                explanation: 'Đúng theo câu thoại 1.',
              },
              {
                question_number: 2,
                question_type: 'MCQ_ABCD',
                options: ['A', 'B', 'C', 'D'],
                correct_answer: 'B',
                points: 5.0,
                explanation: 'Đáp án là B.',
              },
            ],
          },
          {
            section_type: 'READING',
            title: 'Phần 2: Đọc hiểu (阅读)',
            instructions: 'Đọc đề PDF và chọn đáp án tương ứng.',
            order_index: 1,
            questions: [
              {
                question_number: 3,
                question_type: 'MCQ_ABCDEF',
                options: ['A', 'B', 'C', 'D', 'E', 'F'],
                correct_answer: 'E',
                points: 5.0,
                explanation: 'Nối vào tranh E.',
              },
              {
                question_number: 4,
                question_type: 'WRITING_FILL',
                correct_answer: '苹果 | 苹果汁',
                points: 5.0,
                explanation: 'Điền từ quả táo (苹果).',
              },
            ],
          },
        ],
      }),
    });

    assert.strictEqual(createExamRes.status, 201, 'Giáo viên tạo đề thi thành công với HTTP 201');
    const createdData = (await createExamRes.json()) as any;
    assert.strictEqual(createdData.data.code, examCode);
    assert.strictEqual(createdData.data.total_score, 20.0); // 4 câu x 5đ = 20đ
    const examId = createdData.data.id;
    console.log(`    ✔ Đề thi đã tạo thành công với ID=${examId}, Tổng điểm=${createdData.data.total_score}đ.`);

    console.log('\n▶ [PHẦN 2] HỌC VIÊN XEM ĐỀ & BẢO MẬT CHỐNG GIAN LẬN');

    // 2.1 Học viên lấy danh sách đề thi
    console.log('  • Test 2.1: Học viên gọi GET /exams?level=HSK2');
    const listRes = await fetch(`${baseUrl}/api/v1/exams?level=HSK2`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listJson = (await listRes.json()) as any;
    const foundExam = listJson.data.find((e: any) => e.id === examId);
    assert(foundExam, 'Đề thi vừa tạo phải xuất hiện trong danh sách cấp độ HSK2');
    assert.strictEqual(foundExam.has_answer_pdf, true);
    console.log('    ✔ Danh sách đề thi hiển thị đầy đủ thông tin.');

    // 2.2 Học viên vào làm bài: Kiểm tra bảo mật ẩn đáp án và ẩn file đáp án PDF
    console.log('  • Test 2.2: Bảo mật chống lộ đề khi học viên chưa nộp bài (GET /exams/:id)');
    const studentExamRes = await fetch(`${baseUrl}/api/v1/exams/${examId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(studentExamRes.status, 200);
    const studentExamJson = (await studentExamRes.json()) as any;
    const examData = studentExamJson.data;

    // Phải ẩn answer_pdf_url để học viên không xem trước
    assert.strictEqual(
      examData.answer_pdf_url,
      null,
      'answer_pdf_url phải là null khi học viên chưa nộp bài'
    );

    // Kiểm tra từng câu hỏi: không được chứa correct_answer, sample_answer, explanation
    for (const sec of examData.sections) {
      for (const q of sec.questions) {
        assert.strictEqual(
          q.correct_answer,
          undefined,
          `Câu ${q.question_number} không được tiết lộ correct_answer khi đang làm bài`
        );
        assert.strictEqual(
          q.explanation,
          undefined,
          `Câu ${q.question_number} không được tiết lộ explanation khi đang làm bài`
        );
      }
    }
    console.log('    ✔ Toàn bộ đáp án đúng, giải thích và file đáp án PDF được bảo mật tuyệt đối.');

    console.log('\n▶ [PHẦN 3] NỘP BÀI THI & HỆ THỐNG CHẤM TỰ ĐỘNG TỪNG CÂU');

    // 3.1 Học viên nộp bài làm:
    // Câu 1: đúng (TRUE)
    // Câu 2: sai (chọn C thay vì B)
    // Câu 3: đúng (chọn E)
    // Câu 4: đúng (chọn "苹果")
    console.log('  • Test 3.1: Học viên nộp bài làm (POST /exams/:id/submit)');
    const q1 = examData.sections[0].questions[0];
    const q2 = examData.sections[0].questions[1];
    const q3 = examData.sections[1].questions[0];
    const q4 = examData.sections[1].questions[1];

    const submitRes = await fetch(`${baseUrl}/api/v1/exams/${examId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        answers: [
          { question_id: q1.id, user_answer: 'TRUE' }, // Đúng (+5đ)
          { question_id: q2.id, user_answer: 'C' },    // Sai (0đ)
          { question_id: q3.id, user_answer: 'E' },    // Đúng (+5đ)
          { question_id: q4.id, user_answer: '苹果' }, // Đúng (+5đ)
        ],
      }),
    });

    assert.strictEqual(submitRes.status, 200, 'Nộp bài thi thành công');
    const submitJson = (await submitRes.json()) as any;
    const result = submitJson.data;

    assert.strictEqual(result.listening_score, 5.0, 'Phần nghe đúng câu 1 (5đ)');
    assert.strictEqual(result.reading_score, 10.0, 'Phần đọc đúng câu 3 và câu 4 (10đ)');
    assert.strictEqual(result.total_score, 15.0, 'Tổng điểm phải là 15đ');
    assert.strictEqual(result.correct_count, 3, 'Số câu đúng là 3');
    assert.strictEqual(result.wrong_count, 1, 'Số câu sai là 1');

    // Mở khóa file đáp án PDF gốc
    assert(result.answer_pdf_url, 'File đáp án PDF phải được mở khóa sau khi nộp');
    assert(result.answer_pdf_url.includes(`${examCode}_answer.pdf`));

    // Kiểm tra câu 2 bị chấm sai kèm ghi nhận câu trả lời
    const q2Result = result.answers.find((a: any) => a.question_id === q2.id);
    assert.strictEqual(q2Result.is_correct, false);
    assert.strictEqual(q2Result.earned_score, 0);
    assert.strictEqual(q2Result.user_answer, 'C');
    assert.strictEqual(q2Result.correct_answer, 'B');

    console.log(`    ✔ Kết quả chấm tự động chính xác: 15/20đ (3 câu đúng, 1 câu sai).`);
    console.log(`    ✔ File đáp án PDF gốc đã được mở khóa: ${result.answer_pdf_url}`);

    console.log('\n▶ [PHẦN 4] XEM LẠI BÀI THI & LỊCH SỬ THI');

    // 4.1 Xem chi tiết bài làm qua GET /exams/attempts/:attemptId
    console.log('  • Test 4.1: Xem chi tiết bài làm (GET /exams/attempts/:attemptId)');
    const attemptRes = await fetch(`${baseUrl}/api/v1/exams/attempts/${result.attempt_id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(attemptRes.status, 200);
    const attemptData = ((await attemptRes.json()) as any).data;
    assert.strictEqual(attemptData.total_score, 15.0);
    assert.strictEqual(attemptData.answers.length, 4);
    console.log('    ✔ Chi tiết bài làm trả về đầy đủ từng câu hỏi kèm phản hồi.');

    // 4.2 Học viên xem lại đề sau khi nộp -> lúc này đã được mở khóa đáp án
    console.log('  • Test 4.2: Sau khi nộp, học viên vào lại đề thì đáp án và file PDF được mở khóa');
    const unlockedExamRes = await fetch(`${baseUrl}/api/v1/exams/${examId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const unlockedExamData = ((await unlockedExamRes.json()) as any).data;
    assert(unlockedExamData.answer_pdf_url, 'Đã mở khóa file đáp án PDF');
    assert.strictEqual(unlockedExamData.can_see_answers, true);
    console.log('    ✔ Học viên xem được giải thích và đối chiếu bài làm.');

    // 4.3 Dọn dẹp dữ liệu kiểm thử
    console.log('\n▶ [PHẦN 5] DỌN DẸP DỮ LIỆU KIỂM THỬ');
    const deleteRes = await fetch(`${baseUrl}/api/v1/exams/${examId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('    ✔ Đã xóa đề thi kiểm thử thành công.');

    // Dọn dẹp users
    await prisma.users.deleteMany({
      where: { user_id: { in: [teacherUser.user_id, studentUser.user_id] } },
    });
    console.log('    ✔ Đã xóa tài khoản kiểm thử.');

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ MOCK EXAM SYSTEM ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runMockExamTests().catch((err) => {
  console.error('❌ MOCK EXAM TEST FAILED:', err);
  process.exit(1);
});
