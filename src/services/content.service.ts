import { getCache, invalidateCache, setCache } from '@utils/cache/cache.service';
import { AppError } from '@utils/helpers/error.helper';

import ContentOverrideModel from '@models/ContentOverride.model';

export const SUPPORTED_CONTENT_LOCALES = ['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh'] as const;

export type ContentLocale = (typeof SUPPORTED_CONTENT_LOCALES)[number];

interface ContentOverridePayload {
  locale: ContentLocale;
  overrides: Record<string, unknown>;
  updatedAt: Date | null;
  updatedBy?: string;
}

const getCacheKey = (locale: ContentLocale) => `content:override:${locale}`;

const assertLocale = (value: string): ContentLocale => {
  const normalized = value.trim().toLowerCase() as ContentLocale;

  if (!SUPPORTED_CONTENT_LOCALES.includes(normalized)) {
    throw new AppError(`Unsupported locale "${value}"`, 400);
  }

  return normalized;
};

const assertOverrides = (overrides: unknown): Record<string, unknown> => {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new AppError('Invalid overrides payload: expected a JSON object', 400);
  }

  return overrides as Record<string, unknown>;
};

const toPayload = (
  locale: ContentLocale,
  document: {
    overrides?: Record<string, unknown>;
    updatedAt?: Date;
    updatedBy?: string;
  } | null
): ContentOverridePayload => ({
  locale,
  overrides: document?.overrides ?? {},
  updatedAt: document?.updatedAt ?? null,
  updatedBy: document?.updatedBy
});

export const getPublicContentOverride = async (localeValue: string): Promise<ContentOverridePayload> => {
  const locale = assertLocale(localeValue);
  const cacheKey = getCacheKey(locale);

  const cached = await getCache<ContentOverridePayload>(cacheKey);
  if (cached) {
    return cached;
  }

  const document = await ContentOverrideModel.findOne({ locale }).lean();
  const payload = toPayload(locale, document);
  await setCache(cacheKey, payload, 300);
  return payload;
};

export const getAdminContentOverride = async (localeValue: string): Promise<ContentOverridePayload> => {
  const locale = assertLocale(localeValue);
  const document = await ContentOverrideModel.findOne({ locale }).lean();
  return toPayload(locale, document);
};

export const upsertContentOverride = async (
  localeValue: string,
  overridesValue: unknown,
  updatedBy?: string
): Promise<ContentOverridePayload> => {
  const locale = assertLocale(localeValue);
  const overrides = assertOverrides(overridesValue);

  const updated = await ContentOverrideModel.findOneAndUpdate(
    { locale },
    {
      $set: {
        overrides,
        updatedBy: updatedBy ?? undefined
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  ).lean();

  const payload = toPayload(locale, updated);
  await invalidateCache(getCacheKey(locale));
  return payload;
};

export const resetContentOverride = async (localeValue: string): Promise<ContentOverridePayload> => {
  const locale = assertLocale(localeValue);
  await ContentOverrideModel.deleteOne({ locale });
  await invalidateCache(getCacheKey(locale));
  return {
    locale,
    overrides: {},
    updatedAt: null
  };
};
