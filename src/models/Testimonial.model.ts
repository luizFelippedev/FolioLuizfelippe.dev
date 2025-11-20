import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface ITestimonial {
  name: string;
  email?: string;
  company?: string;
  role?: string;
  message: string;
  rating?: number;
  avatar?: {
    url: string;
    publicId?: string;
  };
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestimonialMethods {}

export type TestimonialDocument = HydratedDocument<ITestimonial, ITestimonialMethods>;

export type TestimonialModelType = Model<ITestimonial, Record<string, never>, ITestimonialMethods>;

const testimonialSchema = new Schema<ITestimonial, TestimonialModelType, ITestimonialMethods>(
  {
    name: {
      type: String,
      required: true
    },
    email: String,
    company: String,
    role: String,
    message: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    avatar: {
      url: String,
      publicId: String
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: true
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

const TestimonialModel = model<ITestimonial, TestimonialModelType>('Testimonial', testimonialSchema);

export default TestimonialModel;
