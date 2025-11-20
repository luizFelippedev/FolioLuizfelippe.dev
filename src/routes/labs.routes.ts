import { Router } from 'express';

import {
  createLabHandler,
  deleteLabHandler,
  listAdminLabsHandler,
  listPublicLabsHandler,
  updateLabHandler
} from '@controllers/labs.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import validate from '@middleware/validation.middleware';
import { createLabSchema, labIdSchema, updateLabSchema } from '@validators/lab.validator';

const router = Router();

router.get('/', listPublicLabsHandler);
router.get('/manage', authenticate, authorizeAction('labs:manage'), listAdminLabsHandler);
router.post('/', authenticate, authorizeAction('labs:manage'), validate(createLabSchema), createLabHandler);
router.put('/:id', authenticate, authorizeAction('labs:manage'), validate(updateLabSchema), updateLabHandler);
router.delete('/:id', authenticate, authorizeAction('labs:manage'), validate(labIdSchema), deleteLabHandler);

export default router;
