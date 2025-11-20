import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface JsonResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const successResponse = <T>(res: Response, data: T, message?: string, status = StatusCodes.OK) => {
  const payload: JsonResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {})
  };

  return res.status(status).json(payload);
};

export const errorResponse = <T>(res: Response, message: string, status = StatusCodes.BAD_REQUEST, details?: T) => {
  const payload: JsonResponse<T> = {
    success: false,
    message,
    ...(details ? { data: details } : {})
  };

  return res.status(status).json(payload);
};
