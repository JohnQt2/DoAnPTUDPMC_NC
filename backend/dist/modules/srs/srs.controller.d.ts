import { Request, Response, NextFunction } from 'express';
export declare class SrsController {
    getDailyQueue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    submitReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    previewIntervals: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const srsController: SrsController;
