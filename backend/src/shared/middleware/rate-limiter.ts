import { Request, Response, NextFunction } from 'express';
import { redisService } from '../redis/redis.service';
import { AppError } from '../errors/app-error';

export function rateLimit(options: {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const normalizedEmail =
        typeof req.body?.email === 'string' && req.body.email.trim()
          ? req.body.email.trim().toLowerCase()
          : null;

      // Enforce rate limit on BOTH client IP and target email (when present) to stop distributed / rotating-email abuse
      const keys = normalizedEmail
        ? [`ratelimit:${options.keyPrefix}:ip:${rawIp}`, `ratelimit:${options.keyPrefix}:email:${normalizedEmail}`]
        : [`ratelimit:${options.keyPrefix}:ip:${rawIp}`];

      let maxCurrent = 0;
      let maxTtl = 0;

      for (const key of keys) {
        const current = await redisService.incr(key);
        if (current === 1) {
          await redisService.expire(key, options.windowSeconds);
        }
        const ttl = await redisService.ttl(key);
        if (current > maxCurrent) maxCurrent = current;
        if (ttl > maxTtl) maxTtl = ttl;
      }

      const remainingSeconds = maxTtl > 0 ? maxTtl : options.windowSeconds;

      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - maxCurrent));
      res.setHeader('X-RateLimit-Reset', remainingSeconds);

      if (maxCurrent > options.maxRequests) {
        res.setHeader('Retry-After', String(remainingSeconds));
        const waitText =
          remainingSeconds >= 60
            ? `${Math.ceil(remainingSeconds / 60)} phút`
            : `${Math.max(1, remainingSeconds)} giây`;
        return next(
          AppError.tooManyRequests(
            options.message
              ? `${options.message} (Thử lại sau ${waitText})`
              : `Bạn vừa thao tác quá nhanh. Vui lòng thử lại sau ${waitText}.`,
            'RATE_LIMIT_EXCEEDED',
            { remainingSeconds: Math.max(1, remainingSeconds) }
          )
        );
      }

      next();
    } catch (err) {
      // In case of rate limiter glitch, don't block user
      next();
    }
  };
}
