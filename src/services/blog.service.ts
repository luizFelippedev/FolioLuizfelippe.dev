import { Types } from 'mongoose';

import BlogPostModel, { type BlogPostDocument } from '@models/BlogPost.model';
import { AppError } from '@utils/helpers/error.helper';

import type {
  CreateBlogPostInput,
  CreateCommentInput,
  UpdateBlogPostInput
} from '@validators/blog.validator';

interface ListBlogOptions {
  tag?: string;
  category?: string;
  published?: boolean;
  featured?: boolean;
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

const applyPinMetadata = <T extends { featured?: boolean }>(payload: T) => {
  const next = { ...payload } as T & { pinnedAt?: Date };
  if (payload.featured === true) {
    next.pinnedAt = new Date();
  } else if (payload.featured === false) {
    next.pinnedAt = undefined;
  }

  return next;
};

export const listBlogPosts = async (options?: ListBlogOptions) => {
  const filter: Record<string, unknown> = {};

  if (options?.published !== undefined) {
    filter.published = options.published;
  }

  if (options?.tag) {
    filter.tags = options.tag;
  }

  if (options?.category) {
    filter.categories = options.category;
  }

  if (options?.featured !== undefined) {
    filter.featured = options.featured;
  }

  let query = BlogPostModel.find(filter);

  if (options?.sort) {
    query = query.sort(options.sort);
  } else {
    query = query.sort({ publishedAt: -1, createdAt: -1 });
  }

  if (options?.skip !== undefined) {
    query = query.skip(options.skip);
  }

  if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }

  return query;
};

export const getBlogPostById = async (id: string) => {
  return BlogPostModel.findById(id);
};

export const getBlogPostBySlug = async (slug: string) => {
  return BlogPostModel.findOne({ slug });
};

export const createBlogPost = async (
  payload: CreateBlogPostInput
): Promise<BlogPostDocument> => {
  const exists = await BlogPostModel.findOne({ slug: payload.slug });
  if (exists) {
    throw new AppError('Blog post slug already exists', 409);
  }

  if (payload.published && !payload.publishedAt) {
    payload.publishedAt = new Date();
  }

  const data = applyPinMetadata(payload);

  return BlogPostModel.create(data);
};

export const updateBlogPost = async (
  id: string,
  payload: UpdateBlogPostInput
): Promise<BlogPostDocument | null> => {
  if (payload.published && !payload.publishedAt) {
    payload.publishedAt = new Date();
  }

  const data = applyPinMetadata(payload);

  return BlogPostModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

export const deleteBlogPost = async (id: string): Promise<BlogPostDocument | null> => {
  return BlogPostModel.findByIdAndDelete(id);
};

export const incrementBlogView = async (slug: string) => {
  return BlogPostModel.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true });
};

export const addCommentToPost = async (
  postId: string,
  payload: CreateCommentInput
): Promise<BlogPostDocument | null> => {
  return BlogPostModel.findByIdAndUpdate(
    postId,
    {
      $push: {
        comments: {
          _id: new Types.ObjectId(),
          ...payload,
          isApproved: true
        }
      }
    },
    { new: true }
  );
};

export const toggleCommentApproval = async (
  postId: string,
  commentId: string,
  isApproved: boolean
): Promise<BlogPostDocument | null> => {
  return BlogPostModel.findOneAndUpdate(
    { _id: postId, 'comments._id': commentId },
    { $set: { 'comments.$.isApproved': isApproved } },
    { new: true }
  );
};
