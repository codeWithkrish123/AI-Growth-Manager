import { Queue, Worker } from 'bullmq';
import { redisConnection, isRedisEnabled } from '../config/redis.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchOrders } from '../services/shopify/order.services.js';
import { fetchStoreInfo } from '../services/shopify/store.service.js';
import { fetchAbandonedCheckouts } from '../services/shopify/order.services.js';
import { fetchCustomers } from '../services/shopify/customers.service.js';
import { StoreSnapshotModel } from '../models/StoreSnapshot.model.js';
import { MerchantModel } from '../models/Merchant.model.js';
import { logger } from '../utils/logger.js';

// Only create queues if Redis is enabled
export let syncQueue = null;
export let fixQueue = null;
export let webhookQueue = null;
export let analysisQueue = null;

if (isRedisEnabled) {
  const defaultOptions = {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  };

  syncQueue = new Queue('store-sync', defaultOptions);
  fixQueue = new Queue('apply-fix', defaultOptions);
  webhookQueue = new Queue('webhook-events', defaultOptions);
  analysisQueue = new Queue('store-analysis', defaultOptions);
}

export async function queueAnalysis(shopDomain, snapshotId) {
  if (!analysisQueue) {
    logger.warn('Redis not enabled - analysis queue unavailable');
    return null;
  }
  const job = await analysisQueue.add('analyze-store', { shopDomain, snapshotId }, {
    jobId: `${shopDomain}-analysis`,
  });
  return job;
}

export async function queueFix(fixActionId, shopDomain) {
  if (!fixQueue) {
    logger.warn('Redis not enabled - fix queue unavailable');
    return null;
  }
  const job = await fixQueue.add('apply-fix', { fixActionId, shopDomain }, {
    jobId: fixActionId,
  });
  return job;
}

export async function queueWebhookEvent(webhookEventId) {
  if (!webhookQueue) {
    logger.warn('Redis not enabled - webhook queue unavailable');
    return null;
  }
  const job = await webhookQueue.add('process-webhook', { webhookEventId }, {
    jobId: webhookEventId,
  });
  return job;
}

// ─── Sync Worker ─────────────────────────────────────────────────────────────
export function startSyncWorker() {
  if (!isRedisEnabled) {
    logger.info('Redis not enabled - sync worker disabled');
    return;
  }
  
  const worker = new Worker(
    'store-sync',
    async (job) => {
      const { shopDomain, syncJobId } = job.data;
      logger.info({ shopDomain, syncJobId }, 'Processing sync job');

      try {
        // Get merchant's stored access token (falls back to admin token)
        const merchant = await MerchantModel.findOne({ shopDomain });
        if (!merchant) throw new Error('Merchant not found');

        let accessToken = merchant.getAccessToken();
        if (!accessToken) {
          accessToken = process.env.ADMIN_API_ACCESS_TOKEN;
        }
        if (!accessToken) {
          throw new Error('No valid access token found for this store. Please reconnect via OAuth.');
        }

        // Fetch real data from Shopify with individual error handling
        let products = [], orders = [], storeInfo = {}, checkouts = [], customers = [];

        try {
          products = await fetchProducts(shopDomain, accessToken).catch(err => {
            logger.warn({ shopDomain, error: err.message }, 'Failed to fetch products');
            return [];
          });
        } catch (e) { products = []; }

        try {
          orders = await fetchOrders(shopDomain, accessToken, 30).catch(err => {
            logger.warn({ shopDomain, error: err.message }, 'Failed to fetch orders');
            return [];
          });
        } catch (e) { orders = []; }

        try {
          storeInfo = await fetchStoreInfo(shopDomain, accessToken).catch(err => {
            logger.warn({ shopDomain, error: err.message }, 'Failed to fetch store info');
            return {};
          });
        } catch (e) { storeInfo = {}; }

        try {
          checkouts = await fetchAbandonedCheckouts(shopDomain, accessToken, 30).catch(err => {
            logger.warn({ shopDomain, error: err.message }, 'Failed to fetch checkouts');
            return [];
          });
        } catch (e) { checkouts = []; }

        try {
          customers = await fetchCustomers(shopDomain, accessToken).catch(err => {
            logger.warn({ shopDomain, error: err.message }, 'Failed to fetch customers');
            return [];
          });
        } catch (e) { customers = []; }

        // Calculate metrics
        const totalProducts = products.length;
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalCarts = checkouts.length + totalOrders;
        const cartAbandonmentRate = totalCarts > 0 ? ((checkouts.length / totalCarts) * 100) : 0;
        const estimatedSessions = totalOrders * 42;
        const conversionRate = estimatedSessions > 0 ? ((totalOrders / estimatedSessions) * 100) : 0;

        // Analyze products for health score
        const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
        const productsWithoutDescription = products.filter(p => !p.body_html || p.body_html.trim().length < 50);
        const inactiveProducts = products.filter(p => p.status !== 'active');
        let healthScore = 100;
        healthScore -= productsWithoutImages.length > 0 ? 15 : 0;
        healthScore -= productsWithoutDescription.length > 0 ? 10 : 0;
        healthScore -= inactiveProducts.length > 0 ? 5 : 0;
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Create store snapshot (reuse merchant from above)
        const snapshot = await StoreSnapshotModel.create({
          merchantId: merchant.id,
          shopDomain,
          metrics: {
            totalRevenue,
            orderCount: totalOrders,
            avgOrderValue,
            totalSessions: estimatedSessions,
            conversionRate: conversionRate / 100,
            checkoutsInitiated: totalCarts,
            checkoutsCompleted: totalOrders,
            cartAbandonRate: cartAbandonmentRate / 100,
            totalCustomers: customers.length,
            newCustomers: customers.length,
            returningCustomers: 0,
            returningRate: 0,
            totalProducts,
            activeProducts: products.filter(p => p.status === 'active').length,
            outOfStockCount: 0,
            noDescriptionCount: productsWithoutDescription.length,
            noImageCount: productsWithoutImages.length,
            revenue30d: totalRevenue,
            orders30d: totalOrders,
            aov30d: avgOrderValue,
          },
          topProducts: products.slice(0, 10).map(p => ({
            id: p.id,
            title: p.title,
            price: p.variants?.[0]?.price || '0.00',
          })),
          healthScore,
          healthBreakdown: {
            productsWithoutImages: productsWithoutImages.length,
            productsWithoutDescription: productsWithoutDescription.length,
            inactiveProducts: inactiveProducts.length,
          },
          syncedAt: new Date(),
          dataWindowDays: 30,
        });

        // Update merchant last sync time
        await MerchantModel.updateByShopDomain(shopDomain, { lastSyncAt: new Date() });

        logger.info({ shopDomain, healthScore, totalProducts, totalOrders }, 'Sync completed');
        return { success: true, snapshotId: snapshot.id };
      } catch (err) {
        logger.error({ err, shopDomain }, 'Sync job failed');
        throw err;
      }
    },
    { connection: redisConnection }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Sync job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Sync job failed');
  });

  logger.info('Sync worker started and listening for jobs');
  return worker;
}