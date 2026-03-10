import logger from '@utils/logger/logger';
import cron from 'node-cron';

import NewsletterSubscriberModel from '@models/NewsletterSubscriber.model';
import { sendNewsletterDigestEmail } from '@services/email.service';

interface NewsletterJobOptions {
  cronExpression?: string;
  subject?: string;
  content?: string;
}

const DEFAULT_SUBJECT = 'Weekly portfolio updates';
const DEFAULT_CONTENT = 'Stay tuned for the latest projects, articles, and achievements.';

export const scheduleNewsletterJob = ({
  cronExpression = '0 12 * * 1',
  subject = DEFAULT_SUBJECT,
  content = DEFAULT_CONTENT
}: NewsletterJobOptions = {}) => {
  return cron.schedule(cronExpression, async () => {
    try {
      const subscribers = await NewsletterSubscriberModel.find({
        isConfirmed: true,
        unsubscribedAt: { $exists: false }
      });

      if (!subscribers.length) {
        logger.info('Newsletter job skipped - no confirmed subscribers');
        return;
      }

      await Promise.all(
        subscribers.map((subscriber) =>
          sendNewsletterDigestEmail(subscriber.email, {
            name: subscriber.name ?? undefined,
            subject,
            content
          }).catch((error) => {
            logger.warn('Failed to deliver newsletter email', {
              error,
              subscriber: subscriber.email
            });
          })
        )
      );

      logger.info('Newsletter job dispatched', { recipients: subscribers.length });
    } catch (error) {
      logger.error('Newsletter job failed', { error });
    }
  });
};

export const runNewsletterJobOnce = async (options?: Omit<NewsletterJobOptions, 'cronExpression'>) => {
  try {
    const subscribers = await NewsletterSubscriberModel.find({
      isConfirmed: true,
      unsubscribedAt: { $exists: false }
    });

    if (!subscribers.length) {
      logger.info('Newsletter trigger skipped - no confirmed subscribers');
      return;
    }

    await Promise.all(
      subscribers.map((subscriber) =>
        sendNewsletterDigestEmail(subscriber.email, {
          name: subscriber.name ?? undefined,
          subject: options?.subject ?? DEFAULT_SUBJECT,
          content: options?.content ?? DEFAULT_CONTENT
        })
      )
    );

    logger.info('Newsletter trigger completed', { recipients: subscribers.length });
  } catch (error) {
    logger.error('Manual newsletter trigger failed', { error });
  }
};
