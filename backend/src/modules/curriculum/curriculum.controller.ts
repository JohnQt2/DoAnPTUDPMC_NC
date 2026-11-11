import { Request, Response, NextFunction } from 'express';
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

export class CurriculumController {
  // ─── Courses ───────────────────────────────────────────────────────

  listCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'CONTENT_EDITOR';
      const publishedOnly = !isAdmin;
      const courses = await curriculumService.listCourses(publishedOnly);
      res.status(200).json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  };

  getCourseDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const userId = req.user?.userId;
      const course = await curriculumService.getCourseDetail(courseId, userId);
      res.status(200).json({ success: true, data: course });
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
      const lessonId = parseInt(req.params.id, 10);
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const lesson = await curriculumService.getLessonDetail(lessonId, userId, userRole);
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
