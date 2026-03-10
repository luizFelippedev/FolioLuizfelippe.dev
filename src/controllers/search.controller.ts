import { successResponse } from '@utils/helpers/response.helper';
import type { NextFunction, Request, Response } from 'express';

import { searchContent } from '@services/search.service';
import type { SearchQuery } from '@validators/search.validator';

export const searchHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = req.query as unknown as SearchQuery;
    const data = await searchContent(q, limit);
    return successResponse(res, data);
  } catch (error) {
    return next(error);
  }
};
