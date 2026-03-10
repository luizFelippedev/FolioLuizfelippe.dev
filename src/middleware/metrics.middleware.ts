import { httpRequestCounter, httpRequestDuration } from '@utils/metrics/metrics';
import type { NextFunction, Request, Response } from 'express';


const sanitizeRoute = (req: Request): string => {
  if (req.route?.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  return req.originalUrl.split('?')[0];
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const route = sanitizeRoute(req);
  const end = httpRequestDuration.startTimer({ method: req.method, route });

  res.on('finish', () => {
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestCounter.inc(labels);
    end(labels);
  });

  next();
};

export default metricsMiddleware;
