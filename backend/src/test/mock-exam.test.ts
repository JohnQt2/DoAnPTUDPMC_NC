import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

async function runMockExamTests() {
  console.log('🧪 Bắt đầu Bộ Kiểm Thử Độc Lập Giai Đoạn 5: Mock Exam HSK 1 (Mã H11332)...\n');

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
        email: `teacher_hsk1_${timestamp}@hanzi4u.test`,
        display_name: 'Thầy Giáo Vương HSK1',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const studentUser = await prisma.users.create({
      data: {
        email: `student_hsk1_${timestamp}@hanzi4u.test`,
        display_name: 'Học Viên Lan Anh HSK1',
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

    console.log('▶ [PHẦN 1] KIỂM TRA UPLOAD & STATIC STREAMING (ACCEPT-RANGES)');
    const staticRes = await fetch(`${baseUrl}/uploads/`);
    const acceptRanges = staticRes.headers.get('accept-ranges');
    assert.strictEqual(acceptRanges, 'bytes', 'Express static /uploads phải có header Accept-Ranges: bytes để tua MP3');
    console.log('  ✔ Express Static phục vụ /uploads hỗ trợ Accept-Ranges: bytes thành công.');

    console.log('\n▶ [PHẦN 2] GIÁO VIÊN TẠO ĐỀ HSK 1 (MÃ H11332) CÓ PDF, AUDIO, ĐÁP ÁN & CHIA ĐIỂM TỪNG CÂU');
    const examCode = `H11332_${timestamp}`;
    const createExamRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        code: examCode,
        title: `Đề thi thử HSK 1 Chuẩn Đề PDF - Mã ${examCode}`,
        description: 'Đề thi chuẩn HSK 1 gồm 3 phần: Nghe hiểu, Đọc hiểu và Viết.',
        hsk_level: 'HSK1',
        exam_pdf_url: `/uploads/exams/${examCode}.pdf`,
        audio_url: `/uploads/exams/${examCode}.mp3`,
        answer_pdf_url: `/uploads/exams/${examCode}_answer.pdf`,
        duration_minutes: 35,
        pass_score: 60,
        status: 'PUBLISHED',
        sections: [
          {
            section_type: 'LISTENING',
            title: 'Phần 1: Nghe hiểu (听力)',
            instructions: 'Nghe đoạn hội thoại và xác định đúng/sai hoặc chọn đáp án.',
            order_index: 0,
            questions: [
              {
                question_number: 1,
                question_type: 'TRUE_FALSE',
                options: ['✓', '✗'],
                correct_answer: 'TRUE',
                points: 5.0,
                explanation: 'Đúng theo nội dung đoạn nghe câu 1.',
              },
              {
                question_number: 2,
                question_type: 'MCQ_ABCD',
                options: ['A', 'B', 'C', 'D'],
                correct_answer: 'C',
                points: 5.0,
                explanation: 'Đáp án đúng là C.',
              },
            ],
          },
          {
            section_type: 'READING',
            title: 'Phần 2: Đọc hiểu (阅读)',
            instructions: 'Đọc câu hỏi và chọn tranh tương ứng hoặc điền từ.',
            order_index: 1,
            questions: [
              {
                question_number: 3,
                question_type: 'MCQ_ABCDEF',
                options: ['A', 'B', 'C', 'D', 'E', 'F'],
                correct_answer: 'B',
                points: 5.0,
                explanation: 'Ghép tranh tương ứng với đáp án B.',
              },
              {
                question_number: 4,
                question_type: 'WRITING_FILL',
                correct_answer: '北京 | 北京市',
                points: 5.0,
                explanation: 'Điền địa danh Bắc Kinh (北京).',
              },
            ],
          },
          {
            section_type: 'WRITING',
            title: 'Phần 3: Viết (书写)',
            instructions: 'Sắp xếp câu hoặc viết câu hoàn chỉnh theo yêu cầu.',
            order_index: 2,
            questions: [
              {
                question_number: 5,
                question_type: 'WRITING_ESSAY',
                correct_answer: '喜欢 | 汉语 | 学习',
                sample_answer: '我很喜欢学习汉语。',
                points: 10.0,
                explanation: 'Câu văn chữ Hán hoàn chỉnh có chứa các từ khóa 喜欢, 学习, 汉语.',
              },
            ],
          },
        ],
      }),
    });

    assert.strictEqual(createExamRes.status, 201, 'Giáo viên tạo đề HSK 1 phải trả về 201');
    const createdExamJson = ((await createExamRes.json()) as any).data;
    const examId = createdExamJson.id;

    // Tổng điểm tự động cộng từ toàn bộ các câu: 5 + 5 + 5 + 5 + 10 = 30 điểm
    assert.strictEqual(createdExamJson.total_score, 30.0, 'Tổng điểm phải tự động tính bằng 30.0');
    assert.strictEqual(createdExamJson.hsk_level, 'HSK1');
    assert(createdExamJson.exam_pdf_url.includes(`${examCode}.pdf`));
    assert(createdExamJson.audio_url.includes(`${examCode}.mp3`));
    assert(createdExamJson.answer_pdf_url.includes(`${examCode}_answer.pdf`));
    assert.strictEqual(createdExamJson.sections.length, 3, 'Phải có đủ 3 phần: Nghe + Đọc + Viết');
    console.log(`  ✔ Giáo viên tạo đề HSK 1 thành công (ID=${examId}, Mã=${examCode}, Tổng điểm=${createdExamJson.total_score}đ).`);

    console.log('\n▶ [PHẦN 3] KIỂM TRA BẢO MẬT API /TAKE (ẨN HOÀN TOÀN CORRECT_ANSWER VÀ ANSWER_PDF_URL)');
    const takeRes = await fetch(`${baseUrl}/api/exams/${examId}/take`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(takeRes.status, 200, 'Học viên gọi /take phải thành công 200');
    const takeData = ((await takeRes.json()) as any).data;

    // 1. Phải ẩn hoàn toàn answer_pdf_url (bằng null)
    assert.strictEqual(takeData.answer_pdf_url, null, 'API /take bắt buộc phải ẩn answer_pdf_url (trả về null)');

    // 2. Mọi câu hỏi không được rò rỉ correct_answer, sample_answer, explanation
    let totalQuestionsInTake = 0;
    for (const sec of takeData.sections) {
      for (const q of sec.questions) {
        totalQuestionsInTake++;
        assert.strictEqual(q.correct_answer, undefined, `Câu ${q.question_number} không được chứa correct_answer`);
        assert.strictEqual(q.sample_answer, undefined, `Câu ${q.question_number} không được chứa sample_answer`);
        assert.strictEqual(q.explanation, undefined, `Câu ${q.question_number} không được chứa explanation`);
      }
    }
    assert.strictEqual(totalQuestionsInTake, 5, 'Phải nạp đủ 5 câu hỏi');
    console.log('  ✔ API /take bảo mật tuyệt đối: Ẩn 100% correct_answer, sample_answer và answer_pdf_url.');

    console.log('\n▶ [PHẦN 4] HỌC VIÊN NỘP BÀI (CÂU ĐÚNG, CÂU SAI ABCD, CÂU VIẾT) & KIỂM TRA CHẤM ĐIỂM');
    // Q1 (TRUE_FALSE): đúng ('TRUE') -> +5đ, is_correct = true
    // Q2 (MCQ_ABCD): chọn sai ('A' thay vì 'C') -> 0đ, is_correct = false
    // Q3 (MCQ_ABCDEF): đúng ('B') -> +5đ, is_correct = true
    // Q4 (WRITING_FILL): đúng ('北京。' có dấu chấm câu, chuẩn hóa chuỗi) -> +5đ, is_correct = true
    // Q5 (WRITING_ESSAY): đúng ('我非常喜欢学习汉语。' chứa đủ 3 từ khóa) -> +10đ, is_correct = true
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
          { questionId: q1.id, answer: 'TRUE' }, // Đúng
          { questionId: q2.id, answer: 'A' }, // SAI ABCD
          { questionId: q3.id, answer: 'B' }, // Đúng
          { questionId: q4.id, answer: '北京。' }, // Viết điền đúng
          { questionId: q5.id, answer: '我非常喜欢学习汉语，很有趣。' }, // Viết câu đúng
        ],
      }),
    });

    assert.strictEqual(submitRes.status, 200, 'Nộp bài phải trả về 200');
    const submitResult = ((await submitRes.json()) as any).data;

    // 1. Kiểm tra điểm từng phần
    assert.strictEqual(submitResult.listening_score, 5.0, 'Phần Nghe: Đúng Q1 (5đ), Sai Q2 (0đ) -> 5.0đ');
    assert.strictEqual(submitResult.reading_score, 10.0, 'Phần Đọc: Đúng Q3 (5đ) và Q4 (5đ) -> 10.0đ');
    assert.strictEqual(submitResult.writing_score, 10.0, 'Phần Viết: Đúng Q5 (10đ) -> 10.0đ');

    // 2. Kiểm tra tổng điểm
    assert.strictEqual(submitResult.total_score, 25.0, 'Tổng điểm: 5 + 10 + 10 = 25.0đ');
    assert.strictEqual(submitResult.max_score, 30.0, 'Điểm tối đa là 30.0đ');
    assert.strictEqual(submitResult.correct_count, 4, 'Số câu đúng phải là 4');
    assert.strictEqual(submitResult.wrong_count, 1, 'Số câu sai phải là 1');

    // 3. Kiểm tra chi tiết câu sai Q2: is_correct === false và earned_score === 0
    const q2Ans = submitResult.answers.find((a: any) => a.question_id === q2.id);
    assert(q2Ans, 'Phải có kết quả cho câu Q2');
    assert.strictEqual(q2Ans.is_correct, false, 'Câu chọn sai ABCD phải có is_correct = false');
    assert.strictEqual(q2Ans.earned_score, 0, 'Câu chọn sai ABCD phải có earned_score = 0');
    assert.strictEqual(q2Ans.correct_answer, 'C', 'Phải giải mã đáp án đúng cho học viên xem lại');

    // 4. Kiểm tra các câu đúng
    const q1Ans = submitResult.answers.find((a: any) => a.question_id === q1.id);
    assert.strictEqual(q1Ans.is_correct, true);
    assert.strictEqual(q1Ans.earned_score, 5.0);

    const q5Ans = submitResult.answers.find((a: any) => a.question_id === q5.id);
    assert.strictEqual(q5Ans.is_correct, true);
    assert.strictEqual(q5Ans.earned_score, 10.0);
    assert(q5Ans.sample_answer, 'Mở khóa sample_answer cho câu viết');

    // 5. Kiểm tra mở khóa answer_pdf_url sau khi nộp
    assert(submitResult.answer_pdf_url, 'Phải trả về answer_pdf_url sau khi nộp bài');
    assert(
      submitResult.answer_pdf_url.includes(`${examCode}_answer.pdf`),
      'answer_pdf_url phải khớp với file đáp án gốc'
    );

    console.log('  ✔ Chấm điểm chính xác 100%: 25.0/30.0đ (4 câu đúng, 1 câu sai).');
    console.log('  ✔ Câu sai ABCD (Q2) được đánh dấu is_correct = false và earned_score = 0đ chuẩn xác.');
    console.log(`  ✔ Đã tự động mở khóa file đáp án PDF gốc sau khi nộp bài: ${submitResult.answer_pdf_url}`);

    console.log('\n▶ [PHẦN 5] DỌN DẸP DỮ LIỆU KIỂM THỬ');
    await fetch(`${baseUrl}/api/exams/${examId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    await prisma.users.deleteMany({
      where: { user_id: { in: [teacherUser.user_id, studentUser.user_id] } },
    });
    console.log('  ✔ Đã dọn dẹp dữ liệu kiểm thử sạch sẽ.');

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC ĐIỀU KIỆN KIỂM THỬ ĐỘC LẬP GIAI ĐOẠN 5 ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }
}

runMockExamTests().catch((err) => {
  console.error('❌ MOCK EXAM GIAI ĐOẠN 5 TEST FAILED:', err);
  process.exit(1);
});
