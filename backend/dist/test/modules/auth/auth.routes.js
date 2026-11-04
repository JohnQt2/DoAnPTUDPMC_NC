"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const rate_limiter_1 = require("../../shared/middleware/rate-limiter");
const router = (0, express_1.Router)();
// Public Authentication Endpoints
router.post('/otp/send', (0, rate_limiter_1.rateLimit)({ windowSeconds: 60, maxRequests: 3, keyPrefix: 'otp-send', message: 'Vui lòng chờ 1 phút trước khi yêu cầu mã OTP tiếp theo.' }), auth_controller_1.authController.sendOtp);
router.post('/otp/verify', (0, rate_limiter_1.rateLimit)({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'otp-verify' }), auth_controller_1.authController.verifyOtp);
router.post('/google', auth_controller_1.authController.googleAuth);
router.post('/refresh', auth_controller_1.authController.refresh);
// Protected Session Management Endpoints
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.authController.logout);
router.get('/sessions', auth_middleware_1.authenticate, auth_controller_1.authController.getSessions);
router.delete('/sessions/:sessionId', auth_middleware_1.authenticate, auth_controller_1.authController.revokeSession);
router.post('/sessions/revoke-others', auth_middleware_1.authenticate, auth_controller_1.authController.revokeOtherSessions);
exports.authRoutes = router;
