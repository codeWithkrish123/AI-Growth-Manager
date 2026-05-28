import { logger } from '../utils/logger.js';

// Mock Redis objects since Redis is not installed
export const redisConnection = {
  connect: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
  on: () => {},
  status: 'ready'
};

export const redisCache = {
  get: () => Promise.resolve(null),
  set: () => Promise.resolve('OK'),
  del: () => Promise.resolve(1),
  exists: () => Promise.resolve(0),
  expire: () => Promise.resolve(1)
};