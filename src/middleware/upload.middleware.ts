import type { Request } from 'express';
import multer from 'multer';

import { uploadConfig } from '@config/upload.config';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req: Request, file, cb) => {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    return;
  }
  cb(null, true);
};

const baseUploader = multer({
  storage,
  limits: {
    fileSize: uploadConfig.maxFileSize
  },
  fileFilter
});

export const uploadSingle = (field = 'file') => baseUploader.single(field);

export const uploadMultiple = (field = 'files') => baseUploader.array(field, uploadConfig.maxFiles);

export default baseUploader;
