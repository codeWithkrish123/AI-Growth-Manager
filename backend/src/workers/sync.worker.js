import { logger } from '../utils/logger.js';

// Workers disabled - Redis not available
export let syncQueue = null;
export let fixQueue = null;
export let webhookQueue = null;
export let analysisQueue = null;

export async function queueAnalysis(shopDomain, snapshotId) {
  logger.debug('Analysis queued (Redis unavailable)');
  return null;
}

export async function queueFix(fixActionId, shopDomain) {
  logger.debug('Fix queued (Redis unavailable)');
  return null;
}

export async function queueWebhookEvent(webhookEventId) {
  logger.debug('Webhook queued (Redis unavailable)');
  return null;
}

export function startSyncWorker() {
  logger.info('Sync worker disabled (Redis not available)');
}
