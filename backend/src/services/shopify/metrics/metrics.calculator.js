import { daysAgo } from '../../utils/date.js';

/**
 * Compute all ecommerce metrics from raw Shopify data.
 * Pure function — no DB or API calls. Easy to unit test.
 *
 * @param {Object} raw  { orders, checkouts, products, customers }
 * @returns {Object}    metrics object matching StoreSnapshot.metrics schema
 */
export function calculateMetrics({ orders = [], checkouts = [], products = [], customers = [] }) {
  const thirtyDaysAgo = daysAgo(30);

  // ── Orders ──────────────────────────────────────────────────────────────────
  const completedOrders = orders.filter(o => o.financial_status === 'paid');
  const totalRevenue    = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  const orderCount      = completedOrders.length;
  const avgOrderValue   = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Last 30 days
  const orders30d  = completedOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
  const revenue30d = orders30d.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  const aov30d     = orders30d.length > 0 ? revenue30d / orders30d.length : 0;

  // ── Cart Abandonment ────────────────────────────────────────────────────────
  const checkoutsInitiated  = checkouts.length;
  const checkoutsCompleted  = orderCount; // orders are completed checkouts
  const cartAbandonRate     = checkoutsInitiated > 0
    ? ((checkoutsInitiated - checkoutsCompleted) / checkoutsInitiated) * 100
    : 0;

  // ── Products ────────────────────────────────────────────────────────────────
  const activeProducts     = products.filter(p => p.status === 'active');
  const noDescriptionCount = activeProducts.filter(p => !p.body_html || p.body_html.trim() === '').length;
  const noImageCount       = activeProducts.filter(p => !p.images || p.images.length === 0).length;

  // Out of stock: all variants have inventory_quantity <= 0
  const outOfStockCount = activeProducts.filter(p =>
    p.variants?.every(v => (v.inventory_quantity || 0) <= 0)
  ).length;

  // ── Customers ───────────────────────────────────────────────────────────────
  const totalCustomers      = customers.length;
  const returningCustomers  = customers.filter(c => (c.orders_count || 0) > 1).length;
  const newCustomers        = totalCustomers - returningCustomers;
  const returningRate       = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

  // ── Top Products by revenue ─────────────────────────────────────────────────
  const productRevenue = {};
  const productUnits   = {};

  completedOrders.forEach(order => {
    (order.line_items || []).forEach(item => {
      const id  = String(item.product_id);
      const rev = parseFloat(item.price || 0) * (item.quantity || 0);
      productRevenue[id] = (productRevenue[id] || 0) + rev;
      productUnits[id]   = (productUnits[id]   || 0) + (item.quantity || 0);
    });
  });

  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId, revenue]) => {
      const prod = products.find(p => String(p.id) === productId);
      return {
        productId,
        title:     prod?.title || 'Unknown',
        revenue:   parseFloat(revenue.toFixed(2)),
        unitsSold: productUnits[productId] || 0,
      };
    });

  return {
    metrics: {
      totalRevenue:       parseFloat(totalRevenue.toFixed(2)),
      orderCount,
      avgOrderValue:      parseFloat(avgOrderValue.toFixed(2)),
      totalSessions:      0, // Shopify Analytics API — add separately if needed
      conversionRate:     0,
      checkoutsInitiated,
      checkoutsCompleted,
      cartAbandonRate:    parseFloat(cartAbandonRate.toFixed(2)),
      totalCustomers,
      newCustomers,
      returningCustomers,
      returningRate:      parseFloat(returningRate.toFixed(2)),
      totalProducts:      products.length,
      activeProducts:     activeProducts.length,
      outOfStockCount,
      noDescriptionCount,
      noImageCount,
      revenue30d:         parseFloat(revenue30d.toFixed(2)),
      orders30d:          orders30d.length,
      aov30d:             parseFloat(aov30d.toFixed(2)),
    },
    topProducts,
  };
}