/**
 * Daily cron job — saves a health_history row for every active merchant at midnight.
 * Powers the revenue chart trend line on the dashboard.
 */
import { logger } from '../utils/logger.js';
import { MerchantModel } from '../models/index.js';
import { HealthHistoryModel } from '../models/secondary.models.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchOrders } from '../services/shopify/order.services.js';

async function takeDailySnapshot(merchant) {
  const { shopDomain } = merchant;
  try {
    const accessToken = merchant.getAccessToken();
    if (!accessToken) {
      logger.warn({ shopDomain }, 'No access token — skipping daily snapshot');
      return;
    }

    const [products, orders] = await Promise.all([
      fetchProducts(shopDomain, accessToken).catch(() => []),
      fetchOrders(shopDomain, accessToken, 1, true).catch(() => []), // today's orders
    ]);

    const revenue = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
    const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0).length;
    const productsWithoutDesc = products.filter(p => !p.body_html || p.body_html.trim().length < 50).length;

    let healthScore = 100;
    if (productsWithoutImages > 0) healthScore -= Math.min(20, productsWithoutImages * 3);
    if (productsWithoutDesc > 0) healthScore -= Math.min(15, productsWithoutDesc * 2);
    healthScore = Math.max(0, Math.min(100, healthScore));

    await HealthHistoryModel.create({
      merchantId: merchant.id,
      shopDomain,
      healthScore,
      date: new Date(),
      metrics: {
        revenue,
        orderCount: orders.length,
        totalProducts: products.length,
      },
    });

    logger.info({ shopDomain, healthScore, revenue }, 'Daily snapshot saved');
  } catch (err) {
    logger.error({ err, shopDomain }, 'Daily snapshot failed for merchant');
  }
}

export async function runDailySnapshots() {
  logger.info('Running daily snapshots for all active merchants');
  try {
    const merchants = await MerchantModel.find({ is_active: true });
    await Promise.allSettled(merchants.map(takeDailySnapshot));
    logger.info({ count: merchants.length }, 'Daily snapshots complete');
  } catch (err) {
    logger.error({ err }, 'Daily snapshot run failed');
  }
}

/**
 * Schedule daily cron using setInterval at midnight.
 * No external dependency — works without Redis/BullMQ.
 */
export function startCronWorker() {
  const msUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  };

  const schedule = () => {
    const delay = msUntilMidnight();
    logger.info({ nextRunIn: `${Math.round(delay / 60000)}min` }, 'Daily snapshot cron scheduled');
    setTimeout(async () => {
      await runDailySnapshots();
      schedule(); // reschedule for next midnight
    }, delay);
  };

  schedule();
}
