import mongoose from 'mongoose';

import { databaseConfig } from '@config/database.config';
import logger from '@utils/logger/logger';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(databaseConfig.url, databaseConfig.options);
    logger.info('Database connection established');
    return connection;
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('Database connection closed');
};

export default connectDatabase;
