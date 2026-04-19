import { invalidateCachePrefix } from '@utils/cache/cache.service';
import { AppError } from '@utils/helpers/error.helper';
import { broadcastViewUpdate } from '@utils/helpers/notifications';
import { parsePagination } from '@utils/helpers/pagination.helper';
import { successResponse } from '@utils/helpers/response.helper';
import { getClientIp } from '@utils/network/clientIp';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { recordActivity } from '@services/activityLog.service';
import {
  resolveRequestAudienceContext,
  serializeBlogPostForAudience
} from '@services/audienceAccess.service';
import {
  addCommentToPost,
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  incrementBlogView,
  listBlogPosts,
  toggleCommentApproval,
  updateBlogPost
} from '@services/blog.service';
import { trackUniqueView } from '@services/viewTracking.service';

export const getBlogPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 10,
      allowedSortFields: ['publishedAt', 'createdAt', 'title']
    });

    const { tag, category, level, published, featured } = req.query as {
      tag?: string;
      category?: string;
      level?: string;
      published?: string;
      featured?: string;
    };

    const posts = await listBlogPosts({
      tag,
      category,
      level,
      published: published !== undefined ? published === 'true' : undefined,
      featured: featured !== undefined ? featured === 'true' : undefined,
      skip: pagination.skip,
      limit: pagination.limit,
      sort: pagination.sort
    });
    const audienceContext = await resolveRequestAudienceContext(req);

    return successResponse(res, {
      page: pagination.page,
      limit: pagination.limit,
      data: posts.map((post) => serializeBlogPostForAudience(post.toObject(), audienceContext))
    });
  } catch (error) {
    return next(error);
  }
};

export const getBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await getBlogPostById(req.params.id);

    if (!post) {
      return next(new AppError('Blog post not found', StatusCodes.NOT_FOUND));
    }

    const audienceContext = await resolveRequestAudienceContext(req);
    return successResponse(res, serializeBlogPostForAudience(post.toObject(), audienceContext));
  } catch (error) {
    return next(error);
  }
};

export const createBlogPostHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await createBlogPost(req.body);
    await Promise.all([
      invalidateCachePrefix('blog:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'blog:create',
        actor: req.user,
        target: { id: post._id.toString(), type: 'BlogPost' },
        metadata: { slug: post.slug }
      })
    ]);
    return successResponse(res, post, 'Blog post created', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const updateBlogPostHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await updateBlogPost(req.params.id, req.body);

    if (!post) {
      return next(new AppError('Blog post not found', StatusCodes.NOT_FOUND));
    }

    await Promise.all([
      invalidateCachePrefix('blog:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'blog:update',
        actor: req.user,
        target: { id: req.params.id, type: 'BlogPost' },
        metadata: { slug: post.slug }
      })
    ]);

    return successResponse(res, post, 'Blog post updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteBlogPostHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await deleteBlogPost(req.params.id);

    if (!post) {
      return next(new AppError('Blog post not found', StatusCodes.NOT_FOUND));
    }

    await Promise.all([
      invalidateCachePrefix('blog:'),
      invalidateCachePrefix('highlights:'),
      invalidateCachePrefix('search:'),
      recordActivity({
        action: 'blog:delete',
        actor: req.user,
        target: { id: req.params.id, type: 'BlogPost' },
        metadata: { slug: post.slug }
      })
    ]);

    return successResponse(res, post, 'Blog post deleted');
  } catch (error) {
    return next(error);
  }
};

export const addCommentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await addCommentToPost(req.params.postId, req.body);

    if (!post) {
      return next(new AppError('Blog post not found', StatusCodes.NOT_FOUND));
    }

    return successResponse(res, post, 'Comment added', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const toggleCommentApprovalHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId, commentId } = req.params;
    const { approved } = req.body as { approved: boolean };

    const post = await toggleCommentApproval(postId, commentId, approved);

    if (!post) {
      return next(new AppError('Comment or post not found', StatusCodes.NOT_FOUND));
    }

    return successResponse(res, post, 'Comment moderation updated');
  } catch (error) {
    return next(error);
  }
};

export const registerPostView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const ipAddress = getClientIp(req);
    const viewResult = await trackUniqueView({
      contentType: 'blog',
      contentKey: slug,
      ipAddress
    });

    const post = viewResult.counted
      ? await incrementBlogView(slug)
      : await getBlogPostBySlug(slug);

    if (!post) {
      return next(new AppError('Blog post not found', StatusCodes.NOT_FOUND));
    }

    if (viewResult.counted) {
      broadcastViewUpdate({
        contentType: 'blog',
        contentKey: slug,
        views: post.views
      });
    }

    return successResponse(res, {
      views: post.views,
      counted: viewResult.counted
    });
  } catch (error) {
    return next(error);
  }
};
