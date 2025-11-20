import AnalyticsEventModel from '@models/AnalyticsEvent.model';
import { emitAnalyticsUpdate } from '@sockets/analytics.socket';
import { getAnalyticsNamespace } from '@sockets/index';

interface AnalyticsFilters {
  from?: Date;
  to?: Date;
  type?: string;
}

export const recordAnalyticsEvent = async (
  payload: {
    type: string;
    locale?: string;
    referrer?: string;
    userAgent?: string;
    eventPayload?: Record<string, unknown>;
  }
) => {
  return AnalyticsEventModel.create({
    type: payload.type,
    locale: payload.locale,
    referrer: payload.referrer,
    userAgent: payload.userAgent,
    payload: payload.eventPayload
  });
};

export const getAnalyticsSummary = async (filters: AnalyticsFilters = {}) => {
  const match: Record<string, unknown> = {};

  if (filters.type) {
    match.type = filters.type;
  }

  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) {
      createdAt.$gte = filters.from;
    }
    if (filters.to) {
      createdAt.$lte = filters.to;
    }
    match.createdAt = createdAt;
  }

  const summary = await AnalyticsEventModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1
      }
    }
  ]);

  try {
    const namespace = getAnalyticsNamespace();
    emitAnalyticsUpdate(namespace, summary);
  } catch (error) {
    // Socket server might not be initialized yet; ignore.
  }

  return summary;
};

export const getAnalyticsTimeline = async (filters: AnalyticsFilters = {}) => {
  const match: Record<string, unknown> = {};

  if (filters.type) {
    match.type = filters.type;
  }

  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) {
      createdAt.$gte = filters.from;
    }
    if (filters.to) {
      createdAt.$lte = filters.to;
    }
    match.createdAt = createdAt;
  }

  return AnalyticsEventModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        count: 1,
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);
};
