import env from '@config/env.config';

export interface EmailTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export const emailConfig: EmailTransportConfig = {
  host: env.SMTP_HOST ?? '',
  port: env.SMTP_PORT ?? 587,
  secure: env.SMTP_SECURE ?? false,
  auth:
    env.SMTP_USER && env.SMTP_PASSWORD
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD
        }
      : undefined
};

export default emailConfig;
