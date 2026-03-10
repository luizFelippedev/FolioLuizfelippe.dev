import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { AppError } from '@utils/helpers/error.helper';

import env from '@config/env.config';
import { uploadConfig, resolveUploadPath } from '@config/upload.config';

export interface UploadResult {
  id: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
}

const ensureDirectory = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const generateFilename = (original: string) => {
  const ext = path.extname(original) || '.bin';
  return `${crypto.randomUUID()}${ext}`;
};

export const saveFile = async (file: Express.Multer.File, folder = 'temp'): Promise<UploadResult> => {
  if (!file) {
    throw new AppError('File is required', 400);
  }

  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError('Unsupported file type', 415);
  }

  const uploadsDir = resolveUploadPath(folder);
  await ensureDirectory(uploadsDir);

  const filename = generateFilename(file.originalname);
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, file.buffer);

  const assetUrl = new URL(`/uploads/${folder}/${filename}`, env.ASSET_BASE_URL).toString();

  return {
    id: crypto.randomUUID(),
    filename,
    path: filePath,
    size: file.size,
    mimetype: file.mimetype,
    url: assetUrl
  };
};

export const removeFile = async (filePath: string) => {
  await fs.rm(filePath, { force: true });
};
