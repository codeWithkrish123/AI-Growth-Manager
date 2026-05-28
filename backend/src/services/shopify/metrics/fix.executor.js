import { FixAction }        from '../../../models/index.js';
import { updateProduct }    from '../../shopify/products.service.js';
import { ShopifyApiError }  from '../../../utils/error.js';
import { logger }           from '../../../utils/logger.js';
import { shopify }          from '../../../config/shopify.js';

/**
 * ✅ VALIDATE + NORMALIZE PAYLOAD
 */
function validateAndNormalizePayload(fixType, payload) {
  // ⚠️ Check for empty payload
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    throw new Error(`Cannot execute fix: No data provided for this problem. The AI analysis identified an issue but couldn't generate actionable changes. Please try analyzing the store again.`);
  }

  if (Array.isArray(payload)) {
    payload = payload[0];
  }

  // ⚠️ After array unwrap, check if still empty
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error(`Cannot execute fix: No data provided for this problem. The AI analysis identified an issue but couldn't generate actionable changes. Please try analyzing the store again.`);
  }

  switch (fixType) {
    case 'update_product':
    case 'update_price':
    case 'update_seo':
    case 'add_product_tags': {
      const productId = payload?.product?.id || payload?.id;

      if (!productId) {
        throw new Error('Cannot apply fix: Missing product ID. The payload does not contain valid product information.');
      }

      return {
        ...payload,
        product: {
          ...(payload.product || {}),
          id: productId,
        },
      };
    }

    case 'create_discount': {
      if (!payload?.discount) {
        throw new Error('Cannot apply fix: Missing discount data. The payload does not contain valid discount information.');
      }
      return payload;
    }

    case 'none':
      return payload;

    default:
      throw new Error(`Unsupported fix type: ${fixType}`);
  }
}

/**
 * Preview Fix
 */
export async function previewFix(fixActionId, accessToken) {
  const fixAction = await FixAction.findById(fixActionId);
  if (!fixAction) throw new Error(`FixAction ${fixActionId} not found`);

  const { fixType, shopDomain } = fixAction;

  let payload;
  try {
    payload = validateAndNormalizePayload(fixType, fixAction.payload);
  } catch (err) {
    throw new ShopifyApiError(`Preview failed: ${err.message}`);
  }

  const client = new shopify.clients.Rest({
    session: { shop: shopDomain, accessToken },
  });

  let before = {};
  let after = {};

  try {
    if (fixType === 'update_product' || fixType === 'update_seo') {
      const productId = payload.product.id;

      const currentProduct = await client.get({
      path: `products/${productId}`,
     query: { fields: 'id,title,body_html,tags,variants' }
});client.get({ path: `products/${productId}` });

      before = {
        id: currentProduct.body.product.id,
        title: currentProduct.body.product.title,
        body_html: currentProduct.body.product.body_html,
        tags: currentProduct.body.product.tags,
        handle: currentProduct.body.product.handle,
      };

      after = {
        id: productId,
        title: payload.product.title ?? before.title,
        body_html: payload.product.body_html ?? before.body_html,
        tags: payload.product.tags ?? before.tags,
        handle: before.handle,
      };

    } else if (fixType === 'update_price') {
      const productId = payload.product.id;

      const currentProduct = await client.get({ path: `products/${productId}` });
      const variant = currentProduct.body.product.variants?.[0] || {};

      before = {
        id: productId,
        price: variant.price,
        compare_at_price: variant.compare_at_price,
      };

      after = {
        id: productId,
        price: payload.product.variants?.[0]?.price ?? before.price,
        compare_at_price: payload.product.variants?.[0]?.compare_at_price ?? before.compare_at_price,
      };

    } else if (fixType === 'add_product_tags') {
      const productId = payload.product.id;

      const currentProduct = await client.get({ path: `products/${productId}` });
      const existingTags = currentProduct.body.product.tags || '';

      before = {
        id: productId,
        tags: existingTags,
      };

      const incomingTags = payload.tags?.trim();

      const newTags = incomingTags
        ? (existingTags ? `${existingTags}, ${incomingTags}` : incomingTags)
        : existingTags;

      after = {
        id: productId,
        tags: newTags,
      };

    } else if (fixType === 'create_discount') {
      const existingDiscounts = await client.get({
        path: 'price_rules',
        query: { limit: 10 },
      });

      before = {
        existing_discounts: existingDiscounts.body.price_rules || [],
      };

      after = {
        new_discount: payload.discount,
      };

    } else {
      before = { info: 'No preview available' };
      after = { info: 'No preview available' };
    }

    return {
      fixActionId,
      fixType,
      shopDomain,
      before,
      after,
      changes: detectChanges(before, after),
    };

  } catch (err) {
    logger.error({ err, fixActionId }, 'Fix preview failed');
    throw new ShopifyApiError(`Fix preview failed: ${err.message}`);
  }
}

/**
 * Detect Changes Safely
 */
