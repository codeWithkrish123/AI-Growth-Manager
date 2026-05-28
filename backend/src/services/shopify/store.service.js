import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/error.js';
import { logger }         from '../../utils/logger.js';
import { shopifyCache } from '../../utils/cache.js';
import { shopifyRateLimiter } from '../../utils/rateLimiter.js';

/**
 * Fetch general store/shop info (name, email, currency, etc.).
 * Uses in-memory cache with 1-hour TTL (store info changes rarely).
 */
export async function fetchStoreInfo(shopDomain, accessToken, forceRefresh = false) {
  const cacheKey = shopifyCache.key.storeInfo(shopDomain);

  // Return cached data if available and not forcing refresh
  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Store info fetched from cache');
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

    const response = await client.get({ path: 'shop' });

    const shop = response.body.shop;

    const storeInfo = {
      name: shop.name,
      email: shop.email,
      currency: shop.currency,
      timezone: shop.iana_timezone,
      countryCode: shop.country_code,
      planName: shop.plan_name,
    };

    // Cache the results for 1 hour (store info changes rarely)
    shopifyCache.set(cacheKey, storeInfo, 3600);

    return storeInfo;
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch store info');
    throw new ShopifyApiError(`Store info fetch failed: ${err.message}`);
  }
}