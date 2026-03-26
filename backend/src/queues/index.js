import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

const defaultOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:         3,
    backoff:          { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail:     200,
  },
};

// ─── Analysis Queue ───────────────────────────────────────────────────────────
export const analysisQueue = new Queue('ai-analysis', defaultOptions);

export async function queueAnalysis(shopDomain, snapshotId) {
  return analysisQueue.add(
    'run_analysis',
    { shopDomain, snapshotId: String(snapshotId) },
    { jobId: `analysis:${shopDomain}:${snapshotId}` }
  );
}

// ─── Fix Queue ────────────────────────────────────────────────────────────────
export const fixQueue = new Queue('apply-fix', defaultOptions);

export async function queueFix(fixActionId, shopDomain) {
  return fixQueue.add(
    'apply_fix',
    { fixActionId: String(fixActionId), shopDomain },
    { jobId: `fix:${fixActionId}` }
  );
}

// ─── Webhook Queue ────────────────────────────────────────────────────────────
export const webhookQueue = new Queue('webhook-events', defaultOptions);

export async function queueWebhookEvent(webhookEventId) {
  return webhookQueue.add(
    'process_webhook',
    { webhookEventId: String(webhookEventId) },
    { jobId: `webhook:${webhookEventId}` }
  );
}