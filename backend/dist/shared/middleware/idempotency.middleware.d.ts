import { Request, Response, NextFunction } from 'express';
export declare function idempotency(ttlSeconds?: number): (req: Request, res: Response, next: NextFunction) => Promise<void>;
