"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const crypto_1 = require("../utils/crypto");
const app_error_1 = require("../errors/app-error");
const prisma_client_1 = require("../database/prisma.client");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw app_error_1.AppError.unauthorized('Vui lòng đăng nhập để tiếp tục.');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw app_error_1.AppError.unauthorized('Token xác thực không hợp lệ.');
        }
        const payload = (0, crypto_1.verifyAccessToken)(token);
        // Verify user exists and is active
        const user = await prisma_client_1.prisma.users.findUnique({
            where: { user_id: payload.userId },
            select: { user_id: true, email: true, role: true, status: true },
        });
        if (!user) {
            throw app_error_1.AppError.unauthorized('Tài khoản không tồn tại.');
        }
        if (user.status === 'BANNED' || user.status === 'LOCKED') {
            throw app_error_1.AppError.forbidden('Tài khoản đã bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.');
        }
        req.user = {
            userId: user.user_id,
            email: user.email,
            role: user.role,
            sessionId: payload.sessionId,
            familyId: payload.familyId,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            next(app_error_1.AppError.unauthorized('Phiên làm việc đã hết hạn. Vui lòng làm mới phiên.', 'TOKEN_EXPIRED'));
            return;
        }
        if (error.name === 'JsonWebTokenError') {
            next(app_error_1.AppError.unauthorized('Chữ ký xác thực không hợp lệ.', 'INVALID_TOKEN'));
            return;
        }
        next(error);
    }
}
async function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token)
        return next();
    try {
        const payload = (0, crypto_1.verifyAccessToken)(token);
        req.user = payload;
    }
    catch {
        // Ignore invalid token in optional auth
    }
    next();
}
