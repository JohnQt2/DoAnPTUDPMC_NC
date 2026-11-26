import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';

export class PracticeService {
  private isCurrentPublishedVersion(version: {
    id: number;
    status: string;
    collection: { status: string; currentVersionId: number | null };
  }) {
    return (
      version.status === 'PUBLISHED' &&
      version.collection.status === 'PUBLISHED' &&
      version.collection.currentVersionId === version.id
    );
  }

  /**
   * Helper: check correctness of an answer based on question type and correct answer definition
   */
  private evaluateAnswer(type: string, userAnswer: any, correctAnswerDef: any): boolean {
    if (userAnswer === undefined || userAnswer === null) return false;

    switch (type) {
      case 'TRUE_FALSE': {
        const u = Boolean(userAnswer);
        let c = false;
        if (typeof correctAnswerDef === 'boolean') {
          c = correctAnswerDef;
        } else if (correctAnswerDef && typeof correctAnswerDef === 'object' && correctAnswerDef.value !== undefined) {
          c = Boolean(correctAnswerDef.value);
        } else {
          c = correctAnswerDef === 'true' || correctAnswerDef === '√' || correctAnswerDef === 1;
        }
        return u === c;
      }

      case 'SINGLE_CHOICE':
      case 'IMAGE_CHOICE':
      case 'LISTEN_AND_CHOOSE':
      case 'TONE_SELECTION': {
        const u = String(userAnswer).trim().toUpperCase();
        const target = typeof correctAnswerDef === 'object' && correctAnswerDef !== null
          ? (correctAnswerDef.value || correctAnswerDef.correctOption || '')
          : String(correctAnswerDef || '');
        return u === target.trim().toUpperCase();
      }

      case 'MULTIPLE_CHOICE': {
        let uArr: string[] = [];
        if (Array.isArray(userAnswer)) {
          uArr = userAnswer.map((x) => String(x).trim().toUpperCase()).sort();
        } else if (typeof userAnswer === 'string') {
          uArr = userAnswer.split(',').map((x) => x.trim().toUpperCase()).sort();
        }

        let cArr: string[] = [];
        const rawC = typeof correctAnswerDef === 'object' && correctAnswerDef !== null
          ? (correctAnswerDef.value || correctAnswerDef.correctOptions || [])
          : correctAnswerDef;

        if (Array.isArray(rawC)) {
          cArr = rawC.map((x) => String(x).trim().toUpperCase()).sort();
        } else if (typeof rawC === 'string') {
          cArr = rawC.split(',').map((x) => x.trim().toUpperCase()).sort();
        }

        if (uArr.length !== cArr.length) return false;
        return uArr.every((val, idx) => val === cArr[idx]);
      }

      case 'FILL_BLANK': {
        const u = String(userAnswer).trim().toLowerCase();
        let accepted: string[] = [];
        if (typeof correctAnswerDef === 'object' && correctAnswerDef !== null) {
          if (Array.isArray(correctAnswerDef.acceptable)) {
            accepted = correctAnswerDef.acceptable.map((x: any) => String(x).trim().toLowerCase());
          } else if (correctAnswerDef.value) {
            accepted = [String(correctAnswerDef.value).trim().toLowerCase()];
          }
        } else if (typeof correctAnswerDef === 'string') {
          accepted = [correctAnswerDef.trim().toLowerCase()];
        }
        return accepted.includes(u);
      }

      case 'MATCHING': {
        if (typeof userAnswer !== 'object' || userAnswer === null) return false;
        const correctPairs = typeof correctAnswerDef === 'object' && correctAnswerDef !== null
          ? (correctAnswerDef.pairs || correctAnswerDef)
          : {};

        const keys = Object.keys(correctPairs);
        if (keys.length === 0) return false;
        for (const k of keys) {
          if (String(userAnswer[k]).trim().toUpperCase() !== String(correctPairs[k]).trim().toUpperCase()) {
            return false;
          }
        }
        return true;
      }

      case 'CHARACTER_WRITING': {
        // Self-practice/guided writing: if user completed or wrote strokes, count as valid
        if (!userAnswer || typeof userAnswer !== 'object') return false;
        return userAnswer.completed === true;
      }

      case 'TEXT_INPUT': {
        if (typeof userAnswer !== 'string' && typeof userAnswer !== 'number') return false;
        // Chuỗi rỗng luôn sai
        const rawUser = String(userAnswer).normalize('NFC').trim();
        if (!rawUser) return false;

        // Normalization: NFC, lowercase, collapse multiple whitespace into single space
        const cleanUser = rawUser.toLowerCase().replace(/\s+/g, ' ');

        // Chuẩn bị danh sách đáp án đúng được chấp nhận
        const validTargets: string[] = [];
        if (typeof correctAnswerDef === 'object' && correctAnswerDef !== null) {
          if (correctAnswerDef.value !== undefined && correctAnswerDef.value !== null) {
            validTargets.push(String(correctAnswerDef.value));
          }
          if (Array.isArray(correctAnswerDef.acceptedValues)) {
            for (const v of correctAnswerDef.acceptedValues) {
              if (v !== undefined && v !== null) validTargets.push(String(v));
            }
          }
        } else if (typeof correctAnswerDef === 'string' || typeof correctAnswerDef === 'number') {
          validTargets.push(String(correctAnswerDef));
        }

        return validTargets.some((target) => {
          const cleanTarget = String(target)
            .normalize('NFC')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
          return cleanUser === cleanTarget;
        });
      }

      default:
        return String(userAnswer).trim().toLowerCase() === String(correctAnswerDef).trim().toLowerCase();
    }
  }

