"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curriculumController = exports.CurriculumController = void 0;
const curriculum_service_1 = require("./curriculum.service");
const curriculum_dto_1 = require("./curriculum.dto");
class CurriculumController {
    // ─── Courses ───────────────────────────────────────────────────────
    listCourses = async (req, res, next) => {
        try {
            const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'CONTENT_EDITOR';
            const publishedOnly = !isAdmin;
            const courses = await curriculum_service_1.curriculumService.listCourses(publishedOnly);
            res.status(200).json({ success: true, data: courses });
        }
        catch (err) {
            next(err);
        }
    };
    getCourseDetail = async (req, res, next) => {
        try {
            const courseId = parseInt(req.params.id, 10);
            const userId = req.user?.userId;
            const course = await curriculum_service_1.curriculumService.getCourseDetail(courseId, userId);
            res.status(200).json({ success: true, data: course });
        }
        catch (err) {
            next(err);
        }
    };
    createCourse = async (req, res, next) => {
        try {
            const dto = curriculum_dto_1.CreateCourseDto.parse(req.body);
            const course = await curriculum_service_1.curriculumService.createCourse(dto);
            res.status(201).json({ success: true, data: course });
        }
        catch (err) {
            next(err);
        }
    };
    updateCourse = async (req, res, next) => {
        try {
            const courseId = parseInt(req.params.id, 10);
            const dto = curriculum_dto_1.UpdateCourseDto.parse(req.body);
            const course = await curriculum_service_1.curriculumService.updateCourse(courseId, dto);
            res.status(200).json({ success: true, data: course });
        }
        catch (err) {
            next(err);
        }
    };
    publishCourse = async (req, res, next) => {
        try {
            const courseId = parseInt(req.params.id, 10);
            const result = await curriculum_service_1.curriculumService.publishCourse(courseId);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Chapters ──────────────────────────────────────────────────────
    createChapter = async (req, res, next) => {
        try {
            const dto = curriculum_dto_1.CreateChapterDto.parse(req.body);
            const chapter = await curriculum_service_1.curriculumService.createChapter(dto);
            res.status(201).json({ success: true, data: chapter });
        }
        catch (err) {
            next(err);
        }
    };
    updateChapter = async (req, res, next) => {
        try {
            const chapterId = parseInt(req.params.id, 10);
            const dto = curriculum_dto_1.UpdateChapterDto.parse(req.body);
            const chapter = await curriculum_service_1.curriculumService.updateChapter(chapterId, dto);
            res.status(200).json({ success: true, data: chapter });
        }
        catch (err) {
            next(err);
        }
    };
    deleteChapter = async (req, res, next) => {
        try {
            const chapterId = parseInt(req.params.id, 10);
            const result = await curriculum_service_1.curriculumService.deleteChapter(chapterId);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Lessons ───────────────────────────────────────────────────────
    createLesson = async (req, res, next) => {
        try {
            const dto = curriculum_dto_1.CreateLessonDto.parse(req.body);
            const lesson = await curriculum_service_1.curriculumService.createLesson(dto);
            res.status(201).json({ success: true, data: lesson });
        }
        catch (err) {
            next(err);
        }
    };
    updateLesson = async (req, res, next) => {
        try {
            const lessonId = parseInt(req.params.id, 10);
            const dto = curriculum_dto_1.UpdateLessonDto.parse(req.body);
            const lesson = await curriculum_service_1.curriculumService.updateLesson(lessonId, dto);
            res.status(200).json({ success: true, data: lesson });
        }
        catch (err) {
            next(err);
        }
    };
    deleteLesson = async (req, res, next) => {
        try {
            const lessonId = parseInt(req.params.id, 10);
            const result = await curriculum_service_1.curriculumService.deleteLesson(lessonId);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    getLessonDetail = async (req, res, next) => {
        try {
            const lessonId = parseInt(req.params.id, 10);
            const lesson = await curriculum_service_1.curriculumService.getLessonDetail(lessonId);
            res.status(200).json({ success: true, data: lesson });
        }
        catch (err) {
            next(err);
        }
    };
    publishLesson = async (req, res, next) => {
        try {
            const lessonId = parseInt(req.params.id, 10);
            const result = await curriculum_service_1.curriculumService.publishLesson(lessonId);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Lesson Blocks ─────────────────────────────────────────────────
    createLessonBlock = async (req, res, next) => {
        try {
            const dto = curriculum_dto_1.CreateLessonBlockDto.parse(req.body);
            const block = await curriculum_service_1.curriculumService.createLessonBlock(dto);
            res.status(201).json({ success: true, data: block });
        }
        catch (err) {
            next(err);
        }
    };
    updateLessonBlock = async (req, res, next) => {
        try {
            const blockId = parseInt(req.params.id, 10);
            const dto = curriculum_dto_1.UpdateLessonBlockDto.parse(req.body);
            const block = await curriculum_service_1.curriculumService.updateLessonBlock(blockId, dto);
            res.status(200).json({ success: true, data: block });
        }
        catch (err) {
            next(err);
        }
    };
    deleteLessonBlock = async (req, res, next) => {
        try {
            const blockId = parseInt(req.params.id, 10);
            const result = await curriculum_service_1.curriculumService.deleteLessonBlock(blockId);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.CurriculumController = CurriculumController;
exports.curriculumController = new CurriculumController();
