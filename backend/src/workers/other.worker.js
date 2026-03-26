import { Worker }           from 'bullmq';
import { redisConnection }  from '../config/redis.js';
import { StoreSnapshot, Merchant, WebhookEvent } from '../models/index.js';
import { runAiAnalysis }    from '../services/shopify/ai/analysis.service.js';
import { executeFix }       from '../services/shopify/metrics/fix.executor.js';
import { queueSync }        from '../queues/sync.queue.js';
import { logger }           from '../utils/logger.js';

// ─── Analysis Worker ──────────────────────────────────────────────────────────
export function startAnalysisWorker() {
  const worker = new Worker(
    'ai-analysis',
    async (job) => {
      const { shopDomain, snapshotId } = job.data;
      logger.info({ jobId: job.id, shopDomain }, 'Analysis worker: processing job');

      const snapshot = await StoreSnapshot.findById(snapshotId);
      if (!snapshot) throw new Error(`Snapshot not found: ${snapshotId}`);

      const merchant = await Merchant.findById(snapshot.merchantId);
      await runAiAnalysis(snapshot, merchant?.shopInfo || {});
    },
    { connection: redisConnection, concurrency: 3 }
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Analysis worker: completed'));
  worker.on('failed',    (job, err) => logger.error({ jobId: job?.id, err }, 'Analysis worker: failed'));

  logger.info('Analysis worker started');
  return worker;
}

// ─── Fix Worker ───────────────────────────────────────────────────────────────
export function startFixWorker() {
  const worker = new Worker(
    'apply-fix',
    async (job) => {
      const { fixActionId, shopDomain } = job.data;
      logger.info({ jobId: job.id, fixActionId }, 'Fix worker: processing job');

      const merchant    = await Merchant.findOne({ shopDomain, isActive: true });
      if (!merchant) throw new Error(`Merchant not found: ${shopDomain}`);

      const accessToken = merchant.getAccessToken();
      await executeFix(fixActionId, accessToken);
    },
    { connection: redisConnection, concurrency: 3 }
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Fix worker: completed'));
  worker.on('failed',    (job, err) => logger.error({ jobId: job?.id, err }, 'Fix worker: failed'));

  logger.info('Fix worker started');
  return worker;
}

// ─── Webhook Worker ───────────────────────────────────────────────────────────
export function startWebhookWorker() {
  const worker = new Worker(
    'webhook-events',
    async (job) => {
      const { webhookEventId } = job.data;

      const event = await WebhookEvent.findById(webhookEventId);
      if (!event || event.processed) return;

      const { shopDomain, topic } = event;
      logger.info({ jobId: job.id, topic, shopDomain }, 'Webhook worker: processing');

      // ── Trigger partial re-sync on relevant events ────────────────────────
      const syncTriggers = [
        'orders/create',
        'orders/updated',
        'products/create',
        'products/update',
        'inventory_levels/update',
      ];

      if (syncTriggers.includes(topic)) {
        const merchant = await Merchant.findOne({ shopDomain, isActive: true });
        if (merchant) {
          const { SyncJob } = await import('../models/index.js');
          const syncJob     = await SyncJob.create({
            merchantId: merchant._id,
            shopDomain,
            jobType:    'partial_sync',
          });
          await queueSync(shopDomain, syncJob._id);
        }
      }

      // ── Handle app uninstall ──────────────────────────────────────────────
      if (topic === 'app/uninstalled') {
        await Merchant.findOneAndUpdate({ shopDomain }, { isActive: false });
        logger.info({ shopDomain }, 'Merchant marked inactive after uninstall');
      }

      event.processed   = true;
      event.processedAt = new Date();
      await event.save();
    },
    { connection: redisConnection, concurrency: 10 }
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Webhook worker: completed'));
  worker.on('failed',    (job, err) => logger.error({ jobId: job?.id, err }, 'Webhook worker: failed'));

  logger.info('Webhook worker started');
  return worker;
}