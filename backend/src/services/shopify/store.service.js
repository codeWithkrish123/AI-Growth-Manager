import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/errors.js';
import { logger }         from '../../utils/logger.js';

/**
 * Fetch general store/shop info (name, email, currency, etc.)
 */
export async function fetchStoreInfo(shopDomain, accessToken) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const response = await client.get({ path: 'shop' });

    const shop = response.body.shop;

    return {
      name:        shop.name,
      email:       shop.email,
      currency:    shop.currency,
      timezone:    shop.iana_timezone,
      countryCode: shop.country_code,
      planName:    shop.plan_name,
    };
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch store info');
    throw new ShopifyApiError(`Store info fetch failed: ${err.message}`);
  }
}