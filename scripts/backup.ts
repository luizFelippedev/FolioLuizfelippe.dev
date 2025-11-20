import fs from 'node:fs';
import path from 'node:path';

import env from '../src/config/env.config';
import logger from '../src/utils/logger/logger';

const backup = async () => {
  try {
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // TODO: dump MongoDB database or export collections as JSON.
    logger.info(`Backup placeholder completed for database ${env.DATABASE_URL}`);
  } catch (error) {
    logger.error('Backup failed', { error });
    process.exitCode = 1;
  }
};

void backup();
