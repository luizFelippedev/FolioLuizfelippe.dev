import TestimonialModel, { type TestimonialDocument } from '@models/Testimonial.model';
import { AppError } from '@utils/helpers/error.helper';

import type {
  CreateTestimonialInput,
  UpdateTestimonialInput
} from '@validators/testimonial.validator';

interface TestimonialFilter {
  featured?: boolean;
  approved?: boolean;
}

interface ListOptions {
  filters?: TestimonialFilter;
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export const listTestimonials = async (options: ListOptions = {}) => {
  const query: Record<string, unknown> = {};
  if (options.filters?.featured !== undefined) {
    query.isFeatured = options.filters.featured;
  }
  if (options.filters?.approved !== undefined) {
    query.isApproved = options.filters.approved;
  }

  let cursor = TestimonialModel.find(query);

  if (options.sort) {
    cursor = cursor.sort(options.sort);
  } else {
    cursor = cursor.sort({ createdAt: -1 });
  }

  if (options.skip !== undefined) {
    cursor = cursor.skip(options.skip);
  }

  if (options.limit !== undefined) {
    cursor = cursor.limit(options.limit);
  }

  return cursor;
};

export const getTestimonialById = async (id: string) => {
  return TestimonialModel.findById(id);
};

export const createTestimonial = async (
  payload: CreateTestimonialInput
): Promise<TestimonialDocument> => {
  return TestimonialModel.create(payload);
};

export const updateTestimonial = async (
  id: string,
  payload: UpdateTestimonialInput
): Promise<TestimonialDocument | null> => {
  return TestimonialModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });
};

export const deleteTestimonial = async (id: string): Promise<TestimonialDocument | null> => {
  return TestimonialModel.findByIdAndDelete(id);
};

export const toggleTestimonialApproval = async (
  id: string,
  isApproved: boolean
): Promise<TestimonialDocument | null> => {
  const testimonial = await TestimonialModel.findById(id);
  if (!testimonial) {
    throw new AppError('Testimonial not found', 404);
  }

  testimonial.isApproved = isApproved;
  return testimonial.save();
};
