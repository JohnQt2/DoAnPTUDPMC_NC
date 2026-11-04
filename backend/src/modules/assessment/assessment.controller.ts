import { Request, Response, NextFunction } from 'express';
import { assessmentService } from './assessment.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateTestDto,
  UpdateTestDto,
  AssignQuestionsDto,
  SubmitTestDto,
} from './assessment.dto';

export class AssessmentController {
  // ─── Questions ───────────────────────────────────────────────────────

  listQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { question_type, skill_category, difficulty_level, search, limit } = req.query;
      const questions = await assessmentService.listQuestions({
        question_type: question_type as string,
        skill_category: skill_category as string,
        difficulty_level: difficulty_level as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.status(200).json({ success: true, data: questions });
    } catch (err) {
      next(err);
    }
  };

  createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateQuestionDto.parse(req.body);
      const question = await assessmentService.createQuestion(dto);
      res.status(201).json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  };

  updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const qId = parseInt(req.params.id, 10);
      const dto = UpdateQuestionDto.parse(req.body);
      const question = await assessmentService.updateQuestion(qId, dto);
      res.status(200).json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  };

  deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const qId = parseInt(req.params.id, 10);
      await assessmentService.deleteQuestion(qId);
      res.status(200).json({ success: true, data: { message: 'Đã xóa câu hỏi thành công.' } });
    } catch (err) {
      next(err);
    }
  };

  // ─── Tests ───────────────────────────────────────────────────────────

  createTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateTestDto.parse(req.body);
      const test = await assessmentService.createTest(dto);
      res.status(201).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  };

  getTestDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const testId = parseInt(req.params.id, 10);
      const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'CONTENT_EDITOR';
      const test = await assessmentService.getTestDetail(testId, isStaff);
      res.status(200).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  };

  updateTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const testId = parseInt(req.params.id, 10);
      const dto = UpdateTestDto.parse(req.body);
      const test = await assessmentService.updateTest(testId, dto);
      res.status(200).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  };

  assignQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const testId = parseInt(req.params.id, 10);
      const { question_ids } = AssignQuestionsDto.parse(req.body);
      const result = await assessmentService.assignQuestions(testId, question_ids);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ─── Taking Tests & Grading ──────────────────────────────────────────

  startTestSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const testId = parseInt(req.params.id, 10);
      const session = await assessmentService.startTestSession(userId, testId);
      res.status(200).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  };

  submitTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const testId = parseInt(req.params.id, 10);
      const dto = SubmitTestDto.parse(req.body);
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await assessmentService.submitTest(userId, testId, dto, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  checkUnlockStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const lessonId = parseInt(req.params.lessonId, 10);
      const status = await assessmentService.checkLessonUnlockStatus(userId, lessonId);
      res.status(200).json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  };

  getUserSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const testId = req.query.testId ? parseInt(req.query.testId as string, 10) : undefined;
      const submissions = await assessmentService.getUserSubmissions(userId, testId);
      res.status(200).json({ success: true, data: submissions });
    } catch (err) {
      next(err);
    }
  };

  getSubmissionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const submissionId = parseInt(req.params.submissionId, 10);
      const detail = await assessmentService.getSubmissionDetail(userId, submissionId);
      res.status(200).json({ success: true, data: detail });
    } catch (err) {
      next(err);
    }
  };
}

export const assessmentController = new AssessmentController();
