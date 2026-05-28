import { shopify } from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/error.js';
import { logger } from '../../utils/logger.js';
import { daysAgo } from '../../utils/date.js';
import { shopifyCache } from '../../utils/cache.js';
import { shopifyRateLimiter } from '../../utils/rateLimiter.js';

/**
 * Fetch store analytics data including sessions and conversion metrics.
 * Note: Shopify Analytics API requires Shopify Plus or specific app permissions.
 * For non-Plus stores, we'll use order-based conversion calculations.
 * Uses in-memory cache with 30-minute TTL.
 */
export async function fetchAnalytics(shopDomain, accessToken, days = 90, forceRefresh = false) {
  const cacheKey = shopifyCache.key.analytics(shopDomain, days);

  // Return cached data if available and not forcing refresh
  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Analytics fetched from cache');
    return shopifyCache.get(cacheKey);
  }

  // Check rate limit before making API call
  if (!shopifyRateLimiter.isAllowed(shopDomain, 'standard')) {
    const remaining = shopifyRateLimiter.getRemaining(shopDomain, 'standard');
    throw new ShopifyApiError(`Rate limit exceeded. ${remaining} requests remaining.`);
  }

  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const sinceDate = daysAgo(days).toISOString();

    // Try to fetch report data (Shopify Plus feature)
    let analyticsData = {
      sessions: 0,
      pageViews: 0,
      conversionRate: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
    };

    try {
      // Attempt to get shop analytics report (Shopify Plus only)
      const response = await client.get({
        path: 'reports/sessions_over_time',
        query: {
          since: sinceDate,
          until: new Date().toISOString(),
          limit: 90,
        },
      });

      if (response.body && response.body.reports) {
        const report = response.body.reports[0];
        analyticsData.sessions = report.data_rows?.reduce((sum, row) => sum + (row.sessions || 0), 0) || 0;
        analyticsData.pageViews = report.data_rows?.reduce((sum, row) => sum + (row.page_views || 0), 0) || 0;
      }
    } catch (analyticsError) {
      // Analytics API not available (non-Plus store), will calculate from orders
      logger.debug({ shopDomain }, 'Shopify Analytics API not available, will use order-based calculations');
    }

    // Cache the results for 30 minutes
    shopifyCache.set(cacheKey, analyticsData, 1800);

    return analyticsData;
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch analytics');
    throw new ShopifyApiError(`Analytics fetch failed: ${err.message}`);
  }
}

/**
 * Calculate conversion rate from orders and sessions.
 * This is used when Shopify Analytics API is not available.
 */
export function calculateConversionRate(orderCount, sessions) {
  if (!sessions || sessions === 0) return 0;
  return (orderCount / sessions) * 100;
}

/**
 * Fetch report data for specific metrics.
 * This provides more detailed analytics when available.
 */
export async function fetchReportData(shopDomain, accessToken, reportType, days = 90) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const sinceDate = daysAgo(days).toISOString();

    const response = await client.get({
      path: `reports/${reportType}`,
      query: {
        since: sinceDate,
        until: new Date().toISOString(),
        limit: 90,
      },
    });

    return response.body;
  } catch (err) {
    logger.error({ err, shopDomain, reportType }, 'Failed to fetch report data');
    throw new ShopifyApiError(`Report fetch failed: ${err.message}`);
  }
}

/**
 * Get available report types for the store.
 */
export async function getAvailableReports(shopDomain, accessToken) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const response = await client.get({
      path: 'reports',
    });

    return response.body.reports || [];
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch available reports');
    // Return empty array if reports not available
    return [];
  }
}
