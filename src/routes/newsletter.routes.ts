import { Router } from 'express';

import {
  confirmHandler,
  deleteSubscriberHandler,
  listSubscribersHandler,
  subscribeHandler,
  triggerNewsletterHandler,
  unsubscribeHandler
} from '@controllers/newsletter.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import {
  confirmSubscriptionSchema,
  newsletterAdminQuerySchema,
  subscribeSchema,
  triggerNewsletterSchema,
  unsubscribeSchema
} from '@validators/newsletter.validator';

const router = Router();

router.post('/subscribe', validate(subscribeSchema), subscribeHandler);
router.post('/unsubscribe', validate(unsubscribeSchema), unsubscribeHandler);
router.get('/confirm/:token', validate(confirmSubscriptionSchema), confirmHandler);

router.get(
  '/',
  authenticate,
  authorizeAction('newsletter:manage'),
  validate(newsletterAdminQuerySchema),
  listSubscribersHandler
);
router.delete('/:id', authenticate, authorizeAction('newsletter:manage'), deleteSubscriberHandler);
router.post(
  '/send',
  authenticate,
  authorizeAction('newsletter:send'),
  validate(triggerNewsletterSchema),
  triggerNewsletterHandler
);

export default router;
