import { Request, Response, NextFunction } from 'express';
export declare class LearningController {
    getPinyin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMinimalPairs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCharacters: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCharacterDetail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    recordPractice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPracticeStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const learningController: LearningController;
