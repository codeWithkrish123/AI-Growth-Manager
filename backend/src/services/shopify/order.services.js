import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/error.js';
import { logger }         from '../../utils/logger.js';
import { daysAgo }        from '../../utils/date.js';
import { shopifyCache }   from '../../utils/cache.js';
import { shopifyRateLimiter } from '../../utils/rateLimiter.js';

/**
 * Fetch all orders for a shop within the last N days.
 * Handles Shopify pagination automatically.
 * Uses in-memory cache with 30-minute TTL.
 */
export async function fetchOrders(shopDomain, accessToken, days = 90, forceRefresh = false) {
  const cacheKey = shopifyCache.key.orders(shopDomain, days);

  // Return cached data if available and not forcing refresh
  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Orders fetched from cache');
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
    const allOrders = [];
    let pageInfo    = null;

    do {
      const params = {
        limit:        250,
        status:       'any',
        created_at_min: sinceDate,
        fields:       'id,total_price,financial_status,fulfillment_status,created_at,line_items,customer',
      };

      if (pageInfo) params.page_info = pageInfo;

      const response = await client.get({ path: 'orders', query: params });

      allOrders.push(...(response.body.orders || []));

      // Extract next page cursor from Link header
      const linkHeader = response.headers?.link || '';
      const nextMatch  = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      pageInfo         = nextMatch ? nextMatch[1] : null;

    } while (pageInfo);

    // Cache the results for 30 minutes
    shopifyCache.set(cacheKey, allOrders, 1800);

    logger.debug({ shopDomain, count: allOrders.length }, 'Orders fetched');
    return allOrders;

  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch orders');
    throw new ShopifyApiError(`Orders fetch failed: ${err.message}`);
  }
}

/**
 * Fetch abandoned checkouts for the last N days.
 * Uses in-memory cache with 30-minute TTL.
 */
export async function fetchAbandonedCheckouts(shopDomain, accessToken, days = 90, forceRefresh = false) {
  const cacheKey = `shopify:${shopDomain}:checkouts:${days}d`;

  // Return cached data if available and not forcing refresh
  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Checkouts fetched from cache');
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

    const response = await client.get({
      path:  'checkouts',
      query: { limit: 250, created_at_min: sinceDate },
    });

    const checkouts = response.body.checkouts || [];
    
    // Cache the results for 30 minutes
    shopifyCache.set(cacheKey, checkouts, 1800);

    return checkouts;
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch checkouts');
    throw new ShopifyApiError(`Checkouts fetch failed: ${err.message}`);
  }
}