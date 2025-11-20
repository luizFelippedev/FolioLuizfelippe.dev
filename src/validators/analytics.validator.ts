import { z } from 'zod';

export const createAnalyticsEventSchema = z.object({
  body: z.object({
    type: z.enum([
      'page_view',
      'project_view',
      'certificate_view',
      'blog_view',
      'contact_submission',
      'testimonial_submission',
      'custom'
    ]),
    locale: z.string().optional(),
    referrer: z.string().optional(),
    payload: z.record(z.any()).optional()
  })
});

export const analyticsQuerySchema = z.object({
  query: z.object({
    from: z.preprocess((val) => (val ? new Date(String(val)) : undefined), z.date().optional()),
    to: z.preprocess((val) => (val ? new Date(String(val)) : undefined), z.date().optional()),
    type: z
      .enum([
        'page_view',
        'project_view',
        'certificate_view',
        'blog_view',
        'contact_submission',
        'testimonial_submission',
        'custom'
      ])
      .optional()
  })
});
