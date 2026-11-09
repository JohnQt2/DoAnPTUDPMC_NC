import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, LoginPasswordDto, GoogleAuthDto, RefreshTokenDto } from './auth.dto';
import { env } from '../../config/env';

export class AuthController {
  private getClientInfo(req: Request) {
    return {
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown Device',
    };
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, displayName, mode } = SendOtpDto.parse(req.body);
      const result = await authService.sendEmailOtp(email, { password, displayName, mode });
      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          expiresIn: result.expiresIn,
          senderEmail: result.senderEmail,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getMailbox = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.query.email as string;
      const mail = await authService.getMailboxMessage(email);
      res.status(200).json({
        success: true,
        data: mail,
      });
    } catch (err) {
      next(err);
    }
  };

  loginPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = LoginPasswordDto.parse(req.body);
      const clientInfo = this.getClientInfo(req);

      const result = await authService.loginWithPassword(email, password, clientInfo);
      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          isNewUser: result.isNewUser,
          expiresIn: 900,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = VerifyOtpDto.parse(req.body);
      const clientInfo = this.getClientInfo(req);

      const result = await authService.verifyEmailOtp(email, otp, clientInfo);
      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          isNewUser: result.isNewUser,
          expiresIn: 900, // 15 mins in seconds
        },
      });
    } catch (err) {
      next(err);
    }
  };

  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = GoogleAuthDto.parse(req.body);
      const clientInfo = this.getClientInfo(req);

      const result = await authService.loginWithGoogle(dto, clientInfo);
      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          isNewUser: result.isNewUser,
          expiresIn: 900,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokenFromCookie = req.cookies?.refreshToken;
      const parsedBody = RefreshTokenDto.safeParse(req.body);
      const tokenFromBody = parsedBody.success ? parsedBody.data.refreshToken : undefined;

      const tokenToUse = tokenFromCookie || tokenFromBody;
      const clientInfo = this.getClientInfo(req);

      const result = await authService.rotateRefreshToken(tokenToUse, clientInfo);
      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: 900,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const sessionId = req.user?.sessionId;
      const tokenFromCookie = req.cookies?.refreshToken;

      if (userId) {
        await authService.logout(userId, sessionId, tokenFromCookie);
      }

      this.clearRefreshTokenCookie(res);
      res.status(200).json({
        success: true,
        data: { message: 'Đăng xuất thành công.' },
      });
    } catch (err) {
      next(err);
    }
  };

  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const currentSessionId = req.user!.sessionId;

      const sessions = await authService.listUserSessions(userId, currentSessionId);
      res.status(200).json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const targetSessionId = parseInt(req.params.sessionId, 10);

      await authService.revokeSession(userId, targetSessionId);
      res.status(200).json({
        success: true,
        data: { message: 'Đã thu hồi phiên đăng nhập thiết bị thành công.' },
      });
    } catch (err) {
      next(err);
    }
  };

  revokeOtherSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const currentSessionId = req.user!.sessionId;

      if (!currentSessionId) {
        res.status(400).json({ success: false, error: { message: 'Không thể xác định phiên hiện tại.' } });
        return;
      }

      const result = await authService.revokeOtherSessions(userId, currentSessionId);
      res.status(200).json({
        success: true,
        data: {
          message: `Đã thu hồi thành công ${result.revokedCount} phiên đăng nhập trên các thiết bị khác.`,
          revokedCount: result.revokedCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
