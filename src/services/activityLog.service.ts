import ActivityLogModel, { type ActivityAction } from '@models/ActivityLog.model';

interface LogOptions {
  action: ActivityAction;
  actor?: { id?: string; email?: string };
  target?: { id?: string; type?: string };
  metadata?: Record<string, unknown>;
}

export const recordActivity = async ({ action, actor, target, metadata }: LogOptions) => {
  await ActivityLogModel.create({
    action,
    actorId: actor?.id,
    actorEmail: actor?.email,
    targetId: target?.id,
    targetType: target?.type,
    metadata
  });
};

export const fetchRecentActivity = async (limit = 20) => {
  return ActivityLogModel.find().sort({ createdAt: -1 }).limit(limit).lean();
};
