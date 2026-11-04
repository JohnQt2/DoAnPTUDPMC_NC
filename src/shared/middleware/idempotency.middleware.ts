import { Request, Response, NextFunction } from 'express';
import { redisService } from '../redis/redis.service';
import { AppError } from '../errors/app-error';

export function idempotency(ttlSeconds: number = 86400) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.headers['idempotency-key'] as string;

    // If no Idempotency-Key header is supplied, proceed normally
    if (!key) {
      return next();
    }

    const userId = req.user?.userId || 'guest';
    const redisKey = `idempotency:${userId}:${key}`;

    try {
      const cached = await redisService.get(redisKey);

      if (cached) {
        if (cached === 'IN_PROGRESS') {
          return next(
            AppError.conflict(
              'Yêu cầu trước đó với mã Idempotency-Key này đang được xử lý. Vui lòng chờ kết quả.',
              'IDEMPOTENT_REQUEST_IN_PROGRESS'
            )
          );
        }

        // Return the cached idempotent response
        try {
          const parsed = JSON.parse(cached);
          res.setHeader('X-Idempotent-Replay', 'true');
          res.status(parsed.status || 200).json(parsed.body);
          return;
        } catch {
          // If parse fails, clear and proceed
          await redisService.del(redisKey);
        }
      }

      // Mark request as IN_PROGRESS with a short lock TTL (60s)
      await redisService.set(redisKey, 'IN_PROGRESS', 60);

      // Intercept res.json to cache successful response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisService.set(
            redisKey,
            JSON.stringify({ status: res.statusCode, body }),
            ttlSeconds
          ).catch((err) => console.error('Failed to cache idempotent result:', err));
        } else {
          // If response was error, clear in-progress lock so user can retry
          redisService.del(redisKey).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
