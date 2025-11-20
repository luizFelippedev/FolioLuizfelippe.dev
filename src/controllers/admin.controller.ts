import type { NextFunction, Request, Response } from 'express';

import ContactMessageModel from '@models/ContactMessage.model';
import NewsletterSubscriberModel from '@models/NewsletterSubscriber.model';
import { getAdminMetrics } from '@services/admin.service';
import { buildCsv } from '@utils/helpers/csv.helper';
import { successResponse } from '@utils/helpers/response.helper';

export const metricsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getAdminMetrics();
    return successResponse(res, metrics);
  } catch (error) {
    return next(error);
  }
};

export const exportSubscribersCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { confirmed, tag } = req.query as { confirmed?: string; tag?: string };
    const filters: Record<string, unknown> = {};
    if (confirmed !== undefined) {
      filters.isConfirmed = confirmed === 'true';
    }
    if (tag) {
      filters.tags = tag;
    }
    filters.unsubscribedAt = { $exists: false };

    const subscribers = await NewsletterSubscriberModel.find(filters)
      .sort({ createdAt: -1 })
      .lean();

    const csv = buildCsv(subscribers as unknown as Record<string, unknown>[], [
      { key: 'email', header: 'Email' },
      { key: 'name', header: 'Name' },
      {
        key: 'tags',
        header: 'Tags',
        transform: (value) => (Array.isArray(value) ? value.join(';') : '')
      },
      {
        key: 'confirmedAt',
        header: 'Confirmed At',
        transform: (value) => (value ? new Date(String(value)).toISOString() : '')
      },
      {
        key: 'createdAt',
        header: 'Created At',
        transform: (value) => new Date(String(value)).toISOString()
      }
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};

export const exportContactsCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const filters: Record<string, unknown> = {};
    if (status) {
      filters.status = status;
    }

    const messages = await ContactMessageModel.find(filters).sort({ createdAt: -1 }).lean();

    const csv = buildCsv(messages as unknown as Record<string, unknown>[], [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'subject', header: 'Subject' },
      { key: 'message', header: 'Message' },
      { key: 'source', header: 'Source' },
      { key: 'status', header: 'Status' },
      {
        key: 'createdAt',
        header: 'Created At',
        transform: (value) => new Date(String(value)).toISOString()
      }
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contact-messages.csv"');
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};
