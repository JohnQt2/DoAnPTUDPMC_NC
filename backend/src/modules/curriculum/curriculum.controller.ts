import { Request, Response, NextFunction } from 'express';
import { ContentType } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { curriculumService } from './curriculum.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateLessonBlockDto,
  UpdateLessonBlockDto,
} from './curriculum.dto';

const contentTypes = new Set<string>(Object.values(ContentType));

function parseIdParam(value: string, name: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw AppError.badRequest(`${name} phải là số nguyên dương.`, 'INVALID_ID');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw AppError.badRequest(`${name} không hợp lệ.`, 'INVALID_ID');
  }
  return parsed;
}

function parseContentType(value: unknown): ContentType | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !contentTypes.has(value)) {
    throw AppError.badRequest(
      `contentType không hợp lệ. Giá trị hỗ trợ: ${Array.from(contentTypes).join(', ')}.`,
      'INVALID_CONTENT_TYPE'
    );
  }
  return value as ContentType;
}

export class CurriculumController {
  // ─── Courses ───────────────────────────────────────────────────────

  listCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courses = await curriculumService.listCourses();
      res.status(200).json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  };

  getCourseDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = parseIdParam(req.params.id, 'courseId');
      const userId = req.user?.userId;
      const course = await curriculumService.getCourseDetail(courseId, userId);
      res.status(200).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  };

  listUnitsForCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = parseIdParam(req.params.id, 'courseId');
      const units = await curriculumService.listUnitsForCourse(courseId);
      res.status(200).json({ success: true, data: units });
    } catch (err) {
      next(err);
    }
  };

  getUnitDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const unitId = parseIdParam(req.params.id, 'unitId');
      const unit = await curriculumService.getUnitDetail(unitId);
      res.status(200).json({ success: true, data: unit });
    } catch (err) {
      next(err);
    }
  };

  getUnitContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const unitId = parseIdParam(req.params.id, 'unitId');
      const content = await curriculumService.getUnitContent(unitId);
      res.status(200).json({ success: true, data: content });
    } catch (err) {
      next(err);
    }
  };

  getLessonContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = parseIdParam(req.params.id, 'lessonId');
      const content = await curriculumService.getLessonContent(lessonId);
      res.status(200).json({ success: true, data: content });
    } catch (err) {
      next(err);
    }
  };

  listUnitContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const unitId = parseIdParam(req.params.id, 'unitId');
      const contentType = parseContentType(req.query.contentType);
      const contents = await curriculumService.listUnitContents(unitId, contentType);
      res.status(200).json({ success: true, data: contents });
    } catch (err) {
      next(err);
    }
  };

  getLearningContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contentId = parseIdParam(req.params.id, 'contentId');
      const content = await curriculumService.getLearningContent(contentId);
      res.status(200).json({ success: true, data: content });
    } catch (err) {
      next(err);
    }
  };

  createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateCourseDto.parse(req.body);
      const course = await curriculumService.createCourse(dto);
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  };

  updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const dto = UpdateCourseDto.parse(req.body);
      const course = await curriculumService.updateCourse(courseId, dto);
      res.status(200).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  };

  publishCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const result = await curriculumService.publishCourse(courseId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ─── Chapters ──────────────────────────────────────────────────────

  createChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateChapterDto.parse(req.body);
      const chapter = await curriculumService.createChapter(dto);
      res.status(201).json({ success: true, data: chapter });
    } catch (err) {
      next(err);
    }
  };

  updateChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chapterId = parseInt(req.params.id, 10);
      const dto = UpdateChapterDto.parse(req.body);
      const chapter = await curriculumService.updateChapter(chapterId, dto);
      res.status(200).json({ success: true, data: chapter });
    } catch (err) {
      next(err);
    }
  };

  deleteChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chapterId = parseInt(req.params.id, 10);
      const result = await curriculumService.deleteChapter(chapterId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ─── Lessons ───────────────────────────────────────────────────────

  createLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateLessonDto.parse(req.body);
      const lesson = await curriculumService.createLesson(dto);
      res.status(201).json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  };

  updateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = parseInt(req.params.id, 10);
      const dto = UpdateLessonDto.parse(req.body);
      const lesson = await curriculumService.updateLesson(lessonId, dto);
      res.status(200).json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  };

  deleteLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = parseInt(req.params.id, 10);
      const result = await curriculumService.deleteLesson(lessonId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getLessonDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = parseIdParam(req.params.id, 'lessonId');
      const lesson = await curriculumService.getLessonDetail(lessonId);
      res.status(200).json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  };

  publishLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = parseInt(req.params.id, 10);
      const result = await curriculumService.publishLesson(lessonId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ─── Lesson Blocks ─────────────────────────────────────────────────

  createLessonBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateLessonBlockDto.parse(req.body);
      const block = await curriculumService.createLessonBlock(dto);
      res.status(201).json({ success: true, data: block });
    } catch (err) {
      next(err);
    }
  };

  updateLessonBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const blockId = parseInt(req.params.id, 10);
      const dto = UpdateLessonBlockDto.parse(req.body);
      const block = await curriculumService.updateLessonBlock(blockId, dto);
      res.status(200).json({ success: true, data: block });
    } catch (err) {
      next(err);
    }
  };

  deleteLessonBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const blockId = parseInt(req.params.id, 10);
      const result = await curriculumService.deleteLessonBlock(blockId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}

export const curriculumController = new CurriculumController();
