import { shopify } from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/error.js';
import { logger } from '../../utils/logger.js';
import { shopifyCache } from '../../utils/cache.js';
import { shopifyRateLimiter } from '../../utils/rateLimiter.js';

/**
 * Fetch customer summary data.
 * We only need count + orders_count for metrics — no PII beyond that.
 * Uses in-memory cache with 30-minute TTL.
 */
export async function fetchCustomers(shopDomain, accessToken, forceRefresh = false) {
  const cacheKey = shopifyCache.key.customers(shopDomain);

  // Return cached data if available and not forcing refresh
  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Customers fetched from cache');
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

    const allCustomers = [];
    let pageInfo = null;

    do {
      const params = {
        limit: 250,
        fields: 'id,orders_count,total_spent,created_at',
      };

      if (pageInfo) params.page_info = pageInfo;

      const response = await client.get({ path: 'customers', query: params });

      allCustomers.push(...(response.body.customers || []));

      const linkHeader = response.headers?.link || '';
      const nextMatch = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      pageInfo = nextMatch ? nextMatch[1] : null;

    } while (pageInfo);

    // Cache the results for 30 minutes
    shopifyCache.set(cacheKey, allCustomers, 1800);

    logger.debug({ shopDomain, count: allCustomers.length }, 'Customers fetched');
    return allCustomers;

  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch customers');
    throw new ShopifyApiError(`Customers fetch failed: ${err.message}`);
  }
}