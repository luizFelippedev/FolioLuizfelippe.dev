import { Router } from 'express';

import { uploadMultipleFiles, uploadSingleFile } from '@controllers/upload.controller';
import { authenticate, authorizeAction } from '@middleware/auth.middleware';
import { uploadMultiple, uploadSingle } from '@middleware/upload.middleware';

const router = Router();

router.post('/single', authenticate, authorizeAction('uploads:manage'), uploadSingle('file'), uploadSingleFile);
router.post('/multiple', authenticate, authorizeAction('uploads:manage'), uploadMultiple('files'), uploadMultipleFiles);

export default router;
