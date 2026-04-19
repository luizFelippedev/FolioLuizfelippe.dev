import { recordAnalyticsEvent } from '@services/analytics.service';
import { getVisitorSessionIdFromRequest } from '@utils/visitor/visitorSession.helper';

import type { NextFunction, Request, Response } from 'express';

interface TrackOptions {
  resolvePayload?: (req: Request) => Record<string, unknown> | undefined;
}

export const trackAnalyticsEvent = (type: string, options: TrackOptions = {}) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await recordAnalyticsEvent({
        type,
        visitorSessionId: getVisitorSessionIdFromRequest(req) ?? undefined,
        locale: req.headers['accept-language']?.split(',')[0],
        referrer: req.get('referer') ?? undefined,
        userAgent: req.get('user-agent') ?? undefined,
        eventPayload: options.resolvePayload?.(req)
      });
    } catch (error) {
      // fail silently; analytics should not block user flow
    }

    next();
  };

export default trackAnalyticsEvent;
