import { z } from 'zod';

const visitorSegmentSchema = z.enum(['company', 'recruiter', 'visitor']);
const visitorProfileSchema = z.enum(['corporate_like', 'recruiter_like', 'general']);
const visitorEventTypeSchema = z.enum([
  'page_view',
  'project_view',
  'certificate_view',
  'blog_view',
  'chat_open',
  'chat_message',
  'contact_click',
  'outbound_click'
]);

const utmSchema = z
  .object({
    source: z.string().trim().max(160).optional(),
    medium: z.string().trim().max(160).optional(),
    campaign: z.string().trim().max(160).optional(),
    term: z.string().trim().max(160).optional(),
    content: z.string().trim().max(160).optional()
  })
  .optional();

const visitorIdentitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  companyName: z.string().trim().max(160).optional(),
  purpose: z.string().trim().min(1).max(280)
});

export const visitorSessionSnapshotSchema = z.object({
  query: z.object({})
});

export const upsertVisitorSessionSchema = z.object({
  body: z.object({
    segment: visitorSegmentSchema,
    entryPath: z.string().trim().min(1).max(160),
    locale: z.string().trim().min(2).max(16).optional(),
    referrer: z.string().trim().url().max(600).optional(),
    utm: utmSchema,
    identity: visitorIdentitySchema
  }).superRefine((body, ctx) => {
    if (
      (body.segment === 'company' || body.segment === 'recruiter') &&
      !body.identity.companyName?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identity', 'companyName'],
        message: 'companyName is required for company and recruiter segments.'
      });
    }
  })
});

export const recordVisitorEventSchema = z.object({
  body: z.object({
    type: visitorEventTypeSchema,
    path: z.string().trim().min(1).max(160),
    contentType: z.enum(['project', 'certificate', 'blog']).optional(),
    contentKey: z.string().trim().max(160).optional(),
    meta: z.record(z.any()).optional()
  })
});

export const visitorIntelSessionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    segment: visitorSegmentSchema.optional(),
    profile: visitorProfileSchema.optional(),
    path: z.string().trim().max(160).optional(),
    source: z.string().trim().max(160).optional()
  })
});

export type VisitorSegmentInput = z.infer<typeof visitorSegmentSchema>;
export type VisitorProfileInput = z.infer<typeof visitorProfileSchema>;
export type VisitorEventTypeInput = z.infer<typeof visitorEventTypeSchema>;
export type UpsertVisitorSessionInput = z.infer<typeof upsertVisitorSessionSchema>['body'];
export type RecordVisitorEventInput = z.infer<typeof recordVisitorEventSchema>['body'];
export type VisitorIntelSessionsQueryInput = z.infer<typeof visitorIntelSessionsQuerySchema>['query'];
