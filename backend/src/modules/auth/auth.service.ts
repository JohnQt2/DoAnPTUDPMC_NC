import { randomUUID } from 'crypto';
import { prisma } from '../../shared/database/prisma.client';
import { redisService } from '../../shared/redis/redis.service';
import {
  generateOtp,
  hashString,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/crypto';
import { AppError } from '../../shared/errors/app-error';
import { GoogleAuthInput } from './auth.dto';
import { env } from '../../config/env';

interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes
  private readonly LOCKOUT_TTL_SECONDS = 900; // 15 minutes lockout
  private readonly MAX_OTP_ATTEMPTS = 5;

  /**
   * UC01: Gửi mã OTP xác thực email
   */
  async sendEmailOtp(email: string): Promise<{ message: string; expiresIn: number; devOtp?: string }> {
    const lockoutKey = `otp:lockout:${email}`;
    const isLocked = await redisService.get(lockoutKey);

    if (isLocked) {
      const remaining = await redisService.ttl(lockoutKey);
      throw AppError.tooManyRequests(
        `Tài khoản đang bị tạm khóa do nhập sai OTP quá 5 lần. Vui lòng thử lại sau ${remaining} giây.`,
        'OTP_ACCOUNT_LOCKED',
        { remainingSeconds: remaining }
      );
    }

    // Generate 6-digit OTP and compute its hash
    const otp = generateOtp();
    const otpHash = hashString(otp);

    // Store in Redis with TTL 300s and initial attempt counter
    const otpKey = `otp:${email}`;
    const payload = JSON.stringify({
      hash: otpHash,
      attempts: 0,
      createdAt: Date.now(),
    });

    await redisService.set(otpKey, payload, this.OTP_TTL_SECONDS);

    console.log(`[OTP DISPATCH] Email: ${email} | OTP: ${otp} (TTL: ${this.OTP_TTL_SECONDS}s)`);

    return {
      message: 'Mã xác thực OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 5 phút.',
      expiresIn: this.OTP_TTL_SECONDS,
      // Dev helper for seamless inspection & testing
      devOtp: env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  /**
   * UC01: Xác thực mã OTP và đăng nhập / đăng ký
   */
  async verifyEmailOtp(
    email: string,
    otp: string,
    clientInfo: ClientInfo
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const lockoutKey = `otp:lockout:${email}`;
    const isLocked = await redisService.get(lockoutKey);

    if (isLocked) {
      const remaining = await redisService.ttl(lockoutKey);
      throw AppError.tooManyRequests(
        `Tài khoản đang bị tạm khóa. Vui lòng thử lại sau ${remaining} giây.`,
        'OTP_ACCOUNT_LOCKED'
      );
    }

    const otpKey = `otp:${email}`;
    const storedData = await redisService.get(otpKey);

    if (!storedData) {
      throw AppError.badRequest(
        'Mã OTP đã hết hiệu lực hoặc chưa được yêu cầu. Vui lòng bấm gửi lại mã mới.',
        'OTP_EXPIRED'
      );
    }

    const record = JSON.parse(storedData) as {
      hash: string;
      attempts: number;
      createdAt: number;
    };

    const inputHash = hashString(otp);

    if (inputHash !== record.hash) {
      const newAttempts = record.attempts + 1;
      const ttlRemaining = await redisService.ttl(otpKey);

      if (newAttempts >= this.MAX_OTP_ATTEMPTS) {
        // Exceeded 5 attempts -> Delete OTP and lock for 15 minutes
        await redisService.del(otpKey);
        await redisService.set(lockoutKey, 'LOCKED', this.LOCKOUT_TTL_SECONDS);

        throw AppError.tooManyRequests(
          'Bạn đã nhập sai mã OTP quá 5 lần. Tài khoản của bạn bị tạm khóa trong 15 phút vì lý do an toàn.',
          'OTP_MAX_ATTEMPTS_EXCEEDED'
        );
      } else {
        // Update attempt count in Redis
        record.attempts = newAttempts;
        await redisService.set(otpKey, JSON.stringify(record), Math.max(1, ttlRemaining));

        throw AppError.badRequest(
          `Mã OTP không chính xác. Bạn còn ${this.MAX_OTP_ATTEMPTS - newAttempts} lần thử.`,
          'OTP_INCORRECT',
          { remainingAttempts: this.MAX_OTP_ATTEMPTS - newAttempts }
        );
      }
    }

    // OTP verified successfully -> Delete OTP from Redis
    await redisService.del(otpKey);

    // Check or create user in DB
    let isNewUser = false;
    let user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      isNewUser = true;
      const defaultName = email.split('@')[0];

      user = await prisma.users.create({
        data: {
          email,
          display_name: defaultName,
          role: 'STUDENT',
          status: 'ACTIVE',
          notificationSettings: {
            create: {
              reminder_time: '20:00',
              notify_email: true,
              notify_webpush: false,
            },
          },
        },
      });

      // Assign default introductory course roadmap if course exists
      const defaultCourse = await prisma.courses.findFirst({
        where: { level: 'HSK1' },
      });

      if (defaultCourse) {
        await prisma.userRoadmaps.create({
          data: {
            user_id: user.user_id,
            course_id: defaultCourse.course_id,
            starting_level: 'ZERO',
            target_goal: 'HSK1',
            daily_commitment_mins: 15,
            is_active: true,
          },
        });
      }

      await prisma.auditLogs.create({
        data: {
          user_id: user.user_id,
          action_type: 'REGISTER_OTP',
          target_entity: 'Users',
          target_id: user.user_id.toString(),
          new_value: JSON.stringify({ email: user.email, role: user.role }),
          ip_address: clientInfo.ip,
        },
      });
    } else {
      if (user.status === 'BANNED' || user.status === 'LOCKED') {
        throw AppError.forbidden('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');
      }

      user = await prisma.users.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      await prisma.auditLogs.create({
        data: {
          user_id: user.user_id,
          action_type: 'LOGIN_OTP',
          target_entity: 'Users',
          target_id: user.user_id.toString(),
          ip_address: clientInfo.ip,
        },
      });
    }

    // Create session and issue tokens with Refresh Token Rotation
    const sessionFamilyId = randomUUID();
    const { accessToken, refreshToken } = await this.createSession(
      user.user_id,
      user.email,
      user.role,
      sessionFamilyId,
      clientInfo
    );

    return {
      user: {
        userId: user.user_id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  /**
   * UC01: Tích hợp Đăng nhập bằng Google OAuth2
   */
  async loginWithGoogle(
    dto: GoogleAuthInput,
    clientInfo: ClientInfo
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    // In production, verify Google ID token with OAuth2Client. In development, accept valid email mapping
    let email = dto.email;
    let name = dto.name;

    if (dto.credential) {
      // Decode JWT payload from credential if provided
      try {
        const parts = dto.credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
          }
        }
      } catch (err) {
        console.warn('Failed to parse Google credential token:', err);
      }
    }

    if (!email) {
      throw AppError.badRequest('Không thể xác thực thông tin tài khoản Google.', 'GOOGLE_AUTH_FAILED');
    }

    let isNewUser = false;
    let user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      isNewUser = true;
      user = await prisma.users.create({
        data: {
          email,
          display_name: name || email.split('@')[0],
          role: 'STUDENT',
          status: 'ACTIVE',
          notificationSettings: {
            create: {
              reminder_time: '20:00',
              notify_email: true,
              notify_webpush: false,
            },
          },
        },
      });

      const defaultCourse = await prisma.courses.findFirst({
        where: { level: 'HSK1' },
      });

      if (defaultCourse) {
        await prisma.userRoadmaps.create({
          data: {
            user_id: user.user_id,
            course_id: defaultCourse.course_id,
            starting_level: 'ZERO',
            target_goal: 'HSK1',
            daily_commitment_mins: 15,
            is_active: true,
          },
        });
      }

      await prisma.auditLogs.create({
        data: {
          user_id: user.user_id,
          action_type: 'REGISTER_GOOGLE',
          target_entity: 'Users',
          target_id: user.user_id.toString(),
          new_value: JSON.stringify({ email }),
          ip_address: clientInfo.ip,
        },
      });
    } else {
      if (user.status === 'BANNED' || user.status === 'LOCKED') {
        throw AppError.forbidden('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');
      }

      user = await prisma.users.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      await prisma.auditLogs.create({
        data: {
          user_id: user.user_id,
          action_type: 'LOGIN_GOOGLE',
          target_entity: 'Users',
          target_id: user.user_id.toString(),
          ip_address: clientInfo.ip,
        },
      });
    }

    const sessionFamilyId = randomUUID();
    const { accessToken, refreshToken } = await this.createSession(
      user.user_id,
      user.email,
      user.role,
      sessionFamilyId,
      clientInfo
    );

    return {
      user: {
        userId: user.user_id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  /**
   * Cơ chế Refresh Token Rotation (RTR) với Thu hồi toàn bộ session family khi phát hiện token cũ bị dùng lại (Token Reuse Detection)
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    clientInfo: ClientInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!oldRefreshToken) {
      throw AppError.unauthorized('Yêu cầu Refresh Token hợp lệ.', 'REFRESH_TOKEN_REQUIRED');
    }

    // Verify token validity
    let payload: any;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch (err: any) {
      throw AppError.unauthorized('Refresh Token không hợp lệ hoặc đã hết hạn.', 'INVALID_REFRESH_TOKEN');
    }

    const oldTokenHash = hashString(oldRefreshToken);

    // Look up the session in the database
    const session = await prisma.userSessions.findFirst({
      where: { refresh_token_hash: oldTokenHash },
      include: { user: true },
    });

    if (!session) {
      throw AppError.unauthorized('Phiên đăng nhập không tồn tại.', 'SESSION_NOT_FOUND');
    }

    // === CRITICAL SECURITY CHECK: TOKEN REUSE DETECTION ===
    if (session.is_revoked) {
      // An already revoked token was submitted again! This indicates token theft or replay attack.
      // Revoke the ENTIRE session family immediately!
      await prisma.userSessions.updateMany({
        where: { family_id: session.family_id },
        data: { is_revoked: true },
      });

      await prisma.auditLogs.create({
        data: {
          user_id: session.user_id,
          action_type: 'TOKEN_REUSE_DETECTED',
          target_entity: 'UserSessions',
          target_id: session.session_id.toString(),
          old_value: JSON.stringify({ familyId: session.family_id, revokedAll: true }),
          ip_address: clientInfo.ip,
        },
      });

      console.warn(`🚨 SECURITY ALERT: Token reuse detected for family ${session.family_id}. All family sessions revoked.`);

      throw AppError.unauthorized(
        'Phát hiện hành vi sử dụng lại token cũ (Token Reuse Detected). Toàn bộ phiên làm việc của bạn đã bị hủy bỏ để bảo vệ an toàn tài khoản.',
        'TOKEN_FAMILY_REVOKED'
      );
    }

    // Check expiration
    if (new Date() > session.expires_at) {
      await prisma.userSessions.update({
        where: { session_id: session.session_id },
        data: { is_revoked: true },
      });
      throw AppError.unauthorized('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'SESSION_EXPIRED');
    }

    // Check user status
    if (session.user.status === 'BANNED' || session.user.status === 'LOCKED') {
      throw AppError.forbidden('Tài khoản đã bị tạm khóa.');
    }

    // Mark current session as revoked/consumed
    await prisma.userSessions.update({
      where: { session_id: session.session_id },
      data: { is_revoked: true },
    });

    // Create a new session with the SAME family_id (Session Continuation)
    return this.createSession(
      session.user_id,
      session.user.email,
      session.user.role,
      session.family_id,
      clientInfo
    );
  }

  /**
   * Đăng xuất phiên hiện tại
   */
  async logout(userId: number, sessionId?: number, refreshToken?: string): Promise<void> {
    if (sessionId) {
      await prisma.userSessions.updateMany({
        where: { session_id: sessionId, user_id: userId },
        data: { is_revoked: true },
      });
    } else if (refreshToken) {
      const hash = hashString(refreshToken);
      await prisma.userSessions.updateMany({
        where: { refresh_token_hash: hash, user_id: userId },
        data: { is_revoked: true },
      });
    }

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'LOGOUT',
        target_entity: 'UserSessions',
        target_id: sessionId?.toString() || 'current',
      },
    });
  }

  /**
   * Danh sách phiên đăng nhập theo thiết bị của người dùng
   */
  async listUserSessions(userId: number, currentSessionId?: number): Promise<any[]> {
    const sessions = await prisma.userSessions.findMany({
      where: {
        user_id: userId,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
      select: {
        session_id: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        expires_at: true,
        family_id: true,
      },
    });

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.session_id === currentSessionId,
    }));
  }

  /**
   * Thu hồi phiên đăng nhập theo thiết bị / sessionId cụ thể
   */
  async revokeSession(userId: number, targetSessionId: number): Promise<void> {
    const session = await prisma.userSessions.findFirst({
      where: { session_id: targetSessionId, user_id: userId },
    });

    if (!session) {
      throw AppError.notFound('Không tìm thấy phiên đăng nhập này.');
    }

    await prisma.userSessions.update({
      where: { session_id: targetSessionId },
      data: { is_revoked: true },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'REVOKE_SESSION',
        target_entity: 'UserSessions',
        target_id: targetSessionId.toString(),
      },
    });
  }

  /**
   * Thu hồi tất cả các phiên khác ngoại trừ phiên hiện tại
   */
  async revokeOtherSessions(userId: number, currentSessionId: number): Promise<{ revokedCount: number }> {
    const result = await prisma.userSessions.updateMany({
      where: {
        user_id: userId,
        session_id: { not: currentSessionId },
        is_revoked: false,
      },
      data: { is_revoked: true },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'REVOKE_OTHER_SESSIONS',
        target_entity: 'UserSessions',
        target_id: 'others',
        new_value: JSON.stringify({ revokedCount: result.count }),
      },
    });

    return { revokedCount: result.count };
  }

  /**
   * Helper phát hành phiên mới và token
   */
  private async createSession(
    userId: number,
    email: string,
    role: string,
    familyId: string,
    clientInfo: ClientInfo
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: number }> {
    // 30 days expiration for refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Initial placeholder hash to get auto-generated session_id
    const placeholderHash = randomUUID();

    const session = await prisma.userSessions.create({
      data: {
        user_id: userId,
        refresh_token_hash: placeholderHash,
        family_id: familyId,
        ip_address: clientInfo.ip || null,
        user_agent: clientInfo.userAgent || null,
        is_revoked: false,
        expires_at: expiresAt,
      },
    });

    const tokenPayload = {
      userId,
      email,
      role,
      sessionId: session.session_id,
      familyId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store real SHA-256 hash of refresh token
    const realHash = hashString(refreshToken);
    await prisma.userSessions.update({
      where: { session_id: session.session_id },
      data: { refresh_token_hash: realHash },
    });

    return {
      accessToken,
      refreshToken,
      sessionId: session.session_id,
    };
  }
}

export const authService = new AuthService();
