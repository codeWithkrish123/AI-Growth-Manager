import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/errors.js';
import { logger }         from '../../utils/logger.js';
import { daysAgo }        from '../../utils/date.js';

/**
 * Fetch all orders for a shop within the last N days.
 * Handles Shopify pagination automatically.
 */
export async function fetchOrders(shopDomain, accessToken, days = 90) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const sinceDate = daysAgo(days).toISOString();
    const allOrders = [];
    let pageInfo    = null;

    do {
      const params = {
        limit:        250,
        status:       'any',
        created_at_min: sinceDate,
        fields:       'id,total_price,financial_status,fulfillment_status,created_at,line_items,customer',
      };

      if (pageInfo) params.page_info = pageInfo;

      const response = await client.get({ path: 'orders', query: params });

      allOrders.push(...(response.body.orders || []));

      // Extract next page cursor from Link header
      const linkHeader = response.headers?.link || '';
      const nextMatch  = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      pageInfo         = nextMatch ? nextMatch[1] : null;

    } while (pageInfo);

    logger.debug({ shopDomain, count: allOrders.length }, 'Orders fetched');
    return allOrders;

  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch orders');
    throw new ShopifyApiError(`Orders fetch failed: ${err.message}`);
  }
}

/**
 * Fetch abandoned checkouts for the last N days.
 */
export async function fetchAbandonedCheckouts(shopDomain, accessToken, days = 90) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const sinceDate = daysAgo(days).toISOString();

    const response = await client.get({
      path:  'checkouts',
      query: { limit: 250, created_at_min: sinceDate },
    });

    return response.body.checkouts || [];
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch checkouts');
    throw new ShopifyApiError(`Checkouts fetch failed: ${err.message}`);
  }
}