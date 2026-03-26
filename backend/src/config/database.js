import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export async function connectDB() {
  try {
    await mongoose.connect(config.mongo.uri, { dbName: 'ai_growth_manager' });
    logger.info('MongoDB connected');

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — retrying...');
    });
  } catch (err) {
    logger.error({ err }, 'MongoDB initial connection failed');
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}