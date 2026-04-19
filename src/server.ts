import http from 'http';

import logger from '@utils/logger/logger';

import env from '@config/env.config';
import { createRedisClient, disconnectRedis } from '@config/redis.config';
import connectDatabase, { disconnectDatabase } from '@database/connection';
import { scheduleNewsletterJob } from '@jobs/newsletter.job';
import { startPortfolioMetricsSync, stopPortfolioMetricsSync } from '@services/status.service';
import { initializeSockets } from '@sockets/index';

import app from './app';
import { ensureAdmin } from './scripts/ensureAdmin';


const server = http.createServer(app);
initializeSockets(server);

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureAdmin();

    if (env.REDIS_URL) {
      createRedisClient();
    }

    scheduleNewsletterJob();
    startPortfolioMetricsSync();

    server.listen(env.PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

void startServer();

const gracefulShutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Closing server gracefully...`);

  server.close(async (closeError) => {
    if (closeError) {
      logger.error('Error while closing HTTP server', { error: closeError });
      process.exit(1);
    }

    await disconnectDatabase();
    await disconnectRedis();
    stopPortfolioMetricsSync();
    process.exit(0);
  });
};

['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  gracefulShutdown('uncaughtException').catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  gracefulShutdown('unhandledRejection').catch(() => process.exit(1));
});
