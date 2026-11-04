"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotency = idempotency;
const redis_service_1 = require("../redis/redis.service");
const app_error_1 = require("../errors/app-error");
function idempotency(ttlSeconds = 86400) {
    return async (req, res, next) => {
        const key = req.headers['idempotency-key'];
        // If no Idempotency-Key header is supplied, proceed normally
        if (!key) {
            return next();
        }
        const userId = req.user?.userId || 'guest';
        const redisKey = `idempotency:${userId}:${key}`;
        try {
            const cached = await redis_service_1.redisService.get(redisKey);
            if (cached) {
                if (cached === 'IN_PROGRESS') {
                    return next(app_error_1.AppError.conflict('Yêu cầu trước đó với mã Idempotency-Key này đang được xử lý. Vui lòng chờ kết quả.', 'IDEMPOTENT_REQUEST_IN_PROGRESS'));
                }
                // Return the cached idempotent response
                try {
                    const parsed = JSON.parse(cached);
                    res.setHeader('X-Idempotent-Replay', 'true');
                    res.status(parsed.status || 200).json(parsed.body);
                    return;
                }
                catch {
                    // If parse fails, clear and proceed
                    await redis_service_1.redisService.del(redisKey);
                }
            }
            // Mark request as IN_PROGRESS with a short lock TTL (60s)
            await redis_service_1.redisService.set(redisKey, 'IN_PROGRESS', 60);
            // Intercept res.json to cache successful response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redis_service_1.redisService.set(redisKey, JSON.stringify({ status: res.statusCode, body }), ttlSeconds).catch((err) => console.error('Failed to cache idempotent result:', err));
                }
                else {
                    // If response was error, clear in-progress lock so user can retry
                    redis_service_1.redisService.del(redisKey).catch(() => { });
                }
                return originalJson(body);
            };
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
