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
router.get('/auth/shopify',    authBegin);
router.get('/auth/callback',   authCallback);
router.post('/auth/oauth-url', getOAuthUrl);
router.use('/auth/google',     googleRoutes);

// ── Shopify OAuth (public) ─────────────────────────────────────────────────────
router.post('/api/auth/shopify/initiate', rateLimiter, initiateShopifyAuth);
router.get('/api/auth/shopify/callback',  rateLimiter, handleShopifyCallback);
router.post('/api/auth/activate-store',   rateLimiter, activateStore);
router.get('/api/auth/status',            rateLimiter, getAuthStatus);
router.post('/api/auth/disconnect',       rateLimiter, disconnectShopify);

// ── Debug / one-time fix endpoints (public, no auth) ──────────────────────────
router.get('/api/auth/debug-merchant', async (req, res) => {
  try {
    const { query: dbQuery } = await import('../config/database.js');
    const { decrypt } = await import('../utils/encryption.js');
    const result = await dbQuery(
      `SELECT id, shop_domain, is_active,
              (access_token_enc IS NOT NULL AND access_token_enc != '') as has_token,
              length(access_token_enc) as token_length,
              shop_info, created_at, updated_at
       FROM merchants ORDER BY updated_at DESC LIMIT 5`
    );
    const merchants = result.rows.map(m => {
      let decrypted_preview = null;
      let decrypt_error = null;
      try {
        const dec = decrypt(m.access_token_enc || '');
        decrypted_preview = dec ? `${dec.substring(0, 8)}... (length ${dec.length})` : 'empty';
      } catch (e) {
        decrypt_error = e.message;
      }
      return { ...m, decrypted_preview, decrypt_error };
    });
    res.json({
      merchants,
      admin_token_set: !!process.env.ADMIN_API_ACCESS_TOKEN,
      app_url: process.env.APP_URL,
      encryption_key_length: (process.env.ENCRYPTION_KEY || '').length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store a Shopify access token directly via form or API
router.get('/api/auth/set-shop-token', (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;max-width:500px;margin:50px auto;padding:20px">
    <h2>Set Shopify Token</h2>
    <form method="POST" action="/api/auth/set-shop-token">
      <p><label>Shop domain:<br><input name="shop" value="ai-product-optimizer.myshopify.com" style="width:100%;padding:8px"></label></p>
      <p><label>Shopify access token (shpat_...):<br><input name="token" placeholder="shpat_xxxxx" style="width:100%;padding:8px"></label></p>
      <p><label>Secret:<br><input name="secret" value="aigrowthmanager-secret-key-2024" style="width:100%;padding:8px"></label></p>
      <button type="submit" style="padding:10px 20px;background:#2563eb;color:white;border:none;cursor:pointer">Save Token</button>
    </form>
    <hr>
    <h3>How to get your Shopify token:</h3>
    <ol>
      <li>Go to <a href="https://ai-product-optimizer.myshopify.com/admin/settings/apps/development" target="_blank">Shopify Admin → Settings → Apps → Develop apps</a></li>
      <li>Click your app (AI Growth Manager)</li>
      <li>Click <strong>API credentials</strong> tab</li>
      <li>Click <strong>Install app</strong> or <strong>Uninstall and reinstall</strong></li>
      <li>Copy the <strong>Admin API access token</strong> (shown once)</li>
      <li>Paste it above and click Save</li>
    </ol>
    </body></html>
  `);
});

router.post('/api/auth/set-shop-token', async (req, res) => {
  try {
    const { shop, token, secret } = req.body;
    if (secret !== 'aigrowthmanager-secret-key-2024') return res.status(403).json({ error: 'Forbidden' });
    if (!shop || !token) return res.status(400).json({ error: 'shop and token required' });
    const { query: dbQuery } = await import('../config/database.js');
    const { encrypt } = await import('../utils/encryption.js');
    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    const result = await dbQuery(
      `UPDATE merchants SET access_token_enc = $1, is_active = true, updated_at = NOW()
       WHERE shop_domain = $2 RETURNING id, shop_domain, is_active`,
      [encrypt(token), shopDomain]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Merchant not found: ' + shopDomain });
    res.json({ status: 'ok', merchant: result.rows[0] });
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
m.post('/sync',           triggerSync);
m.get('/sync/:syncJobId', getSyncStatus);

// Analysis
m.post('/analyze',        triggerAnalysis);
m.get('/analysis/latest', getLatestAnalysis);

// Fixes
m.post('/fix',                     applyFix);
m.get('/fixes',                    listFixes);
m.get('/fix/:fixActionId',         getFixStatus);
m.get('/fix/:fixActionId/preview', previewFixAction);

// Health history
m.get('/health-history', getHealthHistory);

// AI features
m.post('/ai/generate-descriptions', generateDescriptions);

// Email campaigns
m.get('/email/campaigns',           getEmailCampaigns);
m.post('/email/campaigns',          createEmailCampaign);
m.post('/email/ai-generate',        generateAiEmail);
m.post('/email/ai-prompt-compose',  promptComposeEmail);
m.post('/email/campaigns/:id/send', sendEmailCampaign);
m.get('/email/analytics',           getEmailAnalytics);

// Ads
m.get('/ads/accounts',                  getAdsAccounts);
m.post('/ads/connect/:platform',        connectAdAccount);
m.delete('/ads/accounts/:id',           disconnectAdAccount);
m.get('/ads/campaigns',                 getAdsCampaigns);
m.post('/ads/campaigns',                createAdsCampaign);
m.post('/ads/campaigns/ai-generate',    aiGenerateCampaign);
m.put('/ads/campaigns/:id',             updateAdsCampaign);
m.post('/ads/campaigns/:id/pause',      pauseAdsCampaign);
m.post('/ads/campaigns/:id/resume',     resumeAdsCampaign);
m.get('/ads/performance',               getAdsPerformance);
m.get('/ads/performance/trend',         getAdsPerformanceTrend);
m.get('/ads/performance/:campaignId',   getCampaignPerformance);
m.get('/ads/ai/suggestions',            getAdsSuggestions);
m.post('/ads/ai/suggestions/:id/apply', applyAdsSuggestion);
m.post('/ads/ai/budget-optimize',       aiBudgetOptimize);
m.post('/ads/ai/audience-suggest',      aiAudienceSuggest);
m.post('/ads/ai/creative-generate',     aiCreativeGenerate);

// SEO
m.post('/seo/audit/run',             runSeoAudit);
m.get('/seo/audit/latest',           getLatestSeoAudit);
m.get('/seo/audit/history',          getSeoAuditHistory);
m.get('/seo/issues',                 getSeoIssues);
m.post('/seo/issues/:id/fix',        fixSeoIssue);
m.post('/seo/issues/fix-all',        fixAllSeoIssues);
m.get('/seo/products',               getProductSeoScores);
m.post('/seo/products/:id/optimize', aiOptimizeProduct);
m.post('/seo/products/optimize-all', aiOptimizeAllProducts);
m.get('/seo/products/:id/preview',   previewSeoChanges);
m.get('/seo/meta-tags',              getMetaTags);
m.put('/seo/meta-tags/bulk',         bulkUpdateMetaTags);
m.post('/seo/meta-tags/ai-generate', aiGenerateMetaTags);
m.get('/seo/keywords',               getSeoKeywords);
m.post('/seo/keywords',              addSeoKeyword);
m.delete('/seo/keywords/:id',        deleteSeoKeyword);
m.get('/seo/keywords/rankings',      getKeywordRankings);
m.post('/seo/keywords/suggest',      aiSuggestKeywords);
m.get('/seo/schema',                 getSchemaMarkup);
m.post('/seo/schema/generate',       generateSchemaMarkup);
m.post('/seo/schema/apply',          applySchemaMarkup);
m.get('/seo/pagespeed',              getPageSpeedScores);
m.get('/seo/pagespeed/history',      getPageSpeedHistory);
m.post('/seo/competitors',           addCompetitor);
m.get('/seo/competitors/analyze',    analyzeCompetitors);

router.use('/api/:shopDomain', m);

export default router;
