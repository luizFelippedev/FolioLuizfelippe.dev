import { Router } from 'express';

import {
  deleteContactMessageHandler,
  getContactMessage,
  getContactMessages,
  submitContactMessage,
  updateContactMessageStatus
} from '@controllers/contact.controller';
import trackAnalyticsEvent from '@middleware/analytics.middleware';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import {
  contactMessageIdSchema,
  createContactMessageSchema,
  updateContactStatusSchema
} from '@validators/contact.validator';

const router = Router();

router.post(
  '/',
  validate(createContactMessageSchema),
  trackAnalyticsEvent('contact_submission', {
    resolvePayload: (req) => ({ subject: req.body.subject })
  }),
  submitContactMessage
);
router.get('/', authenticate, authorizeAction('contact:manage'), getContactMessages);
router.get(
  '/:id',
  authenticate,
  authorizeAction('contact:manage'),
  validate(contactMessageIdSchema),
  getContactMessage
);
router.patch(
  '/:id/status',
  authenticate,
  authorizeAction('contact:manage'),
  validate(updateContactStatusSchema),
  updateContactMessageStatus
);
router.delete(
  '/:id',
  authenticate,
  authorizeAction('contact:manage'),
  validate(contactMessageIdSchema),
  deleteContactMessageHandler
);

export default router;
