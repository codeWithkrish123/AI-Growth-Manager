import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { MerchantModel, AiAnalysisModel, StoreSnapshotModel } from '../models/index.js';
import { HealthHistoryModel } from '../models/secondary.models.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchOrders } from '../services/shopify/order.services.js';
import { fetchStoreInfo } from '../services/shopify/store.service.js';
import { fetchAbandonedCheckouts } from '../services/shopify/order.services.js';
import { fetchCustomers } from '../services/shopify/customers.service.js';
import { calculateHealthScore } from '../services/shopify/metrics/health.score.js';

/**
 * Get dashboard data for a merchant
 * GET /api/:shopDomain/dashboard
 */
export async function getDashboard(req, res) {
  try {
    const { shopDomain } = req.params;
    const { force } = req.query;
    
    // Find merchant
    const merchant = await MerchantModel.findOne({ shopDomain });
    
    if (!merchant) {
      return error(res, 'Store not found. Please connect your store first.', 404);
    }

    // Use merchant's stored access token only — no admin fallback
    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      return error(res, 'Access token not found. Please reconnect your store via Shopify OAuth.', 401);
    }

    // Quick token validity check — if 401, fall back to cached DB data
    let tokenValid = true;
    try {
      await fetchStoreInfo(shopDomain, accessToken, true);
    } catch (e) {
      if (e.message?.includes('401')) {
        tokenValid = false;
        logger.warn({ shopDomain }, 'Shopify token expired — serving cached data');
      }
    }

    // If token expired, serve from DB cache
    if (!tokenValid) {
      const [snapshot, analysis, scoreHistory] = await Promise.all([
        StoreSnapshotModel.findOne({ merchantId: merchant.id }).catch(() => null),
        AiAnalysisModel.findOne({ merchantId: merchant.id, status: 'completed' }).catch(() => null),
        HealthHistoryModel.find({ merchantId: merchant.id, sort: { date: -1 }, limit: 30 }).catch(() => []),
      ]);
      return success(res, {
        shopDomain,
        tokenExpired: true,
        reconnectUrl: `/onboarding`,
        snapshot: snapshot || null,
        analysis: analysis || null,
        scoreHistory: (scoreHistory || []).reverse(),
        healthScore: snapshot?.healthScore ?? 0,
        products: [],
      });
    }

    // Check if this is a first-time load (no snapshot yet)
    const existingSnapshot = await StoreSnapshotModel.findOne({ merchantId: merchant.id }).catch(() => null);
    const isFirstLoad = !existingSnapshot;
    if (isFirstLoad) logger.info({ shopDomain }, 'First dashboard load — building snapshot inline');

    // Fetch real data from Shopify with individual error handling
    let products = [], orders = [], storeInfo = {}, checkouts = [], customers = [];
    
    try {
      products = await fetchProducts(shopDomain, accessToken, force === 'true').catch(err => {
        logger.warn({ shopDomain, error: err.message }, 'Failed to fetch products');
        return [];
      });
    } catch (e) { products = []; }
    
    try {
      orders = await fetchOrders(shopDomain, accessToken, 30, force === 'true').catch(err => {
        logger.warn({ shopDomain, error: err.message }, 'Failed to fetch orders');
        return [];
      });
    } catch (e) { orders = []; }
    
    try {
      storeInfo = await fetchStoreInfo(shopDomain, accessToken, force === 'true').catch(err => {
        logger.warn({ shopDomain, error: err.message }, 'Failed to fetch store info');
        return {};
      });
    } catch (e) { storeInfo = {}; }
    
    try {
      checkouts = await fetchAbandonedCheckouts(shopDomain, accessToken, 30, force === 'true').catch(err => {
        logger.warn({ shopDomain, error: err.message }, 'Failed to fetch checkouts');
        return [];
      });
    } catch (e) { checkouts = []; }
    
    try {
      customers = await fetchCustomers(shopDomain, accessToken, force === 'true').catch(err => {
        logger.warn({ shopDomain, error: err.message }, 'Failed to fetch customers');
        return [];
      });
    } catch (e) { customers = []; }

    // Calculate real metrics
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate cart abandonment
    const totalCarts = checkouts.length + totalOrders;
    const cartAbandonmentRate = totalCarts > 0 ? ((checkouts.length / totalCarts) * 100).toFixed(1) : 0;
    
    // Analyze products for AI insights
    const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
    const productsWithoutDescription = products.filter(p => !p.body_html || p.body_html.trim().length < 50);
    const inactiveProducts = products.filter(p => p.status !== 'active');
    const productsWithoutTags = products.filter(p => !p.tags || p.tags.length === 0);

    // Returning customer analysis — needed for health score
    const emailOrderCount = {};
    for (const order of orders) {
      const email = order.email?.toLowerCase();
      if (email) emailOrderCount[email] = (emailOrderCount[email] || 0) + 1;
    }
    const returningCustomers = Object.values(emailOrderCount).filter(c => c > 1).length;
    const totalUniqueCustomers = Object.keys(emailOrderCount).length || customers.length;
    const returningRate = totalUniqueCustomers > 0 ? returningCustomers / totalUniqueCustomers : 0;
    const estimatedSessions = totalOrders * 42;
    const conversionRate = estimatedSessions > 0 ? ((totalOrders / estimatedSessions) * 100).toFixed(2) : 0;

    // Generate AI-powered suggestions
    const suggestions = [];
    // Use the canonical health score calculator
    const { healthScore, healthBreakdown } = calculateHealthScore({
      conversionRate: totalOrders > 0 ? (totalOrders / (totalOrders * 42)) * 100 : 0,
      cartAbandonRate: totalCarts > 0 ? (checkouts.length / totalCarts) * 100 : 0,
      avgOrderValue,
      noDescriptionCount: productsWithoutDescription.length,
      noImageCount: productsWithoutImages.length,
      activeProducts: products.filter(p => p.status === 'active').length || 1,
      outOfStockCount: 0,
      returningRate,
    });

    if (productsWithoutImages.length > 0) {
      suggestions.push({
        id: '1',
        title: 'Add Product Images',
        reason: `${productsWithoutImages.length} products missing images - reduces conversion by 40%`,
        impact: 'High',
        action: `Add images to ${productsWithoutImages.length} products`,
        status: 'pending',
        affectedProducts: productsWithoutImages.map(p => ({ id: p.id, title: p.title }))
      });
    }

    if (productsWithoutDescription.length > 0) {
      suggestions.push({
        id: '2',
        title: 'Improve Product Descriptions',
        reason: `${productsWithoutDescription.length} products have poor descriptions - hurts SEO`,
        impact: 'High',
        action: 'Generate AI-optimized descriptions',
        status: 'pending',
        affectedProducts: productsWithoutDescription.slice(0, 5).map(p => ({ id: p.id, title: p.title }))
      });
    }

    if (inactiveProducts.length > 0) {
      suggestions.push({
        id: '3',
        title: 'Activate Products',
        reason: `${inactiveProducts.length} products are inactive`,
        impact: 'Medium',
        action: `Review and activate ${inactiveProducts.length} products`,
        status: 'pending'
      });
    }

    if (parseFloat(cartAbandonmentRate) > 60) {
      suggestions.push({
        id: '4',
        title: 'Reduce Cart Abandonment',
        reason: `${cartAbandonmentRate}% cart abandonment rate - industry avg is 70%`,
        impact: 'High',
        action: 'Enable abandoned cart recovery emails',
        status: 'pending'
      });
    }

    if (productsWithoutTags.length > 0) {
      const firstUntagged = productsWithoutTags[0];
      const autoTags = firstUntagged.title
        .toLowerCase()
        .replace(/[^a-z0-9\s\-]/g, '')
        .split(/[\s\-]+/)
        .filter(w => w.length > 2)
        .slice(0, 5)
        .join(', ');

      suggestions.push({
        id: '5',
        title: 'Add Product Tags',
        reason: `${productsWithoutTags.length} product${productsWithoutTags.length > 1 ? 's' : ''} missing tags - hurts discoverability`,
        impact: 'Low',
        action: 'Auto-generate relevant tags',
        status: 'pending',
        fixType: 'add_product_tags',
        payload: { product: { id: firstUntagged.id }, tags: autoTags },
        affectedProducts: productsWithoutTags.map(p => ({ id: p.id, title: p.title }))
      });
    }

    const seoScore = Math.max(0, Math.min(100, Math.round(
      100
      - (productsWithoutDescription.length / Math.max(totalProducts, 1)) * 40
      - (productsWithoutTags.length / Math.max(totalProducts, 1)) * 20
    )));
    const speedScore = 72;
    const productsScore = Math.max(0, Math.min(100, Math.round(
      100
      - (productsWithoutImages.length / Math.max(totalProducts, 1)) * 40
      - (inactiveProducts.length / Math.max(totalProducts, 1)) * 20
    )));

    // Build revenue map: productId -> revenue from orders
    const productRevenueMap = {};
    for (const order of orders) {
      for (const item of (order.line_items || [])) {
        const pid = String(item.product_id);
        productRevenueMap[pid] = (productRevenueMap[pid] || 0) + (parseFloat(item.price) * (item.quantity || 1));
      }
    }

    // Persist snapshot to DB (upsert pattern — always keep latest)
    const snapshotMetrics = {
      totalRevenue,
      orderCount: totalOrders,
      avgOrderValue,
      totalSessions: estimatedSessions,
      conversionRate: conversionRate / 100,
      checkoutsInitiated: totalCarts,
      checkoutsCompleted: totalOrders,
      cartAbandonRate: cartAbandonmentRate / 100,
      totalCustomers: totalUniqueCustomers,
      newCustomers: totalUniqueCustomers - returningCustomers,
      returningCustomers,
      returningRate,
      totalProducts,
      activeProducts: products.filter(p => p.status === 'active').length,
      outOfStockCount: 0,
      noDescriptionCount: productsWithoutDescription.length,
      noImageCount: productsWithoutImages.length,
      revenue30d: totalRevenue,
      orders30d: totalOrders,
      aov30d: avgOrderValue,
    };
    StoreSnapshotModel.create({
      merchantId: merchant.id,
      shopDomain,
      metrics: snapshotMetrics,
      topProducts: products.slice(0, 5).map(p => ({ id: p.id, title: p.title, price: p.variants?.[0]?.price || '0' })),
      healthScore,
      healthBreakdown: { productsWithoutImages: productsWithoutImages.length, productsWithoutDescription: productsWithoutDescription.length, inactiveProducts: inactiveProducts.length },
      syncedAt: new Date(),
      dataWindowDays: 30,
    }).catch(() => {}); // non-blocking, non-fatal

    // Save health history row for chart
    HealthHistoryModel.create({
      merchantId: merchant.id,
      shopDomain,
      healthScore,
      date: new Date(),
      metrics: { revenue: totalRevenue, orderCount: totalOrders },
    }).catch(() => {});

    const dashboardData = {
      shopDomain,
      shopInfo: {
        ...merchant.shopInfo,
        ...storeInfo,
        name: storeInfo.name || merchant.shopInfo?.name || shopDomain,
        currency: storeInfo.currency || 'USD'
      },
      snapshot: {
        healthScore,
        healthBreakdown: { ...healthBreakdown, seoScore, speedScore, productsScore },
        metrics: snapshotMetrics,
      },
      healthScore,
      conversionRate,
      avgOrderValue: avgOrderValue.toFixed(2),
      cartAbandonmentRate,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts,
      lastSyncAt: new Date().toISOString(),
      suggestions: suggestions.slice(0, 5),
      analysis: {
        problems: suggestions.map(s => ({
          id: s.id,
          title: s.title,
          description: s.reason,
          severity: s.impact === 'High' ? 'critical' : s.impact === 'Medium' ? 'warning' : 'info',
          fixType: s.fixType || 'none',
          impact: s.impact,
          payload: s.payload || null,
        }))
      },
      products: products.slice(0, 20).map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        image: p.images?.[0]?.src || null,
        price: p.variants?.[0]?.price || '0.00',
        revenue: productRevenueMap[String(p.id)] || 0,
        score: Math.max(0, Math.min(100, Math.round(
          100
          - ((!p.images || p.images.length === 0) ? 30 : 0)
          - ((!p.body_html || p.body_html.trim().length < 50) ? 25 : 0)
          - ((!p.tags || p.tags.length === 0) ? 15 : 0)
          - ((p.status !== 'active') ? 20 : 0)
        ))),
        hasDescription: !!p.body_html && p.body_html.length > 50,
        hasImages: p.images && p.images.length > 0,
        tags: p.tags || '',
        vendor: p.vendor || '',
      }))
    };

    logger.info({ shopDomain, healthScore, totalProducts, totalOrders }, 'Dashboard data retrieved');

    return success(res, dashboardData);

  } catch (err) {
    logger.error({ err, shopDomain: req.params.shopDomain }, 'Failed to get dashboard data');
    return error(res, 'Failed to retrieve dashboard data: ' + err.message, 500);
  }
}

