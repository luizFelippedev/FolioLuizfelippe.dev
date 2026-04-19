import { Schema, model, type Document } from 'mongoose';

export type LabLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ILab extends Document {
  title: string;
  slug: string;
  description: string;
  status?: string;
  level?: LabLevel;
  icon?: string;
  gradient?: string;
  ctaUrl?: string;
  active: boolean;
  beta?: boolean;
}

const LabSchema = new Schema<ILab>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, trim: true },
    level: { type: String, trim: true, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
    icon: { type: String, trim: true },
    gradient: { type: String, trim: true },
    ctaUrl: { type: String, trim: true },
    active: { type: Boolean, default: true },
    beta: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default model<ILab>('Lab', LabSchema);