  // 1. Levels
  async getLevels() {
    return prisma.practiceLevel.findMany({
      where: { isPublished: true, status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        sortOrder: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getLevelByCode(code: string) {
    const level = await prisma.practiceLevel.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            lessonNumber: true,
            titleZh: true,
            titlePinyin: true,
            titleVi: true,
            sortOrder: true,
            status: true,
          },
        },
      },
    });
    if (!level || !level.isPublished || level.status !== 'PUBLISHED') {
      throw AppError.notFound(`Cấp độ ${code} không tồn tại.`);
    }
    return level;
  }

  // 2. Lessons & Exercise Sets
  async getLessonsByLevel(levelCode: string) {
    const level = await prisma.practiceLevel.findUnique({
      where: { code: levelCode.toUpperCase() },
    });
    if (!level || !level.isPublished || level.status !== 'PUBLISHED') {
      throw AppError.notFound(`Cấp độ ${levelCode} không tồn tại.`);
    }

    const lessons = await prisma.practiceLesson.findMany({
      where: { levelId: level.id, isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        exerciseSets: {
          where: { isPublished: true },
          select: {
            id: true,
            versionId: true,
            code: true,
            skill: true,
            titleZh: true,
            titleVi: true,
            estimatedMinutes: true,
            sortOrder: true,
            version: {
              select: {
                id: true,
                status: true,
                collection: {
                  select: { status: true, currentVersionId: true },
                },
              },
            },
            _count: {
              select: { questions: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return lessons.map((lesson) => ({
      ...lesson,
      exerciseSets: lesson.exerciseSets.flatMap(({ version, versionId, ...set }) => {
        if (versionId === null) return [set];
        if (!version || !this.isCurrentPublishedVersion(version)) return [];
        return [set];
      }),
    }));
  }

  async getLessonDetail(lessonId: number) {
    const lesson = await prisma.practiceLesson.findUnique({
      where: { id: lessonId },
      include: {
        level: true,
        exerciseSets: {
          where: { isPublished: true, status: 'PUBLISHED' },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { questions: true },
            },
            version: {
              include: {
                collection: {
                  select: { status: true, currentVersionId: true },
                },
              },
            },
          },
        },
      },
    });
    if (!lesson) throw AppError.notFound('Bài học không tồn tại.');

    return {
      ...lesson,
      exerciseSets: lesson.exerciseSets.flatMap(({ version, ...set }) => {
        if (set.versionId === null) return [set];
        if (!version || !this.isCurrentPublishedVersion(version)) return [];
        return [set];
      }),
    };
  }

  async getExerciseSetsByLesson(lessonId: number) {
    const sets = await prisma.practiceExerciseSet.findMany({
      where: { lessonId, isPublished: true, status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { questions: true } },
        version: {
          include: {
            collection: {
              select: { status: true, currentVersionId: true },
            },
          },
        },
      },
    });

    return sets.flatMap(({ version, ...set }) => {
      if (set.versionId === null) return [set];
      if (!version || !this.isCurrentPublishedVersion(version)) return [];
      return [set];
    });
  }

  /**
   * Get exercise set for student - CRITICAL: Strip correct answer & explanation!
   */
  async getExerciseSetForPractice(exerciseSetId: number) {
    const set = await prisma.practiceExerciseSet.findUnique({
      where: { id: exerciseSetId, isPublished: true, status: 'PUBLISHED' },
      include: {
        lesson: {
          include: { level: true },
        },
        version: {
          include: {
            collection: {
              select: { status: true, currentVersionId: true },
            },
          },
        },
        questions: {
          where: { status: 'PUBLISHED' },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            code: true,
            type: true,
            prompt: true,
            score: true,
            sortOrder: true,
            sourceAudio: true,
            // SECURITY: answer and explanation are NOT selected!
          },
        },
      },
    });

    if (!set) throw AppError.notFound('Bộ bài tập không tồn tại.');
    const { version, ...studentSet } = set;
    if (
      !set.isPublished ||
      set.status !== 'PUBLISHED' ||
      (version && !this.isCurrentPublishedVersion(version))
    ) {
      throw AppError.notFound('Bộ bài tập không tồn tại.');
    }

    const parsedQuestions = set.questions.map((q) => {
      let promptParsed = {};
      try {
        promptParsed = JSON.parse(q.prompt);
      } catch {
        promptParsed = { text: q.prompt };
      }
      return {
        ...q,
        prompt: promptParsed,
      };
    });

    return {
      ...studentSet,
      collectionId: version?.collectionId || null,
      versionId: set.versionId || null,
      questions: parsedQuestions,
    };
  }

  // 3. Practice Attempts
  async startOrCreateAttempt(userId: number, exerciseSetId: number) {
    const exerciseSet = await prisma.practiceExerciseSet.findUnique({
      where: { id: exerciseSetId, isPublished: true, status: 'PUBLISHED' },
      include: {
        questions: { where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } },
        version: {
          include: {
            collection: true,
          },
        },
      },
    });
    if (!exerciseSet) throw AppError.notFound('Bộ bài tập không tồn tại.');

    if (!exerciseSet.isPublished || exerciseSet.status !== 'PUBLISHED') {
      throw AppError.notFound('Bộ bài tập không tồn tại.');
    }

    if (exerciseSet.version) {
      if (!this.isCurrentPublishedVersion(exerciseSet.version)) {
        throw AppError.conflict(
          `Phiên bản này đang ở trạng thái "${exerciseSet.version.status}". Không thể tạo lượt làm bài mới trên phiên bản chưa được xuất bản hoặc đã thu hồi.`,
          'VERSION_NOT_PUBLISHED'
        );
      }
    }

    const targetVersionId = exerciseSet.versionId || null;

    // Look for in-progress attempt to resume (same user, exerciseSet, and version)
    const existing = await prisma.practiceAttempt.findFirst({
      where: {
        userId,
        exerciseSetId,
        status: 'IN_PROGRESS',
        ...(targetVersionId ? { versionId: targetVersionId } : {}),
      },
      include: {
        answers: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (existing) {
      const answersMap: Record<number, any> = {};
      existing.answers.forEach((ans) => {
        try {
          answersMap[ans.questionId] = JSON.parse(ans.answer);
        } catch {
          answersMap[ans.questionId] = ans.answer;
        }
      });
      return {
        attemptId: existing.id,
        exerciseSetId: existing.exerciseSetId,
        versionId: existing.versionId,
        status: existing.status,
        startedAt: existing.startedAt,
        answers: answersMap,
        totalQuestions: exerciseSet.questions.length,
      };
    }

    // Build snapshot payload at attempt creation
    const snapshotPayload = {
      collection: exerciseSet.version?.collection
        ? {
            id: exerciseSet.version.collection.id,
            code: exerciseSet.version.collection.code,
            titleZh: exerciseSet.version.collection.titleZh,
            titleVi: exerciseSet.version.collection.titleVi,
          }
        : null,
      version: exerciseSet.version
        ? {
            id: exerciseSet.version.id,
            versionNumber: exerciseSet.version.versionNumber,
            status: exerciseSet.version.status,
          }
        : null,
      exerciseSet: {
        id: exerciseSet.id,
        code: exerciseSet.code,
        skill: exerciseSet.skill,
        titleZh: exerciseSet.titleZh,
        titleVi: exerciseSet.titleVi,
      },
      questions: exerciseSet.questions.map((q) => ({
        id: q.id,
        code: q.code,
        type: q.type,
        score: q.score,
        sortOrder: q.sortOrder,
        prompt: q.prompt,
        answer: q.answer,
        explanation: q.explanation,
      })),
    };

    // Create new attempt
    const newAttempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        exerciseSetId,
        versionId: targetVersionId,
        snapshotData: JSON.stringify(snapshotPayload),
        status: 'IN_PROGRESS',
        totalQuestions: exerciseSet.questions.length,
        totalScore: exerciseSet.questions.reduce((sum, q) => sum + q.score, 0),
      },
    });

    return {
      attemptId: newAttempt.id,
      exerciseSetId: newAttempt.exerciseSetId,
      versionId: newAttempt.versionId,
      status: newAttempt.status,
      startedAt: newAttempt.startedAt,
      answers: {},
      totalQuestions: exerciseSet.questions.length,
    };
  }

  async getAttemptDetail(userId: number, attemptId: number) {
    const attempt = await prisma.practiceAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        exerciseSet: {
          include: {
            lesson: { include: { level: true } },
          },
        },
      },
    });

    if (!attempt) throw AppError.notFound('Lượt làm bài không tồn tại.');
    if (attempt.userId !== userId) throw AppError.forbidden('Bạn không có quyền truy cập bài làm này.');

    const { answers: attemptAnswers, snapshotData, ...safeAttempt } = attempt;
    const answersMap: Record<number, any> = {};
    attemptAnswers.forEach((a) => {
      try {
        answersMap[a.questionId] = JSON.parse(a.answer);
      } catch {
        answersMap[a.questionId] = a.answer;
      }
    });

    const snapshot = snapshotData
      ? JSON.parse(snapshotData) as {
          questions?: Array<{
            id: number;
            sortOrder: number;
            type: string;
            score: number;
          }>;
        }
      : null;
    const answeredQuestionIds = new Set(attemptAnswers.map((answer) => answer.questionId));
    const questions = snapshot?.questions?.map((question) => ({
      questionId: question.id,
      sortOrder: question.sortOrder,
      type: question.type,
      score: question.score,
      userAnswer: answersMap[question.id] ?? null,
      progress: answeredQuestionIds.has(question.id) ? 'ANSWERED' : 'NOT_ANSWERED',
    })) ?? [];

    return {
      ...safeAttempt,
      questions,
      answersMap,
    };
  }

  async saveQuestionAnswer(userId: number, attemptId: number, questionId: number, answerPayload: any) {
    const attempt = await prisma.practiceAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw AppError.notFound('Lượt làm bài không tồn tại.');
    if (attempt.userId !== userId) throw AppError.forbidden('Bạn không có quyền lưu bài làm này.');
    if (attempt.status !== 'IN_PROGRESS') {
      throw AppError.conflict('Lượt làm bài này đã được nộp hoặc hoàn thành.');
    }

    const question = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question || question.exerciseSetId !== attempt.exerciseSetId) {
      throw AppError.badRequest('Câu hỏi không thuộc bộ bài tập này.');
    }

    const answerStr = typeof answerPayload === 'string' ? answerPayload : JSON.stringify(answerPayload);

    await prisma.practiceAttemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        answer: answerStr,
        isCorrect: false,
        earnedScore: 0,
      },
      update: {
        answer: answerStr,
        answeredAt: new Date(),
      },
    });

    return { success: true, attemptId, questionId };
  }

  /**
   * Submit attempt with backend evaluation & transaction
   */
  async submitAttempt(userId: number, attemptId: number, bulkAnswers?: Record<string, any>) {
    const attempt = await prisma.practiceAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exerciseSet: {
          include: {
            questions: { where: { status: 'PUBLISHED' } },
            lesson: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw AppError.notFound('Lượt làm bài không tồn tại.');
    if (attempt.userId !== userId) throw AppError.forbidden('Bạn không có quyền nộp bài làm này.');

    // If already submitted, return existing result (Idempotent)
    if (attempt.status === 'SUBMITTED' || attempt.status === 'COMPLETED') {
      return this.getAttemptResult(userId, attemptId);
    }

    const questions = attempt.exerciseSet.questions;

    // Merge answers from existing DB records and optional bulk submission payload
    const existingAnswersMap: Record<number, any> = {};
    attempt.answers.forEach((ans) => {
      try {
        existingAnswersMap[ans.questionId] = JSON.parse(ans.answer);
      } catch {
        existingAnswersMap[ans.questionId] = ans.answer;
      }
    });

    if (bulkAnswers) {
      Object.entries(bulkAnswers).forEach(([qId, val]) => {
        existingAnswersMap[Number(qId)] = val;
      });
    }

    // Grade each question
    let earnedScore = 0;
    let correctCount = 0;
    const answerUpserts: Array<{
      questionId: number;
      answer: string;
      isCorrect: boolean;
      earnedScore: number;
    }> = [];

    for (const q of questions) {
      const userAns = existingAnswersMap[q.id];
      let correctDef: any = null;
      try {
        correctDef = JSON.parse(q.answer);
      } catch {
        correctDef = q.answer;
      }

      const isCorrect = this.evaluateAnswer(q.type, userAns, correctDef);
      const qScore = isCorrect ? q.score : 0;

      if (isCorrect) {
        correctCount += 1;
        earnedScore += qScore;
      }

      answerUpserts.push({
        questionId: q.id,
        answer: userAns !== undefined ? JSON.stringify(userAns) : 'null',
        isCorrect,
        earnedScore: qScore,
      });
    }

    const totalQuestions = questions.length;
    const totalScore = questions.reduce((sum, q) => sum + q.score, 0);

    // Execute transaction: update answers, attempt status, and lesson progress
    await prisma.$transaction(async (tx) => {
      // Upsert all answers
      for (const item of answerUpserts) {
        await tx.practiceAttemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: item.questionId,
            },
          },
          create: {
            attemptId,
            questionId: item.questionId,
            answer: item.answer,
            isCorrect: item.isCorrect,
            earnedScore: item.earnedScore,
          },
          update: {
            answer: item.answer,
            isCorrect: item.isCorrect,
            earnedScore: item.earnedScore,
          },
        });
      }

      // Mark attempt SUBMITTED
      await tx.practiceAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          submittedAt: new Date(),
          totalQuestions,
          totalScore,
          earnedScore,
          correctCount,
        },
      });

      // Update or create LessonProgress (if linked to a lesson)
      const lessonId = attempt.exerciseSet.lessonId;
      if (lessonId) {
        const allSetsInLesson = await tx.practiceExerciseSet.findMany({
          where: { lessonId, isPublished: true },
          select: { id: true },
        });

        // Find all completed sets for this user in this lesson
        const completedAttempts = await tx.practiceAttempt.findMany({
          where: {
            userId,
            exerciseSet: { lessonId },
            status: { in: ['SUBMITTED', 'COMPLETED'] },
          },
          select: {
            exerciseSetId: true,
            earnedScore: true,
            totalScore: true,
          },
        });

        const completedSetIds = new Set(completedAttempts.map((a) => a.exerciseSetId));
        const completionPercent = Math.min(
          100,
          Math.round((completedSetIds.size / Math.max(1, allSetsInLesson.length)) * 100)
        );

        const bestScoreInLesson = completedAttempts.reduce((max, a) => Math.max(max, a.earnedScore), 0);

        await tx.practiceLessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId,
            },
          },
          create: {
            userId,
            lessonId,
            completionPercent,
            bestScore: bestScoreInLesson,
            completedExerciseCount: completedSetIds.size,
            lastExerciseSetId: attempt.exerciseSetId,
            lastActivityAt: new Date(),
          },
          update: {
            completionPercent,
            bestScore: Math.max(bestScoreInLesson, earnedScore),
            completedExerciseCount: completedSetIds.size,
            lastExerciseSetId: attempt.exerciseSetId,
            lastActivityAt: new Date(),
          },
        });
      }
    });

    return this.getAttemptResult(userId, attemptId);
  }

  /**
   * After submission: return full detailed result WITH explanations and correct answers!
   */
  async getAttemptResult(userId: number, attemptId: number) {
    const attempt = await prisma.practiceAttempt.findUnique({
      where: { id: attemptId },
      include: {
        version: {
          select: {
            id: true,
            collectionId: true,
            versionNumber: true,
          },
        },
        exerciseSet: {
          include: {
            lesson: { include: { level: true } },
            questions: {
              where: { status: 'PUBLISHED' },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw AppError.notFound('Lượt làm bài không tồn tại.');
    if (attempt.userId !== userId) throw AppError.forbidden('Bạn không có quyền xem kết quả này.');
    if (attempt.status === 'IN_PROGRESS') {
      throw AppError.badRequest('Bài tập chưa được nộp. Không thể xem kết quả.');
    }

    const answersMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    const detailedQuestions = attempt.exerciseSet.questions.map((q) => {
      const studentAns = answersMap.get(q.id);
      let parsedUserAns: any = null;
      if (studentAns?.answer) {
        try {
          parsedUserAns = JSON.parse(studentAns.answer);
        } catch {
          parsedUserAns = studentAns.answer;
        }
      }

      let parsedPrompt: any = null;
      try {
        parsedPrompt = JSON.parse(q.prompt);
      } catch {
        parsedPrompt = { text: q.prompt };
      }

      let parsedAnswer: any = null;
      try {
        parsedAnswer = JSON.parse(q.answer);
      } catch {
        parsedAnswer = q.answer;
      }

      let parsedExplanation: any = null;
      if (q.explanation) {
        try {
          parsedExplanation = JSON.parse(q.explanation);
        } catch {
          parsedExplanation = q.explanation;
        }
      }

      return {
        id: q.id,
        code: q.code,
        type: q.type,
        score: q.score,
        sortOrder: q.sortOrder,
        prompt: parsedPrompt,
        userAnswer: parsedUserAns,
        isCorrect: studentAns?.isCorrect ?? false,
        earnedScore: studentAns?.earnedScore ?? 0,
        correctAnswer: parsedAnswer,
        explanation: parsedExplanation,
      };
    });

    const totalQuestions = attempt.totalQuestions || detailedQuestions.length;
    const correctCount = attempt.correctCount || detailedQuestions.filter((q) => q.isCorrect).length;
    const wrongCount = Math.max(0, totalQuestions - correctCount);
    const accuracyRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const score100 = attempt.totalScore > 0
      ? Math.round((attempt.earnedScore / attempt.totalScore) * 100)
      : (totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);

    // Calculate duration in seconds
    let durationSeconds = 0;
    if (attempt.startedAt && attempt.submittedAt) {
      durationSeconds = Math.max(0, Math.floor((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000));
    }

    return {
      attemptId: attempt.id,
      exerciseSetId: attempt.exerciseSetId,
      exerciseSetTitle: attempt.exerciseSet.titleZh,
      collectionId: attempt.version?.collectionId || null,
      versionId: attempt.versionId || null,
      skill: attempt.exerciseSet.skill,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationSeconds,
      totalQuestions,
      correctCount,
      wrongCount,
      accuracyRate,
      score100,
      totalScore: attempt.totalScore,
      earnedScore: attempt.earnedScore,
      percentage: score100,
      questions: detailedQuestions,
      lesson: attempt.exerciseSet.lesson
        ? {
            id: attempt.exerciseSet.lesson.id,
            number: attempt.exerciseSet.lesson.lessonNumber,
            titleZh: attempt.exerciseSet.lesson.titleZh,
            levelCode: attempt.exerciseSet.lesson.level?.code || '',
          }
        : null,
    };
  }

  // 4. Progress Tracking
  async getUserOverallProgress(userId: number) {
    const levels = await prisma.practiceLevel.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });

    const progressList = await prisma.practiceLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: { include: { level: true } },
      },
    });

    const levelStats = await Promise.all(
      levels.map(async (lvl) => {
        const totalLessons = await prisma.practiceLesson.count({
          where: { levelId: lvl.id, isPublished: true },
        });
        const levelProgresses = progressList.filter((p) => p.lesson.levelId === lvl.id);
        const completedLessons = levelProgresses.filter((p) => p.completionPercent === 100).length;
        const avgPercent =
          totalLessons > 0
            ? Math.round(
                levelProgresses.reduce((sum, p) => sum + p.completionPercent, 0) / totalLessons
              )
            : 0;

        return {
          levelCode: lvl.code,
          levelName: lvl.name,
          totalLessons,
          completedLessons,
          completionPercent: avgPercent,
          lastActivityAt: levelProgresses.sort(
            (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
          )[0]?.lastActivityAt || null,
        };
      })
    );

    return {
      userId,
      levels: levelStats,
    };
  }

  async getUserLevelProgress(userId: number, levelCode: string) {
    const level = await prisma.practiceLevel.findUnique({
      where: { code: levelCode.toUpperCase() },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            exerciseSets: {
              where: { isPublished: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!level) throw AppError.notFound(`Cấp độ ${levelCode} không tồn tại.`);

    const lessonIds = level.lessons.map((l) => l.id);
    const progressList = await prisma.practiceLessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    const progressMap = new Map(progressList.map((p) => [p.lessonId, p]));

    const lessonProgress = level.lessons.map((l) => {
      const p = progressMap.get(l.id);
      return {
        lessonId: l.id,
        lessonNumber: l.lessonNumber,
        titleZh: l.titleZh,
        titleVi: l.titleVi,
        totalExerciseSets: l.exerciseSets.length,
        completionPercent: p?.completionPercent ?? 0,
        bestScore: p?.bestScore ?? 0,
        completedExerciseCount: p?.completedExerciseCount ?? 0,
        lastActivityAt: p?.lastActivityAt ?? null,
      };
    });

    return {
      levelCode: level.code,
      levelName: level.name,
      lessons: lessonProgress,
    };
  }

  async getUserLessonProgress(userId: number, lessonId: number) {
    const progress = await prisma.practiceLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      include: {
        lesson: { include: { level: true } },
      },
    });

    if (!progress) {
      return {
        lessonId,
        completionPercent: 0,
        bestScore: 0,
        completedExerciseCount: 0,
        lastActivityAt: null,
      };
    }

    return progress;
  }

  // ==========================================
  // 5. Student Practice Collections & History (Giai đoạn 5)
  // ==========================================

  async getPublishedCollections(
    query: {
      levelCode?: string;
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    userId?: number
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const { levelCode, category, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
      currentVersionId: { not: null },
      currentVersion: {
        status: 'PUBLISHED',
      },
    };

    if (levelCode) {
      where.level = { code: levelCode.toUpperCase() };
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { titleZh: { contains: search } },
        { titleVi: { contains: search } },
      ];
    }

    const [collections, total] = await Promise.all([
      prisma.practiceCollection.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ orderIndex: 'asc' }, { updatedAt: 'desc' }],
        include: {
          level: { select: { id: true, code: true, name: true } },
          currentVersion: {
            include: {
              exerciseSets: {
                where: { isPublished: true, status: 'PUBLISHED' },
                include: {
                  questions: { where: { status: 'PUBLISHED' }, select: { id: true, score: true } },
                },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      }),
      prisma.practiceCollection.count({ where }),
    ]);

    // Fetch user attempts if logged in
    let userAttemptsMap: Record<number, any> = {};
    if (userId) {
      const versionIds = collections
        .map((c) => c.currentVersionId)
        .filter((id): id is number => id !== null);

      if (versionIds.length > 0) {
        const attempts = await prisma.practiceAttempt.findMany({
          where: {
            userId,
            versionId: { in: versionIds },
          },
          select: {
            id: true,
            versionId: true,
            exerciseSetId: true,
            status: true,
            totalScore: true,
            earnedScore: true,
            startedAt: true,
            submittedAt: true,
          },
          orderBy: { startedAt: 'desc' },
        });

        // Group attempts by versionId
        attempts.forEach((att) => {
          if (att.versionId) {
            if (!userAttemptsMap[att.versionId]) {
              userAttemptsMap[att.versionId] = [];
            }
            userAttemptsMap[att.versionId].push(att);
          }
        });
      }
    }

    const items = collections.map((col) => {
      const ver = col.currentVersion!;
      const sets = ver.exerciseSets || [];
      const totalQuestions = sets.reduce((sum, s) => sum + s.questions.length, 0);
      const totalScore = sets.reduce(
        (sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.score, 0),
        0
      );
      const estimatedMinutes = sets.reduce((sum, s) => sum + s.estimatedMinutes, 0) || 15;
      const skills = Array.from(new Set(sets.map((s) => s.skill)));

      // User status calculation
      const versionAttempts = ver.id ? userAttemptsMap[ver.id] || [] : [];
      const hasInProgress = versionAttempts.some((a: any) => a.status === 'IN_PROGRESS');
      const completedAttempts = versionAttempts.filter((a: any) =>
        a.status === 'SUBMITTED' || a.status === 'COMPLETED'
      );
      const bestScore = completedAttempts.reduce(
        (max: number, a: any) => Math.max(max, a.earnedScore),
        0
      );

      let userStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (hasInProgress) {
        userStatus = 'IN_PROGRESS';
      } else if (completedAttempts.length > 0) {
        userStatus = 'COMPLETED';
      }

      return {
        id: col.id,
        code: col.code,
        levelCode: col.level.code,
        levelName: col.level.name,
        category: col.category,
        titleZh: col.titleZh,
        titlePinyin: col.titlePinyin,
        titleVi: col.titleVi,
        description: col.description,
        orderIndex: col.orderIndex,
        currentVersionId: col.currentVersionId,
        currentVersionNumber: ver.versionNumber,
        exerciseSetsCount: sets.length,
        totalQuestions,
        totalScore,
        estimatedMinutes,
        skills,
        userStatus,
        bestScore: completedAttempts.length > 0 ? bestScore : null,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublishedCollectionDetail(collectionId: number, userId?: number) {
    const collection = await prisma.practiceCollection.findFirst({
      where: {
        id: collectionId,
        status: 'PUBLISHED',
        currentVersionId: { not: null },
        currentVersion: {
          status: 'PUBLISHED',
        },
      },
      include: {
        level: { select: { id: true, code: true, name: true } },
        currentVersion: {
          include: {
            exerciseSets: {
              where: { isPublished: true, status: 'PUBLISHED' },
              include: {
                questions: { where: { status: 'PUBLISHED' }, select: { id: true, score: true } },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!collection || !collection.currentVersion) {
      throw AppError.notFound('Bài luyện tập không tồn tại hoặc chưa được xuất bản.');
    }

    const ver = collection.currentVersion;
    const sets = ver.exerciseSets || [];

    // Fetch user attempts on these exercise sets
    let userAttemptsMap: Record<number, any> = {};
    if (userId) {
      const attempts = await prisma.practiceAttempt.findMany({
        where: {
          userId,
          versionId: ver.id,
        },
        select: {
          id: true,
          exerciseSetId: true,
          status: true,
          totalScore: true,
          earnedScore: true,
          correctCount: true,
          totalQuestions: true,
          startedAt: true,
          submittedAt: true,
        },
        orderBy: { startedAt: 'desc' },
      });

      attempts.forEach((a) => {
        if (!userAttemptsMap[a.exerciseSetId]) {
          userAttemptsMap[a.exerciseSetId] = a; // Latest attempt
        }
      });
    }

    const setsSummary = sets.map((s) => {
      const latestAttempt = userAttemptsMap[s.id];
      return {
        id: s.id,
        code: s.code,
        skill: s.skill,
        titleZh: s.titleZh,
        titleVi: s.titleVi,
        instructions: s.instructions,
        estimatedMinutes: s.estimatedMinutes,
        sortOrder: s.sortOrder,
        questionsCount: s.questions.length,
        totalScore: s.questions.reduce((sum, q) => sum + q.score, 0),
        latestAttempt: latestAttempt
          ? {
              id: latestAttempt.id,
              status: latestAttempt.status,
              earnedScore: latestAttempt.earnedScore,
              totalScore: latestAttempt.totalScore,
              correctCount: latestAttempt.correctCount ?? 0,
              totalQuestions: latestAttempt.totalQuestions ?? s.questions.length,
              wrongCount: Math.max(0, (latestAttempt.totalQuestions ?? s.questions.length) - (latestAttempt.correctCount ?? 0)),
              startedAt: latestAttempt.startedAt,
              submittedAt: latestAttempt.submittedAt,
            }
          : null,
      };
    });

    const totalQuestions = setsSummary.reduce((sum, s) => sum + s.questionsCount, 0);
    const totalScore = setsSummary.reduce((sum, s) => sum + s.totalScore, 0);
    const estimatedMinutes = setsSummary.reduce((sum, s) => sum + s.estimatedMinutes, 0) || 15;

    return {
      id: collection.id,
      code: collection.code,
      levelCode: collection.level.code,
      levelName: collection.level.name,
      category: collection.category,
      titleZh: collection.titleZh,
      titlePinyin: collection.titlePinyin,
      titleVi: collection.titleVi,
      description: collection.description,
      currentVersionId: ver.id,
      currentVersionNumber: ver.versionNumber,
      totalQuestions,
      totalScore,
      estimatedMinutes,
      exerciseSets: setsSummary,
    };
  }

  async startCollectionAttempt(userId: number, collectionId: number, exerciseSetId: number) {
    // 1. Verify collection and published currentVersion
    const collection = await prisma.practiceCollection.findFirst({
      where: {
        id: collectionId,
        status: 'PUBLISHED',
        currentVersionId: { not: null },
      },
      include: {
        currentVersion: {
          include: {
            exerciseSets: {
              where: { id: exerciseSetId, isPublished: true },
            },
          },
        },
      },
    });

    if (!collection || !collection.currentVersion) {
      throw AppError.notFound('Bài luyện tập không tồn tại hoặc chưa được xuất bản.');
    }

    if (collection.currentVersion.status !== 'PUBLISHED') {
      throw AppError.conflict(
        `Phiên bản hiện tại của bộ đề đang ở trạng thái "${collection.currentVersion.status}". Không thể bắt đầu lượt làm bài mới.`,
        'VERSION_NOT_PUBLISHED'
      );
    }

    // 2. Verify exerciseSet belongs to this currentVersion
    const exerciseSet = collection.currentVersion.exerciseSets[0];
    if (!exerciseSet) {
      throw AppError.badRequest(
        `Phần bài tập ID ${exerciseSetId} không thuộc phiên bản xuất bản hiện tại của bộ đề này.`
      );
    }

    // 3. Delegate to startOrCreateAttempt with version validation
    return this.startOrCreateAttempt(userId, exerciseSetId);
  }

  async getStudentHistory(userId: number, query: {
    levelCode?: string;
    category?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { levelCode, category, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (levelCode || category) {
      where.exerciseSet = {};
      if (category) {
        where.exerciseSet.version = {
          collection: { category },
        };
      }
      if (levelCode) {
        where.exerciseSet.OR = [
          { version: { collection: { level: { code: levelCode.toUpperCase() } } } },
          { lesson: { level: { code: levelCode.toUpperCase() } } },
        ];
      }
    }

    const [attempts, total] = await Promise.all([
      prisma.practiceAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          exerciseSet: {
            include: {
              version: {
                include: {
                  collection: {
                    include: { level: true },
                  },
                },
              },
              lesson: {
                include: { level: true },
              },
            },
          },
        },
      }),
      prisma.practiceAttempt.count({ where }),
    ]);

    const items = attempts.map((att) => {
      const col = att.exerciseSet.version?.collection;
      const ver = att.exerciseSet.version;
      const les = att.exerciseSet.lesson;
      const levelCodeResult = col?.level?.code || les?.level?.code || 'HSK1';
      const collectionTitle = col?.titleVi || les?.titleVi || 'Luyện tập SBT';
      const versionNumber = ver?.versionNumber || 1;

      return {
        attemptId: att.id,
        exerciseSetId: att.exerciseSetId,
        exerciseSetTitle: att.exerciseSet.titleZh,
        skill: att.exerciseSet.skill,
        collectionId: col?.id || null,
        collectionTitle,
        levelCode: levelCodeResult,
        category: col?.category || 'WORKBOOK_LESSON',
        versionNumber,
        status: att.status,
        earnedScore: att.earnedScore,
        totalScore: att.totalScore,
        percentage: Math.round((att.earnedScore / Math.max(1, att.totalScore)) * 100),
        correctCount: att.correctCount,
        totalQuestions: att.totalQuestions,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const practiceService = new PracticeService();
