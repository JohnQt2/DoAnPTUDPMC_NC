import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

const router = Router();

// Student Profile Endpoints
router.get('/profile', authenticate, userController.getProfile);
router.get('/me', authenticate, userController.getProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.patch('/me', authenticate, userController.updateProfile);
router.put('/me', authenticate, userController.updateProfile);
router.put('/profile', authenticate, userController.updateProfile);

// Progress Endpoints
router.get('/me/progress', authenticate, userController.getUserProgressOverview);
router.get('/progress', authenticate, userController.getUserProgressOverview);

// Survey & Roadmap Endpoints
router.post('/onboarding', authenticate, userController.submitOnboarding);
router.post('/survey', authenticate, userController.submitOnboarding);
router.post('/onboarding/preview', authenticate, userController.previewOnboarding);
router.post('/survey/preview', authenticate, userController.previewOnboarding);
router.get('/roadmap', authenticate, userController.getActiveRoadmap);
router.get('/roadmap/active', authenticate, userController.getActiveRoadmap);
router.put('/notifications', authenticate, userController.updateNotifications);
router.patch('/notifications', authenticate, userController.updateNotifications);

// Admin User Management & Audit Endpoints (RBAC: ADMIN)
router.get('/admin/all', authenticate, authorize('ADMIN'), userController.adminListUsers);
router.get('/admin/audit-logs', authenticate, authorize('ADMIN'), userController.adminListAuditLogs);
router.put('/admin/:userId', authenticate, authorize('ADMIN'), userController.adminUpdateUser);

export const userRoutes = router;
