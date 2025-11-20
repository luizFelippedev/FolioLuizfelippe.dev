import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface INewsletterSubscriber {
  email: string;
  name?: string;
  tags: string[];
  isConfirmed: boolean;
  confirmationToken?: string;
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INewsletterSubscriberMethods {}

export type NewsletterSubscriberDocument = HydratedDocument<INewsletterSubscriber, INewsletterSubscriberMethods>;

export type NewsletterSubscriberModelType = Model<
  INewsletterSubscriber,
  Record<string, never>,
  INewsletterSubscriberMethods
>;

const newsletterSubscriberSchema = new Schema<
  INewsletterSubscriber,
  NewsletterSubscriberModelType,
  INewsletterSubscriberMethods
>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    name: String,
    tags: {
      type: [String],
      default: []
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    confirmationToken: String,
    confirmedAt: Date,
    unsubscribedAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.confirmationToken;
        return ret;
      }
    }
  }
);

const NewsletterSubscriberModel = model<
  INewsletterSubscriber,
  NewsletterSubscriberModelType
>('NewsletterSubscriber', newsletterSubscriberSchema);

export default NewsletterSubscriberModel;
