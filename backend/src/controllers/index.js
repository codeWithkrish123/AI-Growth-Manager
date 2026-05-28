import { StoreSnapshotModel } from '../models/StoreSnapshot.model.js';
import { AiAnalysisModel } from '../models/AiAnalysis.model.js';
import { MerchantModel } from '../models/Merchant.model.js';
import { FixActionModel, SyncJobModel, HealthHistoryModel, WebhookEventModel } from '../models/secondary.models.js';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/error.js';
import { processWebhook } from '../services/webhook.processor.js';
import { aiRateLimiter } from '../utils/rateLimiter.js';
import { executeFix, previewFix } from '../services/shopify/metrics/fix.executor.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchOrders } from '../services/shopify/order.services.js';
import { fetchStoreInfo } from '../services/shopify/store.service.js';
import { fetchAbandonedCheckouts } from '../services/shopify/order.services.js';
import { fetchCustomers } from '../services/shopify/customers.service.js';

// ─── Dashboard Controller ─────────────────────────────────────────────────────

/**
 * GET /api/:shopDomain/dashboard
 * Returns the latest snapshot + analysis for the merchant dashboard.
 */
export async function getDashboard(req, res) {
  try {
    const { merchant } = req;

    const [snapshot, analysis, scoreHistory] = await Promise.all([
      StoreSnapshotModel.findOne({ merchantId: merchant.id }),
      AiAnalysisModel.findOne({ merchantId: merchant.id, status: 'completed' }),
      HealthHistoryModel.find({ merchantId: merchant.id }).sort({ date: -1 }).limit(30),
    ]);

    return success(res, {
      merchant: {
        shopDomain: merchant.shopDomain,
        shopInfo:   merchant.shopInfo,
        planTier:   merchant.planTier,
        lastSyncAt: merchant.lastSyncAt,
      },
      snapshot:     snapshot  || null,
      analysis:     analysis  || null,
      scoreHistory: scoreHistory.reverse(), // oldest first for chart
    });
  } catch (err) {
    return error(res, err);
  }
}

// ─── Sync Controller ──────────────────────────────────────────────────────────

/**
 * POST /api/:shopDomain/sync
 * Directly fetches data from Shopify and creates database snapshot (no queue).
 */
export async function triggerSync(req, res) {
  try {
    const { merchant } = req;
    const shopDomain = merchant.shopDomain;

    // Use merchant's stored access token
    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      return error(res, 'Access token not found. Please reconnect your store.', 500);
    }

    logger.info({ shopDomain }, 'Starting direct sync');

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

    // Create store snapshot
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
    return success(res, {
      syncJobId: snapshot.id,
      status: 'completed',
      healthScore,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
    });
  } catch (err) {
    logger.error({ err, shopDomain: req.merchant?.shopDomain }, 'Sync failed');
    return error(res, 'Sync failed: ' + err.message, 500);
  }
}

/**
 * GET /api/:shopDomain/sync/:syncJobId
 * Poll the status of a sync job.
 * Since sync is now synchronous, this returns the store snapshot.
 */
export async function getSyncStatus(req, res) {
  try {
    const snapshot = await StoreSnapshotModel.findOne({
      _id:        req.params.syncJobId,
      merchantId: req.merchant.id,
    });

    if (!snapshot) throw new NotFoundError('Sync snapshot');

    // Return in sync job format for backward compatibility
    return success(res, {
      id: snapshot.id,
      merchantId: snapshot.merchantId,
      shopDomain: snapshot.shopDomain,
      status: 'completed',
      healthScore: snapshot.healthScore,
      metrics: snapshot.metrics,
      syncedAt: snapshot.syncedAt,
      createdAt: snapshot.createdAt,
    });
  } catch (err) {
    return error(res, err);
  }
}

// ─── Analysis Controller ──────────────────────────────────────────────────────

/**
 * POST /api/:shopDomain/analyze
 * Directly performs AI analysis on latest snapshot (no queue).
 */
