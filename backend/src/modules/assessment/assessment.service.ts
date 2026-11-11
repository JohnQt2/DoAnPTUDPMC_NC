import { randomUUID } from 'crypto';
import { prisma } from '../../shared/database/prisma.client';
import { redisService } from '../../shared/redis/redis.service';
import { AppError } from '../../shared/errors/app-error';
import {
  CreateQuestionInput,
  UpdateQuestionInput,
  CreateTestInput,
  UpdateTestInput,
  SubmitTestInput,
} from './assessment.dto';

export class AssessmentService {
  // ─── Question Bank (UC12) ──────────────────────────────────────────

  async listQuestions(query: {
    question_type?: string;
    skill_category?: string;
    difficulty_level?: string;
    search?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (query.question_type) where.question_type = query.question_type;
    if (query.skill_category) where.skill_category = query.skill_category;
    if (query.difficulty_level) where.difficulty_level = query.difficulty_level;
    if (query.search) {
      where.content = { contains: query.search };
    }

    const limit = Math.min(100, Math.max(1, query.limit || 50));

    return prisma.questions.findMany({
      where,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { mediaResource: true },
    });
  }

  async createQuestion(data: CreateQuestionInput) {
    return prisma.questions.create({
      data: {
        question_type: data.question_type,
        skill_category: data.skill_category,
        difficulty_level: data.difficulty_level,
        content: data.content,
        options_json: data.options_json,
        correct_answer: data.correct_answer,
        explanation: data.explanation || null,
        media_resource_id: data.media_resource_id || null,
      },
    });
  }

  async updateQuestion(questionId: number, data: UpdateQuestionInput) {
    const question = await prisma.questions.findUnique({
      where: { question_id: questionId },
    });
    if (!question) throw AppError.notFound('Không tìm thấy câu hỏi.');

    return prisma.questions.update({
      where: { question_id: questionId },
      data: {
        question_type: data.question_type,
        skill_category: data.skill_category,
        difficulty_level: data.difficulty_level,
        content: data.content,
        options_json: data.options_json,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        media_resource_id: data.media_resource_id,
      },
    });
  }

  async deleteQuestion(questionId: number) {
    return prisma.questions.delete({
      where: { question_id: questionId },
    });
  }

  // ─── Tests (UC05 / UC07) ───────────────────────────────────────────

  async createTest(data: CreateTestInput) {
    return prisma.$transaction(async (tx) => {
      const test = await tx.tests.create({
        data: {
          lesson_id: data.lesson_id || null,
          title: data.title,
          test_type: data.test_type,
          passing_score: data.passing_score,
          time_limit_mins: data.time_limit_mins,
          is_published: data.is_published,
        },
      });

      if (data.question_ids && data.question_ids.length > 0) {
        const testQuestionsData = data.question_ids.map((qId, idx) => ({
          test_id: test.test_id,
          question_id: qId,
          order_index: idx + 1,
        }));

        await tx.testQuestions.createMany({
          data: testQuestionsData,
        });
      }

      return test;
    });
  }

  async getTestDetail(testId: number, includeAnswers: boolean = false) {
    const test = await prisma.tests.findUnique({
      where: { test_id: testId },
      include: {
        lesson: true,
        testQuestions: {
          orderBy: { order_index: 'asc' },
          include: {
            question: {
              include: { mediaResource: true },
            },
          },
        },
      },
    });

    if (!test) throw AppError.notFound('Không tìm thấy bài kiểm tra.');

    // If for student, redact correct_answer & explanation to avoid cheating
    const questions = test.testQuestions.map((tq) => {
      const q = tq.question;
      return {
        questionId: q.question_id,
        orderIndex: tq.order_index,
        questionType: q.question_type,
        skillCategory: q.skill_category,
        difficultyLevel: q.difficulty_level,
        content: q.content,
        options: JSON.parse(q.options_json || '[]'),
        mediaUrl: q.mediaResource?.public_url || null,
        correctAnswer: includeAnswers ? q.correct_answer : undefined,
        explanation: includeAnswers ? q.explanation : undefined,
      };
    });

    return {
      testId: test.test_id,
      title: test.title,
      testType: test.test_type,
      passingScore: test.passing_score,
      timeLimitMins: test.time_limit_mins,
      isPublished: test.is_published,
      lessonId: test.lesson_id,
      lessonTitle: test.lesson?.title,
      questionsCount: questions.length,
      questions,
    };
  }

  async updateTest(testId: number, data: UpdateTestInput) {
    return prisma.tests.update({
      where: { test_id: testId },
      data: {
        title: data.title,
        test_type: data.test_type,
        passing_score: data.passing_score,
        time_limit_mins: data.time_limit_mins,
        is_published: data.is_published,
        lesson_id: data.lesson_id,
      },
    });
  }

  async assignQuestions(testId: number, questionIds: number[]) {
    return prisma.$transaction(async (tx) => {
      await tx.testQuestions.deleteMany({
        where: { test_id: testId },
      });

      const records = questionIds.map((qId, idx) => ({
        test_id: testId,
        question_id: qId,
        order_index: idx + 1,
      }));

      await tx.testQuestions.createMany({
        data: records,
      });

      return { assignedCount: questionIds.length };
    });
  }

  // ─── Test Session & Snapshot Creation (UC05 / UC07) ───────────────

  /**
   * Tạo phiên làm bài với cơ chế Snapshot câu hỏi:
   * Chụp lại toàn bộ câu hỏi, phương án và trọng số tại thời điểm làm bài
   * để đảm bảo tính bất biến nếu ngân hàng câu hỏi bị sửa đổi sau này.
   */
  async startTestSession(userId: number, testId: number) {
    const test = await prisma.tests.findUnique({
      where: { test_id: testId },
      include: {
        testQuestions: {
          orderBy: { order_index: 'asc' },
          include: {
            question: {
              include: { mediaResource: true },
            },
          },
        },
      },
    });

    if (!test) throw AppError.notFound('Bài kiểm tra không tồn tại.');
    if (!test.is_published) {
      throw AppError.badRequest('Bài kiểm tra này chưa được xuất bản.');
    }

    if (test.testQuestions.length === 0) {
      throw AppError.badRequest('Bài kiểm tra hiện chưa có câu hỏi nào.');
    }

    // Kiểm tra điều kiện mở khóa bài học nếu bài kiểm tra thuộc về một bài học
    if (test.lesson_id) {
      const unlockStatus = await this.checkLessonUnlockStatus(userId, test.lesson_id);
      if (!unlockStatus.isUnlocked) {
        throw AppError.forbidden(
          unlockStatus.reason || 'Bài học này đang bị khóa. Bạn không thể làm bài kiểm tra khi chưa mở khóa bài học.',
          'LESSON_LOCKED',
          unlockStatus
        );
      }
    }

    // Generate snapshot
    const snapshotQuestions = test.testQuestions.map((tq) => ({
      question_id: tq.question.question_id,
      question_type: tq.question.question_type,
      skill_category: tq.question.skill_category,
      content: tq.question.content,
      options_json: tq.question.options_json,
      correct_answer: tq.question.correct_answer,
      explanation: tq.question.explanation,
      media_url: tq.question.mediaResource?.public_url || null,
    }));

    const sessionToken = `test_sess_${randomUUID()}`;
    const sessionData = {
      sessionToken,
      userId,
      testId,
      startedAt: Date.now(),
      timeLimitMins: test.time_limit_mins,
      snapshotQuestions,
    };

    // Store snapshot in Redis with TTL = time_limit_mins * 2 + 15 mins
    const ttlSeconds = Math.max(3600, test.time_limit_mins * 60 * 2);
    await redisService.set(
      `test_session:${sessionToken}`,
      JSON.stringify(sessionData),
      ttlSeconds
    );

    // Return to client WITHOUT correct_answer and explanation
    const clientQuestions = snapshotQuestions.map((q) => ({
      questionId: q.question_id,
      questionType: q.question_type,
      skillCategory: q.skill_category,
      content: q.content,
      options: JSON.parse(q.options_json || '[]'),
      mediaUrl: q.media_url,
    }));

    return {
      sessionToken,
      testId: test.test_id,
      title: test.title,
      timeLimitMins: test.time_limit_mins,
      passingScore: test.passing_score,
      questionsCount: clientQuestions.length,
      questions: clientQuestions,
    };
  }

  // ─── Submit & Grade with Idempotency & Prisma Transaction ───────────

  /**
   * Nộp bài kiểm tra, chấm điểm, áp dụng Idempotency-Key và xử lý trong Prisma Transaction.
   * Đồng thời kiểm tra điều kiện hoàn thành 80% để mở khóa bài học tiếp theo (UC06).
   */
  async submitTest(
    userId: number,
    testId: number,
    data: SubmitTestInput,
    idempotencyKey?: string
  ) {
    // 1. Idempotency Check: if this idempotency key was already recorded for this test submission
    if (idempotencyKey) {
      const existingSubmission = await prisma.testSubmissions.findFirst({
        where: { idempotency_key: idempotencyKey },
        include: { details: { include: { question: true } } },
      });

      if (existingSubmission) {
        return {
          isIdempotentReplay: true,
          submissionId: existingSubmission.submission_id,
          score: existingSubmission.score,
          isPassed: existingSubmission.is_passed,
          durationSeconds: existingSubmission.duration_seconds,
          submittedAt: existingSubmission.submitted_at,
          details: existingSubmission.details.map((d) => ({
            questionId: d.question_id,
            userAnswer: d.user_answer,
            correctAnswer: d.question.correct_answer,
            isCorrect: d.is_correct,
            explanation: d.question.explanation,
          })),
        };
      }
    }

    // 2. Fetch Question Snapshot if sessionToken exists, or retrieve from test
    let questionsForGrading: Array<{
      question_id: number;
      correct_answer: string;
      explanation: string | null;
    }> = [];

    let snapshotJsonString: string | null = null;

    if (data.session_token) {
      const sessionRaw = await redisService.get(`test_session:${data.session_token}`);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        questionsForGrading = session.snapshotQuestions;
        snapshotJsonString = JSON.stringify(session.snapshotQuestions);
        // Clear session once used
        await redisService.del(`test_session:${data.session_token}`);
      }
    }

    if (questionsForGrading.length === 0) {
      // Fallback: fetch directly from database test questions
      const test = await prisma.tests.findUnique({
        where: { test_id: testId },
        include: {
          testQuestions: {
            include: { question: true },
          },
        },
      });

      if (!test) throw AppError.notFound('Bài kiểm tra không tồn tại.');
      questionsForGrading = test.testQuestions.map((tq) => ({
        question_id: tq.question.question_id,
        correct_answer: tq.question.correct_answer,
        explanation: tq.question.explanation,
      }));
      snapshotJsonString = JSON.stringify(questionsForGrading);
    }

    const test = await prisma.tests.findUnique({
      where: { test_id: testId },
      include: { lesson: { include: { chapter: true } } },
    });

    if (!test) throw AppError.notFound('Bài kiểm tra không tồn tại.');

    // Kiểm tra điều kiện mở khóa bài học nếu bài kiểm tra thuộc về một bài học
    if (test.lesson_id) {
      const unlockStatus = await this.checkLessonUnlockStatus(userId, test.lesson_id);
      if (!unlockStatus.isUnlocked) {
        throw AppError.forbidden(
          unlockStatus.reason || 'Bài học này đang bị khóa. Bạn không thể nộp bài kiểm tra.',
          'LESSON_LOCKED',
          unlockStatus
        );
      }
    }

    // 3. Compute score & evaluate answers
    const userAnswersMap = new Map<number, string>();
    for (const ans of data.answers) {
      userAnswersMap.set(ans.question_id, (ans.user_answer || '').trim());
    }

    let correctCount = 0;
    const evaluatedDetails: Array<{
      question_id: number;
      user_answer: string;
      correct_answer: string;
      is_correct: boolean;
      explanation: string | null;
    }> = [];

    for (const q of questionsForGrading) {
      const userAns = userAnswersMap.get(q.question_id) || '';
      const isCorrect = userAns.toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
      if (isCorrect) correctCount++;

      evaluatedDetails.push({
        question_id: q.question_id,
        user_answer: userAns,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        explanation: q.explanation,
      });
    }

    const totalQuestions = questionsForGrading.length;
    const scorePercentage =
      totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0;
    // Quy tắc nghiệp vụ số 9: tối thiểu 80% để hoàn thành bài
    const isPassed = scorePercentage >= 80;

    // 4. ATOMIC PRISMA TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // Create TestSubmission
      const submission = await tx.testSubmissions.create({
        data: {
          user_id: userId,
          test_id: testId,
          score: scorePercentage,
          is_passed: isPassed,
          duration_seconds: data.duration_seconds,
          idempotency_key: idempotencyKey || null,
          snapshot_data: snapshotJsonString,
        },
      });

      // Bulk create TestSubmissionDetails
      const detailsData = evaluatedDetails.map((d) => ({
        submission_id: submission.submission_id,
        question_id: d.question_id,
        user_answer: d.user_answer,
        is_correct: d.is_correct,
      }));

      await tx.testSubmissionDetails.createMany({
        data: detailsData,
      });

      // Update UserLessonProgress if test belongs to a lesson
      let nextLessonUnlocked: boolean = false;
      let nextLessonId: number | null = null;

      if (test.lesson_id) {
        const lessonId = test.lesson_id;

        // Đọc bản ghi UserLessonProgress hiện tại bên trong transaction
        const existingProgress = await tx.userLessonProgress.findUnique({
          where: {
            user_id_lesson_id: {
              user_id: userId,
              lesson_id: lessonId,
            },
          },
        });

        const prevHighest = existingProgress?.highest_score ?? 0;
        const newHighestScore = Math.max(prevHighest, scorePercentage);

        // Trường hợp score < 80
        if (scorePercentage < 80) {
          if (!existingProgress?.is_completed) {
            await tx.userLessonProgress.upsert({
              where: {
                user_id_lesson_id: {
                  user_id: userId,
                  lesson_id: lessonId,
                },
              },
              create: {
                user_id: userId,
                lesson_id: lessonId,
                is_completed: false,
                status: 'IN_PROGRESS',
                highest_score: newHighestScore,
                last_studied_at: new Date(),
              },
              update: {
                is_completed: false,
                status: 'IN_PROGRESS',
                highest_score: newHighestScore,
                last_studied_at: new Date(),
              },
            });
            // Tuyệt đối KHÔNG mở khóa bài tiếp theo
          } else {
            // Đã từng hoàn thành trước đó: giữ nguyên is_completed: true, status: 'COMPLETED'
            await tx.userLessonProgress.update({
              where: { progress_id: existingProgress.progress_id },
              data: {
                highest_score: newHighestScore,
                last_studied_at: new Date(),
              },
            });
          }
        } else {
          // Trường hợp score >= 80 (isPassed === true)
          const completedAt = existingProgress?.completed_at ?? new Date();

          await tx.userLessonProgress.upsert({
            where: {
              user_id_lesson_id: {
                user_id: userId,
                lesson_id: lessonId,
              },
            },
            create: {
              user_id: userId,
              lesson_id: lessonId,
              is_completed: true,
              status: 'COMPLETED',
              highest_score: newHighestScore,
              completed_at: completedAt,
              last_studied_at: new Date(),
            },
            update: {
              is_completed: true,
              status: 'COMPLETED',
              highest_score: newHighestScore,
              completed_at: completedAt,
              last_studied_at: new Date(),
            },
          });

          // Tìm bài học PUBLISHED kế tiếp theo thứ tự (chapter.order_index, lesson.order_index) trong cùng khóa học
          const currentLesson = await tx.lessons.findUnique({
            where: { lesson_id: lessonId },
            include: { chapter: true },
          });

          if (currentLesson) {
            // 1. Tìm trong cùng chương: bài PUBLISHED có order_index > currentLesson.order_index
            let nextLesson = await tx.lessons.findFirst({
              where: {
                chapter_id: currentLesson.chapter_id,
                order_index: { gt: currentLesson.order_index },
                status: 'PUBLISHED',
              },
              orderBy: { order_index: 'asc' },
            });

            // 2. Nếu không có trong cùng chương, tìm bài đầu tiên của chương kế tiếp trong cùng khóa học
            if (!nextLesson) {
              const nextChapter = await tx.chapters.findFirst({
                where: {
                  course_id: currentLesson.chapter.course_id,
                  order_index: { gt: currentLesson.chapter.order_index },
                },
                orderBy: { order_index: 'asc' },
                include: {
                  lessons: {
                    where: { status: 'PUBLISHED' },
                    orderBy: { order_index: 'asc' },
                    take: 1,
                  },
                },
              });

              if (nextChapter && nextChapter.lessons.length > 0) {
                nextLesson = nextChapter.lessons[0];
              }
            }

            if (nextLesson) {
              nextLessonId = nextLesson.lesson_id;

              // Upsert bản ghi UserLessonProgress cho bài kế tiếp với status = 'UNLOCKED'
              const nextProgress = await tx.userLessonProgress.findUnique({
                where: {
                  user_id_lesson_id: {
                    user_id: userId,
                    lesson_id: nextLesson.lesson_id,
                  },
                },
              });

              if (!nextProgress) {
                await tx.userLessonProgress.create({
                  data: {
                    user_id: userId,
                    lesson_id: nextLesson.lesson_id,
                    status: 'UNLOCKED',
                    is_completed: false,
                    highest_score: 0,
                    last_studied_at: new Date(),
                  },
                });
                nextLessonUnlocked = true;
              } else if (nextProgress.status === 'LOCKED' || !nextProgress.status) {
                await tx.userLessonProgress.update({
                  where: { progress_id: nextProgress.progress_id },
                  data: { status: 'UNLOCKED' },
                });
                nextLessonUnlocked = true;
              } else {
                nextLessonUnlocked = true;
              }
            }
          }

          // Ghi 1 sự kiện vào bảng OutboxMessages ngay trong cùng transaction
          await tx.outboxMessages.create({
            data: {
              aggregate_type: 'LESSON_PROGRESS',
              aggregate_id: String(lessonId),
              event_type: 'LESSON_COMPLETED',
              payload: JSON.stringify({
                user_id: userId,
                lesson_id: lessonId,
                score: scorePercentage,
                unlocked_next_lesson_id: nextLessonId,
                completed_at: completedAt,
                timestamp: new Date().toISOString(),
              }),
              status: 'PENDING',
            },
          });
        }
      }

      // Record Audit Log
      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: 'SUBMIT_TEST',
          target_entity: 'TestSubmissions',
          target_id: submission.submission_id.toString(),
          new_value: JSON.stringify({ score: scorePercentage, isPassed, nextLessonId, nextLessonUnlocked }),
        },
      });

      return {
        submissionId: submission.submission_id,
        score: scorePercentage,
        isPassed,
        passingScore: 80,
        durationSeconds: data.duration_seconds,
        nextLessonUnlocked,
        nextLessonId,
        details: evaluatedDetails,
      };
    });

    return result;
  }

  // ─── Progress & 80% Condition Check (UC06) ──────────────────────────

  /**
   * Kiểm tra điều kiện mở khóa bài học:
   * Thỏa mãn ít nhất 1 trong 3 điều kiện:
   * 1. Là bài học đầu tiên của khóa học (Chapters.order_index nhỏ nhất và Lessons.order_index nhỏ nhất).
   * 2. Đã có bản ghi trong UserLessonProgress với status là 'UNLOCKED', 'IN_PROGRESS' hoặc 'COMPLETED' (hoặc is_completed === true).
   * 3. Bài học PUBLISHED đứng liền trước nó trong cùng khóa học đã có is_completed === true (hoặc có bài thi TestSubmissions đạt score >= 80 / is_passed === true).
   */
  async checkLessonUnlockStatus(userId: number, lessonId: number): Promise<{
    isUnlocked: boolean;
    reason?: string;
    requiredScore?: number;
    previousLesson?: { lessonId: number; title: string };
  }> {
    const targetLesson = await prisma.lessons.findUnique({
      where: { lesson_id: lessonId },
      include: {
        chapter: {
          include: { course: true },
        },
      },
    });

    if (!targetLesson) throw AppError.notFound('Bài học không tồn tại.');

    const courseId = targetLesson.chapter.course_id;

    // ─── ĐIỀU KIỆN 1: Là bài học đầu tiên của khóa học ────────────────
    const firstChapter = await prisma.chapters.findFirst({
      where: { course_id: courseId },
      orderBy: { order_index: 'asc' },
      include: {
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { order_index: 'asc' },
          take: 1,
        },
      },
    });

    if (
      firstChapter &&
      firstChapter.lessons.length > 0 &&
      firstChapter.lessons[0].lesson_id === lessonId
    ) {
      return { isUnlocked: true };
    }

    // ─── ĐIỀU KIỆN 2: Đã có bản ghi trong UserLessonProgress ──────────
    const currentProgress = await prisma.userLessonProgress.findUnique({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId,
        },
      },
    });

    if (currentProgress) {
      const validStatuses = ['UNLOCKED', 'IN_PROGRESS', 'COMPLETED'];
      if (
        currentProgress.is_completed ||
        (currentProgress.status && validStatuses.includes(currentProgress.status.toUpperCase()))
      ) {
        return { isUnlocked: true };
      }
    }

    // ─── ĐIỀU KIỆN 3: Bài học PUBLISHED đứng liền trước nó trong cùng khóa học ───
    // 3a. Tìm trong cùng chapter: bài PUBLISHED có order_index < targetLesson.order_index (lấy bài có order_index lớn nhất trong số đó)
    let prevLesson = await prisma.lessons.findFirst({
      where: {
        chapter_id: targetLesson.chapter_id,
        order_index: { lt: targetLesson.order_index },
        status: 'PUBLISHED',
      },
      orderBy: { order_index: 'desc' },
    });

    // 3b. Nếu không có trong cùng chapter (targetLesson là bài đầu của chapter):
    // Tìm chapter đứng trước trong cùng khóa học có chứa bài học PUBLISHED
    if (!prevLesson) {
      const prevChapter = await prisma.chapters.findFirst({
        where: {
          course_id: courseId,
          order_index: { lt: targetLesson.chapter.order_index },
        },
        orderBy: { order_index: 'desc' },
        include: {
          lessons: {
            where: { status: 'PUBLISHED' },
            orderBy: { order_index: 'desc' },
            take: 1,
          },
        },
      });

      if (prevChapter && prevChapter.lessons.length > 0) {
        prevLesson = prevChapter.lessons[0];
      }
    }

    // Nếu không tìm thấy bài nào đứng trước (nghĩa là targetLesson chính là bài đầu tiên của khóa)
    if (!prevLesson) {
      return { isUnlocked: true };
    }

    // Kiểm tra tiến độ của bài học đứng trước
    const prevProgress = await prisma.userLessonProgress.findUnique({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: prevLesson.lesson_id,
        },
      },
    });

    if (prevProgress && prevProgress.is_completed) {
      return { isUnlocked: true };
    }

    // Hoặc kiểm tra xem có bài thi TestSubmissions của bài học trước đạt score >= 80 hoặc is_passed === true chưa
    const passingSubmission = await prisma.testSubmissions.findFirst({
      where: {
        user_id: userId,
        test: {
          lesson_id: prevLesson.lesson_id,
        },
        OR: [{ score: { gte: 80 } }, { is_passed: true }],
      },
    });

    if (passingSubmission) {
      return { isUnlocked: true };
    }

    // Cả 3 điều kiện đều không thỏa mãn -> Bài bị khóa
    return {
      isUnlocked: false,
      reason: `Bạn cần hoàn thành bài học "${prevLesson.title}" (đạt ≥ 80%) để mở khóa bài học này.`,
      requiredScore: 80,
      previousLesson: {
        lessonId: prevLesson.lesson_id,
        title: prevLesson.title,
      },
    };
  }

  async getUserSubmissions(userId: number, testId?: number) {
    const where: any = { user_id: userId };
    if (testId) where.test_id = testId;

    return prisma.testSubmissions.findMany({
      where,
      orderBy: { submitted_at: 'desc' },
      include: {
        test: {
          select: {
            test_id: true,
            title: true,
            passing_score: true,
            lesson_id: true,
          },
        },
      },
    });
  }

  async getSubmissionDetail(userId: number, submissionId: number) {
    const submission = await prisma.testSubmissions.findFirst({
      where: { submission_id: submissionId, user_id: userId },
      include: {
        test: true,
        details: {
          include: {
            question: {
              include: { mediaResource: true },
            },
          },
        },
      },
    });

    if (!submission) throw AppError.notFound('Không tìm thấy kết quả bài kiểm tra này.');

    return {
      submissionId: submission.submission_id,
      testTitle: submission.test.title,
      score: submission.score,
      isPassed: submission.is_passed,
      passingScore: submission.test.passing_score,
      durationSeconds: submission.duration_seconds,
      submittedAt: submission.submitted_at,
      details: submission.details.map((d) => ({
        questionId: d.question_id,
        content: d.question.content,
        options: JSON.parse(d.question.options_json || '[]'),
        userAnswer: d.user_answer,
        correctAnswer: d.question.correct_answer,
        isCorrect: d.is_correct,
        explanation: d.question.explanation,
        mediaUrl: d.question.mediaResource?.public_url || null,
      })),
    };
  }
}

export const assessmentService = new AssessmentService();
