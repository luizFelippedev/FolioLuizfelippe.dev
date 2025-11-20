import type { TransformableInfo } from 'logform';
import { format, transports, createLogger as createWinstonLogger } from 'winston';

import env, { isProduction } from '@config/env.config';

const { combine, colorize, timestamp, printf, errors, json, splat } = format;

const consoleFormat = combine(
  colorize(),
  splat(),
  timestamp(),
  errors({ stack: true }),
  printf(({ level, message, timestamp: time, stack, ...rest }: TransformableInfo & { timestamp?: string }) => {
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `${time} [${level}] ${message}${stack ? `\n${stack}` : ''}${meta}`;
  })
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

export const createLogger = () =>
  createWinstonLogger({
    level: isProduction ? 'info' : 'debug',
    defaultMeta: { service: 'portfolio-backend', environment: env.NODE_ENV },
    transports: [
      new transports.Console({ format: consoleFormat })
    ],
    exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log', format: fileFormat })],
    rejectionHandlers: [new transports.File({ filename: 'logs/rejections.log', format: fileFormat })]
  });

export default createLogger;
