import type { Request, Response, NextFunction } from 'express';

import { successResponse } from '@utils/helpers/response.helper';
import { fetchStatusSummary } from '@services/status.service';

export const statusSummaryHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await fetchStatusSummary();
    return successResponse(res, summary);
  } catch (error) {
    return next(error);
  }
};
