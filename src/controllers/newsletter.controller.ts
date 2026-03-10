import { AppError } from '@utils/helpers/error.helper';
import { successResponse } from '@utils/helpers/response.helper';
import logger from '@utils/logger/logger';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import env from '@config/env.config';
import { runNewsletterJobOnce } from '@jobs/newsletter.job';
import { recordActivity } from '@services/activityLog.service';
import { sendNewsletterConfirmationEmail } from '@services/email.service';
import {
  confirmSubscription,
  listSubscribers,
  removeSubscriber,
  subscribeToNewsletter,
  unsubscribe
} from '@services/newsletter.service';


export const subscribeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriber = await subscribeToNewsletter(req.body);

    if (subscriber.confirmationToken) {
      const confirmationUrl = env.NEWSLETTER_CONFIRMATION_URL
        ? `${env.NEWSLETTER_CONFIRMATION_URL}?token=${subscriber.confirmationToken}`
        : `${env.CLIENT_URL.replace(/\/$/, '')}/newsletter/confirm?token=${subscriber.confirmationToken}`;

      void sendNewsletterConfirmationEmail(subscriber.email, {
        name: subscriber.name ?? undefined,
        confirmationLink: confirmationUrl
      }).catch((error) => {
        logger.warn('Failed to send newsletter confirmation email', { error });
      });
    }

    return successResponse(res, subscriber, 'Confirmation email sent', StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
};

export const confirmHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriber = await confirmSubscription(req.params.token);
    return successResponse(res, subscriber, 'Subscription confirmed');
  } catch (error) {
    return next(error);
  }
};

export const unsubscribeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriber = await unsubscribe(req.body.email);
    return successResponse(res, subscriber, 'You have been unsubscribed');
  } catch (error) {
    return next(error);
  }
};

export const listSubscribersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { confirmed, tag } = req.query as { confirmed?: boolean; tag?: string };
    const subscribers = await listSubscribers({ confirmed, tag });

    return successResponse(res, subscribers);
  } catch (error) {
    return next(error);
  }
};

export const deleteSubscriberHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await removeSubscriber(req.params.id);

    if (!deleted) {
      return next(new AppError('Subscriber not found', StatusCodes.NOT_FOUND));
    }

    await recordActivity({
      action: 'newsletter:delete',
      actor: req.user,
      target: { id: req.params.id, type: 'NewsletterSubscriber' },
      metadata: { email: deleted.email }
    });

    return successResponse(res, deleted, 'Subscriber removed');
  } catch (error) {
    return next(error);
  }
};

export const triggerNewsletterHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runNewsletterJobOnce({
      subject: req.body?.subject,
      content: req.body?.content
    });

    await recordActivity({
      action: 'newsletter:send',
      actor: req.user,
      metadata: {
        subject: req.body?.subject,
        hasCustomContent: Boolean(req.body?.content)
      }
    });

    return successResponse(res, { dispatched: true }, 'Newsletter dispatch triggered');
  } catch (error) {
    return next(error);
  }
};
