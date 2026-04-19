import { broadcastAdminNotification } from '@utils/helpers/notifications';

import ActivityLogModel, { type ActivityAction } from '@models/ActivityLog.model';
import { getNotificationsNamespace } from '@sockets/index';

interface LogOptions {
  action: ActivityAction;
  actor?: { id?: string; email?: string };
  target?: { id?: string; type?: string };
  metadata?: Record<string, unknown>;
}

export interface ActivitySummary {
  total: number;
  creates: number;
  updates: number;
  deletes: number;
  others: number;
}

const humanizeAction = (action: ActivityAction) =>
  action
    .replace(/[:._-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());

const emitRealtimeActivity = async () => {
  try {
    const namespace = getNotificationsNamespace();
    const recentActivity = await fetchRecentActivity(15);
    namespace.to('admin-alerts').emit('activity', recentActivity);
  } catch {
    // sockets not ready; skip realtime push
  }
};

export const recordActivity = async ({ action, actor, target, metadata }: LogOptions) => {
  await ActivityLogModel.create({
    action,
    actorId: actor?.id,
    actorEmail: actor?.email,
    targetId: target?.id,
    targetType: target?.type,
    metadata
  });

  const detail = target?.type ? ` (${target.type})` : '';
  const actionLabel = humanizeAction(action);
  broadcastAdminNotification({
    code: 'activity.logged',
    params: {
      action: actionLabel,
      targetType: target?.type ?? ''
    },
    title: 'Admin activity',
    message: `${actionLabel}${detail}`,
    type: 'info'
  });

  void emitRealtimeActivity();
};

export const fetchRecentActivity = async (limit = 20) => {
  return ActivityLogModel.find().sort({ createdAt: -1 }).limit(limit).lean();
};

export const fetchActivitySummary = async (since: Date): Promise<ActivitySummary> => {
  const grouped = await ActivityLogModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = grouped.reduce((sum, item) => sum + item.count, 0);
  const creates = grouped
    .filter((item) => item._id.includes(':create'))
    .reduce((sum, item) => sum + item.count, 0);
  const updates = grouped
    .filter((item) => item._id.includes(':update') || item._id.includes(':status'))
    .reduce((sum, item) => sum + item.count, 0);
  const deletes = grouped
    .filter((item) => item._id.includes(':delete'))
    .reduce((sum, item) => sum + item.count, 0);
  const others = Math.max(0, total - creates - updates - deletes);

  return {
    total,
    creates,
    updates,
    deletes,
    others
  };
};
