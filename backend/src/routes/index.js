import { Router } from 'express';
import { authMiddleware, shopifyHmac, rateLimiter } from '../middlewares/index.js';
import { authBegin, authCallback, getOAuthUrl } from '../controllers/auth.controller.js';
import {
  initiateShopifyAuth, handleShopifyCallback, getAuthStatus,
  disconnectShopify, handleEmbeddedAppLaunch, activateStore,
} from '../controllers/shopify.controller.js';
import {
  getDashboard, triggerAnalysis, getProducts, getLatestAnalysis,
} from '../controllers/dashboard.controller.js';
import {
  triggerSync, getSyncStatus,
  applyFix, getFixStatus, listFixes, previewFixAction,
  handleWebhook, getHealthHistory,
} from '../controllers/index.js';
import {
  getEmailCampaigns, createEmailCampaign,
  generateAiEmail, promptComposeEmail,
  sendEmailCampaign, getEmailAnalytics,
} from '../controllers/email.controller.js';
import { generateDescriptions } from '../controllers/ai.controller.js';
import {
  getAdsAccounts, connectAdAccount, disconnectAdAccount,
  getAdsCampaigns, createAdsCampaign, updateAdsCampaign,
  pauseAdsCampaign, resumeAdsCampaign,
  getAdsPerformance, getCampaignPerformance, getAdsPerformanceTrend,
  getAdsSuggestions, applyAdsSuggestion,
  aiBudgetOptimize, aiAudienceSuggest, aiCreativeGenerate, aiGenerateCampaign,
} from '../controllers/ads.controller.js';
import {
  runSeoAudit, getLatestSeoAudit, getSeoAuditHistory,
  getSeoIssues, fixSeoIssue, fixAllSeoIssues,
  getProductSeoScores, aiOptimizeProduct, aiOptimizeAllProducts, previewSeoChanges,
  getSeoKeywords, addSeoKeyword, deleteSeoKeyword, getKeywordRankings, aiSuggestKeywords,
  getSchemaMarkup, generateSchemaMarkup, applySchemaMarkup,
  getPageSpeedScores, getPageSpeedHistory,
  addCompetitor, analyzeCompetitors,
  getMetaTags, bulkUpdateMetaTags, aiGenerateMetaTags,
} from '../controllers/seo.controller.js';
import { createProduct, optimizeProduct } from '../controllers/products.controller.js';
import googleRoutes from './google.routes.js';

const router = Router();

// ── Shopify embedded app launch ────────────────────────────────────────────────
router.get('/', handleEmbeddedAppLaunch);

// ── Auth (public) ──────────────────────────────────────────────────────────────
router.get('/auth/shopify',          authBegin);
router.get('/auth/callback',         authCallback);
router.post('/auth/oauth-url',       getOAuthUrl);
router.use('/auth/google',            googleRoutes);

// ── Shopify OAuth (public) ─────────────────────────────────────────────────────
router.post('/api/auth/shopify/initiate', rateLimiter, initiateShopifyAuth);
router.get('/api/auth/shopify/callback',  rateLimiter, handleShopifyCallback);
router.post('/api/auth/activate-store',   rateLimiter, activateStore);
router.get('/api/auth/status',            rateLimiter, getAuthStatus);
router.post('/api/auth/disconnect',       rateLimiter, disconnectShopify);

