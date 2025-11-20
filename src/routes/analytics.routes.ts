import { Router } from 'express';

import {
  analyticsSummary,
  analyticsTimeline,
  ingestEvent
} from '@controllers/analytics.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import {
  analyticsQuerySchema,
  createAnalyticsEventSchema
} from '@validators/analytics.validator';

const router = Router();

router.post('/', validate(createAnalyticsEventSchema), ingestEvent);
router.get(
  '/summary',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(analyticsQuerySchema),
  analyticsSummary
);
router.get(
  '/timeline',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(analyticsQuerySchema),
  analyticsTimeline
);

export default router;
