import { z } from 'zod';

import { paginationQuerySchema } from '@validators/common/pagination.validator';

export const createTestimonialSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    message: z.string().min(20).max(1000),
    rating: z.number().int().min(1).max(5).optional(),
    avatar: z
      .object({
        url: z.string().url(),
        publicId: z.string().optional()
      })
      .optional(),
    isFeatured: z.boolean().optional(),
    isApproved: z.boolean().optional()
  })
});

export const updateTestimonialSchema = createTestimonialSchema.extend({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createTestimonialSchema.shape.body.partial()
});

export const testimonialIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const testimonialApprovalSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    approved: z.boolean()
  })
});

export const listTestimonialsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    featured: z.enum(['true', 'false']).optional(),
    approved: z.enum(['true', 'false']).optional()
  })
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>['body'];
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>['body'];
