import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/crypto';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
