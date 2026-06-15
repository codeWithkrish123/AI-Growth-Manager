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

  if (!forceRefresh && shopifyCache.has(cacheKey)) {
    logger.debug({ shopDomain }, 'Products fetched from cache');
    return shopifyCache.get(cacheKey);
  }

  if (!shopifyRateLimiter.isAllowed(shopDomain, 'standard')) {
    const remaining = shopifyRateLimiter.getRemaining(shopDomain, 'standard');
    throw new ShopifyApiError(`Rate limit exceeded. ${remaining} requests remaining.`);
  }

  const PRODUCTS_QUERY = `
    query getProducts($cursor: String) {
      products(first: 250, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            title
            status
            descriptionHtml
            tags
            vendor
            productType
            images(first: 5) { edges { node { src altText } } }
            variants(first: 10) {
              edges { node { id title price compareAtPrice inventoryQuantity } }
            }
          }
        }
      }
    }
  `;

  try {
    const client = new shopify.clients.Graphql({
      session: { shop: shopDomain, accessToken },
    });

    const allProducts = [];
    let cursor = null;

    do {
      const response = await client.request(PRODUCTS_QUERY, {
        variables: cursor ? { cursor } : {},
      });

      const data = response.data?.products;
      if (!data) break;

      for (const { node } of data.edges) {
        allProducts.push({
          id: node.id.replace('gid://shopify/Product/', ''),
          gid: node.id,
          title: node.title,
          status: node.status?.toLowerCase(),
          body_html: node.descriptionHtml,
          tags: node.tags?.join(', '),
          vendor: node.vendor,
          product_type: node.productType,
          images: node.images.edges.map(e => ({ src: e.node.src, alt: e.node.altText })),
          variants: node.variants.edges.map(e => ({
            id: e.node.id.replace('gid://shopify/ProductVariant/', ''),
            title: e.node.title,
            price: e.node.price,
            compare_at_price: e.node.compareAtPrice,
            inventory_quantity: e.node.inventoryQuantity,
          })),
        });
      }

      cursor = data.pageInfo.hasNextPage ? data.pageInfo.endCursor : null;
    } while (cursor);

    shopifyCache.set(cacheKey, allProducts, 1800);
    logger.debug({ shopDomain, count: allProducts.length }, 'Products fetched');
    return allProducts;

  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch products');
    throw new ShopifyApiError(`Products fetch failed: ${err.message}`);
  }
}

/**
 * Create a new product via Shopify REST API
 */
export async function createProduct(shopDomain, accessToken, productData) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const response = await client.post({
      path: 'products',
      data: { product: productData },
    });

    // Clear cache after creating product
    const cacheKey = shopifyCache.key.products(shopDomain);
    shopifyCache.delete(cacheKey);

    return response.body.product;
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to create product');
    throw new ShopifyApiError(`Product creation failed: ${err.message}`);
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

/**
 * Delete a product via Shopify REST API
 */
export async function deleteProduct(shopDomain, accessToken, productId) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    await client.delete({
      path: `products/${productId}`,
    });

    return true;
  } catch (err) {
    logger.error({ err, shopDomain, productId }, 'Failed to delete product');
    throw new ShopifyApiError(`Product deletion failed: ${err.message}`);
  }
}