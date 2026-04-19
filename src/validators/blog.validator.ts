import { paginationQuerySchema } from '@validators/common/pagination.validator';
import { z } from 'zod';

const visibleSegmentsSchema = z
  .array(z.enum(['company', 'recruiter', 'visitor']))
  .min(1)
  .default(['company', 'recruiter', 'visitor']);

const commentSchema = z.object({
  authorName: z.string().min(2).max(64),
  authorEmail: z.string().email(),
  content: z.string().min(5).max(2048)
});

export const createBlogPostSchema = z.object({
  body: z.object({
    title: z.string().min(4).max(180),
    slug: z.string().min(3).max(180).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().min(10).max(300),
    content: z.string().min(100),
    coverImage: z
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
      .optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
    readTime: z.number().int().positive().default(5),
    published: z.boolean().default(false),
    publishedAt: z.preprocess((val) => (val ? new Date(String(val)) : undefined), z.date().optional()),
    featured: z.boolean().optional(),
    visibleToSegments: visibleSegmentsSchema,
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional()
      })
      .optional()
  })
});

export const updateBlogPostSchema = createBlogPostSchema.extend({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createBlogPostSchema.shape.body.partial()
});

export const blogPostIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const createCommentSchema = z.object({
  params: z.object({
    postId: z.string().min(1)
  }),
  body: commentSchema
});

export const listBlogPostsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    tag: z.string().optional(),
    category: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    published: z.enum(['true', 'false']).optional(),
    featured: z.enum(['true', 'false']).optional()
  })
});

export const commentModerationSchema = z.object({
  params: z.object({
    postId: z.string().min(1),
    commentId: z.string().min(1)
  }),
  body: z.object({
    approved: z.boolean()
  })
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>['body'];
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>['body'];
export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
