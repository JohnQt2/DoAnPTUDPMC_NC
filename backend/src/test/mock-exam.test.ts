import http from 'http';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';
import { examParserService } from '../modules/exam/exam-parser.service';

async function runMockExamTests() {
  console.log('🧪 Bắt đầu Bộ Kiểm Thử Nâng Cấp: Xử Lý Bộ File HSK 1 H10000 & Phân Tích Tự Động...\n');

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
        email: `teacher_h10000_${timestamp}@hanzi4u.test`,
        display_name: 'Thầy Giáo Vương H10000',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const studentUser = await prisma.users.create({
      data: {
        email: `student_h10000_${timestamp}@hanzi4u.test`,
        display_name: 'Học Viên Lan Anh H10000',
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

    console.log('▶ [PHẦN 1] KIỂM TRA UPLOAD NHIỀU FILE & CHUẨN HÓA TÊN FILE TIẾNG TRUNG');

    // Tạo file test tạm với tên tiếng Trung và dấu ngoặc đơn: "H10000 (1).pdf", "H10000 答案.pdf", "H10000 听力材料.pdf"
    const tempDir = path.join(process.cwd(), 'uploads', 'exams');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const dummyPdfContent = Buffer.from('%PDF-1.4 Mock PDF Content for HSK Exam');
    const dummyAudioContent = Buffer.from('Mock MP3 Audio File Content');

    const boundary = '----WebKitFormBoundary' + timestamp;
    const multipartBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="examPdf"; filename="H10000 (1).pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ),
      dummyPdfContent,
      Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="answerPdf"; filename="H10000 答案.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ),
      dummyPdfContent,
      Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="H10000.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`
      ),
      dummyAudioContent,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${baseUrl}/api/exams/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${teacherToken}`,
      },
      body: multipartBody,
    });

    assert.strictEqual(uploadRes.status, 200, 'Upload nhiều file phải trả về status 200');
    const uploadJson = (await uploadRes.json()) as any;
    assert.strictEqual(uploadJson.success, true);
    assert(uploadJson.urls.exam_pdf, 'Phải có exam_pdf URL');
    assert(uploadJson.urls.answer_pdf, 'Phải có answer_pdf URL');
    assert(uploadJson.urls.audio, 'Phải có audio URL');

    // Kiểm tra tên file trên đĩa an toàn (không chứa chữ Hán hoặc dấu ngoặc đơn)
    const examFilenameOnDisk = path.basename(uploadJson.urls.exam_pdf);
    assert(!/[^\x00-\x7F]/.test(examFilenameOnDisk), 'Tên file trên đĩa không được chứa ký tự tiếng Trung');
    assert(!examFilenameOnDisk.includes(' '), 'Tên file trên đĩa không được chứa khoảng trắng');

    // Kiểm tra metadata lưu đúng originalName đã decode
    if (uploadJson.files) {
      assert(uploadJson.files.examPdf, 'Metadata phải có examPdf');
      assert(uploadJson.files.answerPdf, 'Metadata phải có answerPdf');
    }
    console.log('  ✔ Upload đồng thời nhiều file & chuẩn hóa tên an toàn trên đĩa thành công.');

    // 1.2: Kiểm tra endpoint mới POST /api/exams/upload-batch
    const batchBoundary = '----BatchBoundary' + timestamp;
    const batchBody = Buffer.concat([
      Buffer.from(
        `--${batchBoundary}\r\nContent-Disposition: form-data; name="files"; filename="H10000 (1).pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ),
      dummyPdfContent,
      Buffer.from(
        `\r\n--${batchBoundary}\r\nContent-Disposition: form-data; name="files"; filename="H10000 答案.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ),
      dummyPdfContent,
      Buffer.from(
        `\r\n--${batchBoundary}\r\nContent-Disposition: form-data; name="files"; filename="H10000.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`
      ),
      dummyAudioContent,
      Buffer.from(`\r\n--${batchBoundary}--\r\n`),
    ]);

    const batchRes = await fetch(`${baseUrl}/api/exams/upload-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${batchBoundary}`,
        Authorization: `Bearer ${teacherToken}`,
      },
      body: batchBody,
    });
    assert.strictEqual(batchRes.status, 200, 'POST /api/exams/upload-batch phải trả về 200');
    const batchJson = (await batchRes.json()) as any;
    assert.strictEqual(batchJson.success, true);
    assert(Array.isArray(batchJson.data), 'batchJson.data phải là một mảng');
    assert.strictEqual(batchJson.data.length, 3, 'Phải upload và phân loại đủ 3 file');
    const roleExam = batchJson.data.find((f: any) => f.role === 'examPdf');
    const roleAnswer = batchJson.data.find((f: any) => f.role === 'answerPdf');
    const roleAudio = batchJson.data.find((f: any) => f.role === 'audio');
    assert(roleExam, 'Phải tự động gán role examPdf cho H10000 (1).pdf');
    assert(roleAnswer, 'Phải tự động gán role answerPdf cho H10000 答案.pdf');
    assert(roleAudio, 'Phải tự động gán role audio cho H10000.mp3');
    console.log('  ✔ POST /api/exams/upload-batch tải hàng loạt & tự động phân loại vai trò thành công 100%.');

    console.log('\n▶ [PHẦN 2] KIỂM TRA BỘ PHÂN TÍCH TỰ ĐỘNG ĐỀ H10000 & XỬ LÝ LỖI DÒNG DÍNH "3. 4. X"');

    // Văn bản giả lập chính xác đề HSK 1 H10000 với 40 câu hỏi:
    // - Nghe P1 (Q1-Q5): Đúng/Sai có trường hợp "3. 4. X" (câu 3 bị mất dấu √ do lỗi font)
    // - Nghe P2 (Q6-Q10): MCQ_ABC (A, B, C)
    // - Nghe P3 (Q11-Q15): MCQ_ABC
    // - Nghe P4 (Q16-Q20): MCQ_ABC
    // - Đọc P1 (Q21-Q25): MCQ_ABCDEF (ghép tranh A-F)
    // - Đọc P2 (Q26-Q30): MCQ_ABCDEF
    // - Đọc P3 (Q31-Q35): TRUE_FALSE
    // - Đọc P4 (Q36-Q40): MCQ_ABCDEF
    const sampleH10000AnswerText = `
H10000 样卷答案
一、听力
第一部分
1. √ 2. X 3. 4. X 5. √
第二部分
6. A 7. C 8. B 9. B 10. A
第三部分
11. B 12. C 13. A 14. B 15. C
第四部分
16. A 17. B 18. C 19. A 20. B
二、阅读
第一部分
21. A 22. C 23. E 24. B 25. D
第二部分
26. F 27. B 28. C 29. A 30. E
第三部分
31. √ 32. X 33. √ 34. X 35. √
第四部分
36. B 37. D 38. A 39. C 40. F
    `;

    const parsedQuestions = examParserService.extractQuestionsFromAnswerText(sampleH10000AnswerText, 'HSK1');
    assert.strictEqual(parsedQuestions.length, 40, 'Phải bóc tách chuẩn xác 40 câu hỏi của HSK 1');

    // Kiểm tra câu 3 (dính "3. 4. X"):
    const q3 = parsedQuestions.find((q) => q.question_number === 3);
    assert(q3, 'Phải nhận diện được câu 3 dù bị mất ký tự đáp án');
    assert.strictEqual(q3.needsReview, true, 'Câu 3 phải được đánh dấu needsReview = true');
    assert.strictEqual(q3.raw_answer, 'TRUE', 'Câu 3 gợi ý mặc định là TRUE (√)');

    // Kiểm tra câu 4:
    const q4 = parsedQuestions.find((q) => q.question_number === 4);
    assert(q4, 'Phải có câu 4');
    assert.strictEqual(q4.raw_answer, 'FALSE', 'Câu 4 phải có đáp án FALSE (X)');

    // Kiểm tra bóc tách cấu trúc hoàn chỉnh qua parseExamFiles
    const parsedStructure = await examParserService.parseExamFiles({
      userHskLevel: 'HSK1',
      filesMetadata: {
        examPdf: {
          url: uploadJson.urls.exam_pdf,
          filename: examFilenameOnDisk,
          originalName: 'H10000 (1).pdf',
          size: 1024,
        },
        answerPdf: {
          url: uploadJson.urls.answer_pdf,
          filename: path.basename(uploadJson.urls.answer_pdf),
          originalName: 'H10000 答案.pdf',
          size: 1024,
        },
        audio: {
          url: uploadJson.urls.audio,
          filename: path.basename(uploadJson.urls.audio),
          originalName: 'H10000.mp3',
          size: 2048,
        },
      },
    });

    assert.strictEqual(parsedStructure.code, 'H10000', 'Mã đề phải nhận diện là H10000');
    assert.strictEqual(parsedStructure.hsk_level, 'HSK1', 'Cấp độ phải là HSK1');
    assert.strictEqual(parsedStructure.sections.length, 2, 'Phải có 2 phần: Nghe và Đọc');
    assert.strictEqual(parsedStructure.sections[0].questions?.length, 20, 'Phần Nghe có 20 câu');
    assert.strictEqual(parsedStructure.sections[1].questions?.length, 20, 'Phần Đọc có 20 câu');
    assert.strictEqual(parsedStructure.sections[0].questions?.[0].points, 5.0, 'Mỗi câu nghe 5.0 điểm');
    assert.strictEqual(parsedStructure.sections[1].questions?.[0].points, 5.0, 'Mỗi câu đọc 5.0 điểm');

    console.log('  ✔ Phân tích bóc tách tự động đề H10000 thành công: Đầy đủ 40 câu hỏi, chia 2 phần Nghe & Đọc.');
    console.log('  ✔ Xử lý dòng dính "3. 4. X" hoàn hảo: Câu 3 tự động gợi ý Đúng (√) và gán needsReview = true.');

    console.log('\n▶ [PHẦN 3] TẠO ĐỀ THI H10000 VÀO HỆ THỐNG VỚI MCQ_ABC, MCQ_ABCD, TRUE_FALSE');

    const createExamRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        code: `H10000_${timestamp}`,
        title: `Đề thi thử HSK 1 Chuẩn - Mã H10000_${timestamp}`,
        description: 'Đề thi bóc tách tự động từ bộ file H10000.',
        hsk_level: 'HSK1',
        exam_pdf_url: uploadJson.urls.exam_pdf,
        audio_url: uploadJson.urls.audio,
        answer_pdf_url: uploadJson.urls.answer_pdf,
        duration_minutes: 35,
        pass_score: 120,
        status: 'PUBLISHED',
        sections: examParserService.buildSections(parsedQuestions, 'HSK1'),
      }),
    });

    assert.strictEqual(createExamRes.status, 201, 'Tạo đề thi phải trả về 201');
    const createdExamJson = ((await createExamRes.json()) as any).data;
    const examId = createdExamJson.id;
    assert.strictEqual(createdExamJson.total_score, 200, 'Tổng điểm 40 câu x 5đ = 200đ');
    console.log(`  ✔ Đề thi tạo thành công ID=${examId}, Tổng điểm=${createdExamJson.total_score}đ.`);

    // Kiểm tra chặn trùng mã đề thi
    const duplicateRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        code: `H10000_${timestamp}`,
        title: 'Đề thi thử trùng lặp',
        hsk_level: 'HSK1',
        exam_pdf_url: uploadJson.urls.exam_pdf,
      }),
    });
    assert.strictEqual(duplicateRes.status, 400, 'Tạo trùng mã đề phải trả về 400 Bad Request');
    const duplicateJson = (await duplicateRes.json()) as any;
    const duplicateMessage = duplicateJson.error?.message || duplicateJson.message;
    assert.strictEqual(
      duplicateMessage,
      'Mã đề này đã tồn tại, vui lòng chọn mã khác hoặc cập nhật đề cũ.'
    );
    console.log('  ✔ Chặn tạo trùng mã đề thành công: thông báo rõ ràng chuẩn xác.');

    console.log('\n▶ [PHẦN 4] KIỂM TRA BẢO MẬT API /TAKE (CHỐNG GIAN LẬN)');
    const takeRes = await fetch(`${baseUrl}/api/exams/${examId}/take`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(takeRes.status, 200);
    const takeData = ((await takeRes.json()) as any).data;
    assert.strictEqual(takeData.answer_pdf_url, null, 'answer_pdf_url phải là null');

    for (const sec of takeData.sections) {
      for (const q of sec.questions) {
        assert.strictEqual(q.correct_answer, undefined);
        assert.strictEqual(q.explanation, undefined);
      }
    }
    console.log('  ✔ API /take bảo mật tuyệt đối: Ẩn 100% đáp án và file đáp án PDF.');

    console.log('\n▶ [PHẦN 5] HỌC VIÊN NỘP BÀI (CHẤM ĐIỂM MCQ_ABC, TRUE_FALSE & BÁO ĐỎ ✗ CÂU SAI)');
    // Học viên làm 40 câu:
    // - Làm đúng câu 1 (TRUE), câu 3 (TRUE), câu 6 (A - MCQ_ABC), câu 21 (A - MCQ_ABCDEF)
    // - Làm sai câu 2: chọn TRUE thay vì FALSE
    // - Làm sai câu 7: chọn B thay vì C (MCQ_ABC)
    const listeningQuestions = createdExamJson.sections[0].questions;
    const readingQuestions = createdExamJson.sections[1].questions;

    const studentAnswers = [
      { questionId: listeningQuestions[0].id, answer: 'TRUE' }, // Q1: Đúng -> +5đ
      { questionId: listeningQuestions[1].id, answer: 'TRUE' }, // Q2: SAI (đáp án là FALSE) -> 0đ
      { questionId: listeningQuestions[2].id, answer: 'TRUE' }, // Q3: Đúng -> +5đ
      { questionId: listeningQuestions[3].id, answer: 'FALSE' }, // Q4: Đúng -> +5đ
      { questionId: listeningQuestions[4].id, answer: 'TRUE' }, // Q5: Đúng -> +5đ
      { questionId: listeningQuestions[5].id, answer: 'A' }, // Q6 (MCQ_ABC): Đúng -> +5đ
      { questionId: listeningQuestions[6].id, answer: 'B' }, // Q7 (MCQ_ABC): SAI (đáp án là C) -> 0đ
    ];

    // Thêm các câu còn lại cho đủ
    for (let i = 7; i < 20; i++) {
      studentAnswers.push({
        questionId: listeningQuestions[i].id,
        answer: listeningQuestions[i].correct_answer || 'A',
      });
    }
    for (let i = 0; i < 20; i++) {
      studentAnswers.push({
        questionId: readingQuestions[i].id,
        answer: readingQuestions[i].correct_answer || 'A',
      });
    }

    const submitRes = await fetch(`${baseUrl}/api/exams/${examId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ answers: studentAnswers }),
    });

    assert.strictEqual(submitRes.status, 200);
    const submitResult = ((await submitRes.json()) as any).data;

    // Có 38 câu đúng (mỗi câu 5đ) = 190đ, 2 câu sai (Q2 và Q7) = 0đ
    assert.strictEqual(submitResult.correct_count, 38, 'Số câu đúng phải là 38');
    assert.strictEqual(submitResult.wrong_count, 2, 'Số câu sai phải là 2');
    assert.strictEqual(submitResult.total_score, 190.0, 'Tổng điểm phải là 190.0đ');
    assert.strictEqual(submitResult.is_passed, true, 'Đạt điểm chuẩn (190 >= 120đ)');

    // Kiểm tra câu sai Q2
    const q2Result = submitResult.answers.find((a: any) => a.question_id === listeningQuestions[1].id);
    assert.strictEqual(q2Result.is_correct, false, 'Q2 sai phải có is_correct = false');
    assert.strictEqual(q2Result.earned_score, 0, 'Q2 sai phải có earned_score = 0');

    // Kiểm tra câu sai Q7 (MCQ_ABC)
    const q7Result = submitResult.answers.find((a: any) => a.question_id === listeningQuestions[6].id);
    assert.strictEqual(q7Result.is_correct, false, 'Q7 (MCQ_ABC) sai phải có is_correct = false');
    assert.strictEqual(q7Result.earned_score, 0);

    // Mở khóa file đáp án PDF
    assert(submitResult.answer_pdf_url, 'Phải mở khóa answer_pdf_url sau khi nộp bài');

    console.log('  ✔ Chấm điểm chuẩn xác 100%: 38 câu đúng (190đ), 2 câu sai (0đ, báo is_correct = false).');
    console.log(`  ✔ Đã tự động mở khóa file đáp án PDF gốc: ${submitResult.answer_pdf_url}`);

    console.log('\n▶ [PHẦN 6] KIỂM TRA XÓA TỪNG FILE UPLOAD & CẬP NHẬT GỠ FILE (audio_url = null)');
    // 6.1: Kiểm tra DELETE /api/exams/upload
    const testDeleteFileName = `${timestamp}-delete-test.pdf`;
    const testDeleteFilePath = path.join(tempDir, testDeleteFileName);
    fs.writeFileSync(testDeleteFilePath, 'Temp file to delete');
    assert(fs.existsSync(testDeleteFilePath), 'File test phải tồn tại trước khi xóa');

    const deleteFileRes = await fetch(`${baseUrl}/api/exams/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ fileUrl: `/uploads/exams/${testDeleteFileName}` }),
    });
    assert.strictEqual(deleteFileRes.status, 200, 'DELETE /api/exams/upload phải trả về 200');
    const deleteFileJson = (await deleteFileRes.json()) as any;
    assert.strictEqual(deleteFileJson.success, true);
    assert(!fs.existsSync(testDeleteFilePath), 'File vật lý trên đĩa phải bị xóa hoàn toàn');
    console.log('  ✔ API DELETE /api/exams/upload xóa an toàn file trên đĩa thành công.');

    // 6.2: Kiểm tra cập nhật đề thi gỡ audio_url (đặt về null)
    const updateExamRes = await fetch(`${baseUrl}/api/exams/${examId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        audio_url: null,
      }),
    });
    assert.strictEqual(updateExamRes.status, 200, 'Cập nhật gỡ audio_url phải trả về 200');
    const updatedExamJson = ((await updateExamRes.json()) as any).data;
    assert.strictEqual(updatedExamJson.audio_url, null, 'audio_url trong database phải là null sau khi cập nhật');
    console.log('  ✔ Cập nhật gỡ bỏ file (audio_url = null) thành công trong database.');

    console.log('\n▶ [PHẦN 7] DỌN DẸP DỮ LIỆU KIỂM THỬ');
    await fetch(`${baseUrl}/api/exams/${examId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    await prisma.users.deleteMany({
      where: { user_id: { in: [teacherUser.user_id, studentUser.user_id] } },
    });
    console.log('  ✔ Dọn dẹp dữ liệu kiểm thử thành công.');

    console.log('\n========================================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ NÂNG CẤP BỘ ĐỀ HSK VÀ BÓC TÁCH ĐÃ VƯỢT QUA 100%!');
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
