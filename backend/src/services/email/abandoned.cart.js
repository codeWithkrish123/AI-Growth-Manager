import { logger } from '../../utils/logger.js';
import { sendAbandonedCartEmail } from './email.service.js';
import { query } from '../../config/database.js';

/**
 * Phase 5.2 — Abandoned Cart Recovery
 * Called from webhook processor when checkouts/create fires.
 * Queues a delayed email job via BullMQ.
 */
export async function scheduleAbandonedCartEmail(shopDomain, checkout) {
  const {
    id: checkoutId,
    email: customerEmail,
    customer,
    line_items: items = [],
    total_price,
    abandoned_checkout_url,
  } = checkout;

  if (!customerEmail) {
    logger.debug({ checkoutId }, 'No email on checkout — skipping abandoned cart');
    return;
  }

  // Log the checkout for tracking
  try {
    await query(
      `INSERT INTO email_logs (
         campaign_id, merchant_id, customer_email, customer_name, status
       ) VALUES (
         $1, $2, $3, $4, 'pending'
       ) ON CONFLICT DO NOTHING`,
      [
        checkoutId.toString(),
        shopDomain,
        customerEmail,
        customer?.first_name || 'Valued Customer',
      ]
    ).catch(() => {}); // Non-critical
  } catch { /* silent */ }

  logger.info({ shopDomain, checkoutId, customerEmail }, 'Abandoned cart scheduled');

  // The actual send happens after a delay via BullMQ
  // (imported lazily to avoid circular deps at startup)
  try {
    const { syncQueue } = await import('../../workers/sync.worker.js');
    if (syncQueue) {
      await syncQueue.add(
        'abandoned-cart-email',
        {
          shopDomain,
          checkoutId,
          customerEmail,
          customerName: customer?.first_name || '',
          items: items.slice(0, 3).map(i => ({
            title: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
          totalPrice: total_price,
          cartUrl: abandoned_checkout_url || `https://${shopDomain}`,
        },
        {
          delay: 2 * 60 * 60 * 1000, // 2 hours delay
          jobId: `cart-${checkoutId}`,
          attempts: 2,
        }
      );
    }
  } catch (err) {
    logger.warn({ err }, 'Could not queue abandoned cart email');
  }
}

/**
 * Process and send the abandoned cart email (called by BullMQ worker)
 */
export async function sendScheduledAbandonedCartEmail(jobData) {
  const { shopDomain, customerEmail, customerName, items, cartUrl } = jobData;

  // Look up merchant to get shop name
  let shopName = shopDomain.replace('.myshopify.com', '');
  try {
    const { MerchantModel } = await import('../../models/index.js');
    const merchant = await MerchantModel.findOne({ shopDomain });
    if (merchant?.shopInfo?.name) shopName = merchant.shopInfo.name;
  } catch { /* use fallback */ }

  await sendAbandonedCartEmail({
    customerEmail,
    customerName,
    shopName,
    cartItems: items,
    cartUrl,
    shopDomain,
  });

  logger.info({ shopDomain, customerEmail }, 'Abandoned cart email sent');
}
