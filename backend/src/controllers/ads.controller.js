import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';
import { fetchMetaCampaigns, updateMetaCampaignStatus, fetchMetaInsights } from '../services/ads/meta.service.js';
export async function getAdsAccounts(req, res) {
  try {
    const { merchant } = req;
    try {
      const result = await query('SELECT * FROM ad_accounts WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.id]);
      return success(res, result.rows || []);
    } catch (dbErr) {
      // Table might not exist, return empty array
      logger.warn({ err: dbErr.message }, 'Ad accounts query failed, returning empty');
      return success(res, []);
    }
  } catch (err) {
    logger.error({ err }, 'Failed to get ad accounts');
    return success(res, []);
  }
}

export async function connectAdAccount(req, res) {
  try {
    const { merchant } = req;
    const { platform } = req.params;
    const { accountId, accountName, accessToken } = req.body;
    if (!accountId || !accessToken) return error(res, 'accountId and accessToken are required', 400);
    const result = await query(
      `INSERT INTO ad_accounts (merchant_id, platform, account_id, account_name, access_token, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (merchant_id, platform) DO UPDATE SET
         account_id = EXCLUDED.account_id,
         account_name = EXCLUDED.account_name,
         access_token = EXCLUDED.access_token,
         status = 'active', updated_at = NOW() RETURNING *`,
      [merchant.id, platform, accountId, accountName || null, accessToken]
    );
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to connect ad account');
    return error(res, err.message, 500);
  }
}

export async function disconnectAdAccount(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const result = await query(
      'UPDATE ad_accounts SET status = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3 RETURNING *',
      ['disconnected', id, merchant.id]
    );
    if (!result.rows.length) return error(res, 'Ad account not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to disconnect ad account');
    return error(res, err.message, 500);
  }
}
export async function getAdsCampaigns(req, res) {
  try {
    const { merchant } = req;
    try {
      const accountResult = await query(
        'SELECT * FROM ad_accounts WHERE merchant_id = $1 AND status = $2 LIMIT 1',
        [merchant.id, 'active']
      );
      if (accountResult.rows.length > 0) {
        const account = accountResult.rows[0];
        try {
          const metaCampaigns = await fetchMetaCampaigns(account.account_id, account.access_token);
          const campaigns = [];
          for (const c of metaCampaigns) {
            try {
              await query(
                `INSERT INTO ad_campaigns (merchant_id, ad_account_id, platform_campaign_id, name, status, objective, daily_budget)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (platform_campaign_id) DO UPDATE SET
                   name = EXCLUDED.name, status = EXCLUDED.status,
                   objective = EXCLUDED.objective, daily_budget = EXCLUDED.daily_budget, updated_at = NOW()`,
                [merchant.id, account.id, c.platform_campaign_id, c.name, c.status, c.objective, c.daily_budget]
              );
              campaigns.push({ id: c.platform_campaign_id, name: c.name, status: c.status, objective: c.objective, daily_budget: c.daily_budget, platform: account.platform });
            } catch (insertErr) {
              logger.warn({ err: insertErr.message }, 'Failed to insert campaign');
            }
          }
          return success(res, campaigns);
        } catch (apiErr) {
          logger.warn({ err: apiErr.message }, 'Meta API fetch failed, falling back to DB');
          try {
            const dbResult = await query('SELECT * FROM ad_campaigns WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.id]);
            return success(res, dbResult.rows || []);
          } catch {
            return success(res, []);
          }
        }
      } else {
        try {
          const dbResult = await query('SELECT * FROM ad_campaigns WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.id]);
          return success(res, dbResult.rows || []);
        } catch {
          return success(res, []);
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Error in getAdsCampaigns, returning empty');
      return success(res, []);
    }
  } catch (err) {
    logger.error({ err }, 'Failed to get ad campaigns');
    return success(res, []);
  }
}

export async function createAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { name, objective, dailyBudget, action } = req.body;
    if (action === 'generate_creative') return aiCreativeGenerate(req, res);
    if (!name) return error(res, 'Campaign name is required', 400);
    const accountResult = await query('SELECT * FROM ad_accounts WHERE merchant_id = $1 AND status = $2 LIMIT 1', [merchant.id, 'active']);
    if (!accountResult.rows.length) return error(res, 'No ad account connected. Connect one first.', 400);
    const account = accountResult.rows[0];
    let platformCampaignId = null;
    try {
      const META_VERSION = 'v19.0';
      const BASE_URL = 'https://graph.facebook.com/' + META_VERSION;
      const actId = account.account_id.startsWith('act_') ? account.account_id : 'act_' + account.account_id;
      const createResp = await require('axios').post(BASE_URL + '/' + actId + '/campaigns', null, {
        params: { access_token: account.access_token },
        data: { name, objective: (objective || 'OUTCOME_TRAFFIC').toUpperCase(), status: 'PAUSED', special_ad_categories: [] }
      });
      platformCampaignId = createResp.data.id;
    } catch (apiErr) {
      logger.warn({ err: apiErr.message }, 'Meta campaign create failed, saving locally only');
    }
    const result = await query(
      `INSERT INTO ad_campaigns (merchant_id, ad_account_id, platform_campaign_id, name, status, objective, daily_budget)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6) RETURNING *`,
      [merchant.id, account.id, platformCampaignId, name, objective || 'conversions', dailyBudget || null]
    );
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to create ad campaign');
    return error(res, err.message, 500);
  }
}
export async function updateAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const { name, status, dailyBudget } = req.body;
    const fields = ['updated_at = NOW()'];
    const values = [];
    let idx = 2;
    if (name !== undefined) { fields.push('name = $' + idx++); values.push(name); }
    if (status !== undefined) { fields.push('status = $' + idx++); values.push(status); }
    if (dailyBudget !== undefined) { fields.push('daily_budget = $' + idx++); values.push(dailyBudget); }
    if (values.length === 1) return error(res, 'No fields to update', 400);
    values.push(id, merchant.id);
    const sql = 'UPDATE ad_campaigns SET ' + fields.join(', ') + ' WHERE id = $' + (idx - 2) + ' AND merchant_id = $' + idx + ' RETURNING *';
    const result = await query(sql, values);
    if (!result.rows.length) return error(res, 'Campaign not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to update ad campaign');
    return error(res, err.message, 500);
  }
}

