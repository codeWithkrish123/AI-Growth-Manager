import { Merchant, StoreSnapshot, SyncJob, HealthHistory } from '../models/index.js';
import { fetchOrders, fetchAbandonedCheckouts }  from './shopify/orders.service.js';
import { fetchProducts }                          from './shopify/products.service.js';
import { fetchCustomers }                         from './shopify/customers.service.js';
import { fetchStoreInfo }                         from './shopify/store.service.js';
import { calculateMetrics }                       from './metrics/metrics.calculator.js';
import { calculateHealthScore }                   from './metrics/health.score.js';
import { startOfToday }                           from '../utils/date.js';
import { logger }                                 from '../utils/logger.js';

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
  const syncJob = await SyncJob.findById(syncJobId);

  try {
    // ── 1. Mark job running ─────────────────────────────────────────────────
    if (syncJob) {
      syncJob.status    = 'running';
      syncJob.startedAt = new Date();
      await syncJob.save();
    }

    // ── 2. Get merchant + access token ──────────────────────────────────────
    const merchant    = await Merchant.findOne({ shopDomain, isActive: true });
    if (!merchant) throw new Error(`Merchant not found: ${shopDomain}`);

    const accessToken = merchant.getAccessToken();

    // ── 3. Fetch all data in parallel ───────────────────────────────────────
    logger.info({ shopDomain }, 'Starting store sync');

    const [orders, checkouts, products, customers, storeInfo] = await Promise.all([
      fetchOrders(shopDomain, accessToken),
      fetchAbandonedCheckouts(shopDomain, accessToken),
      fetchProducts(shopDomain, accessToken),
      fetchCustomers(shopDomain, accessToken),
      fetchStoreInfo(shopDomain, accessToken),
    ]);

    // ── 4. Compute metrics ──────────────────────────────────────────────────
    const { metrics, topProducts } = calculateMetrics({ orders, checkouts, products, customers });
    const { healthScore, healthBreakdown } = calculateHealthScore(metrics);

    // ── 5. Save snapshot ────────────────────────────────────────────────────
    const snapshot = await StoreSnapshot.create({
      merchantId:      merchant._id,
      shopDomain,
      metrics,
      topProducts,
      healthScore,
      healthBreakdown,
      syncedAt:        new Date(),
      dataWindowDays:  90,
    });

    // ── 6. Update daily health history (upsert one per day) ─────────────────
    await HealthHistory.findOneAndUpdate(
      { merchantId: merchant._id, date: startOfToday() },
      {
        shopDomain,
        score:           healthScore,
        breakdown:       healthBreakdown,
        aov:             metrics.avgOrderValue,
        cartAbandonRate: metrics.cartAbandonRate,
        conversionRate:  metrics.conversionRate,
      },
      { upsert: true, new: true }
    );

    // ── 7. Update merchant lastSyncAt + shopInfo ─────────────────────────────
    merchant.lastSyncAt = new Date();
    merchant.shopInfo   = storeInfo;
    await merchant.save();

    // ── 8. Mark job completed ───────────────────────────────────────────────
    if (syncJob) {
      syncJob.status      = 'completed';
      syncJob.completedAt = new Date();
      syncJob.durationMs  = Date.now() - syncJob.startedAt.getTime();
      syncJob.result      = {
        ordersCount:    orders.length,
        productsCount:  products.length,
        customersCount: customers.length,
        snapshotId:     snapshot._id,
      };
      await syncJob.save();
    }

    logger.info({ shopDomain, healthScore }, 'Store sync completed');
    return snapshot;

  } catch (err) {
    if (syncJob) {
      syncJob.status   = 'failed';
      syncJob.errorMsg = err.message;
      await syncJob.save();
    }
    logger.error({ err, shopDomain }, 'Store sync failed');
    throw err;
  }
}