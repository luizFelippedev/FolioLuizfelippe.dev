import { Router } from 'express';

import { getPublicContentOverrideHandler } from '@controllers/content.controller';
import validate from '@middleware/validation.middleware';
import { contentLocaleSchema } from '@validators/content.validator';

const router = Router();

router.get('/public/:locale', validate(contentLocaleSchema), getPublicContentOverrideHandler);

export default router;
