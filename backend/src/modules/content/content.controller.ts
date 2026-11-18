import { Request, Response, NextFunction } from 'express';
import { contentService } from './content.service';

export class ContentController {

  // ── GET /api/v1/content/courses ─────────────────────────────
  listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const level = req.query.level as string | undefined;
      const result = await contentService.listCourses(level);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/courses/:courseId/units ─────────────
  listUnitsByCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const userId = (req as any).user?.userId;
      const result = await contentService.listUnitsByCourse(courseId, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/courses/level/:hskLevel/units ───────
  listUnitsByLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hskLevel = req.params.hskLevel;
      const userId = (req as any).user?.userId;
      const result = await contentService.listUnitsByLevel(hskLevel, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── POST /api/v1/content/courses/:courseId/units ────────────
  createUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const result = await contentService.createUnit(courseId, {
        title: req.body.title,
        orderIndex: req.body.orderIndex || req.body.order_index,
        description: req.body.description,
        objective: req.body.objective,
        thumbnailUrl: req.body.thumbnailUrl || req.body.thumbnail_url,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── PATCH /api/v1/content/units/:unitId ─────────────────────
  updateUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.updateUnit(unitId, {
        title: req.body.title,
        orderIndex: req.body.orderIndex || req.body.order_index,
        description: req.body.description,
        objective: req.body.objective,
        thumbnailUrl: req.body.thumbnailUrl || req.body.thumbnail_url,
        status: req.body.status,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── PUT /api/v1/content/units/:unitId/materials ─────────────
  assignMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.assignMaterialsToUnit(unitId, {
        vocabularyIds: req.body.vocabularyIds,
        grammarIds: req.body.grammarIds,
        sentencePatternIds: req.body.sentencePatternIds,
        dialogueIds: req.body.dialogueIds,
        phoneticIds: req.body.phoneticIds,
        hanziIds: req.body.hanziIds,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId ───────────────────────
  getUnitDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const userId = (req as any).user?.userId;
      const result = await contentService.getUnitDetail(unitId, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/vocabularies ──────────
  getUnitVocabularies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitVocabularies(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/sentence-patterns ─────
  getUnitSentencePatterns = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitSentencePatterns(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/grammars ──────────────
  getUnitGrammars = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitGrammars(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/dialogues ─────────────
  getUnitDialogues = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitDialogues(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/phonetics ─────────────
  getUnitPhonetics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitPhonetics(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/hanzi ─────────────────
  getUnitHanzi = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitHanzi(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/units/:unitId/exercises ─────────────
  getUnitExercises = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const result = await contentService.getUnitExercises(unitId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/materials/hanzi/:character ──────────
  getHanziDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const character = decodeURIComponent(req.params.character);
      const result = await contentService.getHanziDetail(character);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // ── GET /api/v1/content/materials/search ────────────────────
  searchMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string || '';
      const level = req.query.level as string | undefined;
      const type = req.query.type as string | undefined;
      const result = await contentService.searchMaterials(q, level, type);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}

export const contentController = new ContentController();
