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

// ── Setup/debug endpoints — use /setup/ prefix to avoid /api/:shopDomain match ─
router.get('/setup/debug', async (_req, res) => {
  try {
    const { query: dbQuery } = await import('../config/database.js');
    const { decrypt } = await import('../utils/encryption.js');
    const result = await dbQuery(
      `SELECT id, shop_domain, is_active,
              (access_token_enc IS NOT NULL AND access_token_enc != '') as has_token,
              length(access_token_enc) as token_length,
              shop_info, updated_at
       FROM merchants ORDER BY updated_at DESC LIMIT 5`
    );
    const merchants = result.rows.map(m => {
      let decrypted_preview = null;
      let decrypt_error = null;
      try {
        const dec = decrypt(m.access_token_enc || '');
        decrypted_preview = dec ? dec.substring(0, 10) + '... len=' + dec.length : 'empty';
      } catch (e) {
        decrypt_error = e.message;
      }
      return { ...m, decrypted_preview, decrypt_error };
    });
    res.json({ merchants, app_url: process.env.APP_URL, encryption_key_length: (process.env.ENCRYPTION_KEY || '').length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/setup/set-token', (_req, res) => {
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:60px auto;padding:24px">
    <h2>Set Shopify Access Token</h2>
    <form method="POST" action="/setup/set-token">
      <p><b>Shop domain</b><br><input name="shop" value="ai-product-optimizer.myshopify.com" style="width:100%;padding:8px;margin-top:4px"></p>
      <p><b>Access token (shpat_...)</b><br><input name="token" placeholder="shpat_xxxx" style="width:100%;padding:8px;margin-top:4px"></p>
      <p><b>Secret</b><br><input name="secret" value="aigrowthmanager-secret-key-2024" style="width:100%;padding:8px;margin-top:4px"></p>
      <button type="submit" style="padding:12px 24px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:15px;margin-top:8px">Save Token</button>
    </form>
  </body></html>`);
});

router.post('/setup/set-token', async (req, res) => {
  try {
    const { shop, token, secret } = req.body;
    if (secret !== 'aigrowthmanager-secret-key-2024') return res.status(403).send('Forbidden');
    if (!shop || !token) return res.status(400).send('shop and token required');
    const { query: dbQuery } = await import('../config/database.js');
    const { encrypt } = await import('../utils/encryption.js');
    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    const result = await dbQuery(
      `UPDATE merchants SET access_token_enc = $1, is_active = true, updated_at = NOW()
       WHERE shop_domain = $2 RETURNING id, shop_domain, is_active`,
      [encrypt(token), shopDomain]
    );
    if (!result.rows.length) return res.status(404).send('Merchant not found: ' + shopDomain);
    res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:60px auto;padding:24px">
      <h2 style="color:green">Token saved successfully!</h2>
      <p>Store: <b>${result.rows[0].shop_domain}</b> is now active.</p>
      <p><a href="https://ai-growth-manager.vercel.app/signin" style="color:#2563eb">Go sign in and open your dashboard</a></p>
    </body></html>`);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// ── Webhooks (public — HMAC validated) ────────────────────────────────────────
router.post('/webhooks/shopify', shopifyHmac, handleWebhook);

// ── Protected merchant routes (/api/:shopDomain/...) ──────────────────────────
const m = Router({ mergeParams: true });
m.use(rateLimiter);
m.use(authMiddleware);

m.get('/dashboard',        getDashboard);
m.get('/products',         getProducts);
m.post('/products/create', createProduct);
m.post('/products/:productId/optimize', optimizeProduct);
m.post('/sync',            triggerSync);
m.get('/sync/:syncJobId',  getSyncStatus);
m.post('/analyze',         triggerAnalysis);
m.get('/analysis/latest',  getLatestAnalysis);
m.post('/fix',             applyFix);
m.get('/fixes',            listFixes);
m.get('/fix/:fixActionId', getFixStatus);
m.get('/fix/:fixActionId/preview', previewFixAction);
m.get('/health-history',   getHealthHistory);
m.post('/ai/generate-descriptions', generateDescriptions);
m.get('/email/campaigns',           getEmailCampaigns);
m.post('/email/campaigns',          createEmailCampaign);
m.post('/email/ai-generate',        generateAiEmail);
m.post('/email/ai-prompt-compose',  promptComposeEmail);
m.post('/email/campaigns/:id/send', sendEmailCampaign);
m.get('/email/analytics',           getEmailAnalytics);
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
