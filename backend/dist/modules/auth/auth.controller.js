"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./auth.dto");
const env_1 = require("../../config/env");
class AuthController {
    getClientInfo(req) {
        return {
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'Unknown Device',
        };
    }
    setRefreshTokenCookie(res, token) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
        });
    }
    clearRefreshTokenCookie(res) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }
    sendOtp = async (req, res, next) => {
        try {
            const { email } = auth_dto_1.SendOtpDto.parse(req.body);
            const result = await auth_service_1.authService.sendEmailOtp(email);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    verifyOtp = async (req, res, next) => {
        try {
            const { email, otp } = auth_dto_1.VerifyOtpDto.parse(req.body);
            const clientInfo = this.getClientInfo(req);
            const result = await auth_service_1.authService.verifyEmailOtp(email, otp, clientInfo);
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
        }
        catch (err) {
            next(err);
        }
    };
    googleAuth = async (req, res, next) => {
        try {
            const dto = auth_dto_1.GoogleAuthDto.parse(req.body);
            const clientInfo = this.getClientInfo(req);
            const result = await auth_service_1.authService.loginWithGoogle(dto, clientInfo);
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
        }
        catch (err) {
            next(err);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const tokenFromCookie = req.cookies?.refreshToken;
            const parsedBody = auth_dto_1.RefreshTokenDto.safeParse(req.body);
            const tokenFromBody = parsedBody.success ? parsedBody.data.refreshToken : undefined;
            const tokenToUse = tokenFromCookie || tokenFromBody;
            const clientInfo = this.getClientInfo(req);
            const result = await auth_service_1.authService.rotateRefreshToken(tokenToUse, clientInfo);
            this.setRefreshTokenCookie(res, result.refreshToken);
            res.status(200).json({
                success: true,
                data: {
                    accessToken: result.accessToken,
                    expiresIn: 900,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const sessionId = req.user?.sessionId;
            const tokenFromCookie = req.cookies?.refreshToken;
            if (userId) {
                await auth_service_1.authService.logout(userId, sessionId, tokenFromCookie);
            }
            this.clearRefreshTokenCookie(res);
            res.status(200).json({
                success: true,
                data: { message: 'Đăng xuất thành công.' },
            });
        }
        catch (err) {
            next(err);
        }
    };
    getSessions = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const currentSessionId = req.user.sessionId;
            const sessions = await auth_service_1.authService.listUserSessions(userId, currentSessionId);
            res.status(200).json({ success: true, data: sessions });
        }
        catch (err) {
            next(err);
        }
    };
    revokeSession = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const targetSessionId = parseInt(req.params.sessionId, 10);
            await auth_service_1.authService.revokeSession(userId, targetSessionId);
            res.status(200).json({
                success: true,
                data: { message: 'Đã thu hồi phiên đăng nhập thiết bị thành công.' },
            });
        }
        catch (err) {
            next(err);
        }
    };
    revokeOtherSessions = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const currentSessionId = req.user.sessionId;
            if (!currentSessionId) {
                res.status(400).json({ success: false, error: { message: 'Không thể xác định phiên hiện tại.' } });
                return;
            }
            const result = await auth_service_1.authService.revokeOtherSessions(userId, currentSessionId);
            res.status(200).json({
                success: true,
                data: {
                    message: `Đã thu hồi thành công ${result.revokedCount} phiên đăng nhập trên các thiết bị khác.`,
                    revokedCount: result.revokedCount,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
