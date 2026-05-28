/**
 * Rule-based problem detection service
 * Identifies common Shopify store issues based on metrics and data
 */

export function detectProblems(metrics, products, orders, checkouts) {
  const problems = [];

  // ── Product Quality Issues ──────────────────────────────────────────────
  
  // Missing product descriptions
  const productsWithoutDescription = products.filter(p => !p.body_html || p.body_html.trim() === '');
  if (productsWithoutDescription.length > 0) {
    const percentage = (productsWithoutDescription.length / products.length) * 100;
    problems.push({
      id: 'missing_descriptions',
      title: 'Missing Product Descriptions',
      severity: percentage > 50 ? 'critical' : 'warning',
      description: `${productsWithoutDescription.length} products (${percentage.toFixed(1)}%) have no descriptions`,
      impact: 'Products without descriptions rank poorly in search and convert less',
      affectedCount: productsWithoutDescription.length,
      affectedIds: productsWithoutDescription.map(p => p.id),
    });
  }

  // No product images
  const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
  if (productsWithoutImages.length > 0) {
    const percentage = (productsWithoutImages.length / products.length) * 100;
    problems.push({
      id: 'missing_images',
      title: 'Missing Product Images',
      severity: percentage > 30 ? 'critical' : 'warning',
      description: `${productsWithoutImages.length} products (${percentage.toFixed(1)}%) have no images`,
      impact: 'Products without images have significantly lower conversion rates',
      affectedCount: productsWithoutImages.length,
      affectedIds: productsWithoutImages.map(p => p.id),
    });
  }

  // Products with no tags
  const productsWithoutTags = products.filter(p => !p.tags || p.tags.trim() === '');
  if (productsWithoutTags.length > products.length * 0.5) {
    problems.push({
      id: 'missing_tags',
      title: 'Poor Product Tagging',
      severity: 'warning',
      description: `${productsWithoutTags.length} products have no tags for organization`,
      impact: 'Tags help with product discovery and collection management',
      affectedCount: productsWithoutTags.length,
    });
  }

  // ── Conversion & Sales Issues ─────────────────────────────────────────────

  // High cart abandonment rate
  if (metrics.cartAbandonRate > 75) {
    problems.push({
      id: 'high_cart_abandonment',
      title: 'High Cart Abandonment Rate',
      severity: metrics.cartAbandonRate > 85 ? 'critical' : 'warning',
      description: `Cart abandonment rate is ${metrics.cartAbandonRate.toFixed(1)}% (industry avg: 70%)`,
      impact: 'Losing potential revenue from customers who add to cart but don\'t complete purchase',
      currentValue: metrics.cartAbandonRate,
      benchmark: 70,
    });
  }

  // Low conversion rate
  if (metrics.conversionRate < 1) {
    problems.push({
      id: 'low_conversion_rate',
      title: 'Low Conversion Rate',
      severity: metrics.conversionRate < 0.5 ? 'critical' : 'warning',
      description: `Conversion rate is ${metrics.conversionRate.toFixed(2)}% (industry avg: 2-3%)`,
      impact: 'Not converting enough visitors into customers',
      currentValue: metrics.conversionRate,
      benchmark: 2,
    });
  }

  // Low average order value
  if (metrics.avgOrderValue < 30) {
    problems.push({
      id: 'low_aov',
      title: 'Low Average Order Value',
      severity: 'info',
      description: `AOV is $${metrics.avgOrderValue.toFixed(2)} (consider upselling strategies)`,
      impact: 'Increasing AOV can significantly boost revenue without more traffic',
      currentValue: metrics.avgOrderValue,
    });
  }

  // ── Inventory Issues ─────────────────────────────────────────────────────

  // Low inventory on top products
  const lowStockProducts = products.filter(p => {
    if (!p.variants || p.variants.length === 0) return false;
    const totalInventory = p.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
    return totalInventory < 10 && totalInventory > 0;
  });

  if (lowStockProducts.length > 0) {
    problems.push({
      id: 'low_inventory',
      title: 'Low Stock on Popular Products',
      severity: 'warning',
      description: `${lowStockProducts.length} products are running low on stock`,
      impact: 'Risk of stockouts leading to lost sales and poor customer experience',
      affectedCount: lowStockProducts.length,
      affectedIds: lowStockProducts.map(p => p.id),
    });
  }

  // ── Customer Issues ──────────────────────────────────────────────────────

  // Low repeat customer rate
  if (metrics.repeatCustomerRate < 15) {
    problems.push({
      id: 'low_repeat_rate',
      title: 'Low Repeat Customer Rate',
      severity: 'info',
      description: `Repeat customer rate is ${metrics.repeatCustomerRate.toFixed(1)}% (aim for 25%+)`,
      impact: 'Focusing on customer retention can increase lifetime value',
      currentValue: metrics.repeatCustomerRate,
      benchmark: 25,
    });
  }

  // ── Store Setup Issues ───────────────────────────────────────────────────

  // Note: These would require additional API calls to check
  // For now, we'll add placeholders

  return problems;
}

/**
 * Calculate store completeness score
 * Based on product data quality and store setup
 */
export function calculateStoreCompleteness(products, shopInfo) {
  let score = 0;
  const maxScore = 100;

  if (products.length === 0) return { score: 0, breakdown: {} };

  const breakdown = {};

  // Product descriptions (30 points)
  const productsWithDesc = products.filter(p => p.body_html && p.body_html.trim() !== '').length;
  const descScore = (productsWithDesc / products.length) * 30;
  breakdown.descriptions = {
    score: descScore,
    max: 30,
    percentage: (productsWithDesc / products.length) * 100,
  };
  score += descScore;

  // Product images (30 points)
  const productsWithImages = products.filter(p => p.images && p.images.length > 0).length;
  const imageScore = (productsWithImages / products.length) * 30;
  breakdown.images = {
    score: imageScore,
    max: 30,
    percentage: (productsWithImages / products.length) * 100,
  };
  score += imageScore;

  // Product tags (20 points)
  const productsWithTags = products.filter(p => p.tags && p.tags.trim() !== '').length;
  const tagScore = (productsWithTags / products.length) * 20;
  breakdown.tags = {
    score: tagScore,
    max: 20,
    percentage: (productsWithTags / products.length) * 100,
  };
  score += tagScore;

  // Store info (20 points)
  let infoScore = 0;
  if (shopInfo) {
    if (shopInfo.email) infoScore += 5;
    if (shopInfo.currency) infoScore += 5;
    if (shopInfo.timezone) infoScore += 5;
    if (shopInfo.countryCode) infoScore += 5;
  }
  breakdown.storeInfo = {
    score: infoScore,
    max: 20,
    percentage: (infoScore / 20) * 100,
  };
  score += infoScore;

  return {
    score: Math.round(score),
    max: maxScore,
    breakdown,
  };
}

/**
 * Get problem severity level
 */
export function getSeverityLevel(severity) {
  const levels = {
    critical: { level: 3, color: 'red', priority: 'immediate' },
    warning: { level: 2, color: 'yellow', priority: 'high' },
    info: { level: 1, color: 'blue', priority: 'medium' },
  };
  return levels[severity] || levels.info;
}

/**
 * Prioritize problems by severity and impact
 */
export function prioritizeProblems(problems) {
  return problems.sort((a, b) => {
    const severityA = getSeverityLevel(a.severity).level;
    const severityB = getSeverityLevel(b.severity).level;
    return severityB - severityA; // Higher severity first
  });
}
