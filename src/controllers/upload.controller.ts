import { successResponse } from '@utils/helpers/response.helper';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { saveFile } from '@services/upload.service';

export const uploadSingleFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const folder = (req.body?.folder as string | undefined) ?? 'temp';
    const result = await saveFile(file as Express.Multer.File, folder);
    return successResponse(res, result, 'File uploaded', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const folder = (req.body?.folder as string | undefined) ?? 'temp';
    const uploads = await Promise.all(files.map((file) => saveFile(file, folder)));
    return successResponse(res, uploads, 'Files uploaded', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};
