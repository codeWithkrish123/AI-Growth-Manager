import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL;
const isRedisEnabled = !!REDIS_URL;

let redisConnection = null;
let redisCache = new InMemoryCache();

if (isRedisEnabled) {
  // Future: connect to actual Redis when available
  logger.info('Redis URL provided - future support');
}

// In-memory cache for local development/when Redis unavailable
class InMemoryCache {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    return this.cache.get(key) || null;
  }

  async set(key, value, ttl) {
    this.cache.set(key, value);
    if (ttl) setTimeout(() => this.cache.delete(key), ttl * 1000);
  }

  async del(key) {
    this.cache.delete(key);
  }

  async ping() {
    return 'PONG';
  }
}

export { redisConnection, redisCache, isRedisEnabled };

export async function redisHealthCheck() {
  try {
    const pong = await redisCache.ping();
    return { status: pong === 'PONG' ? 'healthy' : 'unhealthy' };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}
