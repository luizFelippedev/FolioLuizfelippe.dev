import { Router } from 'express';

import {
  getAdminContentOverrideHandler,
  getAssistantSettingsHandler,
  resetAdminContentOverrideHandler,
  upsertAdminContentOverrideHandler,
  updateAssistantSettingsHandler,
  exportContactsCsv,
  exportSubscribersCsv,
  metricsHandler
} from '@controllers/admin.controller';
import {
  visitorIntelSessionsHandler,
  visitorIntelSummaryHandler
} from '@controllers/visitor.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import { exportContactsQuerySchema } from '@validators/contact.validator';
import { contentLocaleSchema, updateContentOverrideSchema } from '@validators/content.validator';
import { newsletterAdminQuerySchema } from '@validators/newsletter.validator';
import { updateWiseAssistantSettingsSchema } from '@validators/assistantSettings.validator';
import { visitorIntelSessionsQuerySchema } from '@validators/visitor.validator';

const router = Router();

router.get('/metrics', authenticate, authorizeAction('admin:metrics'), metricsHandler);
router.get(
  '/assistant-settings',
  authenticate,
  authorizeAction('admin:metrics'),
  getAssistantSettingsHandler
);
router.put(
  '/assistant-settings',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(updateWiseAssistantSettingsSchema),
  updateAssistantSettingsHandler
);
router.get(
  '/visitor-intel/summary',
  authenticate,
  authorizeAction('admin:metrics'),
  visitorIntelSummaryHandler
);
router.get(
  '/visitor-intel/sessions',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(visitorIntelSessionsQuerySchema),
  visitorIntelSessionsHandler
);
router.get(
  '/content/:locale',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(contentLocaleSchema),
  getAdminContentOverrideHandler
);
router.put(
  '/content/:locale',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(updateContentOverrideSchema),
  upsertAdminContentOverrideHandler
);
router.delete(
  '/content/:locale',
  authenticate,
  authorizeAction('admin:metrics'),
  validate(contentLocaleSchema),
  resetAdminContentOverrideHandler
);
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
