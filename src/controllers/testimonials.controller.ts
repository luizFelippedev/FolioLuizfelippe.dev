import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialById,
  listTestimonials,
  toggleTestimonialApproval,
  updateTestimonial
} from '@services/testimonials.service';
import { recordActivity } from '@services/activityLog.service';
import { AppError } from '@utils/helpers/error.helper';
import { successResponse } from '@utils/helpers/response.helper';
import { parsePagination } from '@utils/helpers/pagination.helper';

export const getTestimonials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 12,
      allowedSortFields: ['createdAt', 'rating', 'name']
    });

    const { featured, approved } = req.query as { featured?: string; approved?: string };
    const testimonials = await listTestimonials({
      filters: {
        featured: featured !== undefined ? featured === 'true' : undefined,
        approved: approved !== undefined ? approved === 'true' : undefined
      },
      skip: pagination.skip,
      limit: pagination.limit,
      sort: pagination.sort
    });

    return successResponse(res, {
      page: pagination.page,
      limit: pagination.limit,
      data: testimonials
    });
  } catch (error) {
    return next(error);
  }
};

export const getTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await getTestimonialById(req.params.id);

    if (!testimonial) {
      return next(new AppError('Testimonial not found', StatusCodes.NOT_FOUND));
    }

    return successResponse(res, testimonial);
  } catch (error) {
    return next(error);
  }
};

export const createTestimonialHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await createTestimonial(req.body);
    return successResponse(res, testimonial, 'Testimonial submitted', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const updateTestimonialHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await updateTestimonial(req.params.id, req.body);

    if (!testimonial) {
      return next(new AppError('Testimonial not found', StatusCodes.NOT_FOUND));
    }

    await recordActivity({
      action: 'testimonial:update',
      actor: req.user,
      target: { id: req.params.id, type: 'Testimonial' }
    });

    return successResponse(res, testimonial, 'Testimonial updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteTestimonialHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await deleteTestimonial(req.params.id);

    if (!testimonial) {
      return next(new AppError('Testimonial not found', StatusCodes.NOT_FOUND));
    }

    await recordActivity({
      action: 'testimonial:delete',
      actor: req.user,
      target: { id: req.params.id, type: 'Testimonial' }
    });

    return successResponse(res, testimonial, 'Testimonial deleted');
  } catch (error) {
    return next(error);
  }
};

export const approveTestimonialHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { approved } = req.body as { approved: boolean };
    const testimonial = await toggleTestimonialApproval(req.params.id, approved);

    if (!testimonial) {
      return next(new AppError('Testimonial not found', StatusCodes.NOT_FOUND));
    }

    await recordActivity({
      action: 'testimonial:update',
      actor: req.user,
      target: { id: req.params.id, type: 'Testimonial' },
      metadata: { approved }
    });

    return successResponse(res, testimonial, 'Testimonial moderation updated');
  } catch (error) {
    return next(error);
  }
};
