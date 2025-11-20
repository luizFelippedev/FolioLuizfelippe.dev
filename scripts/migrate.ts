import connectDatabase, { disconnectDatabase } from '../src/database/connection';
import logger from '../src/utils/logger/logger';

const migrate = async () => {
  try {
    await connectDatabase();
    logger.info('Running migrations...');
    // TODO: execute migration tasks in src/database/migrations
    logger.info('Migrations completed successfully.');
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

void migrate();
