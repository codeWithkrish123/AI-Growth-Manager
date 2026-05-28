import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/error.js';
import { logger }         from '../../utils/logger.js';
import { shopifyCache } from '../../utils/cache.js';
import { shopifyRateLimiter } from '../../utils/rateLimiter.js';

/**
 * Fetch all products with full detail (images, variants, description).
 * Uses in-memory cache with 30-minute TTL.
 */
export async function fetchProducts(shopDomain, accessToken, forceRefresh = false) {
  const cacheKey = shopifyCache.key.products(shopDomain);

  // Return cached data if available and not forcing refresh
  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Products fetched from cache');
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

    const allProducts = [];
    let pageInfo      = null;

    do {
      const params = {
        limit:  250,
        fields: 'id,title,status,variants,images,body_html,tags,vendor,product_type',
      };

      if (pageInfo) params.page_info = pageInfo;

      const response = await client.get({ path: 'products', query: params });

      allProducts.push(...(response.body.products || []));

      const linkHeader = response.headers?.link || '';
      const nextMatch  = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      pageInfo         = nextMatch ? nextMatch[1] : null;

    } while (pageInfo);

    // Cache the results for 30 minutes
    shopifyCache.set(cacheKey, allProducts, 1800);

    logger.debug({ shopDomain, count: allProducts.length }, 'Products fetched');
    return allProducts;

  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch products');
    throw new ShopifyApiError(`Products fetch failed: ${err.message}`);
  }
}

/**
 * Update a single product via Shopify REST API.
 * Used by the fix executor to apply AI-suggested changes.
 */
export async function updateProduct(shopDomain, accessToken, productId, payload) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const response = await client.put({
      path: `products/${productId}`,
      data: { product: payload },
    });

    return response.body.product;
  } catch (err) {
    logger.error({ err, shopDomain, productId }, 'Failed to update product');
    throw new ShopifyApiError(`Product update failed: ${err.message}`);
  }
}