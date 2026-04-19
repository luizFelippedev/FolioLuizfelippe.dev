import { successResponse } from '@utils/helpers/response.helper';
import type { NextFunction, Request, Response } from 'express';

import { resolveRequestAudienceContext } from '@services/audienceAccess.service';
import { searchContent } from '@services/search.service';
import type { SearchQuery } from '@validators/search.validator';

export const searchHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = req.query as unknown as SearchQuery;
    const audienceContext = await resolveRequestAudienceContext(req);
    const data = await searchContent(q, limit, audienceContext);
    return successResponse(res, data);
  } catch (error) {
    return next(error);
  }
};
