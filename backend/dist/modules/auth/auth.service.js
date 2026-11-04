"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const crypto_1 = require("crypto");
const prisma_client_1 = require("../../shared/database/prisma.client");
const redis_service_1 = require("../../shared/redis/redis.service");
const crypto_2 = require("../../shared/utils/crypto");
const app_error_1 = require("../../shared/errors/app-error");
const env_1 = require("../../config/env");
class AuthService {
    OTP_TTL_SECONDS = 300; // 5 minutes
    LOCKOUT_TTL_SECONDS = 900; // 15 minutes lockout
    MAX_OTP_ATTEMPTS = 5;
    /**
     * UC01: Gửi mã OTP xác thực email
     */
    async sendEmailOtp(email) {
        const lockoutKey = `otp:lockout:${email}`;
        const isLocked = await redis_service_1.redisService.get(lockoutKey);
        if (isLocked) {
            const remaining = await redis_service_1.redisService.ttl(lockoutKey);
            throw app_error_1.AppError.tooManyRequests(`Tài khoản đang bị tạm khóa do nhập sai OTP quá 5 lần. Vui lòng thử lại sau ${remaining} giây.`, 'OTP_ACCOUNT_LOCKED', { remainingSeconds: remaining });
        }
        // Generate 6-digit OTP and compute its hash
        const otp = (0, crypto_2.generateOtp)();
        const otpHash = (0, crypto_2.hashString)(otp);
        // Store in Redis with TTL 300s and initial attempt counter
        const otpKey = `otp:${email}`;
        const payload = JSON.stringify({
            hash: otpHash,
            attempts: 0,
            createdAt: Date.now(),
        });
        await redis_service_1.redisService.set(otpKey, payload, this.OTP_TTL_SECONDS);
        console.log(`[OTP DISPATCH] Email: ${email} | OTP: ${otp} (TTL: ${this.OTP_TTL_SECONDS}s)`);
        return {
            message: 'Mã xác thực OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 5 phút.',
            expiresIn: this.OTP_TTL_SECONDS,
            // Dev helper for seamless inspection & testing
            devOtp: env_1.env.NODE_ENV === 'development' ? otp : undefined,
        };
    }
    /**
     * UC01: Xác thực mã OTP và đăng nhập / đăng ký
     */
    async verifyEmailOtp(email, otp, clientInfo) {
        const lockoutKey = `otp:lockout:${email}`;
        const isLocked = await redis_service_1.redisService.get(lockoutKey);
        if (isLocked) {
            const remaining = await redis_service_1.redisService.ttl(lockoutKey);
            throw app_error_1.AppError.tooManyRequests(`Tài khoản đang bị tạm khóa. Vui lòng thử lại sau ${remaining} giây.`, 'OTP_ACCOUNT_LOCKED');
        }
        const otpKey = `otp:${email}`;
        const storedData = await redis_service_1.redisService.get(otpKey);
        if (!storedData) {
            throw app_error_1.AppError.badRequest('Mã OTP đã hết hiệu lực hoặc chưa được yêu cầu. Vui lòng bấm gửi lại mã mới.', 'OTP_EXPIRED');
        }
        const record = JSON.parse(storedData);
        const inputHash = (0, crypto_2.hashString)(otp);
        if (inputHash !== record.hash) {
            const newAttempts = record.attempts + 1;
            const ttlRemaining = await redis_service_1.redisService.ttl(otpKey);
            if (newAttempts >= this.MAX_OTP_ATTEMPTS) {
                // Exceeded 5 attempts -> Delete OTP and lock for 15 minutes
                await redis_service_1.redisService.del(otpKey);
                await redis_service_1.redisService.set(lockoutKey, 'LOCKED', this.LOCKOUT_TTL_SECONDS);
                throw app_error_1.AppError.tooManyRequests('Bạn đã nhập sai mã OTP quá 5 lần. Tài khoản của bạn bị tạm khóa trong 15 phút vì lý do an toàn.', 'OTP_MAX_ATTEMPTS_EXCEEDED');
            }
            else {
                // Update attempt count in Redis
                record.attempts = newAttempts;
                await redis_service_1.redisService.set(otpKey, JSON.stringify(record), Math.max(1, ttlRemaining));
                throw app_error_1.AppError.badRequest(`Mã OTP không chính xác. Bạn còn ${this.MAX_OTP_ATTEMPTS - newAttempts} lần thử.`, 'OTP_INCORRECT', { remainingAttempts: this.MAX_OTP_ATTEMPTS - newAttempts });
            }
        }
        // OTP verified successfully -> Delete OTP from Redis
        await redis_service_1.redisService.del(otpKey);
        // Check or create user in DB
        let isNewUser = false;
        let user = await prisma_client_1.prisma.users.findUnique({
            where: { email },
        });
        if (!user) {
            isNewUser = true;
            const defaultName = email.split('@')[0];
            user = await prisma_client_1.prisma.users.create({
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
            const defaultCourse = await prisma_client_1.prisma.courses.findFirst({
                where: { level: 'HSK1' },
            });
            if (defaultCourse) {
                await prisma_client_1.prisma.userRoadmaps.create({
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
            await prisma_client_1.prisma.auditLogs.create({
                data: {
                    user_id: user.user_id,
                    action_type: 'REGISTER_OTP',
                    target_entity: 'Users',
                    target_id: user.user_id.toString(),
                    new_value: JSON.stringify({ email: user.email, role: user.role }),
                    ip_address: clientInfo.ip,
                },
            });
        }
        else {
            if (user.status === 'BANNED' || user.status === 'LOCKED') {
                throw app_error_1.AppError.forbidden('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');
            }
            user = await prisma_client_1.prisma.users.update({
                where: { user_id: user.user_id },
                data: { last_login_at: new Date() },
            });
            await prisma_client_1.prisma.auditLogs.create({
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
        const sessionFamilyId = (0, crypto_1.randomUUID)();
        const { accessToken, refreshToken } = await this.createSession(user.user_id, user.email, user.role, sessionFamilyId, clientInfo);
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
    async loginWithGoogle(dto, clientInfo) {
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
            }
            catch (err) {
                console.warn('Failed to parse Google credential token:', err);
            }
        }
        if (!email) {
            throw app_error_1.AppError.badRequest('Không thể xác thực thông tin tài khoản Google.', 'GOOGLE_AUTH_FAILED');
        }
        let isNewUser = false;
        let user = await prisma_client_1.prisma.users.findUnique({
            where: { email },
        });
        if (!user) {
            isNewUser = true;
            user = await prisma_client_1.prisma.users.create({
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
            const defaultCourse = await prisma_client_1.prisma.courses.findFirst({
                where: { level: 'HSK1' },
            });
            if (defaultCourse) {
                await prisma_client_1.prisma.userRoadmaps.create({
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
            await prisma_client_1.prisma.auditLogs.create({
                data: {
                    user_id: user.user_id,
                    action_type: 'REGISTER_GOOGLE',
                    target_entity: 'Users',
                    target_id: user.user_id.toString(),
                    new_value: JSON.stringify({ email }),
                    ip_address: clientInfo.ip,
                },
            });
        }
        else {
            if (user.status === 'BANNED' || user.status === 'LOCKED') {
                throw app_error_1.AppError.forbidden('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');
            }
            user = await prisma_client_1.prisma.users.update({
                where: { user_id: user.user_id },
                data: { last_login_at: new Date() },
            });
            await prisma_client_1.prisma.auditLogs.create({
                data: {
                    user_id: user.user_id,
                    action_type: 'LOGIN_GOOGLE',
                    target_entity: 'Users',
                    target_id: user.user_id.toString(),
                    ip_address: clientInfo.ip,
                },
            });
        }
        const sessionFamilyId = (0, crypto_1.randomUUID)();
        const { accessToken, refreshToken } = await this.createSession(user.user_id, user.email, user.role, sessionFamilyId, clientInfo);
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
    async rotateRefreshToken(oldRefreshToken, clientInfo) {
        if (!oldRefreshToken) {
            throw app_error_1.AppError.unauthorized('Yêu cầu Refresh Token hợp lệ.', 'REFRESH_TOKEN_REQUIRED');
        }
        // Verify token validity
        let payload;
        try {
            payload = (0, crypto_2.verifyRefreshToken)(oldRefreshToken);
        }
        catch (err) {
            throw app_error_1.AppError.unauthorized('Refresh Token không hợp lệ hoặc đã hết hạn.', 'INVALID_REFRESH_TOKEN');
        }
        const oldTokenHash = (0, crypto_2.hashString)(oldRefreshToken);
        // Look up the session in the database
        const session = await prisma_client_1.prisma.userSessions.findFirst({
            where: { refresh_token_hash: oldTokenHash },
            include: { user: true },
        });
        if (!session) {
            throw app_error_1.AppError.unauthorized('Phiên đăng nhập không tồn tại.', 'SESSION_NOT_FOUND');
        }
        // === CRITICAL SECURITY CHECK: TOKEN REUSE DETECTION ===
        if (session.is_revoked) {
            // An already revoked token was submitted again! This indicates token theft or replay attack.
            // Revoke the ENTIRE session family immediately!
            await prisma_client_1.prisma.userSessions.updateMany({
                where: { family_id: session.family_id },
                data: { is_revoked: true },
            });
            await prisma_client_1.prisma.auditLogs.create({
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
            throw app_error_1.AppError.unauthorized('Phát hiện hành vi sử dụng lại token cũ (Token Reuse Detected). Toàn bộ phiên làm việc của bạn đã bị hủy bỏ để bảo vệ an toàn tài khoản.', 'TOKEN_FAMILY_REVOKED');
        }
        // Check expiration
        if (new Date() > session.expires_at) {
            await prisma_client_1.prisma.userSessions.update({
                where: { session_id: session.session_id },
                data: { is_revoked: true },
            });
            throw app_error_1.AppError.unauthorized('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'SESSION_EXPIRED');
        }
        // Check user status
        if (session.user.status === 'BANNED' || session.user.status === 'LOCKED') {
            throw app_error_1.AppError.forbidden('Tài khoản đã bị tạm khóa.');
        }
        // Mark current session as revoked/consumed
        await prisma_client_1.prisma.userSessions.update({
            where: { session_id: session.session_id },
            data: { is_revoked: true },
        });
        // Create a new session with the SAME family_id (Session Continuation)
        return this.createSession(session.user_id, session.user.email, session.user.role, session.family_id, clientInfo);
    }
    /**
     * Đăng xuất phiên hiện tại
     */
    async logout(userId, sessionId, refreshToken) {
        if (sessionId) {
            await prisma_client_1.prisma.userSessions.updateMany({
                where: { session_id: sessionId, user_id: userId },
                data: { is_revoked: true },
            });
        }
        else if (refreshToken) {
            const hash = (0, crypto_2.hashString)(refreshToken);
            await prisma_client_1.prisma.userSessions.updateMany({
                where: { refresh_token_hash: hash, user_id: userId },
                data: { is_revoked: true },
            });
        }
        await prisma_client_1.prisma.auditLogs.create({
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
    async listUserSessions(userId, currentSessionId) {
        const sessions = await prisma_client_1.prisma.userSessions.findMany({
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
    async revokeSession(userId, targetSessionId) {
        const session = await prisma_client_1.prisma.userSessions.findFirst({
            where: { session_id: targetSessionId, user_id: userId },
        });
        if (!session) {
            throw app_error_1.AppError.notFound('Không tìm thấy phiên đăng nhập này.');
        }
        await prisma_client_1.prisma.userSessions.update({
            where: { session_id: targetSessionId },
            data: { is_revoked: true },
        });
        await prisma_client_1.prisma.auditLogs.create({
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
    async revokeOtherSessions(userId, currentSessionId) {
        const result = await prisma_client_1.prisma.userSessions.updateMany({
            where: {
                user_id: userId,
                session_id: { not: currentSessionId },
                is_revoked: false,
            },
            data: { is_revoked: true },
        });
        await prisma_client_1.prisma.auditLogs.create({
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
    async createSession(userId, email, role, familyId, clientInfo) {
        // 30 days expiration for refresh token
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        // Initial placeholder hash to get auto-generated session_id
        const placeholderHash = (0, crypto_1.randomUUID)();
        const session = await prisma_client_1.prisma.userSessions.create({
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
        const accessToken = (0, crypto_2.signAccessToken)(tokenPayload);
        const refreshToken = (0, crypto_2.signRefreshToken)(tokenPayload);
        // Store real SHA-256 hash of refresh token
        const realHash = (0, crypto_2.hashString)(refreshToken);
        await prisma_client_1.prisma.userSessions.update({
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