/**
 * Trigger fresh analysis
 * POST /api/:shopDomain/analyze
 */
export async function triggerAnalysis(req, res) {
  try {
    const { shopDomain } = req.params;
    
    // Find merchant
    const merchant = await MerchantModel.findOne({ shopDomain });
    
    if (!merchant) {
      return error(res, 'Store not found. Please connect your store first.', 404);
    }

    // Use merchant's stored access token, fall back to admin token for custom apps
    let accessToken = merchant.getAccessToken();
    if (!accessToken) {
      accessToken = process.env.ADMIN_API_ACCESS_TOKEN;
    }
    if (!accessToken) {
      return error(res, 'Access token not found. Please reconnect your store via Shopify OAuth.', 500);
    }

    // Fetch fresh data for analysis
    const [products, orders, checkouts] = await Promise.all([
      fetchProducts(shopDomain, accessToken, true).catch(() => []),
      fetchOrders(shopDomain, accessToken, 90, true).catch(() => []),
      fetchAbandonedCheckouts(shopDomain, accessToken, 90).catch(() => [])
    ]);

    // Perform AI analysis
    const analysisResults = performAIAnalysis(products, orders, checkouts, shopDomain);

    // Create a snapshot first (required for analysis)
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const productsNoImg  = products.filter(p => !p.images || p.images.length === 0);
    const productsNoDesc = products.filter(p => !p.body_html || p.body_html.trim().length < 50);

    const snapshot = await StoreSnapshotModel.create({
      merchantId: merchant.id,
      shopDomain,
      metrics: {
        totalRevenue,
        orderCount: orders.length,
        avgOrderValue,
        totalSessions: 0,
        conversionRate: 0,
        checkoutsInitiated: checkouts.length,
        checkoutsCompleted: 0,
        cartAbandonRate: 0,
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        returningRate: 0,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        outOfStockCount: 0,
        noDescriptionCount: productsNoDesc.length,
        noImageCount: productsNoImg.length,
        revenue30d: totalRevenue,
        orders30d: orders.length,
        aov30d: avgOrderValue,
      },
      topProducts: products.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.variants?.[0]?.price || '0',
      })),
      healthScore: analysisResults.healthScore,
      healthBreakdown: {
        productsWithoutImages: productsNoImg.length,
        productsWithoutDescription: productsNoDesc.length,
        inactiveProducts: products.filter(p => p.status !== 'active').length,
      },
      syncedAt: new Date(),
      dataWindowDays: 30,
    });

    // Save analysis to database
    const savedAnalysis = await AiAnalysisModel.create({
      merchantId: merchant.id,
      snapshotId: snapshot.id,
      shopDomain,
      healthScore: analysisResults.healthScore,
      summary: JSON.stringify({
        totalIssues: analysisResults.problems.length,
        criticalIssues: analysisResults.problems.filter(p => p.severity === 'critical').length,
        potentialRevenue: analysisResults.problems.reduce((sum, p) => sum + (p.potentialRevenue || 0), 0).toFixed(2),
      }),
      problems: analysisResults.problems,
      status: 'completed',
      createdAt: new Date(),
    });

    logger.info({ shopDomain, analysisId: savedAnalysis.id }, 'AI Analysis completed and saved');

    return success(res, {
      message: 'Analysis completed successfully',
      shopDomain,
      status: 'completed',
      analysis: { ...analysisResults, id: savedAnalysis.id },
      summary: {
        totalIssues: analysisResults.problems.length,
        criticalIssues: analysisResults.problems.filter(p => p.severity === 'critical').length,
        potentialRevenue: analysisResults.problems.reduce((sum, p) => sum + (p.potentialRevenue || 0), 0).toFixed(2)
      }
    });

  } catch (err) {
    logger.error({ err, shopDomain: req.params.shopDomain }, 'Failed to trigger analysis');
    return error(res, 'Failed to complete analysis: ' + err.message, 500);
  }
}

