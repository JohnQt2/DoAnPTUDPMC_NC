"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    isOperational;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, code = 'BAD_REQUEST', details) {
        return new AppError(message, 400, code, details);
    }
    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details) {
        return new AppError(message, 401, code, details);
    }
    static forbidden(message = 'Access denied', code = 'FORBIDDEN', details) {
        return new AppError(message, 403, code, details);
    }
    static notFound(message = 'Resource not found', code = 'NOT_FOUND', details) {
        return new AppError(message, 404, code, details);
    }
    static conflict(message, code = 'CONFLICT', details) {
        return new AppError(message, 409, code, details);
    }
    static tooManyRequests(message, code = 'RATE_LIMIT_EXCEEDED', details) {
        return new AppError(message, 429, code, details);
    }
    static internal(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR', details) {
        return new AppError(message, 500, code, details);
    }
}
exports.AppError = AppError;
