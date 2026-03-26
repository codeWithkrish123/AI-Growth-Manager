import { shopify }       from '../../config/shopify.js';
import { ShopifyApiError } from '../../utils/errors.js';
import { logger }         from '../../utils/logger.js';

/**
 * Fetch customer summary data.
 * We only need count + orders_count for metrics — no PII beyond that.
 */
export async function fetchCustomers(shopDomain, accessToken) {
  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken },
    });

    const allCustomers = [];
    let pageInfo       = null;

    do {
      const params = {
        limit:  250,
        fields: 'id,orders_count,total_spent,created_at',
      };

      if (pageInfo) params.page_info = pageInfo;

      const response = await client.get({ path: 'customers', query: params });

      allCustomers.push(...(response.body.customers || []));

      const linkHeader = response.headers?.link || '';
      const nextMatch  = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      pageInfo         = nextMatch ? nextMatch[1] : null;

    } while (pageInfo);

    logger.debug({ shopDomain, count: allCustomers.length }, 'Customers fetched');
    return allCustomers;

  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to fetch customers');
    throw new ShopifyApiError(`Customers fetch failed: ${err.message}`);
  }
}