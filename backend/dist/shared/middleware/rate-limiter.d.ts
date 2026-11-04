import { Request, Response, NextFunction } from 'express';
export declare function rateLimit(options: {
    windowSeconds: number;
    maxRequests: number;
    keyPrefix: string;
    message?: string;
}): (req: Request, res: Response, next: NextFunction) => Promise<void>;
