/**
 * Ads Controller — AI Growth Manager
 * Handles Meta Ads + Google Ads campaign management.
 */

import { query } from '../config/database.js';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/error.js';
import { openai } from '../config/ai.js';
import { buildAdsCreativePrompt } from '../services/shopify/ai/prompt.builder.js';
import { fetchMetaCampaigns, updateMetaCampaignStatus } from '../services/ads/meta.service.js';

// ─── Ad Account Management ───────────────────────────────────────────────────

/**
 * GET /api/:shopDomain/ads/accounts
 */
export async function getAdsAccounts(req, res) {
  try {
    const { merchant } = req;
    const result = await query(
      'SELECT id, platform, account_id, account_name, status, synced_at, created_at FROM ad_accounts WHERE merchant_id = $1 ORDER BY created_at DESC',
      [merchant.id]
    );
    return success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch ad accounts');
    return error(res, 'Failed to fetch ad accounts', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/connect/:platform
 */
export async function connectAdAccount(req, res) {
  try {
    const { merchant } = req;
    const { platform } = req.params;
    const { accountId, accountName, accessToken, refreshToken } = req.body;
    
    if (!['meta', 'google'].includes(platform)) throw new BadRequestError('Platform must be meta or google');
    if (!accountId || !accessToken) throw new BadRequestError('accountId and accessToken are required');

    const existing = await query(
      'SELECT id FROM ad_accounts WHERE merchant_id = $1 AND platform = $2 AND account_id = $3',
      [merchant.id, platform, accountId]
    );
    
    if (existing.rows.length > 0) {
      const result = await query(
        `UPDATE ad_accounts SET account_name=$1, access_token=$2, refresh_token=$3,
         status='active', synced_at=NOW(), updated_at=NOW()
         WHERE id=$4 RETURNING id, platform, account_id, account_name, status, created_at`,
        [accountName, accessToken, refreshToken || null, existing.rows[0].id]
      );
      return success(res, result.rows[0]);
    }

    const result = await query(
      `INSERT INTO ad_accounts (merchant_id, platform, account_id, account_name, access_token, refresh_token)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, platform, account_id, account_name, status, created_at`,
      [merchant.id, platform, accountId, accountName, accessToken, refreshToken || null]
    );
    return success(res, result.rows[0], 201);
  } catch (err) {
    return error(res, err instanceof BadRequestError ? err.message : 'Failed to connect ad account', 500);
  }
}

/**
 * DELETE /api/:shopDomain/ads/accounts/:id
 */
export async function disconnectAdAccount(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const result = await query('DELETE FROM ad_accounts WHERE id=$1 AND merchant_id=$2 RETURNING id', [id, merchant.id]);
    if (result.rows.length === 0) throw new NotFoundError('Ad account');
    return success(res, { message: 'Account disconnected' });
  } catch (err) {
    return error(res, err instanceof NotFoundError ? err.message : 'Failed to disconnect', 500);
  }
}

// ─── Campaign Management ─────────────────────────────────────────────────────

/**
 * GET /api/:shopDomain/ads/campaigns
 */
export async function getAdsCampaigns(req, res) {
  try {
    const { merchant } = req;
    
    // 1. Fetch connected accounts to sync
    const accountsResult = await query(
      'SELECT id, platform, account_id, access_token FROM ad_accounts WHERE merchant_id = $1 AND status = \'active\'',
      [merchant.id]
    );

    // 2. Fetch live campaigns from Meta/Google if connected
    for (const acc of accountsResult.rows) {
      if (acc.platform === 'meta' && acc.access_token) {
        try {
          const liveCampaigns = await fetchMetaCampaigns(acc.account_id, acc.access_token);
          for (const lc of liveCampaigns) {
            await query(
              `INSERT INTO ad_campaigns (merchant_id, ad_account_id, platform_campaign_id, name, objective, status, daily_budget)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (platform_campaign_id) DO UPDATE SET
               name = EXCLUDED.name, status = EXCLUDED.status, daily_budget = EXCLUDED.daily_budget, updated_at = NOW()`,
              [merchant.id, acc.id, lc.platform_campaign_id, lc.name, lc.objective, lc.status, lc.daily_budget]
            );
          }
        } catch (syncErr) {
          logger.warn({ syncErr: syncErr.message, accId: acc.id }, 'Failed to sync Meta campaigns - Token might be expired');
          // Mark account as expired if token error
          if (syncErr.message.includes('expired')) {
            await query('UPDATE ad_accounts SET status = \'expired\' WHERE id = $1', [acc.id]);
          }
        }
      }
    }

    const result = await query(
      `SELECT c.*, a.account_name, a.platform 
       FROM ad_campaigns c LEFT JOIN ad_accounts a ON c.ad_account_id = a.id 
       WHERE c.merchant_id = $1 ORDER BY c.created_at DESC`,
      [merchant.id]
    );
    return success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch campaigns');
    return error(res, 'Failed to fetch campaigns', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/campaigns
 */
export async function createAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { adAccountId, name, objective, dailyBudget, startDate, endDate, aiGenerated } = req.body;
    if (!name) throw new BadRequestError('Campaign name is required');

    const result = await query(
      `INSERT INTO ad_campaigns (merchant_id, ad_account_id, name, objective, daily_budget, start_date, end_date, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [merchant.id, adAccountId || null, name, objective || 'conversions', dailyBudget || null, startDate || null, endDate || null, aiGenerated || false]
    );
    return success(res, result.rows[0], 201);
  } catch (err) {
    return error(res, err instanceof BadRequestError ? err.message : 'Failed to create campaign', 500);
  }
}

/**
 * PUT /api/:shopDomain/ads/campaigns/:id
 */
export async function updateAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const { name, objective, dailyBudget, status, startDate, endDate } = req.body;

    const existing = await query('SELECT id FROM ad_campaigns WHERE id=$1 AND merchant_id=$2', [id, merchant.id]);
    if (existing.rows.length === 0) throw new NotFoundError('Campaign');

    const result = await query(
      `UPDATE ad_campaigns SET name=COALESCE($1,name), objective=COALESCE($2,objective),
       daily_budget=COALESCE($3,daily_budget), status=COALESCE($4,status),
       start_date=COALESCE($5,start_date), end_date=COALESCE($6,end_date), updated_at=NOW()
       WHERE id=$7 AND merchant_id=$8 RETURNING *`,
      [name, objective, dailyBudget, status, startDate, endDate, id, merchant.id]
    );
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, err instanceof NotFoundError ? err.message : 'Failed to update campaign', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/campaigns/:id/pause
 */
export async function pauseAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;

    const campaignResult = await query(
      'SELECT c.*, a.platform, a.access_token FROM ad_campaigns c JOIN ad_accounts a ON c.ad_account_id = a.id WHERE c.id = $1 AND c.merchant_id = $2',
      [id, merchant.id]
    );
    if (campaignResult.rows.length === 0) throw new NotFoundError('Campaign');
    const campaign = campaignResult.rows[0];

    if (campaign.platform === 'meta' && campaign.access_token && campaign.platform_campaign_id) {
      await updateMetaCampaignStatus(campaign.platform_campaign_id, 'paused', campaign.access_token);
    }

    const result = await query(
      `UPDATE ad_campaigns SET status='paused', updated_at=NOW() WHERE id=$1 AND merchant_id=$2 RETURNING *`,
      [id, merchant.id]
    );
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, err instanceof NotFoundError ? err.message : 'Failed to pause campaign', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/campaigns/:id/resume
 */
export async function resumeAdsCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;

    const campaignResult = await query(
      'SELECT c.*, a.platform, a.access_token FROM ad_campaigns c JOIN ad_accounts a ON c.ad_account_id = a.id WHERE c.id = $1 AND c.merchant_id = $2',
      [id, merchant.id]
    );
    if (campaignResult.rows.length === 0) throw new NotFoundError('Campaign');
    const campaign = campaignResult.rows[0];

    if (campaign.platform === 'meta' && campaign.access_token && campaign.platform_campaign_id) {
      await updateMetaCampaignStatus(campaign.platform_campaign_id, 'active', campaign.access_token);
    }

    const result = await query(
      `UPDATE ad_campaigns SET status='active', updated_at=NOW() WHERE id=$1 AND merchant_id=$2 RETURNING *`,
      [id, merchant.id]
    );
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, err instanceof NotFoundError ? err.message : 'Failed to resume campaign', 500);
  }
}

// ─── Performance Tracking ────────────────────────────────────────────────────

/**
 * GET /api/:shopDomain/ads/performance
 */
export async function getAdsPerformance(req, res) {
  try {
    const { merchant } = req;
    const { period } = req.query;
    const days = period === '90d' ? 90 : period === '7d' ? 7 : 30;

    const summary = await query(
      `SELECT COALESCE(SUM(impressions),0) as total_impressions,
              COALESCE(SUM(clicks),0) as total_clicks,
              COALESCE(SUM(spend),0) as total_spend,
              COALESCE(SUM(conversions),0) as total_conversions,
              COALESCE(SUM(revenue),0) as total_revenue,
              CASE WHEN SUM(clicks)>0 THEN ROUND((SUM(clicks)::DECIMAL/NULLIF(SUM(impressions),0))*100,2) ELSE 0 END as avg_ctr,
              CASE WHEN SUM(clicks)>0 THEN ROUND(SUM(spend)/NULLIF(SUM(clicks),0),2) ELSE 0 END as avg_cpc,
              CASE WHEN SUM(spend)>0 THEN ROUND(SUM(revenue)/NULLIF(SUM(spend),0),2) ELSE 0 END as avg_roas
       FROM ad_performance p JOIN ad_campaigns c ON p.campaign_id=c.id
       WHERE c.merchant_id=$1 AND p.date>=NOW()-INTERVAL '1 day'*$2`,
      [merchant.id, days]
    );

    const trend = await query(
      `SELECT p.date, SUM(p.impressions) as impressions, SUM(p.clicks) as clicks,
              SUM(p.spend) as spend, SUM(p.revenue) as revenue
       FROM ad_performance p JOIN ad_campaigns c ON p.campaign_id=c.id
       WHERE c.merchant_id=$1 AND p.date>=NOW()-INTERVAL '1 day'*$2
       GROUP BY p.date ORDER BY p.date ASC`,
      [merchant.id, days]
    );

    return success(res, { summary: summary.rows[0], trend: trend.rows });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch ads performance');
    return error(res, 'Failed to fetch performance', 500);
  }
}

/**
 * GET /api/:shopDomain/ads/performance/:campaignId
 */
export async function getCampaignPerformance(req, res) {
  try {
    const { merchant } = req;
    const { campaignId } = req.params;
    const result = await query(
      `SELECT * FROM ad_performance WHERE campaign_id=$1 
       AND campaign_id IN (SELECT id FROM ad_campaigns WHERE merchant_id=$2) ORDER BY date DESC`,
      [campaignId, merchant.id]
    );
    return success(res, { campaignId, performance: result.rows });
  } catch (err) {
    return error(res, 'Failed to fetch campaign performance', 500);
  }
}

/**
 * GET /api/:shopDomain/ads/performance/trend
 */
export async function getAdsPerformanceTrend(req, res) {
  try {
    const { merchant } = req;
    const days = parseInt(req.query.days) || 30;
    const result = await query(
      `SELECT p.date, SUM(p.spend) as spend, SUM(p.revenue) as revenue,
              SUM(p.impressions) as impressions, SUM(p.clicks) as clicks, SUM(p.conversions) as conversions
       FROM ad_performance p JOIN ad_campaigns c ON p.campaign_id=c.id
       WHERE c.merchant_id=$1 AND p.date>=NOW()-INTERVAL '1 day'*$2
       GROUP BY p.date ORDER BY p.date ASC`,
      [merchant.id, days]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch trend', 500);
  }
}

// ─── AI Suggestion Management ────────────────────────────────────────────────

/**
 * GET /api/:shopDomain/ads/ai/suggestions
 */
export async function getAdsSuggestions(req, res) {
  try {
    const { merchant } = req;
    const result = await query(
      `SELECT s.*, c.name as campaign_name FROM ad_suggestions s
       LEFT JOIN ad_campaigns c ON s.campaign_id=c.id
       WHERE s.merchant_id=$1 AND s.status='pending' ORDER BY s.created_at DESC`,
      [merchant.id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch suggestions', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/ai/suggestions/:id/apply
 */
export async function applyAdsSuggestion(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;
    const result = await query(
      `UPDATE ad_suggestions SET status='applied', updated_at=NOW() WHERE id=$1 AND merchant_id=$2 RETURNING *`,
      [id, merchant.id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Suggestion');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, err instanceof NotFoundError ? err.message : 'Failed to apply suggestion', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/ai/budget-optimize
 */
export async function aiBudgetOptimize(req, res) {
  try {
    const { merchant } = req;
    const campaigns = await query(
      `SELECT c.id, c.name, c.daily_budget, c.total_spend,
              COALESCE(AVG(p.roas),0) as avg_roas, COALESCE(AVG(p.ctr),0) as avg_ctr
       FROM ad_campaigns c LEFT JOIN ad_performance p ON p.campaign_id=c.id
       WHERE c.merchant_id=$1 AND c.status='active' GROUP BY c.id`,
      [merchant.id]
    );

    const suggestions = [];

    if (openai && campaigns.rows.length > 0) {
      // Build real campaign context for AI
      const campContext = campaigns.rows.map(c =>
        `Campaign: "${c.name}" | Budget: ₹${parseFloat(c.daily_budget||0).toFixed(0)}/day | Spend: ₹${parseFloat(c.total_spend||0).toFixed(0)} | ROAS: ${parseFloat(c.avg_roas).toFixed(2)}x | CTR: ${parseFloat(c.avg_ctr).toFixed(2)}%`
      ).join('\n');

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert digital advertising strategist. Analyze campaign data and provide actionable budget optimization suggestions. Return JSON: { suggestions: [{ campaignName, title, description, action: "increase|decrease|pause|maintain", expectedImpact: "high|medium|low", reasoning }] }' },
            { role: 'user', content: `Analyze these ad campaigns and suggest budget optimizations:\n\n${campContext}` }
          ],
          response_format: { type: 'json_object' },
        });
        const parsed = JSON.parse(completion.choices[0].message.content);

        for (const s of parsed.suggestions || []) {
          const camp = campaigns.rows.find(c => c.name === s.campaignName) || campaigns.rows[0];
          const sug = await query(
            `INSERT INTO ad_suggestions (merchant_id,campaign_id,type,title,description,expected_impact,ai_reasoning)
             VALUES ($1,$2,'budget',$3,$4,$5,$6) RETURNING *`,
            [merchant.id, camp?.id || null, s.title, s.description, s.expectedImpact || 'medium', s.reasoning]
          );
          suggestions.push(sug.rows[0]);
        }
      } catch (aiErr) {
        logger.warn({ aiErr }, 'AI budget optimization failed, using rule-based fallback');
        // Rule-based fallback
        for (const camp of campaigns.rows) {
          const roas = parseFloat(camp.avg_roas);
          let action = null;
          if (roas > 3.0) action = { title: `Scale Budget: ${camp.name}`, desc: `ROAS ${roas.toFixed(2)}x — strong performer. Increase daily budget to capture more conversions.`, impact: 'high' };
          else if (roas < 1.0 && roas > 0) action = { title: `Review Budget: ${camp.name}`, desc: `ROAS ${roas.toFixed(2)}x — spending more than earning. Consider reducing or pausing.`, impact: 'medium' };
          if (action) {
            const sug = await query(
              `INSERT INTO ad_suggestions (merchant_id,campaign_id,type,title,description,expected_impact,ai_reasoning) VALUES ($1,$2,'budget',$3,$4,$5,$6) RETURNING *`,
              [merchant.id, camp.id, action.title, action.desc, action.impact, `Rule-based: ROAS ${roas.toFixed(2)}x`]
            );
            suggestions.push(sug.rows[0]);
          }
        }
      }
    } else if (campaigns.rows.length === 0) {
      // No campaigns yet — generate general suggestions based on store context
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert digital advertising strategist for Shopify stores. Return JSON: { suggestions: [{ title, description, expectedImpact: "high|medium|low", reasoning }] }' },
            { role: 'user', content: 'Generate 3 actionable Meta/Google Ads strategy suggestions for a new Shopify store with no campaigns yet.' }
          ],
          response_format: { type: 'json_object' },
        });
        const parsed = JSON.parse(completion.choices[0].message.content);
        for (const s of parsed.suggestions || []) {
          const sug = await query(
            `INSERT INTO ad_suggestions (merchant_id,campaign_id,type,title,description,expected_impact,ai_reasoning) VALUES ($1,NULL,'strategy',$2,$3,$4,$5) RETURNING *`,
            [merchant.id, s.title, s.description, s.expectedImpact || 'medium', s.reasoning]
          );
          suggestions.push(sug.rows[0]);
        }
      }
    }

    return success(res, { suggestions, generated: suggestions.length });
  } catch (err) {
    return error(res, 'Failed to optimize budget', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/ai/audience-suggest
 */
export async function aiAudienceSuggest(req, res) {
  try {
    const { merchant } = req;
    const { productName } = req.body;
    if (!openai) throw new Error('AI not configured');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a Digital Advertising Expert. Suggest target audiences for a product. Return JSON: { suggestions: [{ title, desc, impact: "high|medium|low", reasoning }] }' },
        { role: 'user', content: `Suggest Meta/Google audiences for: ${productName}` }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const suggestions = [];
    for (const a of parsed.suggestions || []) {
      const r = await query(
        `INSERT INTO ad_suggestions (merchant_id,type,title,description,expected_impact,ai_reasoning) VALUES ($1,'audience',$2,$3,$4,$5) RETURNING *`,
        [merchant.id, a.title, a.desc, a.impact, a.reasoning]
      );
      suggestions.push(r.rows[0]);
    }
    return success(res, { suggestions });
  } catch (err) {
    logger.error({ err }, 'Failed to generate audience suggestions');
    return error(res, 'Failed to generate audience suggestions', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/ai/creative-generate
 */
export async function aiCreativeGenerate(req, res) {
  try {
    const { productName, productDescription, platform } = req.body;
    if (!openai) throw new Error('AI not configured');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a high-converting Ad Copywriter for ${platform}. Generate headlines and descriptions. Return JSON: { headlines: [], descriptions: [] }` },
        { role: 'user', content: `Product: ${productName}. Desc: ${productDescription}` }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return success(res, {
      platform,
      headlines: parsed.headlines,
      descriptions: parsed.descriptions,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'Failed to generate creative');
    return error(res, 'Failed to generate creative', 500);
  }
}

/**
 * POST /api/:shopDomain/ads/campaigns/ai-generate
 */
export async function aiGenerateCampaign(req, res) {
  try {
    const { merchant } = req;
    const { productIds, platform, objective, budget } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestError('productIds array is required');
    }
    const accountResult = await query(
      `SELECT id FROM ad_accounts WHERE merchant_id=$1 AND platform=$2 AND status='active' LIMIT 1`,
      [merchant.id, platform || 'meta']
    );
    const name = `AI Campaign - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const result = await query(
      `INSERT INTO ad_campaigns (merchant_id,ad_account_id,name,objective,daily_budget,status,ai_generated)
       VALUES ($1,$2,$3,$4,$5,'draft',true) RETURNING *`,
      [merchant.id, accountResult.rows[0]?.id || null, name, objective || 'conversions', budget || 25.00]
    );
    await query(
      `INSERT INTO ad_suggestions (merchant_id,campaign_id,type,title,description,expected_impact,ai_reasoning)
       VALUES ($1,$2,'creative',$3,$4,'high',$5)`,
      [merchant.id, result.rows[0].id, `AI Campaign: ${name}`,
       `Campaign generated for ${productIds.length} products targeting ${objective||'conversions'}.`,
       `Generated "${name}" with $${budget||25}/day targeting ${objective||'conversions'}.`]
    );
    return success(res, result.rows[0], 201);
  } catch (err) {
    return error(res, err instanceof BadRequestError ? err.message : 'Failed to generate campaign', 500);
  }
}
