import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ── Primary connection (used by BullMQ workers & queues) ─────────────────────
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  lazyConnect: true,
});

redisConnection.on('connect', () => logger.info('Redis connected'));
redisConnection.on('ready',   () => logger.info('Redis ready'));
redisConnection.on('error',   (err) => logger.error({ err }, 'Redis connection error'));
redisConnection.on('close',   () => logger.warn('Redis connection closed'));
redisConnection.on('reconnecting', () => logger.info('Redis reconnecting...'));

// ── Cache connection (used for general key-value caching) ────────────────────
export const redisCache = new Redis(REDIS_URL, {
  lazyConnect: true,
  keyPrefix: 'aigm:',
});

redisCache.on('error', (err) => logger.error({ err }, 'Redis cache error'));

// ── Health check helper ───────────────────────────────────────────────────────
export async function redisHealthCheck() {
  try {
    const pong = await redisCache.ping();
    return { status: pong === 'PONG' ? 'healthy' : 'unhealthy' };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}
