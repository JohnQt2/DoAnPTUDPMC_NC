import { Router } from 'express';

import { userController } from './user.controller';

import {
  authenticate,
} from '../../shared/middleware/auth.middleware';

import {
  authorize,
} from '../../shared/middleware/rbac.middleware';

const router = Router();

/**
 * Hồ sơ cá nhân
 */
router.get(
  '/me',
  authenticate,
  userController.getProfile
);

router.put(
  '/me',
  authenticate,
  userController.updateProfile
);

/**
 * Onboarding cũ
 *
 * Tạm thời giữ lại để ProfilePage và các chức năng cũ
 * không bị hỏng trong quá trình chuyển sang API khảo sát
 * và API quản lý lộ trình mới.
 */
router.post(
  '/onboarding',
  authenticate,
  userController.submitOnboarding
);

/**
 * Cài đặt thông báo
 */
router.put(
  '/notifications',
  authenticate,
  userController.updateNotifications
);

/**
 * Khảo sát nhu cầu học tập
 */
router.get(
  '/me/learning-survey',
  authenticate,
  userController.getLearningSurvey
);

router.put(
  '/me/learning-survey',
  authenticate,
  userController.upsertLearningSurvey
);

/**
 * Quản lý lộ trình cá nhân
 *
 * GET /me/roadmap
 * Lấy proposal mới nhất hoặc roadmap đang hoạt động.
 *
 * POST /me/roadmap/proposal
 * Lưu một lộ trình được đề xuất.
 *
 * PUT /me/roadmap/confirm
 * Xác nhận và kích hoạt lộ trình được đề xuất.
 *
 * PUT /me/roadmap/cancel
 * Hủy lộ trình đang ở trạng thái PROPOSED.
 */
router.get(
  '/me/roadmap',
  authenticate,
  userController.getCurrentRoadmap
);

router.post(
  '/me/roadmap/proposal',
  authenticate,
  userController.createRoadmapProposal
);

router.put(
  '/me/roadmap/confirm',
  authenticate,
  userController.confirmRoadmap
);

router.put(
  '/me/roadmap/cancel',
  authenticate,
  userController.cancelRoadmapProposal
);

/**
 * Quản trị người dùng và Audit Log
 */
router.get(
  '/admin/all',
  authenticate,
  authorize('ADMIN'),
  userController.adminListUsers
);

router.get(
  '/admin/audit-logs',
  authenticate,
  authorize('ADMIN'),
  userController.adminListAuditLogs
);

router.put(
  '/admin/:userId',
  authenticate,
  authorize('ADMIN'),
  userController.adminUpdateUser
);

export const userRoutes = router;