import { AppError } from '@utils/helpers/error.helper';
import { broadcastAdminNotification } from '@utils/helpers/notifications';
import { parsePagination } from '@utils/helpers/pagination.helper';
import { successResponse } from '@utils/helpers/response.helper';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';


import { createLab, deleteLab, listLabs, updateLab } from '@services/labs.service';


export const listPublicLabsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const labs = await listLabs({ filters: { active: true } });
    return successResponse(res, labs);
  } catch (error) {
    return next(error);
  }
};

export const listAdminLabsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
    const labs = await listLabs({ skip: pagination.skip, limit: pagination.limit });
    return successResponse(res, labs);
  } catch (error) {
    return next(error);
  }
};

export const createLabHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lab = await createLab(req.body);
    broadcastAdminNotification({
      title: 'Lab created',
      message: `${lab.title} is now available`,
      type: 'success'
    });
    return successResponse(res, lab, 'Lab created', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const updateLabHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await updateLab(req.params.id, req.body);
    if (!updated) {
      return next(new AppError('Lab not found', StatusCodes.NOT_FOUND));
    }
    broadcastAdminNotification({
      title: 'Lab updated',
      message: `${updated.title} just changed (${req.body.status ?? 'content'})`,
      type: 'info'
    });
    return successResponse(res, updated, 'Lab updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteLabHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lab = await deleteLab(req.params.id);
    if (!lab) {
      return next(new AppError('Lab not found', StatusCodes.NOT_FOUND));
    }
    broadcastAdminNotification({
      title: 'Lab removed',
      message: `${lab.title} left the roadmap`,
      type: 'warning'
    });
    return successResponse(res, lab, 'Lab deleted');
  } catch (error) {
    return next(error);
  }
};
