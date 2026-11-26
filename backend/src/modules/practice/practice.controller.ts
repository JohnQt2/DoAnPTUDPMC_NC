import { Request, Response, NextFunction } from 'express';
import { practiceService } from './practice.service';
import {
  SaveAnswerSchema,
  SubmitAttemptSchema,
  ListStudentCollectionsQuerySchema,
  StartCollectionAttemptSchema,
  ListStudentHistoryQuerySchema,
} from './practice.dto';
import { AppError } from '../../shared/errors/app-error';

export class PracticeController {
  // --- Student Collection & History Endpoints ---
  async getPublishedCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ListStudentCollectionsQuerySchema.parse(req.query);
      const userId = req.user?.userId;
      const data = await practiceService.getPublishedCollections(query, userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getPublishedCollectionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('Mã bộ sưu tập không hợp lệ.');
      const userId = req.user?.userId;
      const data = await practiceService.getPublishedCollectionDetail(collectionId, userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async startCollectionAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('Mã bộ sưu tập không hợp lệ.');
      const userId = req.user!.userId;
      const parsed = StartCollectionAttemptSchema.parse(req.body);
      const data = await practiceService.startCollectionAttempt(userId, collectionId, parsed.exerciseSetId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStudentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const query = ListStudentHistoryQuerySchema.parse(req.query);
      const data = await practiceService.getStudentHistory(userId, query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // 1. Levels & Lessons
  async getLevels(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await practiceService.getLevels();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getLevelByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { levelCode } = req.params;
      const data = await practiceService.getLevelByCode(levelCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getLessonsByLevel(req: Request, res: Response, next: NextFunction) {
    try {
      const { levelCode } = req.params;
      const data = await practiceService.getLessonsByLevel(levelCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getLessonDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonId = parseInt(req.params.lessonId, 10);
      if (isNaN(lessonId)) throw AppError.badRequest('Mã bài học không hợp lệ.');
      const data = await practiceService.getLessonDetail(lessonId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getExerciseSetsByLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonId = parseInt(req.params.lessonId, 10);
      if (isNaN(lessonId)) throw AppError.badRequest('Mã bài học không hợp lệ.');
      const data = await practiceService.getExerciseSetsByLesson(lessonId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getExerciseSet(req: Request, res: Response, next: NextFunction) {
    try {
      const exerciseSetId = parseInt(req.params.exerciseSetId, 10);
      if (isNaN(exerciseSetId)) throw AppError.badRequest('Mã bộ bài tập không hợp lệ.');
      const data = await practiceService.getExerciseSetForPractice(exerciseSetId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // 2. Attempts & Answers
  async startAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { exerciseSetId } = req.body;
      const setId = parseInt(exerciseSetId, 10);
      if (isNaN(setId)) throw AppError.badRequest('Mã bộ bài tập không hợp lệ.');

      const data = await practiceService.startOrCreateAttempt(userId, setId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAttemptDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const attemptId = parseInt(req.params.attemptId, 10);
      if (isNaN(attemptId)) throw AppError.badRequest('Mã lượt làm bài không hợp lệ.');

      const data = await practiceService.getAttemptDetail(userId, attemptId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async saveAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const attemptId = parseInt(req.params.attemptId, 10);
      const questionId = parseInt(req.params.questionId, 10);
      if (isNaN(attemptId) || isNaN(questionId)) {
        throw AppError.badRequest('Mã lượt làm bài hoặc mã câu hỏi không hợp lệ.');
      }

      const parsed = SaveAnswerSchema.parse(req.body);
      const data = await practiceService.saveQuestionAnswer(userId, attemptId, questionId, parsed.answer);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const attemptId = parseInt(req.params.attemptId, 10);
      if (isNaN(attemptId)) throw AppError.badRequest('Mã lượt làm bài không hợp lệ.');

      const parsed = SubmitAttemptSchema.parse(req.body || {});
      const data = await practiceService.submitAttempt(userId, attemptId, parsed.answers);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAttemptResult(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const attemptId = parseInt(req.params.attemptId, 10);
      if (isNaN(attemptId)) throw AppError.badRequest('Mã lượt làm bài không hợp lệ.');

      const data = await practiceService.getAttemptResult(userId, attemptId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // 3. Progress
  async getOverallProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = await practiceService.getUserOverallProgress(userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getLevelProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { levelCode } = req.params;
      const data = await practiceService.getUserLevelProgress(userId, levelCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getLessonProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const lessonId = parseInt(req.params.lessonId, 10);
      if (isNaN(lessonId)) throw AppError.badRequest('Mã bài học không hợp lệ.');

      const data = await practiceService.getUserLessonProgress(userId, lessonId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const practiceController = new PracticeController();
