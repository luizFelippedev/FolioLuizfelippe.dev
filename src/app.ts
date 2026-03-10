import 'express-async-errors';

import path from 'node:path';

import { getMetrics, metricsRegister } from '@utils/metrics/metrics';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { HelmetOptions } from 'helmet';
import morgan from 'morgan';

import corsConfig from '@config/cors.config';
import env, { isProduction } from '@config/env.config';
import errorHandler from '@middleware/error.middleware';
import metricsMiddleware from '@middleware/metrics.middleware';
import notFoundHandler from '@middleware/notFound.middleware';
import requestIdMiddleware from '@middleware/requestId.middleware';
import routes from '@routes/index';

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

app.disable('x-powered-by');
app.set('trust proxy', 1);

const helmetConfig: HelmetOptions = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', env.CLIENT_URL, env.ASSET_BASE_URL],
      'media-src': ["'self'", 'data:', 'blob:', env.CLIENT_URL, env.ASSET_BASE_URL]
    }
  }
};

app.use(helmet(helmetConfig));
app.use(cors(corsConfig));
app.use(limiter);
app.use(requestIdMiddleware);
app.use(metricsMiddleware);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (!isProduction) {
  morgan.token('id', (req) => (req as Request).requestId ?? 'n/a');
  app.use(
    morgan(':id :method :url :status :res[content-length] - :response-time ms', {
      stream: {
        write: (message) => {
          // eslint-disable-next-line no-console
          console.log(message.trim());
        }
      }
    })
  );
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

app.get('/ready', (_req, res) => {
  res.json({
    status: 'ok',
    ready: true,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', metricsRegister.contentType);
  res.send(await getMetrics());
});

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
