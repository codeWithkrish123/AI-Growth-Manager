import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { MerchantModel, AiAnalysisModel, StoreSnapshotModel } from '../models/index.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchOrders } from '../services/shopify/order.services.js';
import { fetchStoreInfo } from '../services/shopify/store.service.js';
import { fetchAbandonedCheckouts } from '../services/shopify/order.services.js';
import { fetchCustomers } from '../services/shopify/customers.service.js';
import { randomUUID } from 'crypto';

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

    // Use merchant's stored access token
    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      return error(res, 'Access token not found. Please reconnect your store.', 500);
    }
    logger.info({ shopDomain, force }, 'Using merchant access token for dashboard');

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

    // Generate AI-powered suggestions
    const suggestions = [];
    let healthScore = 100;

    if (productsWithoutImages.length > 0) {
      healthScore -= 15;
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
      healthScore -= 10;
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
      healthScore -= 5;
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
      healthScore -= 10;
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
      healthScore -= 5;
      suggestions.push({
        id: '5',
        title: 'Add Product Tags',
        reason: `${productsWithoutTags.length} products missing tags - hurts discoverability`,
        impact: 'Low',
        action: 'Auto-generate relevant tags',
        status: 'pending'
      });
    }

    // Ensure health score stays within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Calculate conversion rate (orders / sessions - estimated)
    const estimatedSessions = totalOrders * 42; // Industry average 2.4% conversion
    const conversionRate = estimatedSessions > 0 ? ((totalOrders / estimatedSessions) * 100).toFixed(2) : 0;

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
        }
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
          fixType: 'update_product',
          impact: s.impact,
          payload: s.affectedProducts
        }))
      },
      products: products.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        image: p.images?.[0]?.src || null,
        price: p.variants?.[0]?.price || '0.00',
        hasDescription: !!p.body_html && p.body_html.length > 50,
        hasImages: p.images && p.images.length > 0
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

    // Use merchant's stored access token
    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      return error(res, 'Access token not found. Please reconnect your store.', 500);
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
    const snapshot = await StoreSnapshotModel.create({
      merchantId: merchant.id,
      shopDomain,
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
      noDescriptionCount: products.filter(p => !p.body_html || p.body_html.trim().length < 50).length,
      noImageCount: products.filter(p => !p.images || p.images.length === 0).length,
      revenue30d: totalRevenue,
      orders30d: orders.length,
      aov30d: avgOrderValue,
      topProducts: products.slice(0, 5).map(p => ({ id: p.id, title: p.title, price: p.variants[0]?.price || '0' })),
      healthScore: analysisResults.healthScore,
      healthBreakdown: {
        productsWithoutImages: products.filter(p => !p.images || p.images.length === 0).length,
        productsWithoutDescription: products.filter(p => !p.body_html || p.body_html.trim().length < 50).length,
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
      summary: {
        totalIssues: analysisResults.problems.length,
        criticalIssues: analysisResults.problems.filter(p => p.severity === 'critical').length,
        potentialRevenue: analysisResults.problems.reduce((sum, p) => sum + (p.potentialRevenue || 0), 0).toFixed(2)
      },
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
    
    // Find merchant
    const merchant = await MerchantModel.findOne({ shopDomain });
    
    if (!merchant) {
      return error(res, 'Store not found. Please connect your store first.', 404);
    }

    // For now, return mock analysis data
    const mockAnalysis = {
      shopDomain,
      healthScore: 75,
      analysisDate: new Date().toISOString(),
      problems: [
        {
          id: '1',
          type: 'missing_descriptions',
          severity: 'high',
          title: 'Missing Product Descriptions',
          description: '8 products are missing descriptions which hurts SEO and conversion rates',
          affectedProducts: 8,
          potentialImpact: '+15% conversion rate'
        },
        {
          id: '2',
          type: 'no_images',
          severity: 'medium',
          title: 'Missing Product Images',
          description: '3 products have no images, making them less likely to sell',
          affectedProducts: 3,
          potentialImpact: '+8% conversion rate'
        }
      ],
      suggestions: [
        {
          id: '1',
          title: 'Add Product Descriptions',
          reason: '8 products missing descriptions hurt SEO',
          impact: 'High',
          action: 'Generate AI descriptions for all products',
          estimatedTime: '5 minutes'
        },
        {
          id: '2',
          title: 'Optimize Product Images',
          reason: '3 products have no images',
          impact: 'Medium',
          action: 'Add placeholder images and optimize alt text',
          estimatedTime: '10 minutes'
        }
      ]
    };

    return success(res, mockAnalysis);

  } catch (err) {
    logger.error({ err, shopDomain: req.params.shopDomain }, 'Failed to get latest analysis');
    return error(res, 'Failed to retrieve analysis', 500);
  }
}