export async function triggerAnalysis(req, res) {
  try {
    const { merchant } = req;
    const shopDomain = merchant.shopDomain;

    const snapshot = await StoreSnapshotModel.findOne({ merchantId: merchant.id }).sort({ syncedAt: -1 });
    if (!snapshot) throw new BadRequestError('No snapshot found. Run a sync first.');

    logger.info({ shopDomain }, 'Starting direct analysis');

    // Simple analysis based on snapshot data
    const problems = [];
    const suggestions = [];

    // Analyze health score
    if (snapshot.healthScore < 70) {
      problems.push({
        id: 'low-health-score',
        severity: 'critical',
        title: 'Low Store Health Score',
        description: `Your store health score is ${snapshot.healthScore}/100. This is below the recommended threshold.`,
        potentialRevenue: (100 - snapshot.healthScore) * 100,
      });
    }

    // Check products without images
    if (snapshot.healthBreakdown?.productsWithoutImages > 0) {
      problems.push({
        id: 'missing-images',
        severity: 'high',
        title: 'Products Without Images',
        description: `${snapshot.healthBreakdown.productsWithoutImages} products are missing images.`,
        potentialRevenue: snapshot.healthBreakdown.productsWithoutImages * 50,
      });
    }

    // Check products without description
    if (snapshot.healthBreakdown?.productsWithoutDescription > 0) {
      problems.push({
        id: 'missing-descriptions',
        severity: 'medium',
        title: 'Products Without Descriptions',
        description: `${snapshot.healthBreakdown.productsWithoutDescription} products have no description.`,
        potentialRevenue: snapshot.healthBreakdown.productsWithoutDescription * 30,
      });
    }

    // Check inactive products
    if (snapshot.healthBreakdown?.inactiveProducts > 0) {
      problems.push({
        id: 'inactive-products',
        severity: 'low',
        title: 'Inactive Products',
        description: `${snapshot.healthBreakdown.inactiveProducts} products are inactive.`,
        potentialRevenue: snapshot.healthBreakdown.inactiveProducts * 20,
      });
    }

    // Add suggestions
    suggestions.push({
      id: 'optimize-images',
      title: 'Optimize Product Images',
      description: 'Ensure all products have high-quality images to increase conversion rates.',
    });

    suggestions.push({
      id: 'improve-descriptions',
      title: 'Improve Product Descriptions',
      description: 'Write detailed SEO-friendly descriptions for all products.',
    });

    // Create analysis record
    const analysis = await AiAnalysisModel.create({
      merchantId: merchant.id,
      shopDomain,
      snapshotId: snapshot.id,
      status: 'completed',
      healthScore: snapshot.healthScore,
      problems,
      suggestions,
      summary: {
        totalIssues: problems.length,
        criticalIssues: problems.filter(p => p.severity === 'critical').length,
        potentialRevenue: problems.reduce((sum, p) => sum + (p.potentialRevenue || 0), 0),
      },
      createdAt: new Date(),
    });

    logger.info({ shopDomain, analysisId: analysis.id }, 'Analysis completed');
    return success(res, {
      analysisId: analysis.id,
      status: 'completed',
      healthScore: snapshot.healthScore,
      problems,
      suggestions,
      summary: analysis.summary,
    });
  } catch (err) {
    logger.error({ err, shopDomain: req.merchant?.shopDomain }, 'Analysis failed');
    return error(res, 'Analysis failed: ' + err.message, 500);
  }
}

/**
 * GET /api/:shopDomain/analysis/latest
 * Returns the most recent completed AI analysis.
 */
export async function getLatestAnalysis(req, res) {
  try {
    const analysis = await AiAnalysisModel.findOne({
      merchantId: req.merchant.id,
      status:     'completed',
    }).sort({ createdAt: -1 });

    if (!analysis) throw new NotFoundError('Analysis');

    return success(res, analysis);
  } catch (err) {
    logger.error({ err, shopDomain: req.merchant?.shopDomain }, 'Failed to retrieve latest analysis');
    return error(res, 'Failed to retrieve latest analysis: ' + err.message, 500);
  }
}

// ─── Fix Controller ───────────────────────────────────────────────────────────
/**
 * POST /api/:shopDomain/fix
 * Directly executes fix on Shopify (no queue).
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise} Promise resolving with the fix action result
 */
