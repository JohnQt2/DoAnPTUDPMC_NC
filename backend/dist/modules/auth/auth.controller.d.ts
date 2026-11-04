import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    private getClientInfo;
    private setRefreshTokenCookie;
    private clearRefreshTokenCookie;
    sendOtp: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    verifyOtp: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    googleAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    refresh: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    revokeSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    revokeOtherSessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const authController: AuthController;
