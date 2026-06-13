import { query } from '../config/database.js';

// ─── Fix Action ───────────────────────────────────────────────────────────────
export class FixAction {
  static async create(data) {
    const {
      merchantId,
      analysisId,
      shopDomain,
      problemId,
      fixType,
      payload,
      status = 'pending',
      shopifyResponse,
      appliedAt,
      errorMsg,
      attemptCount = 0,
      triggeredBy = 'merchant',
    } = data;

    const sql = `
      INSERT INTO fix_actions (
        merchant_id, analysis_id, shop_domain, problem_id, fix_type, payload,
        status, shopify_response, applied_at, error_msg, attempt_count, triggered_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;

    const result = await query(sql, [
      merchantId,
      analysisId,
      shopDomain,
      problemId,
      fixType,
      JSON.stringify(payload),
      status,
      JSON.stringify(shopifyResponse),
      appliedAt,
      errorMsg,
      attemptCount,
      triggeredBy,
    ]);

    return this.mapRowToFixAction(result.rows[0]);
  }

  static async findByMerchantId(merchantId, options = {}) {
    const { limit = 50, sort = { createdAt: -1 }, status = null } = options;
    
    const sortOrder = sort.createdAt === -1 ? 'DESC' : 'ASC';
    let sql = `SELECT * FROM fix_actions WHERE merchant_id = $1`;
    const params = [merchantId];
    
    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    sql += ` ORDER BY created_at ${sortOrder} LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await query(sql, params);
    return result.rows.map(row => this.mapRowToFixAction(row));
  }

  static async findById(id) {
    const sql = 'SELECT * FROM fix_actions WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? this.mapRowToFixAction(result.rows[0]) : null;
  }

