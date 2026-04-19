import { Router } from 'express';

import { portfolioStatusHandler, statusSummaryHandler } from '@controllers/status.controller';

const router = Router();

router.get('/summary', statusSummaryHandler);
router.get('/portfolio', portfolioStatusHandler);

export default router;
