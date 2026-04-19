import { Schema, model, type Document } from 'mongoose';

export type ProjectLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ProjectVisibleSegment = 'company' | 'recruiter' | 'visitor';

export interface IProject extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  level?: ProjectLevel;
  technologies: string[];
  heroImage?: {
    url: string;
    publicId?: string;
  };
  gallery: Array<{
    url: string;
    caption?: string;
  }>;
  liveUrl?: string;
  repositoryUrl?: string;
  featured: boolean;
  visibleToSegments: ProjectVisibleSegment[];
  pinnedAt?: Date;
  order: number;
  metrics?: {
    stars?: number;
    forks?: number;
    downloads?: number;
    views?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
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
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    technologies: {
      type: [String],
      default: []
    },
    heroImage: {
      url: String,
      publicId: String
    },
    gallery: [
      {
        url: String,
        caption: String
      }
    ],
    liveUrl: String,
    repositoryUrl: String,
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
    order: {
      type: Number,
      default: 0
    },
    metrics: {
      stars: Number,
      forks: Number,
      downloads: Number,
      views: Number
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

const ProjectModel = model<IProject>('Project', projectSchema);

export default ProjectModel;