  static async updateStatus(id, status, additionalData = {}) {
    const fields = ['status = $2', 'updated_at = NOW()'];
    const values = [id, status];
    let paramIndex = 3;

    if (additionalData.shopifyResponse !== undefined) {
      fields.push(`shopify_response = $${paramIndex++}`);
      values.push(JSON.stringify(additionalData.shopifyResponse));
    }

    if (additionalData.appliedAt !== undefined) {
      fields.push(`applied_at = $${paramIndex++}`);
      values.push(additionalData.appliedAt);
    }

    if (additionalData.errorMsg !== undefined) {
      fields.push(`error_msg = $${paramIndex++}`);
      values.push(additionalData.errorMsg);
    }

    if (additionalData.attemptCount !== undefined) {
      fields.push(`attempt_count = $${paramIndex++}`);
      values.push(additionalData.attemptCount);
    }

    const sql = `UPDATE fix_actions SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await query(sql, values);
    return result.rows.length > 0 ? this.mapRowToFixAction(result.rows[0]) : null;
  }

  static mapRowToFixAction(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      merchantId: row.merchant_id,
      analysisId: row.analysis_id,
      shopDomain: row.shop_domain,
      problemId: row.problem_id,
      fixType: row.fix_type,
      payload: row.payload || {},
      status: row.status,
      shopifyResponse: row.shopify_response,
      appliedAt: row.applied_at,
      errorMsg: row.error_msg,
      attemptCount: row.attempt_count,
      triggeredBy: row.triggered_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      
      // Instance method to save changes
      save: async function() {
        return await FixAction.updateStatus(this.id, this.status, {
          shopifyResponse: this.shopifyResponse,
          appliedAt: this.appliedAt,
          errorMsg: this.errorMsg,
          attemptCount: this.attemptCount,
        });
      },
    };
  }
}

// ─── Sync Job ─────────────────────────────────────────────────────────────────
export class SyncJob {
  static async create(data) {
    const {
      merchantId,
      shopDomain,
      jobType = 'full_sync',
      status = 'queued',
      bullJobId,
      startedAt,
      completedAt,
      durationMs,
      result = {},
      metadata = {},
    } = data;

    const sql = `
      INSERT INTO sync_jobs (
        merchant_id, shop_domain, job_type, status, bull_job_id,
        started_at, completed_at, duration_ms, result, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `;

    const dbResult = await query(sql, [
      merchantId,
      shopDomain,
      jobType,
      status,
      bullJobId,
      startedAt,
      completedAt,
      durationMs,
      JSON.stringify(result),
      JSON.stringify(metadata),
    ]);

    return this.mapRowToSyncJob(dbResult.rows[0]);
  }

  static async findByMerchantId(merchantId, options = {}) {
    const { limit = 50, sort = { createdAt: -1 }, status = null } = options;
    
    const sortOrder = sort.createdAt === -1 ? 'DESC' : 'ASC';
    let sql = `SELECT * FROM sync_jobs WHERE merchant_id = $1`;
    const params = [merchantId];
    
    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    sql += ` ORDER BY created_at ${sortOrder} LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await query(sql, params);
    return result.rows.map(row => this.mapRowToSyncJob(row));
  }

  static async findById(id) {
    const sql = 'SELECT * FROM sync_jobs WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? this.mapRowToSyncJob(result.rows[0]) : null;
  }

  static async updateStatus(id, status, additionalData = {}) {
    const fields = ['status = $2', 'updated_at = NOW()'];
    const values = [id, status];
    let paramIndex = 3;

    if (additionalData.startedAt !== undefined) {
      fields.push(`started_at = $${paramIndex++}`);
      values.push(additionalData.startedAt);
    }

    if (additionalData.completedAt !== undefined) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(additionalData.completedAt);
    }

    if (additionalData.durationMs !== undefined) {
      fields.push(`duration_ms = $${paramIndex++}`);
      values.push(additionalData.durationMs);
    }

    if (additionalData.result !== undefined) {
      fields.push(`result = $${paramIndex++}`);
      values.push(JSON.stringify(additionalData.result));
    }

    const sql = `UPDATE sync_jobs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await query(sql, values);
    return result.rows.length > 0 ? this.mapRowToSyncJob(result.rows[0]) : null;
  }

  static mapRowToSyncJob(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      merchantId: row.merchant_id,
      shopDomain: row.shop_domain,
      jobType: row.job_type,
      status: row.status,
      bullJobId: row.bull_job_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms,
      result: row.result || {},
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ─── Health History ─────────────────────────────────────────────────────────────
export class HealthHistory {
  static async create(data) {
    const {
      merchantId,
      shopDomain,
      healthScore,
      date = new Date(),
      metrics = {},
    } = data;

    const sql = `
      INSERT INTO health_history (
        merchant_id, shop_domain, health_score, date, metrics
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING *
    `;

    const result = await query(sql, [
      merchantId,
      shopDomain,
      healthScore,
      date,
      JSON.stringify(metrics),
    ]);

    return this.mapRowToHealthHistory(result.rows[0]);
  }

  static async findByMerchantId(merchantId, options = {}) {
    const { limit = 90, sort = { date: -1 } } = options;
    
    const sortOrder = sort.date === -1 ? 'DESC' : 'ASC';
    const sql = `
      SELECT * FROM health_history 
      WHERE merchant_id = $1 
      ORDER BY date ${sortOrder} 
      LIMIT $2
    `;
    
    const result = await query(sql, [merchantId, limit]);
    return result.rows.map(row => this.mapRowToHealthHistory(row));
  }

  static mapRowToHealthHistory(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      merchantId: row.merchant_id,
      shopDomain: row.shop_domain,
      healthScore: row.health_score,
      date: row.date,
      metrics: row.metrics || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ─── Webhook Event ─────────────────────────────────────────────────────────────
export class WebhookEvent {
  static async create(data) {
    const {
      shopDomain,
      topic,
      payload,
      shopifyWebhookId,
      processed = false,
    } = data;

    const sql = `
      INSERT INTO webhook_events (
        shop_domain, topic, payload, shopify_webhook_id, processed
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING *
    `;

    const result = await query(sql, [
      shopDomain,
      topic,
      JSON.stringify(payload),
      shopifyWebhookId,
      processed,
    ]);

    return this.mapRowToWebhookEvent(result.rows[0]);
  }

  static async findByShopifyWebhookId(shopifyWebhookId) {
    const sql = 'SELECT * FROM webhook_events WHERE shopify_webhook_id = $1';
    const result = await query(sql, [shopifyWebhookId]);
    return result.rows.length > 0 ? this.mapRowToWebhookEvent(result.rows[0]) : null;
  }

  static async markProcessed(id) {
    const sql = `
      UPDATE webhook_events 
      SET processed = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? this.mapRowToWebhookEvent(result.rows[0]) : null;
  }

  static mapRowToWebhookEvent(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      shopDomain: row.shop_domain,
      topic: row.topic,
      payload: row.payload || {},
      shopifyWebhookId: row.shopify_webhook_id,
      processed: row.processed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ─── AI Call Log ───────────────────────────────────────────────────────────────
export class AiCallLog {
  static async create(data) {
    const {
      merchantId,
      shopDomain,
      callType,
      modelUsed,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      latencyMs,
      success = true,
      errorMsg,
    } = data;

    const sql = `
      INSERT INTO ai_call_logs (
        merchant_id, shop_domain, call_type, model_used, prompt_tokens,
        completion_tokens, total_tokens, cost_usd, latency_ms, success, error_msg
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `;

    const result = await query(sql, [
      merchantId,
      shopDomain,
      callType,
      modelUsed,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      latencyMs,
      success,
      errorMsg,
    ]);

    return this.mapRowToAiCallLog(result.rows[0]);
  }

  static async findByMerchantId(merchantId, options = {}) {
    const { limit = 100, sort = { createdAt: -1 } } = options;
    
    const sortOrder = sort.createdAt === -1 ? 'DESC' : 'ASC';
    const sql = `
      SELECT * FROM ai_call_logs 
      WHERE merchant_id = $1 
      ORDER BY created_at ${sortOrder} 
      LIMIT $2
    `;
    
    const result = await query(sql, [merchantId, limit]);
    return result.rows.map(row => this.mapRowToAiCallLog(row));
  }

  static mapRowToAiCallLog(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      merchantId: row.merchant_id,
      shopDomain: row.shop_domain,
      callType: row.call_type,
      modelUsed: row.model_used,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      costUsd: row.cost_usd,
      latencyMs: row.latency_ms,
      success: row.success,
      errorMsg: row.error_msg,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ─── Backward Compatibility Exports ─────────────────────────────────────────────
export const FixActionModel = {
  create: async (data) => await FixAction.create(data),
  findOne: async (query) => {
    if (query._id) return await FixAction.findById(query._id);
    if (query.merchantId) {
      const results = await FixAction.findByMerchantId(query.merchantId, { limit: 1 });
      return results[0] || null;
    }
    return null;
  },
  find: async (query) => {
    if (query.merchantId) {
      return await FixAction.findByMerchantId(query.merchantId, query);
    }
    return [];
  },
  deleteMany: async (queryObj) => {
    if (queryObj.merchantId) {
      const sql = 'DELETE FROM fix_actions WHERE merchant_id = $1';
      const result = await query(sql, [queryObj.merchantId]);
      return { deletedCount: result.rowCount };
    }
    return { deletedCount: 0 };
  }
};

export const SyncJobModel = {
  create: async (data) => await SyncJob.create(data),
  findOne: async (query) => {
    if (query._id) return await SyncJob.findById(query._id);
    if (query.merchantId) {
      const results = await SyncJob.findByMerchantId(query.merchantId, { limit: 1 });
      return results[0] || null;
    }
    return null;
  },
  find: async (query) => {
    if (query.merchantId) {
      return await SyncJob.findByMerchantId(query.merchantId, query);
    }
    return [];
  }
};

export const HealthHistoryModel = {
  create: async (data) => await HealthHistory.create(data),
  find: async (query) => {
    if (query.merchantId) {
      return await HealthHistory.findByMerchantId(query.merchantId, query);
    }
    return [];
  },
  deleteMany: async (queryObj) => {
    if (queryObj.merchantId) {
      const sql = 'DELETE FROM health_history WHERE merchant_id = $1';
      const result = await query(sql, [queryObj.merchantId]);
      return { deletedCount: result.rowCount };
    }
    return { deletedCount: 0 };
  }
};

export const WebhookEventModel = {
  create: async (data) => await WebhookEvent.create(data),
  findOne: async (query) => {
    if (query.shopifyWebhookId) {
      return await WebhookEvent.findByShopifyWebhookId(query.shopifyWebhookId);
    }
    return null;
  },
  markProcessed: async (id) => await WebhookEvent.markProcessed(id)
};

export const AiCallLogModel = {
  create: async (data) => await AiCallLog.create(data),
  find: async (query) => {
    if (query.merchantId) {
      return await AiCallLog.findByMerchantId(query.merchantId, query);
    }
    return [];
  }
};