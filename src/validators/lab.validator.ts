import { paginationQuerySchema } from '@validators/common/pagination.validator';
import { z } from 'zod';


export const createLabSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(160),
    slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/),
    description: z.string().min(10).max(500),
    status: z.string().max(120).optional(),
    icon: z.string().max(60).optional(),
    gradient: z.string().max(200).optional(),
    ctaUrl: z.string().url().optional(),
    active: z.boolean().default(true),
    beta: z.boolean().default(true)
  })
});

export const updateLabSchema = createLabSchema.extend({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createLabSchema.shape.body.partial()
});

export const labIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const listLabsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    active: z.enum(['true', 'false']).optional()
  })
});

export type CreateLabInput = z.infer<typeof createLabSchema>['body'];
export type UpdateLabInput = z.infer<typeof updateLabSchema>['body'];
