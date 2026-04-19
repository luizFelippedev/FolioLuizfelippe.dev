import { z } from 'zod';

import { SUPPORTED_CONTENT_LOCALES } from '@services/content.service';

const localeParam = z.object({
  locale: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => SUPPORTED_CONTENT_LOCALES.includes(value as (typeof SUPPORTED_CONTENT_LOCALES)[number]), {
      message: 'Unsupported locale'
    })
});

export const contentLocaleSchema = z.object({
  params: localeParam
});

export const updateContentOverrideSchema = z.object({
  params: localeParam,
  body: z.object({
    overrides: z.record(z.unknown())
  })
});
