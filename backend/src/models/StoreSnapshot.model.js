import { query } from '../config/database.js';

export class StoreSnapshot {
  static async create(data) {
    const {
      merchantId,
      shopDomain,
      metrics = {},
      topProducts = [],
      healthScore,
      healthBreakdown = {},
      syncedAt = new Date(),
      dataWindowDays = 90,
    } = data;

    const sql = `
      INSERT INTO store_snapshots (
        merchant_id, shop_domain, total_revenue, order_count, avg_order_value,
        total_sessions, conversion_rate, checkouts_initiated, checkouts_completed,
        cart_abandon_rate, total_customers, new_customers, returning_customers,
        returning_rate, total_products, active_products, out_of_stock_count,
        no_description_count, no_image_count, revenue_30d, orders_30d, aov_30d,
        top_products, health_score, health_breakdown, synced_at, data_window_days
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *
    `;

    const result = await query(sql, [
      merchantId,
      shopDomain,
      metrics.totalRevenue || 0,
      metrics.orderCount || 0,
      metrics.avgOrderValue || 0,
      metrics.totalSessions || 0,
      metrics.conversionRate || 0,
      metrics.checkoutsInitiated || 0,
      metrics.checkoutsCompleted || 0,
      metrics.cartAbandonRate || 0,
      metrics.totalCustomers || 0,
      metrics.newCustomers || 0,
      metrics.returningCustomers || 0,
      metrics.returningRate || 0,
      metrics.totalProducts || 0,
      metrics.activeProducts || 0,
      metrics.outOfStockCount || 0,
      metrics.noDescriptionCount || 0,
      metrics.noImageCount || 0,
      metrics.revenue30d || 0,
      metrics.orders30d || 0,
      metrics.aov30d || 0,
      JSON.stringify(topProducts),
      healthScore,
      JSON.stringify(healthBreakdown),
      syncedAt,
      dataWindowDays,
    ]);

    return this.mapRowToSnapshot(result.rows[0]);
  }

  static async findByMerchantId(merchantId, options = {}) {
    const { limit = 1, sort = { syncedAt: -1 } } = options;
    
    const sortOrder = sort.syncedAt === -1 ? 'DESC' : 'ASC';
    const sql = `
      SELECT * FROM store_snapshots 
      WHERE merchant_id = $1 
      ORDER BY synced_at ${sortOrder}
      LIMIT $2
    `;
    
    const result = await query(sql, [merchantId, limit]);
    
    if (limit === 1) {
      return result.rows.length > 0 ? this.mapRowToSnapshot(result.rows[0]) : null;
    }
    
    return result.rows.map(row => this.mapRowToSnapshot(row));
  }

  static async findById(id) {
    const sql = 'SELECT * FROM store_snapshots WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rows.length > 0 ? this.mapRowToSnapshot(result.rows[0]) : null;
  }

  static async findByShopDomain(shopDomain, options = {}) {
    const { limit = 1, sort = { syncedAt: -1 } } = options;
    
    const sortOrder = sort.syncedAt === -1 ? 'DESC' : 'ASC';
    const sql = `
      SELECT * FROM store_snapshots 
      WHERE shop_domain = $1 
      ORDER BY synced_at ${sortOrder}
      LIMIT $2
    `;
    
    const result = await query(sql, [shopDomain, limit]);
    
    if (limit === 1) {
      return result.rows.length > 0 ? this.mapRowToSnapshot(result.rows[0]) : null;
    }
    
    return result.rows.map(row => this.mapRowToSnapshot(row));
  }

  static async findLatestByMerchant(merchantId) {
    return await this.findByMerchantId(merchantId, { limit: 1, sort: { syncedAt: -1 } });
  }

  static async deleteById(id) {
    const sql = 'DELETE FROM store_snapshots WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  static async deleteByMerchantId(merchantId) {
    const sql = 'DELETE FROM store_snapshots WHERE merchant_id = $1 RETURNING *';
    const result = await query(sql, [merchantId]);
    return result.rowCount;
  }

