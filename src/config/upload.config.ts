import path from 'node:path';

export const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4'
  ],
  maxFiles: 25,
  tempDir: path.resolve(process.cwd(), 'uploads/temp')
};

export const resolveUploadPath = (folder: string) => path.resolve(process.cwd(), 'uploads', folder);
