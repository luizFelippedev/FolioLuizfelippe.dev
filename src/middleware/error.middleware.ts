import type { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { AppError } from '@utils/helpers/error.helper';
import logger from '@utils/logger/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const appError = error instanceof AppError ? error : new AppError(error.message);
  const status = appError.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;

  if (!appError.isOperational) {
    logger.error('Unexpected error occurred', { error: appError });
  } else {
    logger.warn(appError.message, { status, details: appError.details });
  }

  res.status(status).json({
    success: false,
    message: appError.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    ...(appError.details ? { details: appError.details } : {}),
    ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
  });
};

export default errorHandler;
