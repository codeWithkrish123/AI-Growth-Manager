import { query } from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export class Merchant {
  static async create(data) {
    const {
      shopDomain,
      accessToken,
      scope,
      isActive = true,
      planTier = 'free',
      shopInfo = null,
    } = data;

    // Only encrypt if accessToken is provided (Google OAuth users won't have one yet)
    const encryptedToken = accessToken ? encrypt(accessToken) : '';
    
    const sql = `
      INSERT INTO merchants (shop_domain, access_token_enc, scope, is_active, plan_tier, shop_info)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (shop_domain) DO UPDATE SET
        access_token_enc = CASE WHEN EXCLUDED.access_token_enc != '' THEN EXCLUDED.access_token_enc ELSE merchants.access_token_enc END,
        scope = COALESCE(EXCLUDED.scope, merchants.scope),
        is_active = EXCLUDED.is_active,
        plan_tier = EXCLUDED.plan_tier,
        shop_info = COALESCE(EXCLUDED.shop_info, merchants.shop_info),
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await query(sql, [
      shopDomain.toLowerCase().trim(),
      encryptedToken,
      scope || null,
      isActive,
      planTier,
      shopInfo ? JSON.stringify(shopInfo) : null
    ]);
    
    return this.mapRowToMerchant(result.rows[0]);
  }

  static async findByShopDomain(shopDomain) {
    const sql = 'SELECT * FROM merchants WHERE shop_domain = $1';
    const result = await query(sql, [shopDomain.toLowerCase().trim()]);
    
    return result.rows.length > 0 ? this.mapRowToMerchant(result.rows[0]) : null;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM merchants WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rows.length > 0 ? this.mapRowToMerchant(result.rows[0]) : null;
  }

  static async updateByShopDomain(shopDomain, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.scope !== undefined) {
      fields.push(`scope = $${paramIndex++}`);
      values.push(updateData.scope);
    }
    
    if (updateData.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updateData.isActive);
    }
    
    if (updateData.planTier !== undefined) {
      fields.push(`plan_tier = $${paramIndex++}`);
      values.push(updateData.planTier);
    }
    
    if (updateData.shopInfo !== undefined) {
      fields.push(`shop_info = $${paramIndex++}`);
      values.push(updateData.shopInfo ? JSON.stringify(updateData.shopInfo) : null);
    }
    
    if (updateData.accessToken !== undefined) {
      fields.push(`access_token_enc = $${paramIndex++}`);
      values.push(encrypt(updateData.accessToken));
    }
    
    if (updateData.lastSyncAt !== undefined) {
      fields.push(`last_sync_at = $${paramIndex++}`);
      values.push(updateData.lastSyncAt);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(shopDomain.toLowerCase().trim());

    const sql = `
      UPDATE merchants 
      SET ${fields.join(', ')}
      WHERE shop_domain = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows.length > 0 ? this.mapRowToMerchant(result.rows[0]) : null;
  }

  static async updateById(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.scope !== undefined) {
      fields.push(`scope = $${paramIndex++}`);
      values.push(updateData.scope);
    }
    
    if (updateData.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updateData.isActive);
    }
    
    if (updateData.planTier !== undefined) {
      fields.push(`plan_tier = $${paramIndex++}`);
      values.push(updateData.planTier);
    }
    
    if (updateData.shopInfo !== undefined) {
      fields.push(`shop_info = $${paramIndex++}`);
      values.push(updateData.shopInfo ? JSON.stringify(updateData.shopInfo) : null);
    }
    
    if (updateData.accessToken !== undefined) {
      fields.push(`access_token_enc = $${paramIndex++}`);
      values.push(encrypt(updateData.accessToken));
    }
    
    if (updateData.lastSyncAt !== undefined) {
      fields.push(`last_sync_at = $${paramIndex++}`);
      values.push(updateData.lastSyncAt);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE merchants 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows.length > 0 ? this.mapRowToMerchant(result.rows[0]) : null;
  }

  static async deleteByShopDomain(shopDomain) {
    const sql = 'DELETE FROM merchants WHERE shop_domain = $1 RETURNING *';
    const result = await query(sql, [shopDomain.toLowerCase().trim()]);
    return result.rows.length > 0;
  }

  static async findAllActive() {
    const sql = 'SELECT * FROM merchants WHERE is_active = true ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows.map(row => this.mapRowToMerchant(row));
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM merchants WHERE shop_info->>\'email\' = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await query(sql, [email]);
    return result.rows.length > 0 ? this.mapRowToMerchant(result.rows[0]) : null;
  }

  static mapRowToMerchant(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      shopDomain: row.shop_domain,
      accessTokenEnc: row.access_token_enc,
      scope: row.scope,
      isActive: row.is_active,
      planTier: row.plan_tier,
      shopInfo: row.shop_info,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      
      // Methods for backward compatibility
      setAccessToken: function(plainToken) {
        this.accessTokenEnc = encrypt(plainToken);
      },
      
      getAccessToken: function() {
        if (!this.accessTokenEnc) return null;
        try {
          return decrypt(this.accessTokenEnc);
        } catch {
          return null;
        }
      },
      
      save: async function() {
        // We use updateById which expects plain accessToken and encrypts it.
        // But mapRowToMerchant gives us accessTokenEnc.
        // We should decrypt it first to avoid double encryption.
        const plainToken = this.getAccessToken();
        
        return await Merchant.updateById(this.id, {
          scope: this.scope,
          isActive: this.isActive,
          planTier: this.planTier,
          shopInfo: this.shopInfo,
          lastSyncAt: this.lastSyncAt,
          accessToken: plainToken
        });
      }
    };
  }
}

// Export a singleton-like instance for backward compatibility
export const MerchantModel = {
  findOne: async (query) => {
    if (query.shopDomain) {
      return await Merchant.findByShopDomain(query.shopDomain);
    }
    // Handle both _id and id query keys
    const idToLookup = query._id || query.id;
    if (idToLookup) {
      return await Merchant.findById(idToLookup);
    }
    if (query.email) {
      return await Merchant.findByEmail(query.email);
    }
    return null;
  },
  
  create: async (data) => {
    return await Merchant.create(data);
  },
  
  find: async (query = {}) => {
    if (query.is_active !== undefined) {
      return await Merchant.findAllActive();
    }
    return await Merchant.findAllActive();
  },
  
  findOneAndUpdate: async (query, update) => {
    if (query.shopDomain) {
      return await Merchant.updateByShopDomain(query.shopDomain, update);
    }
    if (query._id) {
      return await Merchant.updateById(query._id, update);
    }
    return null;
  },
  
  updateByShopDomain: async (shopDomain, updateData) => {
    return await Merchant.updateByShopDomain(shopDomain, updateData);
  }
};
