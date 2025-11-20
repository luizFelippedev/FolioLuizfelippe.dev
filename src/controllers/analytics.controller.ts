import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  getAnalyticsSummary,
  getAnalyticsTimeline,
  recordAnalyticsEvent
} from '@services/analytics.service';
import { successResponse } from '@utils/helpers/response.helper';

export const ingestEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await recordAnalyticsEvent({
      type: req.body.type,
      locale: req.body.locale,
      referrer: req.body.referrer,
      userAgent: req.get('user-agent') ?? undefined,
      eventPayload: req.body.payload
    });

    return successResponse(res, { stored: true }, 'Event captured', StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
};

export const analyticsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getAnalyticsSummary({
      type: req.query.type as string | undefined,
      from: req.query.from ? new Date(String(req.query.from)) : undefined,
      to: req.query.to ? new Date(String(req.query.to)) : undefined
    });

    return successResponse(res, summary);
  } catch (error) {
    return next(error);
  }
};

export const analyticsTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeline = await getAnalyticsTimeline({
      type: req.query.type as string | undefined,
      from: req.query.from ? new Date(String(req.query.from)) : undefined,
      to: req.query.to ? new Date(String(req.query.to)) : undefined
    });

    return successResponse(res, timeline);
  } catch (error) {
    return next(error);
  }
};
