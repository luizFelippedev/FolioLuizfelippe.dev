import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const headerName = 'x-request-id';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers[headerName] as string | undefined;
  const requestId = incomingId && incomingId.trim().length ? incomingId : randomUUID();

  req.requestId = requestId;
  res.setHeader(headerName, requestId);

  next();
};

export default requestIdMiddleware;
