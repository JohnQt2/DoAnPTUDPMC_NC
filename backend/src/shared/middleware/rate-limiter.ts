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
      let maxTtl = options.windowSeconds;

      for (const key of keys) {
        const current = await redisService.incr(key);
        if (current === 1) {
          await redisService.expire(key, options.windowSeconds);
        }
        const ttl = await redisService.ttl(key);
        if (current > maxCurrent) maxCurrent = current;
        if (ttl > maxTtl) maxTtl = ttl;
      }

      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - maxCurrent));
      res.setHeader('X-RateLimit-Reset', maxTtl);

      if (maxCurrent > options.maxRequests) {
        return next(
          AppError.tooManyRequests(
            options.message ||
              `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${maxTtl} giây.`,
            'RATE_LIMIT_EXCEEDED'
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
