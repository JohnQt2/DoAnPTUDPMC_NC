import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

const router = Router();

// Student Profile Endpoints
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.post('/onboarding', authenticate, userController.submitOnboarding);
router.put('/notifications', authenticate, userController.updateNotifications);

// Admin User Management Endpoints (RBAC: ADMIN)
router.get('/admin/all', authenticate, authorize('ADMIN'), userController.adminListUsers);
router.put('/admin/:userId', authenticate, authorize('ADMIN'), userController.adminUpdateUser);

export const userRoutes = router;
