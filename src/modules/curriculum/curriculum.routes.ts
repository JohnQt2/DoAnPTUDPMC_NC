import { Router } from 'express';
import { curriculumController } from './curriculum.controller';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

const router = Router();

// ─── Courses ──────────────────────────────────────────────────────────
router.get('/courses', optionalAuthenticate, curriculumController.listCourses);
router.get('/courses/:id', optionalAuthenticate, curriculumController.getCourseDetail);
router.post('/courses', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.createCourse);
router.put('/courses/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.updateCourse);
router.post('/courses/:id/publish', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.publishCourse);

// ─── Chapters ─────────────────────────────────────────────────────────
router.post('/chapters', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.createChapter);
router.put('/chapters/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.updateChapter);
router.delete('/chapters/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.deleteChapter);

// ─── Lessons ──────────────────────────────────────────────────────────
router.get('/lessons/:id', optionalAuthenticate, curriculumController.getLessonDetail);
router.post('/lessons', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.createLesson);
router.put('/lessons/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.updateLesson);
router.delete('/lessons/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.deleteLesson);
router.post('/lessons/:id/publish', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.publishLesson);

// ─── Lesson Blocks ────────────────────────────────────────────────────
router.post('/lesson-blocks', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.createLessonBlock);
router.put('/lesson-blocks/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.updateLessonBlock);
router.delete('/lesson-blocks/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), curriculumController.deleteLessonBlock);

export const curriculumRoutes = router;
