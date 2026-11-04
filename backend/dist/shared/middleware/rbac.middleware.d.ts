import { Request, Response, NextFunction } from 'express';
export declare function authorize(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
