"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentController = exports.AssessmentController = void 0;
const assessment_service_1 = require("./assessment.service");
const assessment_dto_1 = require("./assessment.dto");
class AssessmentController {
    // ─── Questions ───────────────────────────────────────────────────────
    listQuestions = async (req, res, next) => {
        try {
            const { question_type, skill_category, difficulty_level, search, limit } = req.query;
            const questions = await assessment_service_1.assessmentService.listQuestions({
                question_type: question_type,
                skill_category: skill_category,
                difficulty_level: difficulty_level,
                search: search,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            res.status(200).json({ success: true, data: questions });
        }
        catch (err) {
            next(err);
        }
    };
    createQuestion = async (req, res, next) => {
        try {
            const dto = assessment_dto_1.CreateQuestionDto.parse(req.body);
            const question = await assessment_service_1.assessmentService.createQuestion(dto);
            res.status(201).json({ success: true, data: question });
        }
        catch (err) {
            next(err);
        }
    };
    updateQuestion = async (req, res, next) => {
        try {
            const qId = parseInt(req.params.id, 10);
            const dto = assessment_dto_1.UpdateQuestionDto.parse(req.body);
            const question = await assessment_service_1.assessmentService.updateQuestion(qId, dto);
            res.status(200).json({ success: true, data: question });
        }
        catch (err) {
            next(err);
        }
    };
    deleteQuestion = async (req, res, next) => {
        try {
            const qId = parseInt(req.params.id, 10);
            await assessment_service_1.assessmentService.deleteQuestion(qId);
            res.status(200).json({ success: true, data: { message: 'Đã xóa câu hỏi thành công.' } });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Tests ───────────────────────────────────────────────────────────
    createTest = async (req, res, next) => {
        try {
            const dto = assessment_dto_1.CreateTestDto.parse(req.body);
            const test = await assessment_service_1.assessmentService.createTest(dto);
            res.status(201).json({ success: true, data: test });
        }
        catch (err) {
            next(err);
        }
    };
    getTestDetail = async (req, res, next) => {
        try {
            const testId = parseInt(req.params.id, 10);
            const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'CONTENT_EDITOR';
            const test = await assessment_service_1.assessmentService.getTestDetail(testId, isStaff);
            res.status(200).json({ success: true, data: test });
        }
        catch (err) {
            next(err);
        }
    };
    updateTest = async (req, res, next) => {
        try {
            const testId = parseInt(req.params.id, 10);
            const dto = assessment_dto_1.UpdateTestDto.parse(req.body);
            const test = await assessment_service_1.assessmentService.updateTest(testId, dto);
            res.status(200).json({ success: true, data: test });
        }
        catch (err) {
            next(err);
        }
    };
    assignQuestions = async (req, res, next) => {
        try {
            const testId = parseInt(req.params.id, 10);
            const { question_ids } = assessment_dto_1.AssignQuestionsDto.parse(req.body);
            const result = await assessment_service_1.assessmentService.assignQuestions(testId, question_ids);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Taking Tests & Grading ──────────────────────────────────────────
    startTestSession = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const testId = parseInt(req.params.id, 10);
            const session = await assessment_service_1.assessmentService.startTestSession(userId, testId);
            res.status(200).json({ success: true, data: session });
        }
        catch (err) {
            next(err);
        }
    };
    submitTest = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const testId = parseInt(req.params.id, 10);
            const dto = assessment_dto_1.SubmitTestDto.parse(req.body);
            const idempotencyKey = req.headers['idempotency-key'];
            const result = await assessment_service_1.assessmentService.submitTest(userId, testId, dto, idempotencyKey);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    checkUnlockStatus = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const lessonId = parseInt(req.params.lessonId, 10);
            const status = await assessment_service_1.assessmentService.checkLessonUnlockStatus(userId, lessonId);
            res.status(200).json({ success: true, data: status });
        }
        catch (err) {
            next(err);
        }
    };
    getUserSubmissions = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const testId = req.query.testId ? parseInt(req.query.testId, 10) : undefined;
            const submissions = await assessment_service_1.assessmentService.getUserSubmissions(userId, testId);
            res.status(200).json({ success: true, data: submissions });
        }
        catch (err) {
            next(err);
        }
    };
    getSubmissionDetail = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const submissionId = parseInt(req.params.submissionId, 10);
            const detail = await assessment_service_1.assessmentService.getSubmissionDetail(userId, submissionId);
            res.status(200).json({ success: true, data: detail });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AssessmentController = AssessmentController;
exports.assessmentController = new AssessmentController();
