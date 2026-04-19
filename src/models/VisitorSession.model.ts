import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export type VisitorSegment = 'company' | 'recruiter' | 'visitor';
export type VisitorInferredProfile = 'corporate_like' | 'recruiter_like' | 'general';

export interface VisitorSessionUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface VisitorDeclaredIdentity {
  name: string;
  companyName?: string;
  purpose: string;
}

export interface VisitorSessionEventCounts {
  pageView: number;
  projectView: number;
  certificateView: number;
  blogView: number;
  chatOpen: number;
  chatMessage: number;
  contactClick: number;
  outboundClick: number;
}

export interface IVisitorSession {
  sessionId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  selfDeclaredSegment?: VisitorSegment;
  identity?: VisitorDeclaredIdentity;
  inferredProfile: VisitorInferredProfile;
  confidence: number;
  reasons: string[];
  landingPath: string;
  lastPath: string;
  pageCount: number;
  visitedPaths: string[];
  referrerDomain?: string;
  utm?: VisitorSessionUtm;
  locale?: string;
  userAgent?: string;
  ipHash?: string;
  eventCounts: VisitorSessionEventCounts;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export type VisitorSessionDocument = HydratedDocument<IVisitorSession>;
export type VisitorSessionModelType = Model<IVisitorSession>;

const visitorSessionSchema = new Schema<IVisitorSession, VisitorSessionModelType>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    firstSeenAt: {
      type: Date,
      required: true,
      index: true
    },
    lastSeenAt: {
      type: Date,
      required: true,
      index: true
    },
    selfDeclaredSegment: {
      type: String,
      enum: ['company', 'recruiter', 'visitor']
    },
    identity: {
      name: String,
      companyName: String,
      purpose: String
    },
    inferredProfile: {
      type: String,
      enum: ['corporate_like', 'recruiter_like', 'general'],
      default: 'general',
      index: true
    },
    confidence: {
      type: Number,
      default: 0
    },
    reasons: {
      type: [String],
      default: []
    },
    landingPath: {
      type: String,
      required: true,
      index: true
    },
    lastPath: {
      type: String,
      required: true
    },
    pageCount: {
      type: Number,
      default: 0
    },
    visitedPaths: {
      type: [String],
      default: []
    },
    referrerDomain: {
      type: String,
      index: true
    },
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    },
    locale: String,
    userAgent: String,
    ipHash: String,
    eventCounts: {
      pageView: { type: Number, default: 0 },
      projectView: { type: Number, default: 0 },
      certificateView: { type: Number, default: 0 },
      blogView: { type: Number, default: 0 },
      chatOpen: { type: Number, default: 0 },
      chatMessage: { type: Number, default: 0 },
      contactClick: { type: Number, default: 0 },
      outboundClick: { type: Number, default: 0 }
    },
    engagementScore: {
      type: Number,
      default: 0
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

const VisitorSessionModel = model<IVisitorSession, VisitorSessionModelType>(
  'VisitorSession',
  visitorSessionSchema
);

export default VisitorSessionModel;