/**
 * Perform AI analysis on store data
 */
function performAIAnalysis(products, orders, checkouts, shopDomain) {
  const problems = [];
  const suggestions = [];
  let healthScore = 100;
  let potentialRevenue = 0;

  // Product analysis
  const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
  const productsWithoutDescription = products.filter(p => !p.body_html || p.body_html.trim().length < 50);
  const productsWithoutSEO = products.filter(p => !p.metafields || p.metafields.length === 0);
  const inactiveProducts = products.filter(p => p.status !== 'active');
  const draftProducts = products.filter(p => p.status === 'draft');

  // Order analysis
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const abandonedCarts = checkouts.length;
  const abandonedValue = checkouts.reduce((sum, c) => sum + (parseFloat(c.total_price) || 0), 0);

  // Identify problems
  if (productsWithoutImages.length > 0) {
    healthScore -= 20;
    const revenueImpact = productsWithoutImages.length * avgOrderValue * 0.3;
    potentialRevenue += revenueImpact;
    problems.push({
      id: 'img-' + Date.now(),
      type: 'missing_images',
      severity: 'critical',
      title: `${productsWithoutImages.length} Products Without Images`,
      description: `Products without images convert 40% less. These products are losing approximately $${revenueImpact.toFixed(2)} in potential revenue.`,
      affectedProducts: productsWithoutImages.slice(0, 10).map(p => ({ id: p.id, title: p.title })),
      potentialRevenue: revenueImpact,
      quickFix: 'Auto-generate placeholder images or use AI to suggest image requirements',
      fixType: 'none'
    });
  }

  if (productsWithoutDescription.length > 0) {
    healthScore -= 15;
    const revenueImpact = productsWithoutDescription.length * avgOrderValue * 0.2;
    potentialRevenue += revenueImpact;
    problems.push({
      id: 'desc-' + Date.now(),
      type: 'poor_descriptions',
      severity: 'high',
      title: `${productsWithoutDescription.length} Products Need Better Descriptions`,
      description: `Poor descriptions hurt SEO and conversion. Missing product details reduce customer confidence.`,
      affectedProducts: productsWithoutDescription.slice(0, 10).map(p => ({ id: p.id, title: p.title })),
      potentialRevenue: revenueImpact,
      quickFix: 'Generate AI-optimized descriptions with SEO keywords',
      fixType: 'none'
    });
  }

  if (abandonedCarts > 5) {
    healthScore -= 10;
    const recoveryRate = 0.15; // 15% recovery rate
    const recoverableRevenue = abandonedValue * recoveryRate;
    potentialRevenue += recoverableRevenue;
    problems.push({
      id: 'cart-' + Date.now(),
      type: 'cart_abandonment',
      severity: 'high',
      title: `${abandonedCarts} Abandoned Carts`,
      description: `$${abandonedValue.toFixed(2)} in abandoned carts. With recovery emails, you could recover approximately $${recoverableRevenue.toFixed(2)}.`,
      potentialRevenue: recoverableRevenue,
      quickFix: 'Enable abandoned cart recovery email sequence',
      fixType: 'none'
    });
  }

  if (inactiveProducts.length > 0) {
    healthScore -= 5;
    const firstProduct = inactiveProducts[0];
    problems.push({
      id: 'inactive-' + Date.now(),
      type: 'inactive_products',
      severity: 'medium',
      title: `${inactiveProducts.length} Inactive Products`,
      description: `These products are not visible to customers. Either activate them or remove to clean up inventory.`,
      affectedProducts: inactiveProducts.slice(0, 5).map(p => ({ id: p.id, title: p.title })),
      quickFix: 'Bulk activate or archive inactive products',
      fixType: 'update_product',
      payload: {
        product: {
          id: firstProduct.id,
          status: 'active'
        }
      }
    });
  }

  if (draftProducts.length > 0) {
    problems.push({
      id: 'draft-' + Date.now(),
      type: 'draft_products',
      severity: 'low',
      title: `${draftProducts.length} Draft Products`,
      description: `Products in draft mode. Complete them and publish to increase catalog size.`,
      quickFix: 'Review and publish draft products',
      fixType: 'none'
    });
  }

  // Order pattern analysis
  if (orders.length > 0) {
    const ordersWithDiscounts = orders.filter(o => o.discount_codes && o.discount_codes.length > 0);
    const discountRate = ordersWithDiscounts.length / orders.length;
    
    if (discountRate > 0.5) {
      problems.push({
        id: 'discount-' + Date.now(),
        type: 'high_discount_dependency',
        severity: 'medium',
        title: 'High Discount Dependency',
        description: `${(discountRate * 100).toFixed(0)}% of orders use discounts. Consider strategies to improve perceived value without heavy discounting.`,
        quickFix: 'Create bundle offers or value-adds instead of discounts',
        fixType: 'none'
      });
    }
  }

  // Generate prioritized suggestions
  if (problems.length > 0) {
    suggestions.push({
      id: 'priority-1',
      title: 'Quick Wins',
      description: `Fix ${Math.min(3, problems.length)} high-impact issues to potentially increase revenue by $${potentialRevenue.toFixed(2)}`,
      impact: 'High',
      timeEstimate: '15-30 minutes',
      actions: problems.slice(0, 3).map(p => p.quickFix),
      potentialRevenue: potentialRevenue.toFixed(2)
    });
  }

  // Content improvement suggestion
  if (productsWithoutDescription.length > 0 || productsWithoutSEO.length > 0) {
    suggestions.push({
      id: 'content-1',
      title: 'Content Optimization',
      description: 'Improve product descriptions and SEO to increase organic traffic',
      impact: 'Medium',
      timeEstimate: '1-2 hours',
      actions: [
        'Generate AI descriptions for products without them',
        'Add SEO meta titles and descriptions',
        'Optimize product tags and collections'
      ]
    });
  }

  // Retention suggestion
  if (orders.length > 10) {
    suggestions.push({
      id: 'retention-1',
      title: 'Customer Retention',
      description: 'Set up post-purchase follow-up to increase repeat orders',
      impact: 'High',
      timeEstimate: '30 minutes',
      actions: [
        'Create thank you email sequence',
        'Set up product review requests',
        'Offer loyalty incentives'
      ]
    });
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    id: 'analysis-' + Date.now(),
    shopDomain,
    analysisDate: new Date().toISOString(),
    healthScore,
    problems: problems.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityWeight[b.severity] - severityWeight[a.severity];
    }),
    suggestions: suggestions,
    metrics: {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: totalRevenue.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      abandonedCarts,
      abandonedValue: abandonedValue.toFixed(2),
      potentialRevenue: potentialRevenue.toFixed(2),
      conversionFunnel: {
        visitors: Math.floor(orders.length * 42),
        addToCart: orders.length + abandonedCarts,
        purchased: orders.length,
        conversionRate: orders.length > 0 ? ((orders.length / (orders.length * 42)) * 100).toFixed(2) : 0
      }
    }
  };
}