  static mapRowToSnapshot(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      merchantId: row.merchant_id,
      shopDomain: row.shop_domain,
      metrics: {
        totalRevenue: parseFloat(row.total_revenue),
        orderCount: parseInt(row.order_count),
        avgOrderValue: parseFloat(row.avg_order_value),
        totalSessions: parseInt(row.total_sessions),
        conversionRate: parseFloat(row.conversion_rate),
        checkoutsInitiated: parseInt(row.checkouts_initiated),
        checkoutsCompleted: parseInt(row.checkouts_completed),
        cartAbandonRate: parseFloat(row.cart_abandon_rate),
        totalCustomers: parseInt(row.total_customers),
        newCustomers: parseInt(row.new_customers),
        returningCustomers: parseInt(row.returning_customers),
        returningRate: parseFloat(row.returning_rate),
        totalProducts: parseInt(row.total_products),
        activeProducts: parseInt(row.active_products),
        outOfStockCount: parseInt(row.out_of_stock_count),
        noDescriptionCount: parseInt(row.no_description_count),
        noImageCount: parseInt(row.no_image_count),
        revenue30d: parseFloat(row.revenue_30d),
        orders30d: parseInt(row.orders_30d),
        aov30d: parseFloat(row.aov_30d),
      },
      topProducts: row.top_products || [],
      healthScore: row.health_score,
      healthBreakdown: row.health_breakdown || {},
      syncedAt: row.synced_at,
      dataWindowDays: row.data_window_days,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      
      // Backward compatibility methods
      save: async function() {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        // Update metrics fields
        Object.entries(this.metrics).forEach(([key, value]) => {
          const dbField = this.mapMetricField(key);
          if (dbField) {
            fields.push(`${dbField} = $${paramIndex++}`);
            values.push(value);
          }
        });

        if (fields.length > 0) {
          fields.push(`updated_at = NOW()`);
          values.push(this.id);

          const sql = `
            UPDATE store_snapshots 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          const result = await query(sql, values);
          return StoreSnapshot.mapRowToSnapshot(result.rows[0]);
        }
        return this;
      },

      mapMetricField: function(key) {
        const fieldMap = {
          totalRevenue: 'total_revenue',
          orderCount: 'order_count',
          avgOrderValue: 'avg_order_value',
          totalSessions: 'total_sessions',
          conversionRate: 'conversion_rate',
          checkoutsInitiated: 'checkouts_initiated',
          checkoutsCompleted: 'checkouts_completed',
          cartAbandonRate: 'cart_abandon_rate',
          totalCustomers: 'total_customers',
          newCustomers: 'new_customers',
          returningCustomers: 'returning_customers',
          returningRate: 'returning_rate',
          totalProducts: 'total_products',
          activeProducts: 'active_products',
          outOfStockCount: 'out_of_stock_count',
          noDescriptionCount: 'no_description_count',
          noImageCount: 'no_image_count',
          revenue30d: 'revenue_30d',
          orders30d: 'orders_30d',
          aov30d: 'aov_30d',
        };
        return fieldMap[key];
      }
    };
  }
}

// Export for backward compatibility
export const StoreSnapshotModel = {
  findOne: async (query) => {
    if (query.merchantId) {
      return await StoreSnapshot.findByMerchantId(query.merchantId);
    }
    if (query._id) {
      return await StoreSnapshot.findById(query._id);
    }
    if (query.shopDomain) {
      return await StoreSnapshot.findByShopDomain(query.shopDomain);
    }
    return null;
  },
  
  create: async (data) => {
    return await StoreSnapshot.create(data);
  },
  
  find: async (query = {}) => {
    if (query.merchantId) {
      return await StoreSnapshot.findByMerchantId(query.merchantId, { limit: 50 });
    }
    return [];
  },
  
  findOneAndUpdate: async (query, update) => {
    // For simplicity, find first then update
    const existing = await StoreSnapshotModel.findOne(query);
    if (existing) {
      Object.assign(existing, update);
      return await existing.save();
    }
    return null;
  },
  
  deleteOne: async (query) => {
    if (query._id) {
      return await StoreSnapshot.deleteById(query._id);
    }
    if (query.merchantId) {
      const count = await StoreSnapshot.deleteByMerchantId(query.merchantId);
      return { deletedCount: count };
    }
    return { deletedCount: 0 };
  },
  
  deleteMany: async (query) => {
    if (query.merchantId) {
      const count = await StoreSnapshot.deleteByMerchantId(query.merchantId);
      return { deletedCount: count };
    }
    return { deletedCount: 0 };
  },
  
  sort: function(field) {
    // Mock sort for compatibility
    return this;
  },
  
  limit: function(count) {
    // Mock limit for compatibility
    return this;
  }
};