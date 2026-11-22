import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { rateLimit } from '../../shared/middleware/rate-limiter';

const router = Router();

// Public Authentication Endpoints
router.post(
  '/register',
  rateLimit({ windowSeconds: 60, maxRequests: 10, keyPrefix: 'auth-register' }),
  authController.register
);

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

// Forgot Password via Gmail OTP (3-step flow: forgot -> verify-otp -> reset)
router.post(
  '/password/forgot',
  rateLimit({
    windowSeconds: 60,
    maxRequests: 3,
    keyPrefix: 'pwd-forgot',
    message: 'Bạn vừa yêu cầu gửi mã đặt lại mật khẩu quá nhiều lần. Vui lòng chờ một lát.',
  }),
  authController.forgotPasswordSendOtp
);

router.post(
  '/password/verify-otp',
  rateLimit({
    windowSeconds: 60,
    maxRequests: 10,
    keyPrefix: 'pwd-verify-otp',
    message: 'Bạn đã thử xác thực mã OTP quá nhiều lần. Vui lòng chờ một lát.',
  }),
  authController.forgotPasswordVerifyOtp
);

router.post(
  '/password/reset',
  rateLimit({ windowSeconds: 60, maxRequests: 8, keyPrefix: 'pwd-reset' }),
  authController.resetPasswordWithOtp
);

router.get('/google/config', authController.googleConfig);
router.get('/google/callback', authController.googleCallback);
router.post(
  '/google',
  rateLimit({ windowSeconds: 60, maxRequests: 15, keyPrefix: 'auth-google' }),
  authController.googleAuth
);
router.post(
  '/refresh',
  rateLimit({ windowSeconds: 60, maxRequests: 30, keyPrefix: 'auth-refresh' }),
  authController.refresh
);

// Protected Session Management Endpoints
router.post('/logout', authenticate, authController.logout);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.post('/sessions/revoke-others', authenticate, authController.revokeOtherSessions);

export const authRoutes = router;
