import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const syncQueue = new Queue('store-sync', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:  3,
    backoff:   { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail:     200,
  },
});

/**
 * Add a full sync job for a merchant.
 * Uses shopDomain as jobId to deduplicate — if a sync is already queued,
 * BullMQ won't add a duplicate.
 */
export async function queueSync(shopDomain, syncJobId) {
  return syncQueue.add(
    'sync_store',
    { shopDomain, syncJobId: String(syncJobId) },
    { jobId: `sync:${shopDomain}` }
  );
}