// ── One-time DB fix: merge Google placeholder merchant with real Shopify merchant ─
router.get('/api/auth/fix-inactive-merchant', async (req, res) => {
  try {
    const { query: dbQuery } = await import('../config/database.js');
    const { encrypt } = await import('../utils/encryption.js');
    
    const REAL_SHOP = 'ai-product-optimizer.myshopify.com';
    const GOOGLE_MERCHANT_ID = '7fe4aa1e-0d4c-46ef-8470-5235473dd6c5';

    // Get the real Shopify merchant row (the one with the actual access token)
    const realRow = await dbQuery(
      `SELECT id, shop_domain, access_token_enc, scope, shop_info FROM merchants WHERE shop_domain = $1`,
      [REAL_SHOP]
    );

    if (realRow.rows.length > 0) {
      // Real merchant exists — update Google placeholder row to match
      const real = realRow.rows[0];
      await dbQuery(
        `UPDATE merchants
         SET shop_domain      = $1,
             access_token_enc = $2,
             scope            = $3,
             shop_info        = $4,
             is_active        = true,
             updated_at       = NOW()
         WHERE id = $5`,
        [REAL_SHOP, real.access_token_enc, real.scope, real.shop_info, GOOGLE_MERCHANT_ID]
      );
      // Delete the now-duplicate real row so there's no unique constraint conflict
      await dbQuery(`DELETE FROM merchants WHERE id = $1`, [real.id]);
      return res.json({ status: 'merged', shopDomain: REAL_SHOP, keptId: GOOGLE_MERCHANT_ID, deletedId: real.id });
    }

    // No real row — check if ADMIN_API_ACCESS_TOKEN env var is available as fallback
    const adminToken = process.env.ADMIN_API_ACCESS_TOKEN;
    if (adminToken) {
      const encryptedToken = encrypt(adminToken);
      await dbQuery(
        `UPDATE merchants
         SET shop_domain      = $1,
             access_token_enc = $2,
             is_active        = true,
             updated_at       = NOW()
         WHERE id = $3`,
        [REAL_SHOP, encryptedToken, GOOGLE_MERCHANT_ID]
      );
      return res.json({ status: 'activated_with_admin_token', shopDomain: REAL_SHOP, merchantId: GOOGLE_MERCHANT_ID });
    }

    // No token available at all — just update domain and flag
    const result = await dbQuery(
      `UPDATE merchants
       SET shop_domain = $1,
           is_active   = true,
           updated_at  = NOW()
       WHERE id = $2
       RETURNING id, shop_domain, is_active, (access_token_enc != '' AND access_token_enc IS NOT NULL) as has_token`,
      [REAL_SHOP, GOOGLE_MERCHANT_ID]
    );
    return res.json({ status: 'domain_updated_no_token', merchants: result.rows, note: 'No Shopify access token available. Set ADMIN_API_ACCESS_TOKEN in Render env vars or complete Shopify OAuth.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Webhooks (public — HMAC validated) ────────────────────────────────────────
router.post('/webhooks/shopify', shopifyHmac, handleWebhook);

// ── Protected merchant routes (/api/:shopDomain/...) ──────────────────────────
const m = Router({ mergeParams: true });
m.use(rateLimiter);
m.use(authMiddleware);

// Dashboard
m.get('/dashboard',        getDashboard);
m.get('/products',         getProducts);
m.post('/products/create', createProduct);
m.post('/products/:productId/optimize', optimizeProduct);

// Sync
m.post('/sync',            triggerSync);
m.get('/sync/:syncJobId',  getSyncStatus);

// Analysis
m.post('/analyze',              triggerAnalysis);
m.get('/analysis/latest',       getLatestAnalysis);

// Fixes
m.post('/fix',                          applyFix);
m.get('/fixes',                         listFixes);
m.get('/fix/:fixActionId',              getFixStatus);
m.get('/fix/:fixActionId/preview',      previewFixAction);

// Health history
m.get('/health-history',        getHealthHistory);

// AI features
m.post('/ai/generate-descriptions', generateDescriptions);

// Email campaigns
m.get('/email/campaigns',              getEmailCampaigns);
m.post('/email/campaigns',             createEmailCampaign);
m.post('/email/ai-generate',           generateAiEmail);
m.post('/email/ai-prompt-compose',     promptComposeEmail);
m.post('/email/campaigns/:id/send',    sendEmailCampaign);
m.get('/email/analytics',              getEmailAnalytics);

// Ads
m.get('/ads/accounts',                 getAdsAccounts);
m.post('/ads/connect/:platform',       connectAdAccount);
m.delete('/ads/accounts/:id',          disconnectAdAccount);
m.get('/ads/campaigns',                getAdsCampaigns);
m.post('/ads/campaigns',               createAdsCampaign);
m.post('/ads/campaigns/ai-generate',   aiGenerateCampaign);
m.put('/ads/campaigns/:id',            updateAdsCampaign);
m.post('/ads/campaigns/:id/pause',     pauseAdsCampaign);
m.post('/ads/campaigns/:id/resume',    resumeAdsCampaign);
m.get('/ads/performance',              getAdsPerformance);
m.get('/ads/performance/trend',        getAdsPerformanceTrend);
m.get('/ads/performance/:campaignId',  getCampaignPerformance);
m.get('/ads/ai/suggestions',           getAdsSuggestions);
m.post('/ads/ai/suggestions/:id/apply', applyAdsSuggestion);
m.post('/ads/ai/budget-optimize',      aiBudgetOptimize);
m.post('/ads/ai/audience-suggest',     aiAudienceSuggest);
m.post('/ads/ai/creative-generate',    aiCreativeGenerate);

// SEO
m.post('/seo/audit/run',               runSeoAudit);
m.get('/seo/audit/latest',             getLatestSeoAudit);
m.get('/seo/audit/history',            getSeoAuditHistory);
m.get('/seo/issues',                   getSeoIssues);
m.post('/seo/issues/:id/fix',          fixSeoIssue);
m.post('/seo/issues/fix-all',          fixAllSeoIssues);
m.get('/seo/products',                 getProductSeoScores);
m.post('/seo/products/:id/optimize',   aiOptimizeProduct);
m.post('/seo/products/optimize-all',   aiOptimizeAllProducts);
m.get('/seo/products/:id/preview',     previewSeoChanges);
m.get('/seo/meta-tags',                getMetaTags);
m.put('/seo/meta-tags/bulk',           bulkUpdateMetaTags);
m.post('/seo/meta-tags/ai-generate',   aiGenerateMetaTags);
m.get('/seo/keywords',                 getSeoKeywords);
m.post('/seo/keywords',                addSeoKeyword);
m.delete('/seo/keywords/:id',          deleteSeoKeyword);
m.get('/seo/keywords/rankings',        getKeywordRankings);
m.post('/seo/keywords/suggest',        aiSuggestKeywords);
m.get('/seo/schema',                   getSchemaMarkup);
m.post('/seo/schema/generate',         generateSchemaMarkup);
m.post('/seo/schema/apply',            applySchemaMarkup);
m.get('/seo/pagespeed',                getPageSpeedScores);
m.get('/seo/pagespeed/history',        getPageSpeedHistory);
m.post('/seo/competitors',             addCompetitor);
m.get('/seo/competitors/analyze',      analyzeCompetitors);

router.use('/api/:shopDomain', m);

export default router;
