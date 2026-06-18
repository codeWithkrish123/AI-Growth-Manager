import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { AiAnalysisModel, StoreSnapshotModel } from '../models/index.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchOrders } from '../services/shopify/order.services.js';
import { fetchStoreInfo } from '../services/shopify/store.service.js';
import { fetchAbandonedCheckouts } from '../services/shopify/order.services.js';
import { fetchCustomers } from '../services/shopify/customers.service.js';
import { shopifyCache } from '../utils/cache.js';

// ─── Helper: get access token ─────────────────────────────────────────────────
function getToken(merchant) {
  try {
    const t = merchant.getAccessToken();
    // Validate it looks like a real Shopify token (non-empty, reasonable length)
    if (t && t.length > 10) return t;
  } catch (_) {}
  return process.env.ADMIN_API_ACCESS_TOKEN || null;
}

/**
 * GET /api/:shopDomain/dashboard
 */
export async function getDashboard(req, res) {
  try {
    const { shopDomain } = req.params;
    const { force } = req.query;

    const merchant = req.merchant; // already attached by authMiddleware
    const accessToken = getToken(merchant);
    if (!accessToken) return error(res, 'Access token not found. Please reconnect your store.', 500);

    logger.info({ shopDomain, force }, 'Using merchant access token for dashboard');

    const forceRefresh = force === 'true';

    let products = [], orders = [], storeInfo = {}, checkouts = [], customers = [];
    try { products  = await fetchProducts(shopDomain, accessToken, forceRefresh).catch(() => []); } catch { products = []; }
    try { orders    = await fetchOrders(shopDomain, accessToken, 30, forceRefresh).catch(() => []); } catch { orders = []; }
    try { storeInfo = await fetchStoreInfo(shopDomain, accessToken, forceRefresh).catch(() => {}); } catch { storeInfo = {}; }
    try { checkouts = await fetchAbandonedCheckouts(shopDomain, accessToken, 30, forceRefresh).catch(() => []); } catch { checkouts = []; }
    try { customers = await fetchCustomers(shopDomain, accessToken, forceRefresh).catch(() => []); } catch { customers = []; }

    const totalProducts  = products.length;
    const totalOrders    = orders.length;
    const totalRevenue   = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
    const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCarts     = checkouts.length + totalOrders;
    const cartAbandonmentRate = totalCarts > 0 ? ((checkouts.length / totalCarts) * 100).toFixed(1) : 0;
    const estimatedSessions  = totalOrders * 42;
    const conversionRate     = estimatedSessions > 0 ? ((totalOrders / estimatedSessions) * 100).toFixed(2) : 0;

    const productsWithoutImages      = products.filter(p => !p.images || p.images.length === 0);
    const productsWithoutDescription = products.filter(p => !p.body_html || p.body_html.trim().length < 50);
    const inactiveProducts           = products.filter(p => p.status !== 'active');
    const productsWithoutTags        = products.filter(p => !p.tags || p.tags.length === 0);

    const suggestions = [];
    let healthScore = 100;

    if (productsWithoutImages.length > 0) {
      healthScore -= 15;
      suggestions.push({ id: '1', title: 'Add Product Images', reason: `${productsWithoutImages.length} products missing images - reduces conversion by 40%`, impact: 'High', fixType: 'none', payload: null, severity: 'critical', affectedProducts: productsWithoutImages.map(p => ({ id: p.id, title: p.title })) });
    }
    if (productsWithoutDescription.length > 0) {
      healthScore -= 10;
      suggestions.push({ id: '2', title: 'Improve Product Descriptions', reason: `${productsWithoutDescription.length} products have poor descriptions - hurts SEO`, impact: 'High', fixType: 'update_product', severity: 'warning',
        payload: productsWithoutDescription[0] ? { product: { id: productsWithoutDescription[0].id, body_html: `<p>${productsWithoutDescription[0].title} - Premium quality product. Crafted with care and excellent customer service in mind.</p>` } } : null,
        affectedProducts: productsWithoutDescription.slice(0, 5).map(p => ({ id: p.id, title: p.title })) });
    }
    if (inactiveProducts.length > 0) {
      healthScore -= 5;
      suggestions.push({ id: '3', title: 'Activate Products', reason: `${inactiveProducts.length} products are inactive`, impact: 'Medium', fixType: 'update_product', severity: 'warning',
        payload: inactiveProducts[0] ? { product: { id: inactiveProducts[0].id, status: 'active' } } : null });
    }
    if (parseFloat(cartAbandonmentRate) > 60) {
      healthScore -= 10;
      suggestions.push({ id: '4', title: 'Reduce Cart Abandonment', reason: `${cartAbandonmentRate}% cart abandonment rate - industry avg is 70%`, impact: 'High', fixType: 'none', payload: null, severity: 'warning' });
    }
    if (productsWithoutTags.length > 0) {
      healthScore -= 5;
      const firstUntagged = productsWithoutTags[0];
      const autoTags = firstUntagged.title.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').split(/[\s\-]+/).filter(w => w.length > 2).slice(0, 5).join(', ');
      suggestions.push({ id: '5', title: 'Add Product Tags', reason: `${productsWithoutTags.length} product${productsWithoutTags.length > 1 ? 's' : ''} missing tags - hurts discoverability`, impact: 'Low', fixType: 'add_product_tags', severity: 'info',
        payload: { product: { id: firstUntagged.id }, tags: autoTags },
        affectedProducts: productsWithoutTags.map(p => ({ id: p.id, title: p.title })) });
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    const dashboardData = {
      shopDomain,
      shopInfo: { 
        ...merchant.shopInfo, 
        ...(storeInfo || {}), 
        name: (storeInfo && storeInfo.name) || merchant.shopInfo?.name || shopDomain, 
        currency: (storeInfo && storeInfo.currency) || 'INR' 
      },
      snapshot: { healthScore, metrics: { totalRevenue, orderCount: totalOrders, avgOrderValue, totalSessions: estimatedSessions, conversionRate: conversionRate / 100, checkoutsInitiated: totalCarts, checkoutsCompleted: totalOrders, cartAbandonRate: cartAbandonmentRate / 100, totalCustomers: customers.length, newCustomers: customers.length, returningCustomers: 0, returningRate: 0, totalProducts, activeProducts: products.filter(p => p.status === 'active').length, outOfStockCount: 0, noDescriptionCount: productsWithoutDescription.length, noImageCount: productsWithoutImages.length, revenue30d: totalRevenue, orders30d: totalOrders, aov30d: avgOrderValue } },
      healthScore, conversionRate, avgOrderValue: avgOrderValue.toFixed(2), cartAbandonmentRate, totalOrders, totalRevenue: totalRevenue.toFixed(2), totalProducts,
      lastSyncAt: new Date().toISOString(),
      suggestions: suggestions.slice(0, 5),
      analysis: { problems: suggestions.map(s => ({ id: s.id, title: s.title, description: s.reason, severity: s.severity || 'info', fixType: s.fixType || 'none', impact: s.impact, payload: s.payload || null, potentialRevenue: s.impact === 'High' ? 5000 : s.impact === 'Medium' ? 2000 : 500 })) },
      products: products.slice(0, 10).map(p => ({ id: p.id, title: p.title, status: p.status, image: p.images?.[0]?.src || null, price: p.variants?.[0]?.price || '0.00', hasDescription: !!p.body_html && p.body_html.length > 50, hasImages: p.images && p.images.length > 0, tags: p.tags || '' })),
    };

    logger.info({ shopDomain, healthScore, totalProducts, totalOrders }, 'Dashboard data retrieved');
    return success(res, dashboardData);
  } catch (err) {
    logger.error({ err, shopDomain: req.params?.shopDomain }, 'Failed to get dashboard data');
    return error(res, 'Failed to retrieve dashboard data: ' + err.message, 500);
  }
}

/**
 * GET /api/:shopDomain/products
 */
export async function getProducts(req, res) {
  try {
    const { shopDomain } = req.params;
    const { force } = req.query;
    const merchant = req.merchant; // already attached by authMiddleware
    const accessToken = getToken(merchant);
    if (!accessToken) return error(res, 'No access token', 500);
    const products = await fetchProducts(shopDomain, accessToken, force === 'true');
    return success(res, products.map(p => ({ id: p.id, title: p.title, status: p.status, image: p.images?.[0]?.src || null, price: p.variants?.[0]?.price || '0.00', hasDescription: !!p.body_html && p.body_html.length > 50, hasImages: p.images && p.images.length > 0, tags: p.tags || '', body_html: p.body_html })));
  } catch (err) {
    return error(res, err.message, 500);
  }
}

/**
 * POST /api/:shopDomain/analyze
 */
export async function triggerAnalysis(req, res) {
  try {
    const { shopDomain } = req.params;
    const merchant = req.merchant; // already attached by authMiddleware
    const accessToken = getToken(merchant);
    if (!accessToken) return error(res, 'Access token not found. Please reconnect your store.', 500);

    const [products, orders, checkouts] = await Promise.all([
      fetchProducts(shopDomain, accessToken, true).catch(() => []),
      fetchOrders(shopDomain, accessToken, 90, true).catch(() => []),
      fetchAbandonedCheckouts(shopDomain, accessToken, 90).catch(() => []),
    ]);

    const problems = [];
    let healthScore = 100;
    const totalRevenue   = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
    const avgOrderValue  = orders.length > 0 ? totalRevenue / orders.length : 0;
    const abandonedValue = checkouts.reduce((s, c) => s + (parseFloat(c.total_price) || 0), 0);

    const noImages = products.filter(p => !p.images || p.images.length === 0);
    const noDesc   = products.filter(p => !p.body_html || p.body_html.trim().length < 50);
    const inactive = products.filter(p => p.status !== 'active');

    if (noImages.length > 0) { healthScore -= 20; problems.push({ id: `img-${Date.now()}`, type: 'missing_images', severity: 'critical', title: `${noImages.length} Products Without Images`, description: `Products without images convert 40% less. Losing ₹${(noImages.length * avgOrderValue * 0.3).toFixed(0)} in potential revenue.`, affectedProducts: noImages.slice(0, 5).map(p => ({ id: p.id, title: p.title })), potentialRevenue: noImages.length * avgOrderValue * 0.3, fixType: 'none' }); }
    if (noDesc.length > 0)   { healthScore -= 15; problems.push({ id: `desc-${Date.now()}`, type: 'poor_descriptions', severity: 'high', title: `${noDesc.length} Products Need Better Descriptions`, description: `Poor descriptions hurt SEO and conversion.`, affectedProducts: noDesc.slice(0, 5).map(p => ({ id: p.id, title: p.title })), potentialRevenue: noDesc.length * avgOrderValue * 0.2, fixType: 'update_product', payload: noDesc[0] ? { product: { id: noDesc[0].id, body_html: `<p>${noDesc[0].title} - Premium quality product. Carefully crafted for superior performance.</p>` } } : null }); }
    if (checkouts.length > 5) { healthScore -= 10; problems.push({ id: `cart-${Date.now()}`, type: 'cart_abandonment', severity: 'high', title: `${checkouts.length} Abandoned Carts`, description: `₹${abandonedValue.toFixed(0)} in abandoned carts. Could recover ₹${(abandonedValue * 0.15).toFixed(0)} with recovery emails.`, potentialRevenue: abandonedValue * 0.15, fixType: 'none' }); }
    if (inactive.length > 0)  { healthScore -= 5; problems.push({ id: `inactive-${Date.now()}`, type: 'inactive_products', severity: 'medium', title: `${inactive.length} Inactive Products`, description: `Not visible to customers. Activate or archive.`, affectedProducts: inactive.slice(0, 5).map(p => ({ id: p.id, title: p.title })), fixType: 'update_product', payload: inactive[0] ? { product: { id: inactive[0].id, status: 'active' } } : null }); }

    healthScore = Math.max(0, Math.min(100, healthScore));

    const productsNoImg  = products.filter(p => !p.images || p.images.length === 0);
    const productsNoDesc = products.filter(p => !p.body_html || p.body_html.trim().length < 50);

    const snapshot = await StoreSnapshotModel.create({ merchantId: merchant.id, shopDomain, metrics: { totalRevenue, orderCount: orders.length, avgOrderValue, totalSessions: 0, conversionRate: 0, checkoutsInitiated: checkouts.length, checkoutsCompleted: 0, cartAbandonRate: 0, totalCustomers: 0, newCustomers: 0, returningCustomers: 0, returningRate: 0, totalProducts: products.length, activeProducts: products.filter(p => p.status === 'active').length, outOfStockCount: 0, noDescriptionCount: productsNoDesc.length, noImageCount: productsNoImg.length, revenue30d: totalRevenue, orders30d: orders.length, aov30d: avgOrderValue }, topProducts: products.slice(0, 5).map(p => ({ id: p.id, title: p.title, price: p.variants?.[0]?.price || '0' })), healthScore, healthBreakdown: { productsWithoutImages: productsNoImg.length, productsWithoutDescription: productsNoDesc.length, inactiveProducts: inactive.length }, syncedAt: new Date(), dataWindowDays: 30 });

    const savedAnalysis = await AiAnalysisModel.create({ merchantId: merchant.id, snapshotId: snapshot.id, shopDomain, healthScore, summary: JSON.stringify({ totalIssues: problems.length, criticalIssues: problems.filter(p => p.severity === 'critical').length, potentialRevenue: problems.reduce((s, p) => s + (p.potentialRevenue || 0), 0).toFixed(2) }), problems, status: 'completed' });

    // Invalidate cache so dashboard shows fresh data
    shopifyCache.invalidateShop(shopDomain);

    logger.info({ shopDomain, analysisId: savedAnalysis.id }, 'AI Analysis completed and saved');
    return success(res, { message: 'Analysis completed successfully', shopDomain, status: 'completed', analysis: { id: savedAnalysis.id, healthScore, problems, summary: { totalIssues: problems.length, criticalIssues: problems.filter(p => p.severity === 'critical').length, potentialRevenue: problems.reduce((s, p) => s + (p.potentialRevenue || 0), 0).toFixed(2) } } });
  } catch (err) {
    logger.error({ err, shopDomain: req.params?.shopDomain }, 'Failed to trigger analysis');
    return error(res, 'Failed to complete analysis: ' + err.message, 500);
  }
}

/**
 * GET /api/:shopDomain/analysis/latest
 */
export async function getLatestAnalysis(req, res) {
  try {
    const merchant = req.merchant; // already attached by authMiddleware
    const analysis = await AiAnalysisModel.findOne({ merchantId: merchant.id, status: 'completed', sort: { createdAt: -1 } });
    if (!analysis) return error(res, 'No analysis found. Run Analyze Store first.', 404);
    return success(res, analysis);
  } catch (err) {
    return error(res, err.message, 500);
  }
}