export async function applyFix(req, res) {
  try {
    const { merchant } = req;

    // ✅ FIX: include payload
    const { analysisId, problemId, fixType, payload } = req.body;

    if (!problemId || !fixType) {
      throw new BadRequestError('problemId and fixType are required');
    }

    // ✅ OPTIONAL BUT IMPORTANT VALIDATION
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestError('Valid payload is required');
    }

    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      throw new BadRequestError('Access token not found. Please reconnect your store.');
    }

    // Resolve analysisId
    let resolvedAnalysisId = analysisId;
    if (!resolvedAnalysisId) {
      const latestAnalysis = await AiAnalysisModel.findLatestByMerchant(merchant.id, 'completed');
      if (!latestAnalysis) {
        throw new BadRequestError('No analysis found. Please run an analysis first.');
      }
      resolvedAnalysisId = latestAnalysis.id;
    }

    logger.info({
      shopDomain: merchant.shopDomain,
      fixType,
      problemId,
      analysisId: resolvedAnalysisId
    }, 'Starting direct fix execution');

    // ✅ FIX: now payload is correctly stored
    const fixAction = await FixActionModel.create({
      merchantId: merchant.id,
      analysisId: resolvedAnalysisId,
      shopDomain: merchant.shopDomain,
      problemId,
      fixType,
      payload, // ✅ no fallback needed now
      triggeredBy: 'merchant',
      status: 'pending',
    });

    // Execute fix
    await executeFix(fixAction.id, accessToken);

    logger.info({
      shopDomain: merchant.shopDomain,
      fixActionId: fixAction.id
    }, 'Fix completed');

    return success(res, {
      fixActionId: fixAction.id,
      status: 'completed',
      message: 'Fix applied successfully',
    });

  } catch (err) {
    logger.error({ err, shopDomain: req.merchant?.shopDomain }, 'Fix failed');
    return error(res, 'Fix failed: ' + err.message, 500);
  }
}

/**
 * GET /api/:shopDomain/fix/:fixActionId
 * Get the status of a fix action.
 */
export async function getFixStatus(req, res) {
  try {
    const fixAction = await FixActionModel.findOne({
      _id:        req.params.fixActionId,
      merchantId: req.merchant.id,
    });

    if (!fixAction) throw new NotFoundError('Fix action');

    return success(res, fixAction);
  } catch (err) {
    return error(res, err);
  }
}

/**
 * GET /api/:shopDomain/fixes
 * List all fix actions for a merchant (audit trail).
 */
export async function listFixes(req, res) {
  try {
    const fixes = await FixActionModel.find({ merchantId: req.merchant.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return success(res, fixes);
  } catch (err) {
    return error(res, err);
  }
}

/**
 * POST /api/:shopDomain/fix/:fixActionId/preview
 * Preview a fix before applying it (shows before/after changes).
 */
export async function previewFixAction(req, res) {
  try {
    const { merchant } = req;
    const fixActionId = req.params.fixActionId;

    const fixAction = await FixActionModel.findOne({
      _id: fixActionId,
      merchantId: merchant.id,
    });

    if (!fixAction) throw new NotFoundError('Fix action');

    const accessToken = merchant.getAccessToken();
    const preview = await previewFix(fixActionId, accessToken);

    return success(res, preview);
  } catch (err) {
    return error(res, err);
  }
}

// ─── Webhook Controller ───────────────────────────────────────────────────────

/**
 * POST /webhooks/shopify
 * Receives Shopify webhook events. HMAC already validated by middleware.
 */
export async function handleWebhook(req, res) {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const topic = req.headers['x-shopify-topic'];
    const webhookId = req.headers['x-shopify-webhook-id'];

    // Idempotency — skip if we've already processed this exact webhook
    const existing = await WebhookEventModel.findOne({ shopifyWebhookId: webhookId });
    if (existing) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const event = await WebhookEventModel.create({
      shopDomain,
      topic,
      payload: req.body,
      shopifyWebhookId: webhookId,
      receivedAt: new Date(),
      status: 'received',
    });

    // Process webhook directly (inline for now, can be queued later)
    await processWebhook(shopDomain, topic, req.body);

    await WebhookEventModel.findByIdAndUpdate(event.id, { status: 'processed' });

    // Shopify requires a fast 200 response
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Webhook handler error');
    // Still return 200 to prevent Shopify retries flooding us
    return res.status(200).json({ received: true });
  }
}

// ─── Health Score History Controller ─────────────────────────────────────────

/**
 * GET /api/:shopDomain/health-history
 * Returns last 90 days of daily health scores for the trend chart.
 */
export async function getHealthHistory(req, res) {
  try {
    const history = await HealthHistoryModel.find({ merchantId: req.merchant.id })
      .sort({ date: -1 })
      .limit(90);

    return success(res, history.reverse());
  } catch (err) {
    return error(res, err);
  }
}