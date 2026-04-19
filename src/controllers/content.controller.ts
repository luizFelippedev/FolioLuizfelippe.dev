import { successResponse } from '@utils/helpers/response.helper';
import type { NextFunction, Request, Response } from 'express';

import {
  getAdminContentOverride,
  getPublicContentOverride,
  resetContentOverride,
  upsertContentOverride
} from '@services/content.service';

export const getPublicContentOverrideHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await getPublicContentOverride(req.params.locale);
    return successResponse(res, payload);
  } catch (error) {
    return next(error);
  }
};

export const getAdminContentOverrideHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await getAdminContentOverride(req.params.locale);
    return successResponse(res, payload);
  } catch (error) {
    return next(error);
  }
};

export const upsertAdminContentOverrideHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await upsertContentOverride(req.params.locale, req.body.overrides, req.user?.email);
    return successResponse(res, payload, 'Content override saved');
  } catch (error) {
    return next(error);
  }
};

export const resetAdminContentOverrideHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await resetContentOverride(req.params.locale);
    return successResponse(res, payload, 'Content override reset');
  } catch (error) {
    return next(error);
  }
};
