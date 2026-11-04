"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentRoutes = void 0;
const express_1 = require("express");
const assessment_controller_1 = require("./assessment.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const rbac_middleware_1 = require("../../shared/middleware/rbac.middleware");
const idempotency_middleware_1 = require("../../shared/middleware/idempotency.middleware");
const router = (0, express_1.Router)();
// ─── Questions (Admin / Content Editor) ────────────────────────────────
router.get('/questions', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.listQuestions);
router.post('/questions', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.createQuestion);
router.put('/questions/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.updateQuestion);
router.delete('/questions/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.deleteQuestion);
// ─── Tests (Management) ───────────────────────────────────────────────
router.post('/tests', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.createTest);
router.put('/tests/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.updateTest);
router.post('/tests/:id/assign-questions', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN', 'CONTENT_EDITOR'), assessment_controller_1.assessmentController.assignQuestions);
// ─── Tests (Taking & Submitting) ───────────────────────────────────────
router.get('/tests/:id', auth_middleware_1.optionalAuthenticate, assessment_controller_1.assessmentController.getTestDetail);
router.post('/tests/:id/start', auth_middleware_1.authenticate, assessment_controller_1.assessmentController.startTestSession);
router.post('/tests/:id/submit', auth_middleware_1.authenticate, (0, idempotency_middleware_1.idempotency)(86400), assessment_controller_1.assessmentController.submitTest);
// ─── Submissions & Unlock Progress Check ──────────────────────────────
router.get('/unlock-check/:lessonId', auth_middleware_1.authenticate, assessment_controller_1.assessmentController.checkUnlockStatus);
router.get('/submissions', auth_middleware_1.authenticate, assessment_controller_1.assessmentController.getUserSubmissions);
router.get('/submissions/:submissionId', auth_middleware_1.authenticate, assessment_controller_1.assessmentController.getSubmissionDetail);
exports.assessmentRoutes = router;
