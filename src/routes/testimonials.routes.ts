import { Router } from 'express';

import {
  approveTestimonialHandler,
  createTestimonialHandler,
  deleteTestimonialHandler,
  getTestimonial,
  getTestimonials,
  updateTestimonialHandler
} from '@controllers/testimonials.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import trackAnalyticsEvent from '@middleware/analytics.middleware';
import validate from '@middleware/validation.middleware';
import {
  createTestimonialSchema,
  listTestimonialsQuerySchema,
  testimonialApprovalSchema,
  testimonialIdSchema,
  updateTestimonialSchema
} from '@validators/testimonial.validator';

const router = Router();

router.get('/', validate(listTestimonialsQuerySchema), getTestimonials);
router.get('/:id', validate(testimonialIdSchema), getTestimonial);
router.post(
  '/',
  validate(createTestimonialSchema),
  trackAnalyticsEvent('testimonial_submission'),
  createTestimonialHandler
);
router.put(
  '/:id',
  authenticate,
  authorizeAction('testimonials:manage'),
  validate(updateTestimonialSchema),
  updateTestimonialHandler
);
router.delete(
  '/:id',
  authenticate,
  authorizeAction('testimonials:manage'),
  validate(testimonialIdSchema),
  deleteTestimonialHandler
);
router.patch(
  '/:id/approval',
  authenticate,
  authorizeAction('testimonials:manage'),
  validate(testimonialApprovalSchema),
  approveTestimonialHandler
);

export default router;
