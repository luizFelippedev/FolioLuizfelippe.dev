import { Router } from 'express';

import {
  addCommentHandler,
  createBlogPostHandler,
  deleteBlogPostHandler,
  getBlogPost,
  getBlogPosts,
  registerPostView,
  toggleCommentApprovalHandler,
  updateBlogPostHandler
} from '@controllers/blog.controller';
import trackAnalyticsEvent from '@middleware/analytics.middleware';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import cacheResponse from '@middleware/cache.middleware';
import validate from '@middleware/validation.middleware';
import { getAudienceCacheKeySuffix } from '@utils/visitor/visitorSession.helper';
import {
  blogPostIdSchema,
  commentModerationSchema,
  createBlogPostSchema,
  createCommentSchema,
  listBlogPostsQuerySchema,
  updateBlogPostSchema
} from '@validators/blog.validator';

const router = Router();

router.get(
  '/',
  validate(listBlogPostsQuerySchema),
  cacheResponse((req) => {
    const params = new URLSearchParams();
    if (req.query.tag) params.set('tag', String(req.query.tag));
    if (req.query.category) params.set('category', String(req.query.category));
    if (req.query.published !== undefined) params.set('published', String(req.query.published));
    params.set('audience', getAudienceCacheKeySuffix(req));
    params.set('page', String(req.query.page ?? '1'));
    params.set('limit', String(req.query.limit ?? ''));
    params.set('sortBy', String(req.query.sortBy ?? ''));
    params.set('sortOrder', String(req.query.sortOrder ?? ''));
    const key = params.toString() || 'all';
    return `blog:list:${key}`;
  }, 120),
  getBlogPosts
);
router.get(
  '/:id',
  validate(blogPostIdSchema),
  cacheResponse((req) => `blog:${req.params.id}:${getAudienceCacheKeySuffix(req)}`, 300),
  getBlogPost
);
router.post('/', authenticate, authorizeAction('blog:manage'), validate(createBlogPostSchema), createBlogPostHandler);
router.put(
  '/:id',
  authenticate,
  authorizeAction('blog:manage'),
  validate(updateBlogPostSchema),
  updateBlogPostHandler
);
router.delete(
  '/:id',
  authenticate,
  authorizeAction('blog:manage'),
  validate(blogPostIdSchema),
  deleteBlogPostHandler
);

router.post('/:postId/comments', validate(createCommentSchema), addCommentHandler);
router.patch(
  '/:postId/comments/:commentId',
  authenticate,
  authorizeAction('blog:manage'),
  validate(commentModerationSchema),
  toggleCommentApprovalHandler
);

router.post(
  '/:slug/views',
  trackAnalyticsEvent('blog_view', {
    resolvePayload: (req) => ({ slug: req.params.slug })
  }),
  registerPostView
);

export default router;
