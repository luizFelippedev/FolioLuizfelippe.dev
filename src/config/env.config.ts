import { existsSync, readFileSync } from 'node:fs';

import { config, parse } from 'dotenv';
import { z } from 'zod';

const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
config();

const envOverridesPath = `.env.${appEnv}`;

if (existsSync(envOverridesPath)) {
  const envOverrides = parse(readFileSync(envOverridesPath));

  for (const [key, value] of Object.entries(envOverrides)) {
    const hasValue = value.trim().length > 0;

    if (hasValue || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = appEnv;
}

const envSchema = z
  .object({
    APP_ENV: z.enum(['development', 'production', 'test']).optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    ASSET_BASE_URL: z.string().url().default('http://localhost:4000'),
    CORS_ORIGINS: z.string().optional(),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().url().optional(),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_EMAIL_ALIASES: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    SENDGRID_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    NOTIFICATION_EMAIL: z.string().email().optional(),
    NEWSLETTER_CONFIRMATION_URL: z.string().url().optional(),
    PASSWORD_RESET_URL: z.string().url().optional(),
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_USERNAME: z.string().default('luizFelippedev'),
    GITHUB_METRICS_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    INSTAGRAM_USER_ID: z.string().optional(),
    INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
    INSTAGRAM_METRICS_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    GROQ_API_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
    GROQ_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
    GROQ_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.45),
    GROQ_TOP_P: z.coerce.number().min(0).max(1).default(0.9)
  })
  .superRefine((values, ctx) => {
    const requiresSmtpAuth = Boolean(values.SMTP_USER || values.SMTP_PASSWORD);
    if (requiresSmtpAuth && (!values.SMTP_HOST || !values.SMTP_PORT)) {
      ctx.addIssue({
        path: ['SMTP_HOST'],
        code: z.ZodIssueCode.custom,
        message: 'SMTP_HOST and SMTP_PORT are required when SMTP credentials are provided.'
      });
    }
  });

const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export default env;
