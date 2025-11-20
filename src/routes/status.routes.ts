import { Router } from 'express';

import { statusSummaryHandler } from '@controllers/status.controller';

const router = Router();

router.get('/summary', statusSummaryHandler);

export default router;
