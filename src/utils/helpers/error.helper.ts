export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly code: string;

  constructor(message: string, statusCode = 500, details?: unknown, isOperational = true, code = 'internal_error') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createNotFoundError = (message = 'Resource not found') => new AppError(message, 404, undefined, true, 'not_found');
export const createUnauthorizedError = (message = 'Unauthorized') =>
  new AppError(message, 401, undefined, true, 'unauthorized');
export const createForbiddenError = (message = 'Forbidden') => new AppError(message, 403, undefined, true, 'forbidden');
export const createValidationError = (message = 'Validation failed', details?: unknown) =>
  new AppError(message, 400, details, true, 'validation_failed');
