import { Queue } from 'bullmq';
import { redisConnection, isRedisEnabled } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export let syncQueue = null;

if (isRedisEnabled) {
  syncQueue = new Queue('store-sync', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts:  3,
      backoff:   { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail:     200,
    },
  });
}

/**
 * Add a full sync job for a merchant.
 * Uses shopDomain as jobId to deduplicate — if a sync is already queued,
 * BullMQ won't add a duplicate.
 */
export async function queueSync(shopDomain, syncJobId) {
  if (!syncQueue) {
    logger.warn('Redis not enabled - sync queue unavailable');
    return null;
  }
  const job = await syncQueue.add('sync-store', { shopDomain, syncJobId }, {
    jobId: `${shopDomain}:${syncJobId}`,
  });
  return job;
}
