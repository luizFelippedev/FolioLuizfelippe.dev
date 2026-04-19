import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export type CertificateLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CertificateCategory =
  | 'cloud'
  | 'frontend'
  | 'backend'
  | 'design'
  | 'data'
  | 'devops'
  | 'soft-skills'
  | 'other';

export interface ICertificate {
  title: string;
  slug: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  category: CertificateCategory;
  level: CertificateLevel;
  credentialId?: string;
  credentialUrl?: string;
  previewImage?: {
    url: string;
    publicId?: string;
  };
  attachments?: Array<{
    url: string;
    label?: string;
  }>;
  featured: boolean;
  visibleToSegments: Array<'company' | 'recruiter' | 'visitor'>;
  pinnedAt?: Date;
  skills: string[];
  highlights?: string[];
  metrics?: {
    views: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificateMethods {}

export type CertificateDocument = HydratedDocument<ICertificate, ICertificateMethods>;

export type CertificateModelType = Model<ICertificate, Record<string, never>, ICertificateMethods>;

const certificateSchema = new Schema<ICertificate, CertificateModelType, ICertificateMethods>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    issuer: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: Date,
    category: {
      type: String,
      required: true,
      default: 'other'
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    credentialId: String,
    credentialUrl: String,
    previewImage: {
      url: String,
      publicId: String
    },
    attachments: [
      {
        url: String,
        label: String
      }
    ],
    featured: {
      type: Boolean,
      default: false
    },
    visibleToSegments: {
      type: [String],
      enum: ['company', 'recruiter', 'visitor'],
      default: ['company', 'recruiter', 'visitor']
    },
    pinnedAt: Date,
    skills: {
      type: [String],
      default: []
    },
    highlights: {
      type: [String],
      default: []
    },
    metrics: {
      views: {
        type: Number,
        default: 0
      }
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

const CertificateModel = model<ICertificate, CertificateModelType>('Certificate', certificateSchema);

export default CertificateModel;
