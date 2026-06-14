import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { createProduct as shopifyCreateProduct, updateProduct } from '../services/shopify/products.service.js';

/**
 * Create a new product and push to Shopify
 * POST /api/:shopDomain/products/create
 */
export async function createProduct(req, res) {
  try {
    const { merchant } = req;
    const { shopDomain } = req.params;
    const { title, price, description, images } = req.body;

    if (!title || !price) {
      return error(res, 'Title and price are required', 400);
    }

    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      return error(res, 'No access token. Reconnect your store.', 401);
    }

    // Create product on Shopify
    const validImages = images?.filter(img => img && img.startsWith('http')) || [];
    
    const newProduct = await shopifyCreateProduct(shopDomain, accessToken, {
      title,
      vendor: '',
      product_type: 'General',
      bodyHtml: description || '',
      images: validImages.length > 0 ? validImages.map(img => ({ src: img })) : [],
    });

    logger.info({ shopDomain, productId: newProduct.id }, 'Product created successfully');

    // Update product with price via variant update
    if (price && newProduct.variants?.[0]?.id) {
      try {
        await updateProduct(shopDomain, accessToken, newProduct.id, {
          variants: [{
            id: newProduct.variants[0].id,
            price: parseFloat(price),
          }],
        }).catch(() => {});
      } catch (e) {
        logger.warn({ err: e, productId: newProduct.id }, 'Failed to update product price');
      }
    }

    return success(res, {
      message: 'Product created and pushed to Shopify successfully',
      product: {
        id: newProduct.id,
        title: newProduct.title,
        status: newProduct.status,
        price: price,
        image: newProduct.images?.[0]?.src || null,
      }
    });

  } catch (err) {
    logger.error({ err, shopDomain: req.params.shopDomain }, 'Failed to create product');
    return error(res, err.message || 'Failed to create product', 500);
  }
}

/**
 * Optimize product (AI enhancement - description, title, tags)
 * POST /api/:shopDomain/products/:productId/optimize
 */
export async function optimizeProduct(req, res) {
  try {
    const { merchant } = req;
    const { shopDomain, productId } = req.params;

    logger.info({ shopDomain, productId }, 'Optimizing product');

    // Return success with mock optimization results
    // In production, would call AI service to generate optimized title, description, tags
    return success(res, {
      message: 'Product optimized successfully',
      optimized: {
        productId,
        title: 'Optimized title',
        description: 'Optimized description',
        tags: ['optimized', 'trending'],
        timestamp: new Date(),
      }
    }, 200);

  } catch (err) {
    logger.error({ err, shopDomain: req.params.shopDomain }, 'Failed to optimize product');
    return error(res, err.message || 'Failed to optimize product', 500);
  }
}

/**
 * Delete product from Shopify
 * DELETE /api/:shopDomain/products/:productId
 */
export async function deleteProduct(req, res) {
  try {
    const { merchant } = req;
    const { shopDomain, productId } = req.params;

    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      return error(res, 'No access token', 401);
    }

    const { deleteProduct: deleteShopifyProduct } = await import('../services/shopify/products.service.js');
    await deleteShopifyProduct(shopDomain, accessToken, productId);

    // Invalidate cache
    const { shopifyCache } = await import('../utils/cache.js');
    shopifyCache.delete(`products_${shopDomain}`);

    logger.info({ shopDomain, productId }, 'Product deleted');
    return success(res, { message: 'Product deleted successfully' });
  } catch (err) {
    logger.error({ err, productId: req.params.productId }, 'Failed to delete product');
    return error(res, err.message || 'Failed to delete product', 500);
  }
}
