import WiseAssistantSettingsModel from '@models/WiseAssistantSettings.model';
import type { VisitorSegment } from '@models/VisitorSession.model';

export interface WiseAssistantSettingsSnapshot {
  id: string;
  toneBySegment: {
    company: string;
    recruiter: string;
    visitor: string;
  };
  updatedAt: string;
}

export interface UpdateWiseAssistantSettingsInput {
  toneBySegment: {
    company: string;
    recruiter: string;
    visitor: string;
  };
}

const SINGLETON_KEY = 'wise-assistant-settings' as const;

const DEFAULT_TONES = {
  company:
    'Use a formal executive tone. Be concise, business-oriented, and emphasize delivery quality, technical reliability, scope, and partnership readiness.',
  recruiter:
    'Use a formal professional tone. Emphasize experience, engineering maturity, technical fit, learning speed, communication, and the relevance of portfolio evidence.',
  visitor:
    'Use a formal neutral tone. Be clear, explanatory, and professional, without slang or exaggerated informality.'
};

const serializeSettings = (settings: {
  _id?: unknown;
  toneBySegment: {
    company: string;
    recruiter: string;
    visitor: string;
  };
  updatedAt: Date;
}): WiseAssistantSettingsSnapshot => ({
  id: String(settings._id ?? SINGLETON_KEY),
  toneBySegment: settings.toneBySegment,
  updatedAt: new Date(settings.updatedAt).toISOString()
});

export const getWiseAssistantSettings = async (): Promise<WiseAssistantSettingsSnapshot> => {
  const settings =
    (await WiseAssistantSettingsModel.findOne({ singletonKey: SINGLETON_KEY })) ??
    (await WiseAssistantSettingsModel.create({
      singletonKey: SINGLETON_KEY,
      toneBySegment: DEFAULT_TONES
    }));

  return serializeSettings(settings);
};

export const updateWiseAssistantSettings = async (
  input: UpdateWiseAssistantSettingsInput
): Promise<WiseAssistantSettingsSnapshot> => {
  const settings = await WiseAssistantSettingsModel.findOneAndUpdate(
    { singletonKey: SINGLETON_KEY },
    {
      $set: {
        singletonKey: SINGLETON_KEY,
        toneBySegment: input.toneBySegment
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );

  return serializeSettings(settings);
};

export const getWiseToneForSegment = async (segment?: VisitorSegment) => {
  const settings = await getWiseAssistantSettings();
  return settings.toneBySegment[segment ?? 'visitor'];
};
