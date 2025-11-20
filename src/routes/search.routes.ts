import { Router } from 'express';

import { searchHandler } from '@controllers/search.controller';
import cacheResponse from '@middleware/cache.middleware';
import validate from '@middleware/validation.middleware';
import { searchQuerySchema } from '@validators/search.validator';

const router = Router();

router.get(
  '/',
  validate(searchQuerySchema),
  cacheResponse((req) => `search:${String(req.query.q)}:${String(req.query.limit ?? '')}`, 60),
  searchHandler
);

export default router;
