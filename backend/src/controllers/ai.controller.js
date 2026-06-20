import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import {
  generateAndApplyDescriptions,
  generateProductDescription,
} from '../services/shopify/ai/description.generator.js';
import { analyzePricing, suggestPriceWithAI } from '../services/shopify/ai/price.optimizer.js';
import { shopifyCache } from '../utils/cache.js';
import { FixAction } from '../models/index.js';
import { executeFix } from '../services/shopify/metrics/fix.executor.js';

/**
 * POST /api/:shopDomain/ai/generate-descriptions
 * Generates AI product descriptions and applies them to Shopify
 */
export async function generateDescriptions(req, res) {
  try {
    const { merchant } = req;
    const { preview = false } = req.body; // preview=true → return without applying

    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) {
      return error(res, 'No access token. Please reconnect your store.', 400);
    }

    // Fetch latest products (force refresh ALWAYS to get current state)
    const products = await fetchProducts(merchant.shopDomain, accessToken, true);
    const shopName = merchant.shopInfo?.name || merchant.shopDomain;

    if (preview) {
      // Just generate and return, don't apply
      const productsNeedingDesc = products.filter(
        p => !p.body_html || p.body_html.trim().length < 50
      );

      if (productsNeedingDesc.length === 0) {
        return success(res, {
          message: 'All products already have descriptions',
          previews: [],
        });
      }

      // Generate preview for first 3 products
      const previews = await Promise.all(
        productsNeedingDesc.slice(0, 3).map(async p => ({
          id: p.id,
          title: p.title,
          generatedDescription: await generateProductDescription(p, shopName),
        }))
      );

      return success(res, {
        total: productsNeedingDesc.length,
        previews,
      });
    }

    // Apply descriptions to all products
    logger.info({ shopDomain: merchant.shopDomain }, 'Generating and applying AI descriptions');

    const result = await generateAndApplyDescriptions(
      merchant.shopDomain,
      accessToken,
      products,
      shopName
    );

    // Invalidate cache so dashboard reflects changes
    shopifyCache.invalidateShop(merchant.shopDomain);

    return success(res, result);

  } catch (err) {
    logger.error({ err }, 'AI description generation failed');
    return error(res, 'Description generation failed: ' + err.message, 500);
  }
}

/**
 * POST /api/:shopDomain/ai/optimize-prices
 * Analyzes product pricing and suggests optimal price points.
 * Body: { productId?, competitorPrices?: number[] }
 */
export async function optimizePrices(req, res) {
  try {
    const { merchant } = req;
    const { productId, competitorPrices = [] } = req.body;

    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) {
      return error(res, 'No access token. Please reconnect your store.', 400);
    }

    const products = await fetchProducts(merchant.shopDomain, accessToken);
    const shopName  = merchant.shopInfo?.name || merchant.shopDomain;

    // Single product AI suggestion
    if (productId) {
      const product = products.find(p => String(p.id) === String(productId));
      if (!product) return error(res, 'Product not found', 404);
      const suggestion = await suggestPriceWithAI(product, competitorPrices, shopName);
      return success(res, { product: { id: product.id, title: product.title }, suggestion });
    }

    // Bulk analysis
    const result = await analyzePricing(products, [], shopName);
    return success(res, result);

  } catch (err) {
    logger.error({ err }, 'Price optimization failed');
    return error(res, 'Price optimization failed: ' + err.message, 500);
  }
}


/**
 * POST /api/:shopDomain/ai/apply-price
 * Apply a suggested price to a product
 */
export async function applyPrice(req, res) {
  try {
    const { merchant } = req;
    const { productId, suggestedPrice } = req.body;

    if (!productId || !suggestedPrice) {
      return error(res, 'productId and suggestedPrice are required', 400);
    }

    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) {
      return error(res, 'No access token. Please reconnect your store.', 400);
    }

    // Create a FixAction to update the product price
    const fixPayload = {
      product: {
        id: productId,
        variants: [
          {
            price: suggestedPrice.toString(),
          },
        ],
      },
    };

    const fixAction = await FixAction.create({
      merchant_id: merchant.id,
      shop_domain: merchant.shopDomain,
      fix_type: 'update_price',
      status: 'pending',
      payload: fixPayload,
    });

    try {
      const result = await executeFix(fixAction.id, accessToken);
      return success(res, {
        applied: true,
        message: 'Price has been updated on Shopify',
        fixAction: result,
      });
    } catch (fixErr) {
      logger.error({ err: fixErr }, 'Price application failed');
      return error(res, 'Failed to apply price: ' + fixErr.message, 500);
    }

  } catch (err) {
    logger.error({ err }, 'Failed to apply price');
    return error(res, 'Apply price failed: ' + err.message, 500);
  }
}
