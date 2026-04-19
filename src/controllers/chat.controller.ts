import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@utils/helpers/error.helper';
import { successResponse } from '@utils/helpers/response.helper';
import { getVisitorSessionIdFromRequest } from '@utils/visitor/visitorSession.helper';
import {
  getPortfolioAssistantStatus,
  streamPortfolioAssistant
} from '@services/chat.service';
import { resolveVisitorAccessContext } from '@services/visitor.service';
import type { PortfolioAssistantStreamInput } from '@validators/chat.validator';

const writeSseEvent = (res: Response, event: string, payload: Record<string, unknown>) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  res.flush?.();
};

export const portfolioAssistantStatusHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await getPortfolioAssistantStatus();
    return successResponse(res, status);
  } catch (error) {
    return next(error);
  }
};

export const streamPortfolioAssistantHandler = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as PortfolioAssistantStreamInput;
  const abortController = new AbortController();
  const closeHandler = () => abortController.abort();

  req.on('close', closeHandler);

  try {
    const visitorContext = await resolveVisitorAccessContext(getVisitorSessionIdFromRequest(req));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const result = await streamPortfolioAssistant({
      messages: body.messages,
      locale: body.locale,
      page: body.page,
      visitorContext,
      signal: abortController.signal,
      onReady: ({ model }) => {
        if (!res.writableEnded) {
          writeSseEvent(res, 'ready', {
            model,
            timestamp: new Date().toISOString()
          });
        }
      },
      onToken: (token) => {
        if (!res.writableEnded) {
          writeSseEvent(res, 'token', { token });
        }
      }
    });

    if (!res.writableEnded) {
      writeSseEvent(res, 'done', {
        model: result.model,
        text: result.text
      });
      res.end();
    }
  } catch (error) {
    if (abortController.signal.aborted) {
      if (!res.writableEnded) {
        res.end();
      }
      return;
    }

    if (res.headersSent && !res.writableEnded) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('Portfolio assistant stream failed.', 502, undefined, true, 'chatbot_stream_failed');

      writeSseEvent(res, 'error', {
        message: appError.message,
        code: appError.code
      });
      res.end();
      return;
    }

    return next(error);
  } finally {
    req.off('close', closeHandler);
  }
};
