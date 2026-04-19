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
      'chat_open',
      'chat_message',
      'contact_click',
      'outbound_click',
      'visitor_segment_selected',
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
        'chat_open',
        'chat_message',
        'contact_click',
        'outbound_click',
        'visitor_segment_selected',
        'custom'
      ])
      .optional()
  })
});
