export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: any) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message: string = 'Unauthorized', code = 'UNAUTHORIZED', details?: any) {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message: string = 'Access denied', code = 'FORBIDDEN', details?: any) {
    return new AppError(message, 403, code, details);
  }

  static notFound(message: string = 'Resource not found', code = 'NOT_FOUND', details?: any) {
    return new AppError(message, 404, code, details);
  }

  static conflict(message: string, code = 'CONFLICT', details?: any) {
    return new AppError(message, 409, code, details);
  }

  static tooManyRequests(message: string, code = 'RATE_LIMIT_EXCEEDED', details?: any) {
    return new AppError(message, 429, code, details);
  }

  static internal(message: string = 'Internal server error', code = 'INTERNAL_SERVER_ERROR', details?: any) {
    return new AppError(message, 500, code, details);
  }
}
