"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const redis_service_1 = require("../redis/redis.service");
const app_error_1 = require("../errors/app-error");
function rateLimit(options) {
    return async (req, res, next) => {
        try {
            const ip = req.headers['x-forwarded-for'] ||
                req.socket.remoteAddress ||
                '127.0.0.1';
            const identifier = req.body?.email || ip;
            const key = `ratelimit:${options.keyPrefix}:${identifier}`;
            const current = await redis_service_1.redisService.incr(key);
            if (current === 1) {
                await redis_service_1.redisService.expire(key, options.windowSeconds);
            }
            const ttl = await redis_service_1.redisService.ttl(key);
            res.setHeader('X-RateLimit-Limit', options.maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current));
            res.setHeader('X-RateLimit-Reset', ttl);
            if (current > options.maxRequests) {
                return next(app_error_1.AppError.tooManyRequests(options.message ||
                    `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây.`, 'RATE_LIMIT_EXCEEDED'));
            }
            next();
        }
        catch (err) {
            // In case of rate limiter glitch, don't block user
            next();
        }
    };
}
