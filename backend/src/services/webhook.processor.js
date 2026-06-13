import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { shopifyCache } from '../utils/cache.js';
import { MerchantModel } from '../models/index.js';

// Lazy import to avoid circular dependency at startup
let _syncQueue = null;
async function getSyncQueue() {
  if (!_syncQueue) {
    const mod = await import('../workers/sync.worker.js');
    _syncQueue = mod.syncQueue || null;
  }
  return _syncQueue;
}

/**
 * Shopify Webhook Processor
 * Handles incoming Shopify webhooks and triggers appropriate actions
 */
export async function processWebhook(shopDomain, topic, payload) {
  logger.info({ shopDomain, topic }, 'Processing webhook');

  try {
    switch (topic) {
      case 'orders/create':
        await handleOrderCreate(shopDomain, payload);
        break;
      case 'orders/updated':
        await handleOrderUpdate(shopDomain, payload);
        break;
      case 'products/create':
        await handleProductCreate(shopDomain, payload);
        break;
      case 'products/update':
        await handleProductUpdate(shopDomain, payload);
        break;
      case 'checkouts/create':
        await handleCheckoutCreate(shopDomain, payload);
        break;
      case 'app/uninstalled':
        await handleAppUninstall(shopDomain);
        break;
      default:
        logger.warn({ shopDomain, topic }, 'Unhandled webhook topic');
    }

    logger.info({ shopDomain, topic }, 'Webhook processed successfully');
  } catch (err) {
    logger.error({ err, shopDomain, topic }, 'Webhook processing failed');
    throw err;
  }
}

/**
 * Queue a background sync for the shop — debounced so multiple webhooks
 * don't flood the queue. Uses BullMQ jobId deduplication.
 */
async function queueBackgroundSync(shopDomain, reason) {
  try {
    const syncQueue = await getSyncQueue();
    if (!syncQueue) {
      logger.debug({ shopDomain }, 'Sync queue not available — skipping background sync');
      return;
    }

    // jobId deduplication: only one pending sync per shop at a time
    await syncQueue.add(
      'store-sync',
      { shopDomain, reason },
      {
        jobId: `sync-${shopDomain}`,   // same id = deduplicated
        delay: 10_000,                  // wait 10s to batch rapid webhook bursts
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    logger.info({ shopDomain, reason }, 'Background sync queued via webhook');
  } catch (err) {
    // Non-fatal — cache invalidation already happened
    logger.warn({ err, shopDomain }, 'Failed to queue background sync (non-fatal)');
  }
}

// ─── Topic Handlers ───────────────────────────────────────────────────────────

async function handleOrderCreate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:orders:`);
  shopifyCache.deletePattern(`shopify:${shopDomain}:checkouts:`);
  logger.info({ shopDomain, orderId: payload.id }, 'Order created — cache invalidated');

  // Queue a full resync so dashboard metrics update in real-time
  await queueBackgroundSync(shopDomain, 'orders/create');
}

async function handleOrderUpdate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:orders:`);
  logger.info({ shopDomain, orderId: payload.id }, 'Order updated — cache invalidated');

  await queueBackgroundSync(shopDomain, 'orders/updated');
}

async function handleProductCreate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:products`);
  logger.info({ shopDomain, productId: payload.id }, 'Product created — cache invalidated');

  await queueBackgroundSync(shopDomain, 'products/create');
}

async function handleProductUpdate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:products`);
  logger.info({ shopDomain, productId: payload.id }, 'Product updated — cache invalidated');

  await queueBackgroundSync(shopDomain, 'products/update');
}

async function handleCheckoutCreate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:checkouts:`);
  logger.info({ shopDomain, checkoutId: payload.id }, 'Checkout created — cache invalidated');

  // Phase 5.2 — Schedule abandoned cart recovery email (2hr delay)
  try {
    const { scheduleAbandonedCartEmail } = await import('./email/abandoned.cart.js');
    await scheduleAbandonedCartEmail(shopDomain, payload);
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule abandoned cart email (non-fatal)');
  }
}

async function handleAppUninstall(shopDomain) {
  await MerchantModel.updateByShopDomain(shopDomain, { isActive: false });
  shopifyCache.invalidateShop(shopDomain);
  logger.info({ shopDomain }, 'App uninstalled — merchant deactivated and cache cleared');
}

/**
 * Verify Shopify webhook HMAC signature
 */
export function verifyWebhookHmac(body, hmac, apiSecret) {
  const computedHmac = crypto
    .createHmac('sha256', apiSecret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(computedHmac, 'utf8'),
    Buffer.from(hmac, 'utf8')
  );
}
