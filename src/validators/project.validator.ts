import { paginationQuerySchema } from '@validators/common/pagination.validator';
import { z } from 'zod';

const visibleSegmentsSchema = z
  .array(z.enum(['company', 'recruiter', 'visitor']))
  .min(1)
  .default(['company', 'recruiter', 'visitor']);

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(128),
    slug: z.string().min(3).max(128).regex(/^[a-z0-9-]+$/),
    description: z.string().min(20),
    category: z.string().min(2),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
    technologies: z.array(z.string()).default([]),
    heroImage: z
      .object({
        url: z.string().url(),
        publicId: z.string().optional()
      })
      .optional(),
    gallery: z
      .array(
        z.object({
          url: z.string().url(),
          caption: z.string().optional()
        })
      )
      .default([]),
    liveUrl: z.string().url().optional(),
    repositoryUrl: z.string().url().optional(),
    featured: z.boolean().optional(),
    visibleToSegments: visibleSegmentsSchema,
    order: z.number().int().nonnegative().optional(),
    metrics: z
      .object({
        stars: z.number().optional(),
        forks: z.number().optional(),
        downloads: z.number().optional(),
        views: z.number().optional()
      })
      .optional()
  })
});

export const updateProjectSchema = createProjectSchema.extend({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createProjectSchema.shape.body.partial()
});

export const projectIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const listProjectsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    featured: z.enum(['true', 'false']).optional(),
    category: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    technology: z.string().optional()
  })
});

export const listFeaturedProjectsQuerySchema = z.object({
  query: paginationQuerySchema
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
