import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL;
const isRedisEnabled = !!REDIS_URL;

let redisConnection = null;
let redisCache = null;

if (isRedisEnabled) {
  redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  redisConnection.on('connect', () => logger.info('Redis connected'));
  redisConnection.on('ready',   () => logger.info('Redis ready'));
  redisConnection.on('error',   (err) => logger.error({ err }, 'Redis connection error'));
  redisConnection.on('close',   () => logger.warn('Redis connection closed'));
  redisConnection.on('reconnecting', () => logger.debug('Redis reconnecting...'));

  redisCache = new Redis(REDIS_URL, {
    lazyConnect: true,
    keyPrefix: 'aigm:',
  });
  redisCache.on('error', (err) => logger.debug('Redis cache error', { err }));
}

export { redisConnection, redisCache, isRedisEnabled };

export async function redisHealthCheck() {
  if (!isRedisEnabled) {
    return { status: 'disabled' };
  }
  try {
    const pong = await redisCache.ping();
    return { status: pong === 'PONG' ? 'healthy' : 'unhealthy' };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}
