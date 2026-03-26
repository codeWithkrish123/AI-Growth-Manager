import { FixAction }        from '../../../models/index.js';
import { updateProduct }    from '../../shopify/products.service.js';
import { ShopifyApiError }  from '../../../utils/error.js';
import { logger }           from '../../../utils/logger.js';

/**
 * Execute a single fix action against the Shopify Admin API.
 * Updates the FixAction document with the result.
*
 * @param {string} fixActionId  FixAction._id
 * @param {string} accessToken  Decrypted merchant access token
 */
export async function executeFix(fixActionId, accessToken) {
  const fixAction = await FixAction.findById(fixActionId);

  if (!fixAction) throw new Error(`FixAction ${fixActionId} not found`);
  if (fixAction.status === 'applied') {
    logger.warn({ fixActionId }, 'Fix already applied — skipping');
    return fixAction;
  }

  // Mark as applying
  fixAction.status       = 'applying';
  fixAction.attemptCount += 1;
  await fixAction.save();

  try {
    let shopifyResponse = null;
    const { fixType, payload, shopDomain } = fixAction;

    // ── Route to correct Shopify API based on fix type ──────────────────────
    if (fixType === 'update_product') {
      const productId     = payload?.product?.id;
      if (!productId) throw new Error('Missing product id in payload');
      shopifyResponse = await updateProduct(shopDomain, accessToken, productId, payload.product);

    } else if (fixType === 'update_price') {
      // Price updates go through variant endpoint
      const productId = payload?.product?.id;
      shopifyResponse = await updateProduct(shopDomain, accessToken, productId, payload.product);

    } else if (fixType === 'none') {
      // Suggestion only — no write action needed
      shopifyResponse = { info: 'No write action required for this suggestion' };

    } else {
      throw new Error(`Unsupported fix type: ${fixType}`);
    }

    // ── Mark as applied ─────────────────────────────────────────────────────
    fixAction.status          = 'applied';
    fixAction.appliedAt       = new Date();
    fixAction.shopifyResponse = shopifyResponse;
    await fixAction.save();

    logger.info({ fixActionId, fixType, shopDomain }, 'Fix applied successfully');
    return fixAction;

  } catch (err) {
    fixAction.status   = 'failed';
    fixAction.errorMsg = err.message;
    await fixAction.save();

    logger.error({ err, fixActionId }, 'Fix execution failed');
    throw new ShopifyApiError(`Fix failed: ${err.message}`);
  }
}