import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Dữ liệu đầu vào không hợp lệ.',
        code: 'VALIDATION_ERROR',
        details: formatted,
      },
    });
    return;
  }

  // Handle Prisma Known Request Error
  if (err?.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: {
        message: 'Bản ghi với thông tin này đã tồn tại trong hệ thống.',
        code: 'DUPLICATE_RECORD',
        details: err.meta?.target,
      },
    });
    return;
  }

  if (err?.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: {
        message: 'Không tìm thấy dữ liệu yêu cầu.',
        code: 'RECORD_NOT_FOUND',
      },
    });
    return;
  }

  const errorName = err instanceof Error ? err.name : 'UnknownError';
  console.error(`Unhandled server error (${errorName}) on ${req.method} ${req.path}`);

  res.status(500).json({
    success: false,
    error: {
      message: 'Đã xảy ra lỗi hệ thống nội bộ.',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
