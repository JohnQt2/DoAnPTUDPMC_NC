export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: any;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
    static badRequest(message: string, code?: string, details?: any): AppError;
    static unauthorized(message?: string, code?: string, details?: any): AppError;
    static forbidden(message?: string, code?: string, details?: any): AppError;
    static notFound(message?: string, code?: string, details?: any): AppError;
    static conflict(message: string, code?: string, details?: any): AppError;
    static tooManyRequests(message: string, code?: string, details?: any): AppError;
    static internal(message?: string, code?: string, details?: any): AppError;
}
