import { MerchantModel, StoreSnapshotModel, SyncJobModel, HealthHistoryModel } from '../../models/index.js';
import { fetchOrders, fetchAbandonedCheckouts } from '../shopify/orders.service.js';
import { fetchProducts } from '../shopify/products.service.js';
import { fetchCustomers } from '../shopify/customers.service.js';
import { fetchStoreInfo } from '../shopify/store.service.js';
import { fetchAnalytics } from '../shopify/analytics.service.js';
import { calculateMetrics } from './metrics.calculator.js';
import { calculateHealthScore } from './health.score.js';
import { startOfToday } from '../../utils/date.js';
import { logger } from '../../utils/logger.js';
import { shopifyCache } from '../../utils/cache.js';
import { detectProblems, calculateStoreCompleteness } from '../../services/problem.detection.js';

/**
 * Full store sync — fetches all data from Shopify, computes metrics,
 * saves a StoreSnapshot, and updates the daily HealthHistory.
 *
 * Called by: sync.worker.js
 *
 * @param {string} shopDomain
 * @param {string} syncJobId   SyncJob._id (for status updates)
 * @returns {Object}           The saved StoreSnapshot
 */
export async function syncStore(shopDomain, syncJobId) {
  const syncJob = await SyncJobModel.findById(syncJobId);

  try {
    // ── 1. Mark job running ─────────────────────────────────────────────────
    if (syncJob) {
      syncJob.status = 'running';
      syncJob.startedAt = new Date();
      await syncJob.save();
    }

    // ── 2. Get merchant + access token ──────────────────────────────────────
    const merchant = await MerchantModel.findByShopDomain(shopDomain);
    if (!merchant || !merchant.isActive) throw new Error(`Merchant not found or inactive: ${shopDomain}`);

    const accessToken = merchant.getAccessToken();

    // ── 3. Fetch all data in parallel ───────────────────────────────────────
    logger.info({ shopDomain }, 'Starting store sync');

    const [orders, checkouts, products, customers, storeInfo, analytics] = await Promise.all([
      fetchOrders(shopDomain, accessToken),
      fetchAbandonedCheckouts(shopDomain, accessToken),
      fetchProducts(shopDomain, accessToken),
      fetchCustomers(shopDomain, accessToken),
      fetchStoreInfo(shopDomain, accessToken),
      fetchAnalytics(shopDomain, accessToken).catch(() => ({ sessions: 0, pageViews: 0 })), // Analytics may fail for non-Plus stores
    ]);

    // ── 4. Compute metrics ──────────────────────────────────────────────────
    const { metrics, topProducts } = calculateMetrics({ orders, checkouts, products, customers });
    
    // Add analytics data to metrics
    metrics.totalSessions = analytics.sessions;
    metrics.pageViews = analytics.pageViews;
    
    // Calculate conversion rate if we have sessions data
    if (analytics.sessions > 0) {
      metrics.conversionRate = (metrics.orderCount / analytics.sessions) * 100;
    }

    const { healthScore, healthBreakdown } = calculateHealthScore(metrics);

    // ── 5. Detect problems using rule-based detection ───────────────────────
    const problems = detectProblems(metrics, products, orders, checkouts);
    const storeCompleteness = calculateStoreCompleteness(products, storeInfo);

    // ── 6. Save snapshot ────────────────────────────────────────────────────
    const snapshot = await StoreSnapshotModel.create({
      merchantId: merchant.id,
      shopDomain,
      metrics,
      topProducts,
      healthScore,
      healthBreakdown,
      problems,
      storeCompleteness,
      syncedAt: new Date(),
      dataWindowDays: 90,
    });

    // ── 7. Update daily health history (upsert one per day) ─────────────────
    await HealthHistoryModel.findOneAndUpdate(
      { merchantId: merchant.id, date: startOfToday() },
      {
        shopDomain,
        healthScore,
        metrics: {
          aov: metrics.avgOrderValue,
          cartAbandonRate: metrics.cartAbandonRate,
          conversionRate: metrics.conversionRate,
          sessions: analytics.sessions,
        },
      },
      { upsert: true, new: true }
    );

    // ── 7. Update merchant lastSyncAt + shopInfo ─────────────────────────────
    await MerchantModel.updateByShopDomain(shopDomain, {
      lastSyncAt: new Date(),
      shopInfo: storeInfo,
    });

    // ── 8. Invalidate cache for this shop (data is fresh) ───────────────────
    shopifyCache.invalidateShop(shopDomain);
    logger.debug({ shopDomain }, 'Cache invalidated after sync');

    // ── 9. Mark job completed ───────────────────────────────────────────────
    if (syncJob) {
      syncJob.status = 'completed';
      syncJob.completedAt = new Date();
      syncJob.durationMs = Date.now() - syncJob.startedAt.getTime();
      syncJob.result = {
        ordersCount: orders.length,
        productsCount: products.length,
        customersCount: customers.length,
        snapshotId: snapshot.id,
      };
      await syncJob.save();
    }

    logger.info({ shopDomain, healthScore }, 'Store sync completed');
    return snapshot;

  } catch (err) {
    if (syncJob) {
      syncJob.status = 'failed';
      syncJob.errorMsg = err.message;
      await syncJob.save();
    }
    logger.error({ err, shopDomain }, 'Store sync failed');
    throw err;
  }
}