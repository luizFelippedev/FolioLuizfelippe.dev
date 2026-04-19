import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

import type { VisitorDeclaredIdentity, VisitorSegment } from '@models/VisitorSession.model';

export interface IVisitorAccessAccount {
  sessionId: string;
  visitorSessionId: Types.ObjectId;
  segment: VisitorSegment;
  identity: VisitorDeclaredIdentity;
  status: 'active';
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type VisitorAccessAccountDocument = HydratedDocument<IVisitorAccessAccount>;
export type VisitorAccessAccountModelType = Model<IVisitorAccessAccount>;

const visitorAccessAccountSchema = new Schema<IVisitorAccessAccount, VisitorAccessAccountModelType>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    visitorSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'VisitorSession',
      required: true,
      index: true
    },
    segment: {
      type: String,
      enum: ['company', 'recruiter', 'visitor'],
      required: true,
      index: true
    },
    identity: {
      name: {
        type: String,
        required: true
      },
      companyName: String,
      purpose: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: ['active'],
      default: 'active'
    },
    lastSeenAt: {
      type: Date,
      required: true,
      index: true
    }
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

const VisitorAccessAccountModel = model<IVisitorAccessAccount, VisitorAccessAccountModelType>(
  'VisitorAccessAccount',
  visitorAccessAccountSchema
);

export default VisitorAccessAccountModel;
