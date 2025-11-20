import { z } from 'zod';

import { paginationQuerySchema } from '@validators/common/pagination.validator';

const dateSchema = z.preprocess((value) => (value ? new Date(String(value)) : undefined), z.date());

export const createCertificateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(128),
    slug: z.string().min(3).max(128).regex(/^[a-z0-9-]+$/),
    issuer: z.string().min(2).max(128),
    issueDate: dateSchema,
    expiryDate: dateSchema.optional(),
    category: z
      .enum(['cloud', 'frontend', 'backend', 'design', 'data', 'devops', 'soft-skills', 'other'])
      .default('other'),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    credentialId: z.string().nullable().optional(),
    credentialUrl: z.string().url().nullable().optional(),
    previewImage: z
      .object({
        url: z.string().url(),
        publicId: z.string().optional()
      })
      .optional(),
    attachments: z
      .array(
        z.object({
          url: z.string().url(),
          label: z.string().optional()
        })
      )
      .optional(),
    featured: z.boolean().optional(),
    skills: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([])
  })
});

export const updateCertificateSchema = createCertificateSchema.extend({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createCertificateSchema.shape.body.partial()
});

export const certificateIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const listCertificatesQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    featured: z.enum(['true', 'false']).optional()
  })
});

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>['body'];
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>['body'];
