import { Router } from 'express';

import {
  exportContactsCsv,
  exportSubscribersCsv,
  metricsHandler
} from '@controllers/admin.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import { newsletterAdminQuerySchema } from '@validators/newsletter.validator';
import { exportContactsQuerySchema } from '@validators/contact.validator';

const router = Router();

router.get('/metrics', authenticate, authorizeAction('admin:metrics'), metricsHandler);
router.get(
  '/export/subscribers',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(newsletterAdminQuerySchema),
  exportSubscribersCsv
);
router.get(
  '/export/contacts',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(exportContactsQuerySchema),
  exportContactsCsv
);

export default router;
