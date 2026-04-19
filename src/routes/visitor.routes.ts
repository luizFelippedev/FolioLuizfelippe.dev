import { Router } from 'express';

import {
  getVisitorSessionHandler,
  recordVisitorEventHandler,
  upsertVisitorSessionHandler
} from '@controllers/visitor.controller';
import validate from '@middleware/validation.middleware';
import {
  recordVisitorEventSchema,
  upsertVisitorSessionSchema,
  visitorSessionSnapshotSchema
} from '@validators/visitor.validator';

const router = Router();

router.get('/session', validate(visitorSessionSnapshotSchema), getVisitorSessionHandler);
router.post('/session', validate(upsertVisitorSessionSchema), upsertVisitorSessionHandler);
router.post('/events', validate(recordVisitorEventSchema), recordVisitorEventHandler);

export default router;
