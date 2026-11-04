import { Request, Response, NextFunction } from 'express';
export declare class UserController {
    getProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    submitOnboarding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateNotifications: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    adminListUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    adminUpdateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const userController: UserController;
