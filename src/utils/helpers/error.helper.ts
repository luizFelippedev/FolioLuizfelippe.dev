export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createNotFoundError = (message = 'Resource not found') => new AppError(message, 404);
export const createUnauthorizedError = (message = 'Unauthorized') => new AppError(message, 401);
export const createForbiddenError = (message = 'Forbidden') => new AppError(message, 403);
export const createValidationError = (message = 'Validation failed', details?: unknown) =>
  new AppError(message, 400, details);
