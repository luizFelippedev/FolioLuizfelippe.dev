import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface IWiseAssistantSettings {
  singletonKey: 'wise-assistant-settings';
  toneBySegment: {
    company: string;
    recruiter: string;
    visitor: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type WiseAssistantSettingsDocument = HydratedDocument<IWiseAssistantSettings>;
export type WiseAssistantSettingsModelType = Model<IWiseAssistantSettings>;

const wiseAssistantSettingsSchema = new Schema<IWiseAssistantSettings, WiseAssistantSettingsModelType>(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: 'wise-assistant-settings'
    },
    toneBySegment: {
      company: {
        type: String,
        required: true
      },
      recruiter: {
        type: String,
        required: true
      },
      visitor: {
        type: String,
        required: true
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

const WiseAssistantSettingsModel = model<IWiseAssistantSettings, WiseAssistantSettingsModelType>(
  'WiseAssistantSettings',
  wiseAssistantSettingsSchema
);

export default WiseAssistantSettingsModel;
