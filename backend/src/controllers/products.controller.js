import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { createProduct as shopifyCreateProduct, updateProduct as shopifyUpdateProduct } from '../services/shopify/products.service.js';

export async function createProduct(req, res) {
  try {
    const { merchant } = req;
    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) return error(res, 'No access token. Please reconnect your store.', 400);
    const { title, price, description, images } = req.body;
    if (!title) return error(res, 'Product title is required', 400);
    const productData = {
      title,
      body_html: description || '<p>' + title + '</p>',
      images: (images || []).map((src, i) => ({ src, position: i + 1 })),
      variants: price ? [{ price: String(price), sku: title.slice(0, 20) + '-' + Date.now().toString(36) }] : undefined,
    };
    const product = await shopifyCreateProduct(merchant.shopDomain, accessToken, productData);
    return success(res, { message: 'Product created successfully', product });
  } catch (err) {
    logger.error({ err }, 'Failed to create product');
    return error(res, err.message, 500);
  }
}

export async function optimizeProduct(req, res) {
  try {
    const { merchant } = req;
    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) return error(res, 'No access token. Please reconnect your store.', 400);
    const { productId } = req.params;
    const { updates } = req.body;
    if (!updates || typeof updates !== 'object') return error(res, 'updates object is required', 400);
    const result = await shopifyUpdateProduct(merchant.shopDomain, accessToken, productId, updates);
    return success(res, { message: 'Product optimized successfully', product: result });
  } catch (err) {
    logger.error({ err }, 'Failed to optimize product');
    return error(res, err.message, 500);
  }
}
