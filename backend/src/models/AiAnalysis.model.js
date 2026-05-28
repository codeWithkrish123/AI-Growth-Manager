import { query } from '../config/database.js';

export class AiAnalysis {
  static async create(data) {
    const {
      merchantId,
      snapshotId,
      shopDomain,
      healthScore,
      summary,
      problems = [],
      promptTokens,
      completionTokens,
      modelUsed,
      latencyMs,
      metricsHash,
      status = 'completed',
    } = data;

    const sql = `
      INSERT INTO ai_analyses (
        merchant_id, snapshot_id, shop_domain, health_score, summary, problems,
        prompt_tokens, completion_tokens, model_used, latency_ms, metrics_hash, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;

    const result = await query(sql, [
      merchantId,
      snapshotId,
      shopDomain,
      healthScore,
      summary,
      JSON.stringify(problems),
      promptTokens,
      completionTokens,
      modelUsed,
      latencyMs,
      metricsHash,
      status,
    ]);

    return this.mapRowToAnalysis(result.rows[0]);
  }

  static async findByMerchantId(merchantId, options = {}) {
    const {
      limit = 10,
      sort = { createdAt: -1 },
      status = null
    } = options;

    const sortOrder = sort.createdAt === -1 ? 'DESC' : 'ASC';
    let sql = `
      SELECT * FROM ai_analyses
      WHERE merchant_id = $1
    `;
    const params = [merchantId];

    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY created_at ${sortOrder} LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);

    if (limit === 1) {
      return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
    }

    return result.rows.map(row => this.mapRowToAnalysis(row));
  }

  static async findBySnapshotId(snapshotId) {
    const sql = 'SELECT * FROM ai_analyses WHERE snapshot_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [snapshotId]);

    return result.rows.map(row => this.mapRowToAnalysis(row));
  }

  static async findByMetricsHash(metricsHash) {
    const sql = 'SELECT * FROM ai_analyses WHERE metrics_hash = $1 AND status = $2';
    const result = await query(sql, [metricsHash, 'completed']);

    return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM ai_analyses WHERE id = $1';
    const result = await query(sql, [id]);

    return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
  }

  static async findLatestByMerchant(merchantId, status = 'completed') {
    return await this.findByMerchantId(merchantId, {
      limit: 1,
      sort: { createdAt: -1 },
      status
    });
  }

  static async updateStatus(id, status) {
    const sql = `
      UPDATE ai_analyses
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [status, id]);
    return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
  }

  static async deleteById(id) {
    const sql = 'DELETE FROM ai_analyses WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  static async deleteByMerchantId(merchantId) {
    const sql = 'DELETE FROM ai_analyses WHERE merchant_id = $1 RETURNING *';
    const result = await query(sql, [merchantId]);
    return result.rowCount;
  }

  static async deleteBySnapshotId(snapshotId) {
    const sql = 'DELETE FROM ai_analyses WHERE snapshot_id = $1 RETURNING *';
    const result = await query(sql, [snapshotId]);
    return result.rowCount;
  }

  static mapRowToAnalysis(row) {
    if (!row) return null;

    return {
      id: row.id,
      merchantId: row.merchant_id,
      snapshotId: row.snapshot_id,
      shopDomain: row.shop_domain,
      healthScore: row.health_score,
      summary: row.summary,
      problems: row.problems || [],
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      modelUsed: row.model_used,
      latencyMs: row.latency_ms,
      metricsHash: row.metrics_hash,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,

      // Backward compatibility methods
      save: async function() {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (this.healthScore !== undefined) {
          fields.push(`health_score = $${paramIndex++}`);
          values.push(this.healthScore);
        }

        if (this.summary !== undefined) {
          fields.push(`summary = $${paramIndex++}`);
          values.push(this.summary);
        }

        if (this.problems !== undefined) {
          fields.push(`problems = $${paramIndex++}`);
          values.push(JSON.stringify(this.problems));
        }

        if (this.status !== undefined) {
          fields.push(`status = $${paramIndex++}`);
          values.push(this.status);
        }

        if (fields.length > 0) {
          fields.push(`updated_at = NOW()`);
          values.push(this.id);

          const sql = `
            UPDATE ai_analyses
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          const result = await query(sql, values);
          return AiAnalysis.mapRowToAnalysis(result.rows[0]);
        }
        return this;
      }
    };
  }
}

export const AiAnalysisModel = {
  findOne: async (query) => {
    if (query.merchantId) {
      if (query.status) {
        const results = await AiAnalysis.findByMerchantId(query.merchantId, { 
          limit: 1, 
          status: query.status 
        });
        return results;
      }
      return await AiAnalysis.findByMerchantId(query.merchantId, { limit: 1 });
    }
    if (query._id) {
      return await AiAnalysis.findById(query._id);
    }
    if (query.snapshotId) {
      const results = await AiAnalysis.findBySnapshotId(query.snapshotId);
      return results.length > 0 ? results[0] : null;
    }
    if (query.metricsHash) {
      return await AiAnalysis.findByMetricsHash(query.metricsHash);
    }
    return null;
  },
  
  create: async (data) => {
    return await AiAnalysis.create(data);
  },
  
  find: async (query = {}) => {
    if (query.merchantId) {
      return await AiAnalysis.findByMerchantId(query.merchantId, query);
    }
    return [];
  },
  
  findLatestByMerchant: async (merchantId, status = 'completed') => {
    return await AiAnalysis.findLatestByMerchant(merchantId, status);
  },
  
  findOneAndUpdate: async (query, update) => {
    // For simplicity, find first then update
    const existing = await AiAnalysisModel.findOne(query);
    if (existing) {
      Object.assign(existing, update);
      return await existing.save();
    }
    return null;
  },
  
  deleteOne: async (query) => {
    if (query._id) {
      return await AiAnalysis.deleteById(query._id);
    }
    if (query.merchantId) {
      const count = await AiAnalysis.deleteByMerchantId(query.merchantId);
      return { deletedCount: count };
    }
    if (query.snapshotId) {
      const count = await AiAnalysis.deleteBySnapshotId(query.snapshotId);
      return { deletedCount: count };
    }
    return { deletedCount: 0 };
  },
  
  deleteMany: async (query) => {
    if (query.merchantId) {
      const count = await AiAnalysis.deleteByMerchantId(query.merchantId);
      return { deletedCount: count };
    }
    if (query.snapshotId) {
      const count = await AiAnalysis.deleteBySnapshotId(query.snapshotId);
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