import { Router } from 'express';

import {
  portfolioAssistantStatusHandler,
  streamPortfolioAssistantHandler
} from '@controllers/chat.controller';
import trackAnalyticsEvent from '@middleware/analytics.middleware';
import validate from '@middleware/validation.middleware';
import { portfolioAssistantStreamSchema } from '@validators/chat.validator';

const router = Router();

router.get('/status', portfolioAssistantStatusHandler);
router.post(
  '/stream',
  validate(portfolioAssistantStreamSchema),
  trackAnalyticsEvent('chatbot_message', {
    resolvePayload: (req) => ({
      locale: req.body.locale,
      page: req.body.page,
      messages: Array.isArray(req.body.messages) ? req.body.messages.length : 0
    })
  }),
  streamPortfolioAssistantHandler
);

export default router;
