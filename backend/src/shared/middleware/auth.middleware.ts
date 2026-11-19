import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/crypto';
import { AppError } from '../errors/app-error';
import { prisma } from '../database/prisma.client';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Vui lòng đăng nhập để tiếp tục.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Token xác thực không hợp lệ.');
    }

    const payload = verifyAccessToken(token);

    // Verify user exists and is active
    const user = await prisma.users.findUnique({
      where: { user_id: payload.userId },
      select: { user_id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw AppError.unauthorized('Tài khoản không tồn tại.');
    }

    if (user.status === 'BANNED' || user.status === 'LOCKED') {
      throw AppError.forbidden('Tài khoản đã bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.');
    }

    req.user = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      familyId: payload.familyId,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(AppError.unauthorized('Phiên làm việc đã hết hạn. Vui lòng làm mới phiên.', 'TOKEN_EXPIRED'));
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      next(AppError.unauthorized('Chữ ký xác thực không hợp lệ.', 'INVALID_TOKEN'));
      return;
    }
    next(error);
  }
}

export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
}
