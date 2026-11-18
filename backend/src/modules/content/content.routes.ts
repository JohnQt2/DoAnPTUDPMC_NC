import { Router } from 'express';
import { contentController } from './content.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

export const contentRoutes = Router();

// ── Public / Optional-Auth routes ──────────────────────────────────────────

// Danh sách khóa học HSK 1-6 (hỗ trợ filter ?level=HSK1)
contentRoutes.get('/courses', contentController.listCourses);

// Danh sách Unit theo course ID (optional auth để xem tiến độ)
contentRoutes.get('/courses/:courseId/units', contentController.listUnitsByCourse);

// Danh sách Unit theo cấp độ HSK (shorthand: /courses/level/HSK1/units)
contentRoutes.get('/courses/level/:hskLevel/units', contentController.listUnitsByLevel);

// Tải trọn gói nội dung phân rã của 1 Unit (optional auth)
contentRoutes.get('/units/:unitId', contentController.getUnitDetail);

// ── Modular Content Loading (tối ưu cho từng tab học tập) ──────────────────
contentRoutes.get('/units/:unitId/vocabularies', contentController.getUnitVocabularies);
contentRoutes.get('/units/:unitId/sentence-patterns', contentController.getUnitSentencePatterns);
contentRoutes.get('/units/:unitId/grammars', contentController.getUnitGrammars);
contentRoutes.get('/units/:unitId/dialogues', contentController.getUnitDialogues);
contentRoutes.get('/units/:unitId/phonetics', contentController.getUnitPhonetics);
contentRoutes.get('/units/:unitId/hanzi', contentController.getUnitHanzi);
contentRoutes.get('/units/:unitId/exercises', contentController.getUnitExercises);

// ── Dictionary / Quick Lookup ───────────────────────────────────────────────
contentRoutes.get('/materials/hanzi/:character', contentController.getHanziDetail);
contentRoutes.get('/materials/search', contentController.searchMaterials);

// ── Admin / Content CMS (requires auth + ADMIN/CONTENT_EDITOR role) ─────────
contentRoutes.post(
  '/courses/:courseId/units',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR'),
  contentController.createUnit,
);

contentRoutes.patch(
  '/units/:unitId',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR'),
  contentController.updateUnit,
);

contentRoutes.put(
  '/units/:unitId/materials',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR'),
  contentController.assignMaterials,
);
