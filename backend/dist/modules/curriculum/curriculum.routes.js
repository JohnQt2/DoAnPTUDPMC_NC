"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curriculumRoutes = void 0;
const express_1 = require("express");
const curriculum_controller_1 = require("./curriculum.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const rbac_middleware_1 = require("../../shared/middleware/rbac.middleware");
const router = (0, express_1.Router)();
// ─── Courses ──────────────────────────────────────────────────────────
router.get('/courses', auth_middleware_1.optionalAuthenticate, curriculum_controller_1.curriculumController.listCourses);
router.get('/courses/:id', auth_middleware_1.optionalAuthenticate, curriculum_controller_1.curriculumController.getCourseDetail);
router.post('/courses', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.createCourse);
router.put('/courses/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.updateCourse);
router.post('/courses/:id/publish', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.publishCourse);
// ─── Chapters ─────────────────────────────────────────────────────────
router.post('/chapters', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.createChapter);
router.put('/chapters/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.updateChapter);
router.delete('/chapters/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.deleteChapter);
// ─── Lessons ──────────────────────────────────────────────────────────
router.get('/lessons/:id', auth_middleware_1.optionalAuthenticate, curriculum_controller_1.curriculumController.getLessonDetail);
router.post('/lessons', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.createLesson);
router.put('/lessons/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.updateLesson);
router.delete('/lessons/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.deleteLesson);
router.post('/lessons/:id/publish', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.publishLesson);
// ─── Lesson Blocks ────────────────────────────────────────────────────
router.post('/lesson-blocks', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.createLessonBlock);
router.put('/lesson-blocks/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.updateLessonBlock);
router.delete('/lesson-blocks/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), curriculum_controller_1.curriculumController.deleteLessonBlock);
exports.curriculumRoutes = router;
