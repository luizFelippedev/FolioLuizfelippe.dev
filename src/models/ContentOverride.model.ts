import { Schema, model, type Document } from 'mongoose';

export interface IContentOverride extends Document {
  locale: string;
  overrides: Record<string, unknown>;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contentOverrideSchema = new Schema<IContentOverride>(
  {
    locale: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    overrides: {
      type: Schema.Types.Mixed,
      default: {}
    },
    updatedBy: {
      type: String,
      required: false
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

const ContentOverrideModel = model<IContentOverride>('ContentOverride', contentOverrideSchema);

export default ContentOverrideModel;
