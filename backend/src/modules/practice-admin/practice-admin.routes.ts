import { Router } from 'express';
import { practiceAdminController } from './practice-admin.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

const router = Router();

// Tất cả endpoints Admin đều yêu cầu đăng nhập và role CONTENT_EDITOR hoặc ADMIN
router.use(authenticate, authorize('ADMIN', 'CONTENT_EDITOR'));

// ==========================================
// 1. COLLECTIONS
// ==========================================
router.get('/collections', practiceAdminController.listCollections);
router.post('/collections', practiceAdminController.createCollection);
router.get('/collections/:collectionId', practiceAdminController.getCollectionById);
router.put('/collections/:collectionId', practiceAdminController.updateCollection);
router.post('/collections/:collectionId/assign-editor', authorize('ADMIN'), practiceAdminController.assignEditor);
router.post('/collections/:collectionId/duplicate', practiceAdminController.duplicateCollection);
router.post('/collections/:collectionId/archive', authorize('ADMIN'), practiceAdminController.archiveCollection);

// ==========================================
// 2. VERSIONS
// ==========================================
router.get('/collections/:collectionId/versions', practiceAdminController.getVersionsByCollection);
router.post('/collections/:collectionId/versions', practiceAdminController.createVersionRevision);

router.get('/versions/:versionId', practiceAdminController.getVersionDetail);
router.put('/versions/:versionId', practiceAdminController.updateVersion);
router.get('/versions/:versionId/preview', practiceAdminController.previewVersion);
router.post('/versions/:versionId/validate', practiceAdminController.validateVersion);
router.post('/versions/:versionId/submit-review', practiceAdminController.submitForReview);

// Endpoints chỉ dành cho ADMIN
router.post('/versions/:versionId/request-changes', authorize('ADMIN'), practiceAdminController.requestChanges);
router.post('/versions/:versionId/publish', authorize('ADMIN'), practiceAdminController.publishVersion);
router.post('/versions/:versionId/retire', authorize('ADMIN'), practiceAdminController.retireVersion);

// ==========================================
// 3. EXERCISE SETS
// ==========================================
router.post('/versions/:versionId/exercise-sets', practiceAdminController.createExerciseSet);
router.put('/versions/:versionId/exercise-sets/reorder', practiceAdminController.reorderExerciseSets);
router.put('/exercise-sets/:exerciseSetId', practiceAdminController.updateExerciseSet);
router.delete('/exercise-sets/:exerciseSetId', practiceAdminController.deleteExerciseSet);

// ==========================================
// 4. QUESTIONS
// ==========================================
router.post('/exercise-sets/:exerciseSetId/questions', practiceAdminController.createQuestion);
router.put('/exercise-sets/:exerciseSetId/questions/reorder', practiceAdminController.reorderQuestions);
router.put('/questions/:questionId', practiceAdminController.updateQuestion);
router.delete('/questions/:questionId', practiceAdminController.deleteQuestion);
router.post('/questions/:questionId/duplicate', practiceAdminController.duplicateQuestion);

export const practiceAdminRoutes = router;
