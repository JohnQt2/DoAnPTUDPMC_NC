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
      const ip =
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        '127.0.0.1';
      const identifier = req.body?.email || ip;
      const key = `ratelimit:${options.keyPrefix}:${identifier}`;

      const current = await redisService.incr(key);

      if (current === 1) {
        await redisService.expire(key, options.windowSeconds);
      }

      const ttl = await redisService.ttl(key);
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current));
      res.setHeader('X-RateLimit-Reset', ttl);

      if (current > options.maxRequests) {
        return next(
          AppError.tooManyRequests(
            options.message ||
              `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây.`,
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
