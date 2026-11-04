import { Router } from 'express';
import { assessmentController } from './assessment.controller';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';
import { idempotency } from '../../shared/middleware/idempotency.middleware';

const router = Router();

// ─── Questions (Admin / Content Editor) ────────────────────────────────
router.get('/questions', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.listQuestions);
router.post('/questions', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.createQuestion);
router.put('/questions/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.updateQuestion);
router.delete('/questions/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.deleteQuestion);

// ─── Tests (Management) ───────────────────────────────────────────────
router.post('/tests', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.createTest);
router.put('/tests/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.updateTest);
router.post('/tests/:id/assign-questions', authenticate, authorize('ADMIN', 'CONTENT_EDITOR'), assessmentController.assignQuestions);

// ─── Tests (Taking & Submitting) ───────────────────────────────────────
router.get('/tests/:id', optionalAuthenticate, assessmentController.getTestDetail);
router.post('/tests/:id/start', authenticate, assessmentController.startTestSession);
router.post('/tests/:id/submit', authenticate, idempotency(86400), assessmentController.submitTest);

// ─── Submissions & Unlock Progress Check ──────────────────────────────
router.get('/unlock-check/:lessonId', authenticate, assessmentController.checkUnlockStatus);
router.get('/submissions', authenticate, assessmentController.getUserSubmissions);
router.get('/submissions/:submissionId', authenticate, assessmentController.getSubmissionDetail);

export const assessmentRoutes = router;
