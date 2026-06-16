import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { fetchProducts } from '../services/shopify/products.service.js';

export async function createProduct(req, res) {
  return success(res, { message: 'Product creation coming soon' });
}

export async function optimizeProduct(req, res) {
  return success(res, { message: 'Product optimization coming soon' });
}