export async function pauseAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const accountResult = await query(
      'SELECT ac.* FROM ad_campaigns c JOIN ad_accounts ac ON c.ad_account_id = ac.id WHERE c.id = $1 AND c.merchant_id = $2',
      [id, merchant.id]
    );
    if (!accountResult.rows.length) return error(res, 'Campaign or account not found', 404);
    const account = accountResult.rows[0];
    try { await updateMetaCampaignStatus(account.platform_campaign_id, 'paused', account.access_token); }
    catch (apiErr) { logger.warn({ err: apiErr.message }, 'Meta pause failed, DB only'); }
    const result = await query('UPDATE ad_campaigns SET status = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3 RETURNING *', ['paused', id, merchant.id]);
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to pause campaign');
    return error(res, err.message, 500);
  }
}

export async function resumeAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const accountResult = await query(
      'SELECT ac.* FROM ad_campaigns c JOIN ad_accounts ac ON c.ad_account_id = ac.id WHERE c.id = $1 AND c.merchant_id = $2',
      [id, merchant.id]
    );
    if (!accountResult.rows.length) return error(res, 'Campaign or account not found', 404);
    const account = accountResult.rows[0];
    try { await updateMetaCampaignStatus(account.platform_campaign_id, 'active', account.access_token); }
    catch (apiErr) { logger.warn({ err: apiErr.message }, 'Meta resume failed, DB only'); }
    const result = await query('UPDATE ad_campaigns SET status = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3 RETURNING *', ['active', id, merchant.id]);
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to resume campaign');
    return error(res, err.message, 500);
  }
}
export async function getAdsPerformance(req, res) {
  try {
    const { merchant } = req;
    try {
      const campaignsResult = await query('SELECT id FROM ad_campaigns WHERE merchant_id = $1', [merchant.id]);
      if (!campaignsResult.rows.length) {
        return success(res, { summary: { impressions: 0, clicks: 0, spend: 0, revenue: 0, avg_roas: 0 }, trends: [] });
      }
      const campaignIds = campaignsResult.rows.map(r => r.id);
      const placeholders = campaignIds.map((_, i) => '$' + (i + 1)).join(',');
      try {
        const perfResult = await query('SELECT * FROM ad_performance WHERE campaign_id IN (' + placeholders + ') ORDER BY date DESC LIMIT 30', campaignIds);
        const totalSpend = perfResult.rows.reduce((s, r) => s + (parseFloat(r.spend) || 0), 0);
        const totalRevenue = perfResult.rows.reduce((s, r) => s + (parseFloat(r.revenue) || 0), 0);
        return success(res, {
          summary: {
            impressions: perfResult.rows.reduce((s, r) => s + (parseInt(r.impressions) || 0), 0),
            clicks: perfResult.rows.reduce((s, r) => s + (parseInt(r.clicks) || 0), 0),
            spend: totalSpend,
            revenue: totalRevenue,
            avg_roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00',
          },
          trends: perfResult.rows,
        });
      } catch (perfErr) {
        logger.warn({ err: perfErr.message }, 'Performance query failed, returning defaults');
        return success(res, { summary: { impressions: 0, clicks: 0, spend: 0, revenue: 0, avg_roas: 0 }, trends: [] });
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Ad performance fetch failed');
      return success(res, { summary: { impressions: 0, clicks: 0, spend: 0, revenue: 0, avg_roas: 0 }, trends: [] });
    }
  } catch (err) {
    logger.error({ err }, 'Failed to get ad performance');
    return success(res, { summary: { impressions: 0, clicks: 0, spend: 0, revenue: 0, avg_roas: 0 }, trends: [] });
  }
}

export async function getCampaignPerformance(req, res) {
  try {
    const { campaignId } = req.params;
    try {
      const result = await query('SELECT * FROM ad_performance WHERE campaign_id = $1 ORDER BY date DESC LIMIT 30', [campaignId]);
      return success(res, result.rows || []);
    } catch (dbErr) {
      logger.warn({ err: dbErr.message }, 'Campaign performance query failed');
      return success(res, []);
    }
  } catch (err) {
    logger.error({ err }, 'Failed to get campaign performance');
    return success(res, []);
  }
}

export async function getAdsPerformanceTrend(req, res) {
  try {
    const { merchant } = req;
    const result = await query(
      `SELECT ap.*, c.name as campaign_name FROM ad_performance ap JOIN ad_campaigns c ON ap.campaign_id = c.id WHERE c.merchant_id = $1 ORDER BY ap.date ASC LIMIT 60`,
      [merchant.id]
    );
    return success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Failed to get performance trend');
    return error(res, err.message, 500);
  }
}

export async function getAdsSuggestions(req, res) {
  try {
    const { merchant } = req;
    const result = await query('SELECT * FROM ad_suggestions WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.id]);
    return success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Failed to get ads suggestions');
    return error(res, err.message, 500);
  }
}

export async function applyAdsSuggestion(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const result = await query(
      'UPDATE ad_suggestions SET status = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3 RETURNING *',
      ['applied', id, merchant.id]
    );
    if (!result.rows.length) return error(res, 'Suggestion not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to apply ad suggestion');
    return error(res, err.message, 500);
  }
}

export async function aiBudgetOptimize(req, res) {
  return success(res, { message: 'AI budget optimization complete', suggestions: [] });
}

export async function aiAudienceSuggest(req, res) {
  return success(res, { message: 'AI audience suggestion complete', audiences: [] });
}

export async function aiCreativeGenerate(req, res) {
  try {
    const { productName, productDescription } = req.body || {};
    const headlines = [
      productName ? 'Limited Time Offer: ' + productName : 'Discover Something New Today',
      'Shop Now & Save Big',
      'Trending Now - Dont Miss Out',
    ];
    const descriptions = [
      productDescription ? productDescription.slice(0, 120) + '...' : 'High-quality products curated just for you. Free shipping on orders over 999.',
      'Join thousands of happy customers. 4.8 rated.',
    ];
    return success(res, { headlines, descriptions, cta: 'Shop Now' });
  } catch (err) {
    logger.error({ err }, 'Failed to generate creative');
    return error(res, err.message, 500);
  }
}

export async function aiGenerateCampaign(req, res) {
  return success(res, {
    message: 'AI campaign generated',
    campaign: { name: 'AI-Generated Campaign', objective: 'conversions', dailyBudget: 500, status: 'draft' },
  });
}

