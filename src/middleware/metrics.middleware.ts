import { httpRequestCounter, httpRequestDuration } from '@utils/metrics/metrics';
import type { NextFunction, Request, Response } from 'express';


const sanitizeRoute = (req: Request): string => {
  if (req.route?.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  return req.originalUrl.split('?')[0];
};

const requestTimestamps: number[] = [];
const ONE_MINUTE_MS = 60 * 1000;

const pruneOldRequests = (now = Date.now()) => {
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > ONE_MINUTE_MS) {
    requestTimestamps.shift();
  }
};

export const getRequestsPerMinuteSnapshot = () => {
  pruneOldRequests();
  return requestTimestamps.length;
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const route = sanitizeRoute(req);
  const end = httpRequestDuration.startTimer({ method: req.method, route });

  res.on('finish', () => {
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestCounter.inc(labels);
    end(labels);
    requestTimestamps.push(Date.now());
    pruneOldRequests();
  });

  next();
};

export default metricsMiddleware;
