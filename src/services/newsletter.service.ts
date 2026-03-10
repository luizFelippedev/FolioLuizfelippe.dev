import crypto from 'node:crypto';

import { AppError } from '@utils/helpers/error.helper';

import NewsletterSubscriberModel from '@models/NewsletterSubscriber.model';
import type { SubscribeInput } from '@validators/newsletter.validator';

const generateToken = () => crypto.randomBytes(32).toString('hex');

export const subscribeToNewsletter = async (payload: SubscribeInput) => {
  const existing = await NewsletterSubscriberModel.findOne({ email: payload.email });

  if (existing) {
    if (existing.unsubscribedAt) {
      existing.unsubscribedAt = undefined;
    }

    if (!existing.isConfirmed) {
      existing.confirmationToken = generateToken();
    }

    existing.name = payload.name ?? existing.name;
    if (payload.tags) {
      existing.tags = Array.from(new Set([...(existing.tags ?? []), ...payload.tags]));
    }

    await existing.save();
    return existing;
  }

  const subscriber = await NewsletterSubscriberModel.create({
    ...payload,
    tags: payload.tags ?? [],
    confirmationToken: generateToken()
  });

  return subscriber;
};

export const confirmSubscription = async (token: string) => {
  const subscriber = await NewsletterSubscriberModel.findOne({ confirmationToken: token });

  if (!subscriber) {
    throw new AppError('Invalid confirmation token', 404);
  }

  subscriber.isConfirmed = true;
  subscriber.confirmedAt = new Date();
  subscriber.confirmationToken = undefined;
  await subscriber.save();

  return subscriber;
};

export const unsubscribe = async (email: string) => {
  const subscriber = await NewsletterSubscriberModel.findOne({ email });

  if (!subscriber) {
    throw new AppError('Subscriber not found', 404);
  }

  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  return subscriber;
};

export const listSubscribers = async (filters: { confirmed?: boolean; tag?: string } = {}) => {
  const query: Record<string, unknown> = {};

  if (filters.confirmed !== undefined) {
    query.isConfirmed = filters.confirmed;
  }

  if (filters.tag) {
    query.tags = filters.tag;
  }

  return NewsletterSubscriberModel.find(query).sort({ createdAt: -1 });
};

export const removeSubscriber = async (id: string) => {
  return NewsletterSubscriberModel.findByIdAndDelete(id);
};
