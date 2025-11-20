import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export type ActivityAction =
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'certificate:create'
  | 'certificate:update'
  | 'certificate:delete'
  | 'blog:create'
  | 'blog:update'
  | 'blog:delete'
  | 'testimonial:update'
  | 'testimonial:delete'
  | 'newsletter:send'
  | 'newsletter:delete'
  | 'contact:status';

export interface IActivityLog {
  action: ActivityAction;
  actorId?: string;
  actorEmail?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type ActivityLogDocument = HydratedDocument<IActivityLog>;

export type ActivityLogModelType = Model<IActivityLog>;

const activityLogSchema = new Schema<IActivityLog, ActivityLogModelType>(
  {
    action: {
      type: String,
      required: true
    },
    actorId: String,
    actorEmail: String,
    targetId: String,
    targetType: String,
    metadata: Schema.Types.Mixed
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

const ActivityLogModel = model<IActivityLog, ActivityLogModelType>('ActivityLog', activityLogSchema);

export default ActivityLogModel;