function detectChanges(before = {}, after = {}) {
  const changes = [];

  if (before.title !== after.title) {
    changes.push({ field: 'title', from: before.title, to: after.title });
  }

  if (before.body_html !== after.body_html) {
    changes.push({
      field: 'description',
      from: before.body_html ? before.body_html.substring(0, 100) + '...' : '',
      to: after.body_html ? after.body_html.substring(0, 100) + '...' : '',
    });
  }

  if (before.tags !== after.tags) {
    changes.push({ field: 'tags', from: before.tags, to: after.tags });
  }

  if (before.price !== after.price) {
    changes.push({ field: 'price', from: before.price, to: after.price });
  }

  return changes;
}

/**
 * Execute Fix
 */
export async function executeFix(fixActionId, accessToken) {
  const fixAction = await FixAction.findById(fixActionId);

  if (!fixAction) throw new Error(`FixAction ${fixActionId} not found`);
  if (fixAction.status === 'applied') {
    logger.warn({ fixActionId }, 'Fix already applied — skipping');
    return fixAction;
  }

  fixAction.status = 'applying';
  fixAction.attemptCount += 1;
  await fixAction.save();

  try {
    let shopifyResponse = null;
    const { fixType, shopDomain } = fixAction;

    let payload = validateAndNormalizePayload(fixType, fixAction.payload);

    // ✅ Logging (debugging support)
   logger.debug({
  fixType,
  productId: payload?.product?.id,
  hasSeo: !!payload?.seo,
  hasTags: !!payload?.tags
}, 'Payload processed');
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    if (fixType === 'update_product') {
      const productId = payload.product.id;

      const productData = {};

      if (payload.product.title !== undefined) {
        productData.title = payload.product.title;
      }
      if (payload.product.body_html !== undefined) {
        productData.body_html = payload.product.body_html;
      }
      if (payload.product.tags !== undefined) {
        productData.tags = payload.product.tags;
      }

      // ⚠️ If no changes, fetch current product and generate improvements
      if (Object.keys(productData).length === 0) {
        try {
          const currentProduct = await client.get({
            path: `products/${productId}`,
            query: { fields: 'id,title,body_html' }
          });
          
          const product = currentProduct.body.product;
          const currentTitle = product.title || '';
          const currentDescription = product.body_html || '';

          // Generate improved description if missing/poor
          if (!currentDescription || currentDescription.length < 50) {
            productData.body_html = `<p>${currentTitle} - Premium quality product. Carefully crafted with attention to detail and excellent customer service in mind. This product is designed to meet your needs and exceed your expectations.</p>`;
            logger.info({ productId }, 'Generated improved description for product');
          } else {
            // No changes needed, just mark as reviewed
            logger.info({ productId }, 'Product already has adequate description');
            throw new Error('This product already has adequate content. No improvements needed at this time.');
          }

        } catch (err) {
          if (err.message.includes('No improvements needed')) throw err;
          logger.error({ err, productId }, 'Failed to fetch product for improvements');
          throw new Error(`Could not generate improvements: ${err.message}`);
        }
      }

      shopifyResponse = await updateProduct(
        shopDomain,
        accessToken,
        productId,
        productData
      );

    } else if (fixType === 'update_price') {
      const productId = payload.product.id;

      shopifyResponse = await updateProduct(
        shopDomain,
        accessToken,
        productId,
        payload.product
      );

    } else if (fixType === 'create_discount') {
      const discountData = payload.discount;

      const res = await client.post({
        path: 'price_rules',
        data: {
          price_rule: {
            title: discountData.title,
            target_type: 'line_item',
            target_selection: 'all',
            allocation_method: 'across',
            value_type: discountData.value_type || 'percentage',
            value: discountData.value || -10,
            customer_selection: 'all',
            starts_at: new Date().toISOString(),
          },
        },
      });

      const priceRuleId = res.body.price_rule.id;

      await client.post({
        path: `price_rules/${priceRuleId}/discount_codes`,
        data: {
          discount_code: { code: discountData.code },
        },
      });

      shopifyResponse = res;

    } else if (fixType === 'add_product_tags') {
      const productId = payload.product.id;

      const currentProduct = await client.get({ path: `products/${productId}` });
      const existingTags = currentProduct.body.product.tags || '';

      const incomingTags = payload.tags?.trim();

      const newTags = incomingTags
        ? (existingTags ? `${existingTags}, ${incomingTags}` : incomingTags)
        : existingTags;

      shopifyResponse = await updateProduct(
        shopDomain,
        accessToken,
        productId,
        { tags: newTags }
      );

    } else if (fixType === 'update_seo') {
      const productId = payload.product.id;
      const seoData = payload.seo || {};

      shopifyResponse = await updateProduct(
        shopDomain,
        accessToken,
        productId,
        {
          title: seoData.title,
          body_html: seoData.description,
          metafields: seoData.metafields || [],
        }
      );

    } else if (fixType === 'none') {
      shopifyResponse = { info: 'No write action required' };

    } else {
      throw new Error(`Unsupported fix type: ${fixType}`);
    }

    fixAction.status = 'applied';
    fixAction.appliedAt = new Date();
    fixAction.shopifyResponse = shopifyResponse;
    await fixAction.save();

    return fixAction;

  } catch (err) {
    fixAction.status = 'failed';
    fixAction.errorMsg = err.message;
    await fixAction.save();

    logger.error({ err, fixActionId }, 'Fix execution failed');

    throw new ShopifyApiError(`Fix failed: ${err.message}`);
  }
}