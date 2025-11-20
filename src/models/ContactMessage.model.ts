import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface IContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
  source?: string;
  status: 'new' | 'in-progress' | 'resolved';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactMessageMethods {}

export type ContactMessageDocument = HydratedDocument<IContactMessage, IContactMessageMethods>;

export type ContactMessageModelType = Model<
  IContactMessage,
  Record<string, never>,
  IContactMessageMethods
>;

const contactMessageSchema = new Schema<
  IContactMessage,
  ContactMessageModelType,
  IContactMessageMethods
>(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    subject: String,
    message: {
      type: String,
      required: true
    },
    source: String,
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new'
    },
    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

const ContactMessageModel = model<IContactMessage, ContactMessageModelType>(
  'ContactMessage',
  contactMessageSchema
);

export default ContactMessageModel;