/**
 * Get latest analysis
 * GET /api/:shopDomain/analysis/latest
 */
export async function getLatestAnalysis(req, res) {
  try {
    const { shopDomain } = req.params;

    const merchant = await MerchantModel.findOne({ shopDomain });
    if (!merchant) {
      return error(res, 'Store not found. Please connect your store first.', 404);
    }

    const analysis = await AiAnalysisModel.findOne({ merchantId: merchant.id, status: 'completed' });
    if (!analysis) {
      return success(res, { shopDomain, message: 'No analysis found. Run Analyze first.', problems: [], suggestions: [] });
    }

    return success(res, analysis);
  } catch (err) {
    logger.error({ err, shopDomain: req.params.shopDomain }, 'Failed to get latest analysis');
    return error(res, 'Failed to retrieve analysis', 500);
  }
}


/**
 * GET /api/:shopDomain/products
 * Returns formatted product list for ProductsPage
 */
export async function getProducts(req, res) {
  try {
    const { merchant } = req;
    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) return error(res, 'No access token. Reconnect your store.', 400);

    const products = await fetchProducts(merchant.shopDomain, accessToken);
    const formatted = products.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      image: p.images?.[0]?.src || null,
      price: p.variants?.[0]?.price || '0.00',
      hasDescription: !!(p.body_html && p.body_html.trim().length > 50),
      hasImages: p.images?.length > 0,
      tags: p.tags || '',
      vendor: p.vendor || '',
    }));
    return success(res, formatted);
  } catch (err) {
    // Shopify token expired — tell frontend to reconnect
    if (err.message?.includes('401') || err.response?.code === 401) {
      return error(res, 'Shopify token expired. Please reconnect your store via the Onboarding page.', 401);
    }
    return error(res, err.message || 'Failed to fetch products', 500);
  }
}
