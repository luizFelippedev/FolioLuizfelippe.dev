import { Router } from 'express';

import { listHomeHighlightsHandler } from '@controllers/highlights.controller';
import cacheResponse from '@middleware/cache.middleware';
import validate from '@middleware/validation.middleware';
import { getAudienceCacheKeySuffix } from '@utils/visitor/visitorSession.helper';
import { listHomeHighlightsQuerySchema } from '@validators/highlights.validator';

const router = Router();

router.get(
  '/home',
  validate(listHomeHighlightsQuerySchema),
  cacheResponse((req) => {
    const page = String(req.query.page ?? '1');
    const limit = String(req.query.limit ?? '12');
    return `highlights:home:${getAudienceCacheKeySuffix(req)}:${page}:${limit}`;
  }, 60),
  listHomeHighlightsHandler
);

export default router;
