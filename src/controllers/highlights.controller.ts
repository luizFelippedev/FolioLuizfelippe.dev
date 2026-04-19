import { parsePagination } from '@utils/helpers/pagination.helper';
import { successResponse } from '@utils/helpers/response.helper';
import type { NextFunction, Request, Response } from 'express';

import { resolveRequestAudienceContext } from '@services/audienceAccess.service';
import { listHomeHighlights } from '@services/homeHighlights.service';

export const listHomeHighlightsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 12,
      maxLimit: 30
    });
    const audienceContext = await resolveRequestAudienceContext(req);

    const highlights = await listHomeHighlights({
      page: pagination.page,
      limit: pagination.limit,
      viewerSegment: audienceContext.viewerSegment,
      isAdminBypass: audienceContext.isAdminBypass
    });

    return successResponse(res, highlights);
  } catch (error) {
    return next(error);
  }
};
