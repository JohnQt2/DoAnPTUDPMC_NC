import { Request, Response, NextFunction } from 'express';
export declare class AssessmentController {
    listQuestions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createQuestion: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateQuestion: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteQuestion: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createTest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTestDetail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateTest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    assignQuestions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    startTestSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    submitTest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    checkUnlockStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getUserSubmissions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSubmissionDetail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const assessmentController: AssessmentController;
