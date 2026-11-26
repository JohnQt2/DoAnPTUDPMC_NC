import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import {
  CreateExamDto,
  UpdateExamDto,
  CreateSectionDto,
  SubmitExamDto,
  HskLevel,
  ExamStatus,
  GradeQuestionItemDto,
} from './exam.dto';

function normalizeTrueFalse(val?: string | null): 'TRUE' | 'FALSE' | null {
  if (!val) return null;
  const s = val.trim().toUpperCase();
  if (['TRUE', 'T', '✓', 'V', '1', 'ĐÚNG', 'DUNG', 'YES', 'Y'].includes(s)) return 'TRUE';
  if (['FALSE', 'F', '✗', 'X', '0', 'SAI', 'NO', 'N'].includes(s)) return 'FALSE';
  return null;
}

function normalizeWritingText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.。!！?？]+$/, '')
    .toLowerCase();
}

export class ExamService {
  /**
   * Danh sách đề thi cho học viên hoặc giáo viên
   */
  async listExams(options: {
    hsk_level?: string;
    status?: string;
    userId?: number;
    isAdmin?: boolean;
  }) {
    const where: any = {};

    if (options.hsk_level && options.hsk_level !== 'ALL') {
      where.hsk_level = options.hsk_level;
    }

    if (!options.isAdmin) {
      where.status = 'PUBLISHED';
    } else if (options.status) {
      where.status = options.status;
    }

    const exams = await prisma.mockExam.findMany({
      where,
      orderBy: [{ hsk_level: 'asc' }, { created_at: 'desc' }],
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    // Nếu có userId, truy vấn lịch sử thi để hiển thị điểm cao nhất và trạng thái đạt
    let attemptsMap: Record<number, { bestScore: number; attemptsCount: number; passed: boolean }> = {};
    if (options.userId) {
      const attempts = await prisma.examAttempt.findMany({
        where: { user_id: options.userId },
        select: {
          exam_id: true,
          total_score: true,
          is_passed: true,
        },
      });

      for (const att of attempts) {
        if (!attemptsMap[att.exam_id]) {
          attemptsMap[att.exam_id] = {
            bestScore: att.total_score,
            attemptsCount: 1,
            passed: att.is_passed,
          };
        } else {
          attemptsMap[att.exam_id].attemptsCount += 1;
          if (att.total_score > attemptsMap[att.exam_id].bestScore) {
            attemptsMap[att.exam_id].bestScore = att.total_score;
          }
          if (att.is_passed) {
            attemptsMap[att.exam_id].passed = true;
          }
        }
      }
    }

    return exams.map((exam) => {
      const totalQuestions = exam.sections.reduce((acc, s) => acc + s._count.questions, 0);
      const sectionTypes = exam.sections.map((s) => s.section_type);
      const userStats = attemptsMap[exam.id] || {
        bestScore: null,
        attemptsCount: 0,
        passed: false,
      };

      return {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        description: exam.description,
        hsk_level: exam.hsk_level,
        exam_pdf_url: exam.exam_pdf_url,
        audio_url: exam.audio_url,
        has_answer_pdf: Boolean(exam.answer_pdf_url),
        duration_minutes: exam.duration_minutes,
        total_score: exam.total_score,
        pass_score: exam.pass_score,
        status: exam.status,
        created_at: exam.created_at,
        sections_count: exam.sections.length,
        questions_count: totalQuestions,
        section_types: sectionTypes,
        user_best_score: userStats.bestScore,
        user_attempts_count: userStats.attemptsCount,
        user_passed: userStats.passed,
      };
    });
  }

  /**
   * Lấy chi tiết đề thi kèm câu hỏi
   * - Nếu là học viên chưa nộp bài: Ẩn đáp án đúng, giải thích và answer_pdf_url để chống gian lận
   */
  async getExamById(id: number, userId?: number, isAdmin?: boolean) {
    const exam = await prisma.mockExam.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            questions: {
              orderBy: { question_number: 'asc' },
            },
          },
        },
      },
    });

    if (!exam) {
      throw AppError.notFound('Không tìm thấy đề thi thử này.');
    }

    if (!isAdmin && exam.status !== 'PUBLISHED') {
      throw AppError.forbidden('Đề thi này chưa được công khai.');
    }

    // Kiểm tra xem học viên đã từng nộp bài làm đề này chưa
    let hasCompletedAttempt = false;
    if (userId && !isAdmin) {
      const pastAttempt = await prisma.examAttempt.findFirst({
        where: { exam_id: id, user_id: userId, submitted_at: { not: null } },
      });
      hasCompletedAttempt = Boolean(pastAttempt);
    }

    const canSeeAnswers = isAdmin || hasCompletedAttempt;

    // Sanitize câu hỏi nếu học viên đang làm bài (chưa nộp)
    const sanitizedSections = exam.sections.map((section) => ({
      ...section,
      questions: section.questions.map((q) => {
        let parsedOptions: any = q.options;
        if (typeof q.options === 'string') {
          try {
            parsedOptions = JSON.parse(q.options);
          } catch {
            parsedOptions = q.options;
          }
        }

        return {
          id: q.id,
          section_id: q.section_id,
          question_number: q.question_number,
          question_type: q.question_type,
          prompt_text: q.prompt_text,
          options: parsedOptions,
          points: q.points,
          order_index: q.order_index,
          ...(canSeeAnswers
            ? {
                correct_answer: q.correct_answer,
                sample_answer: q.sample_answer,
                explanation: q.explanation,
              }
            : {}),
        };
      }),
    }));

    return {
      id: exam.id,
      code: exam.code,
      title: exam.title,
      description: exam.description,
      hsk_level: exam.hsk_level,
      exam_pdf_url: exam.exam_pdf_url,
      audio_url: exam.audio_url,
      answer_pdf_url: canSeeAnswers ? exam.answer_pdf_url : null,
      duration_minutes: exam.duration_minutes,
      total_score: exam.total_score,
      pass_score: exam.pass_score,
      status: exam.status,
      created_at: exam.created_at,
      has_answer_pdf: Boolean(exam.answer_pdf_url),
      can_see_answers: canSeeAnswers,
      sections: sanitizedSections,
    };
  }

  /**
   * Tạo đề thi mới (Giáo viên / Admin)
   */
  async createExam(data: CreateExamDto, userId: number) {
    const existing = await prisma.mockExam.findUnique({
      where: { code: data.code.trim().toUpperCase() },
    });

    if (existing) {
      throw AppError.badRequest('Mã đề này đã tồn tại, vui lòng chọn mã khác hoặc cập nhật đề cũ.');
    }

    // Tính tổng điểm từ danh sách câu hỏi nếu có
    let totalScore = data.total_score || 0;
    if (data.sections && data.sections.length > 0) {
      let calculatedSum = 0;
      for (const sec of data.sections) {
        if (sec.questions) {
          for (const q of sec.questions) {
            calculatedSum += Number(q.points) || 0;
          }
        }
      }
      if (calculatedSum > 0) {
        totalScore = calculatedSum;
      }
    }

    if (totalScore <= 0) {
      totalScore = 100;
    }

    const created = await prisma.$transaction(async (tx) => {
      const exam = await tx.mockExam.create({
        data: {
          code: data.code.trim().toUpperCase(),
          title: data.title.trim(),
          description: data.description?.trim() || null,
          hsk_level: data.hsk_level,
          exam_pdf_url: data.exam_pdf_url.trim(),
          audio_url: data.audio_url?.trim() || null,
          answer_pdf_url: data.answer_pdf_url?.trim() || null,
          duration_minutes: data.duration_minutes || 35,
          total_score: totalScore,
          pass_score: data.pass_score || Math.round(totalScore * 0.6),
          status: data.status || 'PUBLISHED',
          created_by: userId,
        },
      });

      if (data.sections && data.sections.length > 0) {
        for (let sIdx = 0; sIdx < data.sections.length; sIdx++) {
          const sec = data.sections[sIdx];
          const createdSec = await tx.examSection.create({
            data: {
              exam_id: exam.id,
              section_type: sec.section_type,
              title: sec.title.trim(),
              instructions: sec.instructions?.trim() || null,
              audio_url: sec.audio_url?.trim() || null,
              order_index: sec.order_index ?? sIdx,
            },
          });

          if (sec.questions && sec.questions.length > 0) {
            for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
              const q = sec.questions[qIdx];
              let optionsStr: string | null = null;
              if (q.options) {
                optionsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options);
              }

              await tx.examQuestion.create({
                data: {
                  section_id: createdSec.id,
                  question_number: q.question_number || qIdx + 1,
                  question_type: q.question_type || 'MCQ_ABCD',
                  prompt_text: q.prompt_text?.trim() || null,
                  options: optionsStr,
                  correct_answer: q.correct_answer ? String(q.correct_answer).trim() : null,
                  sample_answer: q.sample_answer?.trim() || null,
                  points: Number(q.points) || 2.5,
                  explanation: q.explanation?.trim() || null,
                  order_index: q.order_index ?? qIdx,
                },
              });
            }
          }
        }
      }

      return exam;
    });

    return this.getExamById(created.id, userId, true);
  }

  /**
   * Cập nhật thông tin đề thi (Giáo viên / Admin)
   */
  async updateExam(id: number, data: UpdateExamDto, userId: number) {
    const existing = await prisma.mockExam.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Không tìm thấy đề thi cần cập nhật.');
    }

    if (data.code && data.code.trim().toUpperCase() !== existing.code) {
      const codeCheck = await prisma.mockExam.findUnique({
        where: { code: data.code.trim().toUpperCase() },
      });
      if (codeCheck) {
        throw AppError.badRequest('Mã đề này đã tồn tại, vui lòng chọn mã khác hoặc cập nhật đề cũ.');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Cập nhật thông tin chung
      const exam = await tx.mockExam.update({
        where: { id },
        data: {
          ...(data.code ? { code: data.code.trim().toUpperCase() } : {}),
          ...(data.title ? { title: data.title.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.hsk_level ? { hsk_level: data.hsk_level } : {}),
          ...(data.exam_pdf_url !== undefined
            ? { exam_pdf_url: data.exam_pdf_url && data.exam_pdf_url.trim() ? data.exam_pdf_url.trim() : existing.exam_pdf_url }
            : {}),
          ...(data.audio_url !== undefined
            ? { audio_url: data.audio_url && data.audio_url.trim() ? data.audio_url.trim() : null }
            : {}),
          ...(data.answer_pdf_url !== undefined
            ? { answer_pdf_url: data.answer_pdf_url && data.answer_pdf_url.trim() ? data.answer_pdf_url.trim() : null }
            : {}),
          ...(data.duration_minutes ? { duration_minutes: data.duration_minutes } : {}),
          ...(data.pass_score !== undefined ? { pass_score: data.pass_score } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
      });

      // Nếu có cập nhật cấu trúc section & câu hỏi
      if (data.sections) {
        await this.syncSectionsAndQuestions(tx, id, data.sections);
      }

      return exam;
    });

    return this.getExamById(updated.id, userId, true);
  }

  /**
   * Lưu nhanh cấu trúc Phần thi & Câu hỏi kèm thang điểm
   */
  async saveExamStructure(id: number, sections: CreateSectionDto[], userId: number) {
    const existing = await prisma.mockExam.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Không tìm thấy đề thi.');
    }

    await prisma.$transaction(async (tx) => {
      await this.syncSectionsAndQuestions(tx, id, sections);
    });

    return this.getExamById(id, userId, true);
  }

  /**
   * Helper đồng bộ sections & câu hỏi trong transaction
   */
  private async syncSectionsAndQuestions(tx: any, examId: number, sections: CreateSectionDto[]) {
    // Xóa toàn bộ section cũ của đề thi (cascade xóa questions cũ)
    await tx.examSection.deleteMany({
      where: { exam_id: examId },
    });

    let totalScore = 0;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      const createdSec = await tx.examSection.create({
        data: {
          exam_id: examId,
          section_type: sec.section_type,
          title: sec.title.trim(),
          instructions: sec.instructions?.trim() || null,
          audio_url: sec.audio_url?.trim() || null,
          order_index: sec.order_index ?? sIdx,
        },
      });

      if (sec.questions && sec.questions.length > 0) {
        for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
          const q = sec.questions[qIdx];
          const pts = Number(q.points) || 2.5;
          totalScore += pts;

          let optionsStr: string | null = null;
          if (q.options) {
            optionsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options);
          }

          await tx.examQuestion.create({
            data: {
              section_id: createdSec.id,
              question_number: q.question_number || qIdx + 1,
              question_type: q.question_type || 'MCQ_ABCD',
              prompt_text: q.prompt_text?.trim() || null,
              options: optionsStr,
              correct_answer: q.correct_answer ? String(q.correct_answer).trim() : null,
              sample_answer: q.sample_answer?.trim() || null,
              points: pts,
              explanation: q.explanation?.trim() || null,
              order_index: q.order_index ?? qIdx,
            },
          });
        }
      }
    }

    if (totalScore > 0) {
      await tx.mockExam.update({
        where: { id: examId },
        data: {
          total_score: totalScore,
          pass_score: Math.round(totalScore * 0.6),
        },
      });
    }
  }

  /**
   * Chuyển đổi trạng thái DRAFT <-> PUBLISHED (Giáo viên / Admin)
   */
  async publishExam(examId: number, targetStatus?: ExamStatus) {
    const existing = await prisma.mockExam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            questions: {
              select: { id: true, points: true },
            },
          },
        },
      },
    });
    if (!existing) {
      throw AppError.notFound('Không tìm thấy đề thi.');
    }

    const nextStatus = targetStatus || (existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED');

    if (nextStatus === 'PUBLISHED') {
      const allQuestions = existing.sections.flatMap((s) => s.questions);
      const computedScore = allQuestions.reduce((sum, q) => sum + Number(q.points || 0), 0);
      const effectiveTotalScore = Math.max(computedScore, Number(existing.total_score || 0));

      if (allQuestions.length < 1 || effectiveTotalScore <= 0) {
        throw AppError.badRequest(
          'Đề thi phải có ít nhất 1 câu hỏi và tổng điểm lớn hơn 0 trước khi xuất bản.'
        );
      }
    }

    const updated = await prisma.mockExam.update({
      where: { id: examId },
      data: { status: nextStatus },
    });

    return {
      success: true,
      id: updated.id,
      code: updated.code,
      status: updated.status,
      message: `Đề thi ${updated.code} hiện ở trạng thái ${updated.status}.`,
    };
  }

  /**
   * Cho phép giáo viên chấm điểm hoặc điều chỉnh điểm các câu hỏi (WRITING_ESSAY, v.v.)
   */
  async gradeAttempt(attemptId: number, grades: GradeQuestionItemDto[]) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw AppError.notFound('Không tìm thấy bài làm cần chấm.');
    }

    const questionSectionMap = new Map<number, string>();
    for (const sec of attempt.exam.sections) {
      for (const q of sec.questions) {
        questionSectionMap.set(q.id, sec.section_type);
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const g of grades || []) {
        const qId = g.question_id !== undefined ? Number(g.question_id) : Number(g.questionId);
        const score = g.earned_score !== undefined ? Number(g.earned_score) : Number(g.earnedScore ?? 0);
        const feedback = g.teacher_feedback || g.teacherFeedback || null;

        if (!qId) continue;

        const existingAns = attempt.answers.find((a) => a.question_id === qId);
        if (existingAns) {
          await tx.examAttemptAnswer.update({
            where: { id: existingAns.id },
            data: {
              earned_score: score,
              is_correct: score > 0,
              ...(feedback ? { teacher_feedback: feedback } : {}),
            },
          });
        }
      }

      const updatedAnswers = await tx.examAttemptAnswer.findMany({
        where: { attempt_id: attemptId },
      });

      let listeningScore = 0;
      let readingScore = 0;
      let writingScore = 0;
      let totalScore = 0;
      let correctCount = 0;
      let wrongCount = 0;

      for (const ans of updatedAnswers) {
        const sType = questionSectionMap.get(ans.question_id);
        const s = ans.earned_score || 0;
        if (sType === 'LISTENING') listeningScore += s;
        else if (sType === 'READING') readingScore += s;
        else if (sType === 'WRITING') writingScore += s;

        totalScore += s;
        if (ans.is_correct) correctCount++;
        else wrongCount++;
      }

      const isPassed = totalScore >= attempt.exam.pass_score;

      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          listening_score: Math.round(listeningScore * 10) / 10,
          reading_score: Math.round(readingScore * 10) / 10,
          writing_score: Math.round(writingScore * 10) / 10,
          total_score: Math.round(totalScore * 10) / 10,
          correct_count: correctCount,
          wrong_count: wrongCount,
          is_passed: isPassed,
        },
      });
    });

    return this.getAttemptDetails(attemptId, attempt.user_id, true);
  }

  /**
   * Lấy đề thi cho học viên làm bài (GET /api/exams/:examId/take)
   * Tuyệt đối ẩn answer_pdf_url, correct_answer và sample_answer
   */
  async getExamForTaking(examId: number, userId?: number) {
    const exam = await prisma.mockExam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            questions: {
              orderBy: { question_number: 'asc' },
            },
          },
        },
      },
    });

    if (!exam) {
      throw AppError.notFound('Không tìm thấy đề thi.');
    }

    if (exam.status !== 'PUBLISHED') {
      throw AppError.forbidden('Đề thi này chưa được công khai.');
    }

    const sanitizedSections = exam.sections.map((section) => ({
      id: section.id,
      section_type: section.section_type,
      title: section.title,
      instructions: section.instructions,
      audio_url: section.audio_url,
      questions: section.questions.map((q) => {
        let parsedOptions: any = q.options;
        if (typeof q.options === 'string') {
          try {
            parsedOptions = JSON.parse(q.options);
          } catch {
            parsedOptions = q.options;
          }
        }

        return {
          id: q.id,
          section_id: q.section_id,
          question_number: q.question_number,
          question_type: q.question_type,
          prompt_text: q.prompt_text,
          options: parsedOptions,
          points: q.points,
          order_index: q.order_index,
        };
      }),
    }));

    return {
      id: exam.id,
      code: exam.code,
      title: exam.title,
      description: exam.description,
      hsk_level: exam.hsk_level,
      exam_pdf_url: exam.exam_pdf_url,
      audio_url: exam.audio_url,
      answer_pdf_url: null, // Bảo mật chống lộ file đáp án
      duration_minutes: exam.duration_minutes,
      total_score: exam.total_score,
      pass_score: exam.pass_score,
      sections: sanitizedSections,
    };
  }

  /**
   * Xóa đề thi (Giáo viên / Admin)
   */
  async deleteExam(id: number) {
    const existing = await prisma.mockExam.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Không tìm thấy đề thi để xóa.');
    }

    await prisma.mockExam.delete({ where: { id } });
    return { success: true, message: `Đã xóa thành công đề thi ${existing.code}` };
  }

  /**
   * Nộp bài thi thử & Hệ thống tự động chấm điểm chi tiết từng câu
   */
  async submitExam(examId: number, userId: number, dto: SubmitExamDto) {
    const exam = await prisma.mockExam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            questions: {
              orderBy: { question_number: 'asc' },
            },
          },
        },
      },
    });

    if (!exam) {
      throw AppError.notFound('Không tìm thấy đề thi.');
    }

    // Bản đồ câu trả lời của thí sinh theo question_id (hỗ trợ cả questionId / question_id, answer / user_answer)
    const userAnswersMap = new Map<number, string>();
    for (const item of dto.answers || []) {
      const qId = item.questionId !== undefined ? Number(item.questionId) : Number(item.question_id);
      const ans = item.answer !== undefined ? String(item.answer) : String(item.user_answer ?? '');
      if (qId) {
        userAnswersMap.set(qId, ans.trim());
      }
    }

    let listeningScore = 0;
    let readingScore = 0;
    let writingScore = 0;
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const answerRecordsToCreate: Array<{
      question_id: number;
      user_answer: string | null;
      is_correct: boolean;
      earned_score: number;
      teacher_feedback: string | null;
    }> = [];

    const detailedFeedbackList: any[] = [];

    // Chấm từng câu hỏi
    for (const sec of exam.sections) {
      for (const q of sec.questions) {
        const uAns = userAnswersMap.get(q.id) || '';
        let isCorrect = false;
        let earnedScore = 0;
        let teacherFeedback: string | null = null;

        const maxPoints = Number(q.points) || 2.5;
        const cAns = q.correct_answer ? q.correct_answer.trim() : '';

        if (q.question_type === 'TRUE_FALSE') {
          const normUser = normalizeTrueFalse(uAns);
          const normCorrect = normalizeTrueFalse(cAns);
          if (normUser !== null && normCorrect !== null && normUser === normCorrect) {
            isCorrect = true;
          }
        } else if (
          q.question_type === 'MCQ_ABC' ||
          q.question_type === 'MCQ_ABCD' ||
          q.question_type === 'MCQ_ABCDEF'
        ) {
          if (uAns && cAns && uAns.toUpperCase() === cAns.toUpperCase()) {
            isCorrect = true;
          }
        } else if (q.question_type === 'WRITING_FILL') {
          // Chuẩn hóa chuỗi (bỏ khoảng trắng thừa, chuẩn hóa dấu câu cuối) và so khớp với danh sách đáp án trong correct_answer (phân cách bởi |)
          if (uAns && cAns) {
            const acceptedVariants = cAns.split('|').map((v) => normalizeWritingText(v));
            const userNormalized = normalizeWritingText(uAns);
            if (acceptedVariants.includes(userNormalized)) {
              isCorrect = true;
            }
          }
        } else if (q.question_type === 'WRITING_ESSAY') {
          // WRITING_ESSAY: Kiểm tra không bỏ trống và đối chiếu từ khóa bắt buộc (nếu giáo viên cấu hình trong correct_answer) để tính điểm sơ bộ; nếu bỏ trống/không đạt -> is_correct = false, earned_score = 0 và đính kèm sample_answer để đối chiếu.
          if (!uAns || uAns.trim().length === 0) {
            isCorrect = false;
            earnedScore = 0;
            teacherFeedback = 'Chưa làm bài viết. Vui lòng đối chiếu với đáp án mẫu.';
          } else if (cAns) {
            const requiredKeywords = cAns
              .split(/[|,]/)
              .map((k) => k.trim().toLowerCase())
              .filter(Boolean);
            const userNormalized = uAns.toLowerCase();
            const matchedKeywords = requiredKeywords.filter((kw) => userNormalized.includes(kw));

            if (requiredKeywords.length > 0) {
              const matchRatio = matchedKeywords.length / requiredKeywords.length;
              if (matchRatio >= 0.5) {
                isCorrect = true;
                earnedScore = Math.round(maxPoints * matchRatio * 10) / 10;
                teacherFeedback = `Đạt sơ bộ (${matchedKeywords.length}/${requiredKeywords.length} từ khóa bắt buộc). Giáo viên có thể chấm thẩm định thêm.`;
              } else {
                isCorrect = false;
                earnedScore = 0;
                teacherFeedback = `Chưa đủ từ khóa bắt buộc (${matchedKeywords.length}/${requiredKeywords.length} từ khóa). Vui lòng xem đáp án mẫu.`;
              }
            } else {
              if (uAns.trim().length >= 10) {
                isCorrect = true;
                earnedScore = maxPoints;
                teacherFeedback = 'Đã ghi nhận bài viết đầy đủ. Chờ giáo viên chấm thẩm định nếu cần.';
              } else {
                isCorrect = false;
                earnedScore = 0;
                teacherFeedback = 'Bài viết quá ngắn. Vui lòng xem câu văn mẫu.';
              }
            }
          } else {
            if (uAns.trim().length >= 10) {
              isCorrect = true;
              earnedScore = maxPoints;
              teacherFeedback = 'Đã ghi nhận bài viết.';
            } else {
              isCorrect = false;
              earnedScore = 0;
              teacherFeedback = 'Bài viết quá ngắn.';
            }
          }
        }

        if (isCorrect) {
          earnedScore = maxPoints;
          correctCount++;
        } else {
          earnedScore = 0;
          wrongCount++;
        }

        if (sec.section_type === 'LISTENING') {
          listeningScore += earnedScore;
        } else if (sec.section_type === 'READING') {
          readingScore += earnedScore;
        } else if (sec.section_type === 'WRITING') {
          writingScore += earnedScore;
        }

        totalScore += earnedScore;

        answerRecordsToCreate.push({
          question_id: q.id,
          user_answer: uAns || null,
          is_correct: isCorrect,
          earned_score: earnedScore,
          teacher_feedback: teacherFeedback,
        });

        detailedFeedbackList.push({
          question_id: q.id,
          question_number: q.question_number,
          section_id: sec.id,
          section_type: sec.section_type,
          question_type: q.question_type,
          prompt_text: q.prompt_text,
          user_answer: uAns || null,
          correct_answer: q.correct_answer,
          sample_answer: q.sample_answer,
          explanation: q.explanation,
          is_correct: isCorrect,
          earned_score: earnedScore,
          max_points: maxPoints,
          teacher_feedback: teacherFeedback,
        });
      }
    }

    const isPassed = totalScore >= exam.pass_score;

    // Lưu kết quả vào DB
    const attempt = await prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.examAttempt.create({
        data: {
          user_id: userId,
          exam_id: exam.id,
          listening_score: Math.round(listeningScore * 10) / 10,
          reading_score: Math.round(readingScore * 10) / 10,
          writing_score: Math.round(writingScore * 10) / 10,
          total_score: Math.round(totalScore * 10) / 10,
          correct_count: correctCount,
          wrong_count: wrongCount,
          is_passed: isPassed,
          submitted_at: new Date(),
        },
      });

      if (answerRecordsToCreate.length > 0) {
        await tx.examAttemptAnswer.createMany({
          data: answerRecordsToCreate.map((ans) => ({
            ...ans,
            attempt_id: createdAttempt.id,
          })),
        });
      }

      return createdAttempt;
    });

    return {
      attempt_id: attempt.id,
      exam_id: exam.id,
      exam_code: exam.code,
      exam_title: exam.title,
      hsk_level: exam.hsk_level,
      // Mở khóa file đáp án PDF gốc sau khi nộp bài
      answer_pdf_url: exam.answer_pdf_url,
      exam_pdf_url: exam.exam_pdf_url,
      audio_url: exam.audio_url,
      listening_score: attempt.listening_score,
      reading_score: attempt.reading_score,
      writing_score: attempt.writing_score,
      total_score: attempt.total_score,
      max_score: exam.total_score,
      pass_score: exam.pass_score,
      is_passed: attempt.is_passed,
      correct_count: attempt.correct_count,
      wrong_count: attempt.wrong_count,
      submitted_at: attempt.submitted_at,
      answers: detailedFeedbackList,
    };
  }

  /**
   * Lấy chi tiết kết quả bài làm của một lượt thi
   */
  async getAttemptDetails(attemptId: number, userId: number, isAdmin?: boolean) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { order_index: 'asc' },
              include: {
                questions: {
                  orderBy: { question_number: 'asc' },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw AppError.notFound('Không tìm thấy kết quả bài thi này.');
    }

    if (!isAdmin && attempt.user_id !== userId) {
      throw AppError.forbidden('Bạn không có quyền xem kết quả của học viên khác.');
    }

    const answersMap = new Map<number, any>();
    for (const a of attempt.answers) {
      answersMap.set(a.question_id, a);
    }

    const detailedQuestions: any[] = [];
    for (const sec of attempt.exam.sections) {
      for (const q of sec.questions) {
        const ans = answersMap.get(q.id);
        detailedQuestions.push({
          question_id: q.id,
          question_number: q.question_number,
          section_id: sec.id,
          section_type: sec.section_type,
          question_type: q.question_type,
          prompt_text: q.prompt_text,
          user_answer: ans ? ans.user_answer : null,
          correct_answer: q.correct_answer,
          sample_answer: q.sample_answer,
          explanation: q.explanation,
          is_correct: ans ? ans.is_correct : false,
          earned_score: ans ? ans.earned_score : 0,
          max_points: q.points,
          teacher_feedback: ans ? ans.teacher_feedback : null,
        });
      }
    }

    return {
      attempt_id: attempt.id,
      exam_id: attempt.exam.id,
      exam_code: attempt.exam.code,
      exam_title: attempt.exam.title,
      hsk_level: attempt.exam.hsk_level,
      exam_pdf_url: attempt.exam.exam_pdf_url,
      audio_url: attempt.exam.audio_url,
      // Mở khóa file đáp án PDF gốc
      answer_pdf_url: attempt.exam.answer_pdf_url,
      listening_score: attempt.listening_score,
      reading_score: attempt.reading_score,
      writing_score: attempt.writing_score,
      total_score: attempt.total_score,
      max_score: attempt.exam.total_score,
      pass_score: attempt.exam.pass_score,
      is_passed: attempt.is_passed,
      correct_count: attempt.correct_count,
      wrong_count: attempt.wrong_count,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      answers: detailedQuestions,
    };
  }

  /**
   * Lấy lịch sử các lần thi của học viên cho 1 đề
   */
  async getUserAttempts(examId: number, userId: number) {
    const attempts = await prisma.examAttempt.findMany({
      where: { exam_id: examId, user_id: userId },
      orderBy: { submitted_at: 'desc' },
      select: {
        id: true,
        listening_score: true,
        reading_score: true,
        writing_score: true,
        total_score: true,
        correct_count: true,
        wrong_count: true,
        is_passed: true,
        started_at: true,
        submitted_at: true,
      },
    });

    return attempts;
  }

  /**
   * Tự động khởi tạo đề mẫu HSK 1 (H11332) nếu database chưa có đề nào
   */
  async ensureSeedExam() {
    const count = await prisma.mockExam.count();
    if (count > 0) return;

    console.log('🌱 Seeding initial HSK 1 Mock Exam (H11332)...');

    // Mẫu 40 câu hỏi chuẩn cấu trúc đề thi HSK 1
    const listeningQuestions: any[] = [];
    // Phần 1 Nghe: Câu 1 - 5 (Đúng/Sai)
    for (let i = 1; i <= 5; i++) {
      listeningQuestions.push({
        question_number: i,
        question_type: 'TRUE_FALSE',
        prompt_text: `Câu ${i}`,
        options: ['✓', '✗'],
        correct_answer: i % 2 === 1 ? 'TRUE' : 'FALSE',
        points: 2.5,
        explanation: `Đáp án nghe câu ${i}`,
        order_index: i - 1,
      });
    }
    // Phần 2 Nghe: Câu 6 - 10 (Ghép tranh A - F)
    for (let i = 6; i <= 10; i++) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      listeningQuestions.push({
        question_number: i,
        question_type: 'MCQ_ABCDEF',
        prompt_text: `Câu ${i}`,
        options: letters,
        correct_answer: letters[(i - 6) % letters.length],
        points: 2.5,
        explanation: `Tranh nối cho câu ${i}`,
        order_index: i - 1,
      });
    }
    // Phần 3 Nghe: Câu 11 - 15 (Ghép tranh A - F)
    for (let i = 11; i <= 15; i++) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      listeningQuestions.push({
        question_number: i,
        question_type: 'MCQ_ABCDEF',
        prompt_text: `Câu ${i}`,
        options: letters,
        correct_answer: letters[(i - 11) % letters.length],
        points: 2.5,
        explanation: `Đối thoại câu ${i}`,
        order_index: i - 1,
      });
    }
    // Phần 4 Nghe: Câu 16 - 20 (Chọn A / B / C)
    for (let i = 16; i <= 20; i++) {
      const choices = ['A', 'B', 'C'];
      listeningQuestions.push({
        question_number: i,
        question_type: 'MCQ_ABCD',
        prompt_text: `Câu ${i}`,
        options: choices,
        correct_answer: choices[(i - 16) % choices.length],
        points: 2.5,
        explanation: `Đáp án câu hỏi đối thoại ${i}`,
        order_index: i - 1,
      });
    }

    const readingQuestions: any[] = [];
    // Phần 1 Đọc: Câu 21 - 25 (Đúng/Sai)
    for (let i = 21; i <= 25; i++) {
      readingQuestions.push({
        question_number: i,
        question_type: 'TRUE_FALSE',
        prompt_text: `Câu ${i}`,
        options: ['✓', '✗'],
        correct_answer: i % 2 === 0 ? 'TRUE' : 'FALSE',
        points: 2.5,
        explanation: `Đọc hiểu câu ${i}`,
        order_index: i - 21,
      });
    }
    // Phần 2 Đọc: Câu 26 - 30 (Ghép tranh A - F)
    for (let i = 26; i <= 30; i++) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      readingQuestions.push({
        question_number: i,
        question_type: 'MCQ_ABCDEF',
        prompt_text: `Câu ${i}`,
        options: letters,
        correct_answer: letters[(i - 26) % letters.length],
        points: 2.5,
        explanation: `Đọc hiểu câu ${i}`,
        order_index: i - 21,
      });
    }
    // Phần 3 Đọc: Câu 31 - 35 (Nối câu hỏi - câu trả lời A - F)
    for (let i = 31; i <= 35; i++) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      readingQuestions.push({
        question_number: i,
        question_type: 'MCQ_ABCDEF',
        prompt_text: `Câu ${i}`,
        options: letters,
        correct_answer: letters[(i - 31) % letters.length],
        points: 2.5,
        explanation: `Hỏi đáp câu ${i}`,
        order_index: i - 21,
      });
    }
    // Phần 4 Đọc: Câu 36 - 40 (Điền từ vào câu A - F)
    for (let i = 36; i <= 40; i++) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      readingQuestions.push({
        question_number: i,
        question_type: 'MCQ_ABCDEF',
        prompt_text: `Câu ${i}`,
        options: letters,
        correct_answer: letters[(i - 36) % letters.length],
        points: 2.5,
        explanation: `Điền từ câu ${i}`,
        order_index: i - 21,
      });
    }

    await this.createExam(
      {
        code: 'H11332',
        title: 'Đề thi thử HSK 1 - Mã H11332',
        description: 'Đề thi thử chuẩn HSK Cấp độ 1 gồm 2 phần: Nghe hiểu (20 câu) và Đọc hiểu (20 câu). Tổng điểm 100.',
        hsk_level: 'HSK1',
        exam_pdf_url: '/uploads/exams/H11332_exam.pdf',
        audio_url: '/uploads/exams/H11332_audio.mp3',
        answer_pdf_url: '/uploads/exams/H11332_answer.pdf',
        duration_minutes: 35,
        total_score: 100,
        pass_score: 60,
        status: 'PUBLISHED',
        sections: [
          {
            section_type: 'LISTENING',
            title: 'Phần 1: Nghe hiểu (听力)',
            instructions: 'Gồm 20 câu, thí sinh nghe và chọn câu trả lời đúng trên phiếu đáp án.',
            order_index: 0,
            questions: listeningQuestions,
          },
          {
            section_type: 'READING',
            title: 'Phần 2: Đọc hiểu (阅读)',
            instructions: 'Gồm 20 câu, thí sinh đọc đề và chọn đáp án tương ứng.',
            order_index: 1,
            questions: readingQuestions,
          },
        ],
      },
      1
    );

    console.log('✅ Seeded default HSK 1 Mock Exam successfully.');
  }
}

export const examService = new ExamService();
