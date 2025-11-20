import { Schema, model, type Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
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
  order: number;
  metrics?: {
    stars?: number;
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
    order: {
      type: Number,
      default: 0
    },
    metrics: {
      stars: Number,
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
