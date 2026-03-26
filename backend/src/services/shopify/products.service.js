import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/error.js';
import { logger }         from '../../utils/logger.js';

/**
 * Fetch all products with full detail (images, variants, description).
 */
export async function fetchProducts(shopDomain, accessToken) {
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