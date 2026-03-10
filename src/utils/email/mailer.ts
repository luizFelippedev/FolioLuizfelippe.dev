import logger from '@utils/logger/logger';
import nodemailer from 'nodemailer';

import emailConfig from '@config/email.config';
import { isDevelopment } from '@config/env.config';

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth
  });

  if (isDevelopment) {
    transporter
      .verify()
      .then(() => {
        logger.info('Email transporter verified');
      })
      .catch((error: unknown) => {
        logger.warn('Email transporter verification failed', { error });
      });
  }

  return transporter;
};

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

export const sendEmail = async (options: SendEmailOptions) => {
  const mailer = getTransporter();

  const fromAddress = options.from ?? (emailConfig.auth?.user ?? 'no-reply@portfolio.local');

  await mailer.sendMail({
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  });
};
