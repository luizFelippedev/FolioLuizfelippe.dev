import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface BlogComment {
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isApproved: boolean;
}

export interface IBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: {
    url: string;
    publicId?: string;
  };
  gallery?: Array<{
    url: string;
    caption?: string;
  }>;
  categories: string[];
  tags: string[];
  readTime: number;
  published: boolean;
  publishedAt?: Date;
  featured: boolean;
  pinnedAt?: Date;
  views: number;
  likes: number;
  comments: BlogComment[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogPostMethods {}

export type BlogPostDocument = HydratedDocument<IBlogPost, IBlogPostMethods>;

export type BlogPostModelType = Model<IBlogPost, Record<string, never>, IBlogPostMethods>;

const commentSchema = new Schema<BlogComment>(
  {
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    content: { type: String, required: true },
    isApproved: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const blogPostSchema = new Schema<IBlogPost, BlogPostModelType, IBlogPostMethods>(
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
    excerpt: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    coverImage: {
      url: String,
      publicId: String
    },
    gallery: [
      {
        url: String,
        caption: String
      }
    ],
    categories: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    readTime: {
      type: Number,
      default: 5
    },
    published: {
      type: Boolean,
      default: false
    },
    publishedAt: Date,
    featured: {
      type: Boolean,
      default: false
    },
    pinnedAt: Date,
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: [commentSchema],
      default: []
    },
    seo: {
      title: String,
      description: String,
      keywords: [String]
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

const BlogPostModel = model<IBlogPost, BlogPostModelType>('BlogPost', blogPostSchema);

export default BlogPostModel;
