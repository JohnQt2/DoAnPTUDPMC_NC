import { Request, Response, NextFunction } from 'express';
import { practiceAdminService } from './practice-admin.service';
import {
  CreatePracticeCollectionSchema,
  UpdatePracticeCollectionSchema,
  AssignPracticeEditorSchema,
  DuplicatePracticeCollectionSchema,
  ListPracticeCollectionsQuerySchema,
  CreatePracticeVersionSchema,
  UpdatePracticeVersionSchema,
  CreatePracticeExerciseSetSchema,
  UpdatePracticeExerciseSetSchema,
  ReorderPracticeItemsSchema,
  CreatePracticeQuestionSchema,
  UpdatePracticeQuestionSchema,
  DuplicatePracticeQuestionSchema,
  SubmitPracticeReviewSchema,
  RequestPracticeChangesSchema,
  PublishPracticeVersionSchema,
} from './practice-admin.dto';
import { AppError } from '../../shared/errors/app-error';

export class PracticeAdminController {
  private getActor(req: Request) {
    if (!req.user) {
      throw AppError.unauthorized('Yêu cầu xác thực tài khoản.');
    }
    return {
      userId: req.user.userId,
      role: req.user.role,
    };
  }

  // ==========================================
  // Collections
  // ==========================================

  listCollections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const query = ListPracticeCollectionsQuerySchema.parse(req.query);
      const result = await practiceAdminService.listCollections(query, actor);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getCollectionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const result = await practiceAdminService.getCollectionById(collectionId, actor);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  createCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const dto = CreatePracticeCollectionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.createCollection(dto, actor, ipAddress);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const dto = UpdatePracticeCollectionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.updateCollection(collectionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  duplicateCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const dto = DuplicatePracticeCollectionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.duplicateCollection(collectionId, dto, actor, ipAddress);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  assignEditor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const dto = AssignPracticeEditorSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.assignEditor(collectionId, dto.editorId, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  archiveCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.archiveCollection(collectionId, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ==========================================
  // Versions
  // ==========================================

  getVersionsByCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const result = await practiceAdminService.getVersionsByCollection(collectionId, actor);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getVersionDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const result = await practiceAdminService.getVersionDetail(versionId, actor);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  createVersionRevision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const collectionId = parseInt(req.params.collectionId, 10);
      if (isNaN(collectionId)) throw AppError.badRequest('collectionId không hợp lệ');

      const dto = CreatePracticeVersionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.createVersionRevision(collectionId, dto, actor, ipAddress);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const dto = UpdatePracticeVersionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.updateVersion(versionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  validateVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const result = await practiceAdminService.validateVersion(versionId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  submitForReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const dto = SubmitPracticeReviewSchema.parse(req.body || {});
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.submitForReview(versionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  requestChanges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const dto = RequestPracticeChangesSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.requestChanges(versionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  publishVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const dto = PublishPracticeVersionSchema.parse(req.body || {});
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.publishVersion(versionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  retireVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.retireVersion(versionId, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  previewVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const showAnswers = req.query.showAnswers === 'true';
      const result = await practiceAdminService.previewVersion(versionId, actor, showAnswers);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ==========================================
  // Exercise Sets
  // ==========================================

  createExerciseSet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const dto = CreatePracticeExerciseSetSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.createExerciseSet(versionId, dto, actor, ipAddress);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateExerciseSet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const exerciseSetId = parseInt(req.params.exerciseSetId, 10);
      if (isNaN(exerciseSetId)) throw AppError.badRequest('exerciseSetId không hợp lệ');

      const dto = UpdatePracticeExerciseSetSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.updateExerciseSet(exerciseSetId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteExerciseSet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const exerciseSetId = parseInt(req.params.exerciseSetId, 10);
      if (isNaN(exerciseSetId)) throw AppError.badRequest('exerciseSetId không hợp lệ');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.deleteExerciseSet(exerciseSetId, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  reorderExerciseSets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) throw AppError.badRequest('versionId không hợp lệ');

      const dto = ReorderPracticeItemsSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.reorderExerciseSets(versionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ==========================================
  // Questions
  // ==========================================

  createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const exerciseSetId = parseInt(req.params.exerciseSetId, 10);
      if (isNaN(exerciseSetId)) throw AppError.badRequest('exerciseSetId không hợp lệ');

      const dto = CreatePracticeQuestionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.createQuestion(exerciseSetId, dto, actor, ipAddress);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const questionId = parseInt(req.params.questionId, 10);
      if (isNaN(questionId)) throw AppError.badRequest('questionId không hợp lệ');

      const dto = UpdatePracticeQuestionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.updateQuestion(questionId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const questionId = parseInt(req.params.questionId, 10);
      if (isNaN(questionId)) throw AppError.badRequest('questionId không hợp lệ');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.deleteQuestion(questionId, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  duplicateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const questionId = parseInt(req.params.questionId, 10);
      if (isNaN(questionId)) throw AppError.badRequest('questionId không hợp lệ');

      const dto = DuplicatePracticeQuestionSchema.parse(req.body || {});
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.duplicateQuestion(questionId, dto, actor, ipAddress);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  reorderQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const exerciseSetId = parseInt(req.params.exerciseSetId, 10);
      if (isNaN(exerciseSetId)) throw AppError.badRequest('exerciseSetId không hợp lệ');

      const dto = ReorderPracticeItemsSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await practiceAdminService.reorderQuestions(exerciseSetId, dto, actor, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}

export const practiceAdminController = new PracticeAdminController();
