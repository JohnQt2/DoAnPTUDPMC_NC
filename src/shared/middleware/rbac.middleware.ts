import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Yêu cầu xác thực tài khoản.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: [${allowedRoles.join(', ')}]`,
          'FORBIDDEN_INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}
