import { Redis } from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// Shared Redis connection used by BullMQ queues and workers
export const redisConnection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck:     false,
});

redisConnection.on('connect',    () => logger.info('Redis connected'));
redisConnection.on('error', (err) => logger.error({ err }, 'Redis error'));

// Separate client for general caching (get/set)
export const redisCache = new Redis(config.redis.url);