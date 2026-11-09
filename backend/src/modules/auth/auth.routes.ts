import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { rateLimit } from '../../shared/middleware/rate-limiter';

const router = Router();

// Public Authentication Endpoints
router.post(
  '/otp/send',
  rateLimit({ windowSeconds: 60, maxRequests: 3, keyPrefix: 'otp-send', message: 'Vui lòng chờ 1 phút trước khi yêu cầu mã OTP tiếp theo.' }),
  authController.sendOtp
);

router.post(
  '/otp/verify',
  rateLimit({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'otp-verify' }),
  authController.verifyOtp
);

router.get('/mailbox', authController.getMailbox);

router.post(
  '/login',
  rateLimit({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'auth-login' }),
  authController.loginPassword
);

router.post('/google', authController.googleAuth);
router.post('/refresh', authController.refresh);

// Protected Session Management Endpoints
router.post('/logout', authenticate, authController.logout);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.post('/sessions/revoke-others', authenticate, authController.revokeOtherSessions);

export const authRoutes = router;
