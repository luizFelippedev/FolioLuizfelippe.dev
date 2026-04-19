import { successResponse } from '@utils/helpers/response.helper';
import { getClientIp } from '@utils/network/clientIp';
import {
  buildVisitorSessionCookieOptions,
  getVisitorSessionIdFromRequest,
  VISITOR_SESSION_COOKIE
} from '@utils/visitor/visitorSession.helper';
import {
  getVisitorIntelSessions,
  getVisitorIntelSummary,
  getVisitorSessionSnapshot,
  recordVisitorEvent,
  upsertVisitorSession
} from '@services/visitor.service';
import type {
  RecordVisitorEventInput,
  UpsertVisitorSessionInput,
  VisitorIntelSessionsQueryInput
} from '@validators/visitor.validator';

import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const getVisitorSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await getVisitorSessionSnapshot(getVisitorSessionIdFromRequest(req));

    if (snapshot.gateRequired) {
      res.clearCookie(VISITOR_SESSION_COOKIE, buildVisitorSessionCookieOptions());
    }

    return successResponse(res, snapshot);
  } catch (error) {
    return next(error);
  }
};

export const upsertVisitorSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as UpsertVisitorSessionInput;
    const session = await upsertVisitorSession({
      segment: body.segment,
      entryPath: body.entryPath,
      locale: body.locale,
      referrer: body.referrer,
      utm: body.utm,
      identity: body.identity,
      sessionId: getVisitorSessionIdFromRequest(req),
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent')
    });

    res.cookie(VISITOR_SESSION_COOKIE, session.sessionId, buildVisitorSessionCookieOptions());

    return successResponse(
      res,
      {
        gateRequired: false,
        session: session.session,
        account: session.account
      },
      'Visitor session captured',
      StatusCodes.CREATED
    );
  } catch (error) {
    return next(error);
  }
};

export const recordVisitorEventHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await recordVisitorEvent({
      sessionId: getVisitorSessionIdFromRequest(req),
      locale: req.headers['accept-language']?.split(',')[0],
      referrer: req.get('referer') ?? undefined,
      userAgent: req.get('user-agent'),
      input: req.body as RecordVisitorEventInput
    });

    return successResponse(
      res,
      {
        stored: true,
        session
      },
      'Visitor event captured',
      StatusCodes.ACCEPTED
    );
  } catch (error) {
    return next(error);
  }
};

export const visitorIntelSummaryHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getVisitorIntelSummary();
    return successResponse(res, summary);
  } catch (error) {
    return next(error);
  }
};

export const visitorIntelSessionsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await getVisitorIntelSessions(req.query as unknown as VisitorIntelSessionsQueryInput);
    return successResponse(res, sessions);
  } catch (error) {
    return next(error);
  }
};
