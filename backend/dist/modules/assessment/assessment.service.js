"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentService = exports.AssessmentService = void 0;
const crypto_1 = require("crypto");
const prisma_client_1 = require("../../shared/database/prisma.client");
const redis_service_1 = require("../../shared/redis/redis.service");
const app_error_1 = require("../../shared/errors/app-error");
class AssessmentService {
    // ─── Question Bank (UC12) ──────────────────────────────────────────
    async listQuestions(query) {
        const where = {};
        if (query.question_type)
            where.question_type = query.question_type;
        if (query.skill_category)
            where.skill_category = query.skill_category;
        if (query.difficulty_level)
            where.difficulty_level = query.difficulty_level;
        if (query.search) {
            where.content = { contains: query.search };
        }
        const limit = Math.min(100, Math.max(1, query.limit || 50));
        return prisma_client_1.prisma.questions.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: { mediaResource: true },
        });
    }
    async createQuestion(data) {
        return prisma_client_1.prisma.questions.create({
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
    async updateQuestion(questionId, data) {
        const question = await prisma_client_1.prisma.questions.findUnique({
            where: { question_id: questionId },
        });
        if (!question)
            throw app_error_1.AppError.notFound('Không tìm thấy câu hỏi.');
        return prisma_client_1.prisma.questions.update({
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
    async deleteQuestion(questionId) {
        return prisma_client_1.prisma.questions.delete({
            where: { question_id: questionId },
        });
    }
    // ─── Tests (UC05 / UC07) ───────────────────────────────────────────
    async createTest(data) {
        return prisma_client_1.prisma.$transaction(async (tx) => {
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
    async getTestDetail(testId, includeAnswers = false) {
        const test = await prisma_client_1.prisma.tests.findUnique({
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
        if (!test)
            throw app_error_1.AppError.notFound('Không tìm thấy bài kiểm tra.');
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
    async updateTest(testId, data) {
        return prisma_client_1.prisma.tests.update({
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
    async assignQuestions(testId, questionIds) {
        return prisma_client_1.prisma.$transaction(async (tx) => {
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
    async startTestSession(userId, testId) {
        const test = await prisma_client_1.prisma.tests.findUnique({
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
        if (!test)
            throw app_error_1.AppError.notFound('Bài kiểm tra không tồn tại.');
        if (!test.is_published) {
            throw app_error_1.AppError.badRequest('Bài kiểm tra này chưa được xuất bản.');
        }
        if (test.testQuestions.length === 0) {
            throw app_error_1.AppError.badRequest('Bài kiểm tra hiện chưa có câu hỏi nào.');
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
        const sessionToken = `test_sess_${(0, crypto_1.randomUUID)()}`;
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
        await redis_service_1.redisService.set(`test_session:${sessionToken}`, JSON.stringify(sessionData), ttlSeconds);
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
    async submitTest(userId, testId, data, idempotencyKey) {
        // 1. Idempotency Check: if this idempotency key was already recorded for this test submission
        if (idempotencyKey) {
            const existingSubmission = await prisma_client_1.prisma.testSubmissions.findFirst({
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
        let questionsForGrading = [];
        let snapshotJsonString = null;
        if (data.session_token) {
            const sessionRaw = await redis_service_1.redisService.get(`test_session:${data.session_token}`);
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                questionsForGrading = session.snapshotQuestions;
                snapshotJsonString = JSON.stringify(session.snapshotQuestions);
                // Clear session once used
                await redis_service_1.redisService.del(`test_session:${data.session_token}`);
            }
        }
        if (questionsForGrading.length === 0) {
            // Fallback: fetch directly from database test questions
            const test = await prisma_client_1.prisma.tests.findUnique({
                where: { test_id: testId },
                include: {
                    testQuestions: {
                        include: { question: true },
                    },
                },
            });
            if (!test)
                throw app_error_1.AppError.notFound('Bài kiểm tra không tồn tại.');
            questionsForGrading = test.testQuestions.map((tq) => ({
                question_id: tq.question.question_id,
                correct_answer: tq.question.correct_answer,
                explanation: tq.question.explanation,
            }));
            snapshotJsonString = JSON.stringify(questionsForGrading);
        }
        const test = await prisma_client_1.prisma.tests.findUnique({
            where: { test_id: testId },
            include: { lesson: true },
        });
        if (!test)
            throw app_error_1.AppError.notFound('Bài kiểm tra không tồn tại.');
        // 3. Compute score & evaluate answers
        const userAnswersMap = new Map();
        for (const ans of data.answers) {
            userAnswersMap.set(ans.question_id, (ans.user_answer || '').trim());
        }
        let correctCount = 0;
        const evaluatedDetails = [];
        for (const q of questionsForGrading) {
            const userAns = userAnswersMap.get(q.question_id) || '';
            const isCorrect = userAns.toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
            if (isCorrect)
                correctCount++;
            evaluatedDetails.push({
                question_id: q.question_id,
                user_answer: userAns,
                correct_answer: q.correct_answer,
                is_correct: isCorrect,
                explanation: q.explanation,
            });
        }
        const totalQuestions = questionsForGrading.length;
        const scorePercentage = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0;
        const isPassed = scorePercentage >= test.passing_score;
        // 4. ATOMIC PRISMA TRANSACTION
        const result = await prisma_client_1.prisma.$transaction(async (tx) => {
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
            let nextLessonUnlocked = false;
            let nextLessonId = null;
            if (test.lesson_id) {
                // Upsert lesson progress
                await tx.userLessonProgress.upsert({
                    where: {
                        user_id_lesson_id: {
                            user_id: userId,
                            lesson_id: test.lesson_id,
                        },
                    },
                    create: {
                        user_id: userId,
                        lesson_id: test.lesson_id,
                        is_completed: isPassed,
                        last_studied_at: new Date(),
                    },
                    update: {
                        is_completed: isPassed ? true : undefined,
                        last_studied_at: new Date(),
                    },
                });
                // Check if 80% condition met to unlock the next lesson
                if (scorePercentage >= 80) {
                    const currentLesson = await tx.lessons.findUnique({
                        where: { lesson_id: test.lesson_id },
                    });
                    if (currentLesson) {
                        // Find next lesson in the same chapter or next chapter
                        const nextLesson = await tx.lessons.findFirst({
                            where: {
                                chapter_id: currentLesson.chapter_id,
                                order_index: { gt: currentLesson.order_index },
                                status: 'PUBLISHED',
                            },
                            orderBy: { order_index: 'asc' },
                        });
                        if (nextLesson) {
                            nextLessonUnlocked = true;
                            nextLessonId = nextLesson.lesson_id;
                        }
                    }
                }
            }
            // Record Audit Log
            await tx.auditLogs.create({
                data: {
                    user_id: userId,
                    action_type: 'SUBMIT_TEST',
                    target_entity: 'TestSubmissions',
                    target_id: submission.submission_id.toString(),
                    new_value: JSON.stringify({ score: scorePercentage, isPassed }),
                },
            });
            return {
                submissionId: submission.submission_id,
                score: scorePercentage,
                isPassed,
                passingScore: test.passing_score,
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
     * Bài học đầu tiên luôn mở. Các bài học sau chỉ mở khi bài học trước đạt >= 80% điểm hoặc đã hoàn thành.
     */
    async checkLessonUnlockStatus(userId, lessonId) {
        const targetLesson = await prisma_client_1.prisma.lessons.findUnique({
            where: { lesson_id: lessonId },
            include: { chapter: true },
        });
        if (!targetLesson)
            throw app_error_1.AppError.notFound('Bài học không tồn tại.');
        // Find preceding lesson in chapter
        const prevLesson = await prisma_client_1.prisma.lessons.findFirst({
            where: {
                chapter_id: targetLesson.chapter_id,
                order_index: { lt: targetLesson.order_index },
            },
            orderBy: { order_index: 'desc' },
        });
        // If first lesson in chapter, check if it's the first chapter
        if (!prevLesson) {
            const prevChapter = await prisma_client_1.prisma.chapters.findFirst({
                where: {
                    course_id: targetLesson.chapter.course_id,
                    order_index: { lt: targetLesson.chapter.order_index },
                },
                orderBy: { order_index: 'desc' },
                include: {
                    lessons: {
                        orderBy: { order_index: 'desc' },
                        take: 1,
                    },
                },
            });
            if (!prevChapter || prevChapter.lessons.length === 0) {
                // First lesson of first chapter is unlocked by default!
                return { isUnlocked: true };
            }
            const lastLessonOfPrevChapter = prevChapter.lessons[0];
            const progress = await prisma_client_1.prisma.userLessonProgress.findUnique({
                where: {
                    user_id_lesson_id: {
                        user_id: userId,
                        lesson_id: lastLessonOfPrevChapter.lesson_id,
                    },
                },
            });
            if (!progress || !progress.is_completed) {
                return {
                    isUnlocked: false,
                    reason: `Bạn cần hoàn thành bài học "${lastLessonOfPrevChapter.title}" (đạt ≥ 80%) ở chương trước để mở khóa bài học này.`,
                    requiredScore: 80,
                    previousLesson: {
                        lessonId: lastLessonOfPrevChapter.lesson_id,
                        title: lastLessonOfPrevChapter.title,
                    },
                };
            }
            return { isUnlocked: true };
        }
        // Check progress of previous lesson in same chapter
        const progress = await prisma_client_1.prisma.userLessonProgress.findUnique({
            where: {
                user_id_lesson_id: {
                    user_id: userId,
                    lesson_id: prevLesson.lesson_id,
                },
            },
        });
        if (!progress || !progress.is_completed) {
            return {
                isUnlocked: false,
                reason: `Bạn cần hoàn thành bài học "${prevLesson.title}" (đạt ≥ 80%) để mở khóa bài học tiếp theo.`,
                requiredScore: 80,
                previousLesson: {
                    lessonId: prevLesson.lesson_id,
                    title: prevLesson.title,
                },
            };
        }
        return { isUnlocked: true };
    }
    async getUserSubmissions(userId, testId) {
        const where = { user_id: userId };
        if (testId)
            where.test_id = testId;
        return prisma_client_1.prisma.testSubmissions.findMany({
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
    async getSubmissionDetail(userId, submissionId) {
        const submission = await prisma_client_1.prisma.testSubmissions.findFirst({
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
        if (!submission)
            throw app_error_1.AppError.notFound('Không tìm thấy kết quả bài kiểm tra này.');
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
exports.AssessmentService = AssessmentService;
exports.assessmentService = new AssessmentService();
