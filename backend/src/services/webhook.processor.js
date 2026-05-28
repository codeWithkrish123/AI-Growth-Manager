import { logger } from '../utils/logger.js';
import { shopifyCache } from '../utils/cache.js';
import { MerchantModel } from '../models/index.js';

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
 * Handle orders/create webhook
 * Invalidate orders cache and potentially trigger re-analysis
 */
async function handleOrderCreate(shopDomain, payload) {
  // Invalidate orders cache
  shopifyCache.deletePattern(`shopify:${shopDomain}:orders:`);
  
  // Invalidate checkouts cache since order was created from checkout
  shopifyCache.deletePattern(`shopify:${shopDomain}:checkouts:`);
  
  logger.info({ shopDomain, orderId: payload.id }, 'Order created - cache invalidated');
  
  // In production, this would queue a background job to:
  // 1. Fetch updated order data
  // 2. Recalculate metrics
  // 3. Trigger AI analysis if significant changes
}

/**
 * Handle orders/updated webhook
 * Invalidate orders cache
 */
async function handleOrderUpdate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:orders:`);
  
  logger.info({ shopDomain, orderId: payload.id }, 'Order updated - cache invalidated');
}

/**
 * Handle products/create webhook
 * Invalidate products cache
 */
async function handleProductCreate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:products`);
  
  logger.info({ shopDomain, productId: payload.id }, 'Product created - cache invalidated');
}

/**
 * Handle products/update webhook
 * Invalidate products cache and potentially trigger re-analysis
 */
async function handleProductUpdate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:products`);
  
  logger.info({ shopDomain, productId: payload.id }, 'Product updated - cache invalidated');
  
  // In production, this would queue a background job to:
  // 1. Fetch updated product data
  // 2. Recalculate product quality metrics
  // 3. Trigger AI analysis if significant changes
}

/**
 * Handle checkouts/create webhook
 * Invalidate checkouts cache
 */
async function handleCheckoutCreate(shopDomain, payload) {
  shopifyCache.deletePattern(`shopify:${shopDomain}:checkouts:`);
  
  logger.info({ shopDomain, checkoutId: payload.id }, 'Checkout created - cache invalidated');
}

/**
 * Handle app/uninstalled webhook
 * Mark merchant as inactive and clear all cache
 */
async function handleAppUninstall(shopDomain) {
  // Mark merchant as inactive
  await MerchantModel.updateByShopDomain(shopDomain, {
    isActive: false,
  });
  
  // Clear all cache for this shop
  shopifyCache.invalidateShop(shopDomain);
  
  logger.info({ shopDomain }, 'App uninstalled - merchant deactivated and cache cleared');
}

/**
 * Verify Shopify webhook HMAC signature
 * This is done in middleware, but included here for reference
 */
export function verifyWebhookHmac(body, hmac, apiSecret) {
  const crypto = require('crypto');
  const computedHmac = crypto
    .createHmac('sha256', apiSecret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(computedHmac, 'utf8'),
    Buffer.from(hmac, 'utf8')
  );
}
