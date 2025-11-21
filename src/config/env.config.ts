import { config } from 'dotenv';
import { z } from 'zod';

config({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
config();

const envSchema = z
  .object({
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
    SENDGRID_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    NOTIFICATION_EMAIL: z.string().email().optional(),
    NEWSLETTER_CONFIRMATION_URL: z.string().url().optional(),
    PASSWORD_RESET_URL: z.string().url().optional()
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
