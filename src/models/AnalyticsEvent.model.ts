import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export type AnalyticsEventType =
  | 'page_view'
  | 'project_view'
  | 'certificate_view'
  | 'blog_view'
  | 'contact_submission'
  | 'testimonial_submission'
  | 'chat_open'
  | 'chat_message'
  | 'contact_click'
  | 'outbound_click'
  | 'visitor_segment_selected'
  | 'custom';

export interface IAnalyticsEvent {
  type: AnalyticsEventType;
  visitorSessionId?: string;
  userAgent?: string;
  locale?: string;
  referrer?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

export type AnalyticsEventDocument = HydratedDocument<IAnalyticsEvent>;

export type AnalyticsEventModelType = Model<IAnalyticsEvent>;

const analyticsEventSchema = new Schema<IAnalyticsEvent, AnalyticsEventModelType>(
  {
    type: {
      type: String,
      enum: [
        'page_view',
        'project_view',
        'certificate_view',
        'blog_view',
        'contact_submission',
        'testimonial_submission',
        'chat_open',
        'chat_message',
        'contact_click',
        'outbound_click',
        'visitor_segment_selected',
        'custom'
      ],
      required: true
    },
    visitorSessionId: String,
    userAgent: String,
    locale: String,
    referrer: String,
    payload: Schema.Types.Mixed
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AnalyticsEventModel = model<IAnalyticsEvent, AnalyticsEventModelType>('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEventModel;
