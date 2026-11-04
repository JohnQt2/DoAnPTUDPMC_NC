"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const rbac_middleware_1 = require("../../shared/middleware/rbac.middleware");
const router = (0, express_1.Router)();
// Student Profile Endpoints
router.get('/me', auth_middleware_1.authenticate, user_controller_1.userController.getProfile);
router.put('/me', auth_middleware_1.authenticate, user_controller_1.userController.updateProfile);
router.post('/onboarding', auth_middleware_1.authenticate, user_controller_1.userController.submitOnboarding);
router.put('/notifications', auth_middleware_1.authenticate, user_controller_1.userController.updateNotifications);
// Admin User Management Endpoints (RBAC: ADMIN)
router.get('/admin/all', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN'), user_controller_1.userController.adminListUsers);
router.put('/admin/:userId', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ADMIN'), user_controller_1.userController.adminUpdateUser);
exports.userRoutes = router;
