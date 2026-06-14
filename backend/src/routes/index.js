import { Router } from 'express';
import { authMiddleware, shopifyHmac, rateLimiter } from '../middlewares/index.js';
import { authBegin, authCallback, getOAuthUrl }  from '../controllers/auth.controller.js';
import {
  initiateShopifyAuth,
  handleShopifyCallback,
  getAuthStatus,
  disconnectShopify,
  handleEmbeddedAppLaunch
} from '../controllers/shopify.controller.js';
import {
  getDashboard,
  triggerAnalysis,
  getProducts,
} from '../controllers/dashboard.controller.js';
import { createProduct, optimizeProduct } from '../controllers/products.controller.js';
import {
  triggerSync, getSyncStatus,
  getLatestAnalysis,
  applyFix, getFixStatus, listFixes,
  handleWebhook,
  getHealthHistory,
} from '../controllers/index.js';
import {
  getEmailCampaigns,
  createEmailCampaign,
  generateAiEmail,
  promptComposeEmail,
  sendEmailCampaign,
  getEmailAnalytics,
} from '../controllers/email.controller.js';
import { generateDescriptions, optimizePrices } from '../controllers/ai.controller.js';
import googleRoutes from './google.routes.js';
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


const router = Router();

// ─── Shopify Embedded App Launch (public) - handles app opening from Shopify Admin
router.get('/', handleEmbeddedAppLaunch);

// ─── Auth (public — no authMiddleware) ───────────────────────────────
router.get('/auth/shopify',   authBegin);
router.get('/auth/callback',  authCallback);
router.post('/auth/oauth-url', getOAuthUrl);

// ─── Shopify OAuth (public) - using official SDK routes
router.post('/auth/shopify/initiate', initiateShopifyAuth);
router.get('/auth/shopify/callback', handleShopifyCallback);
router.get('/auth/status', getAuthStatus);
router.post('/auth/disconnect', disconnectShopify);

// ─── Google OAuth (public) ───────────────────────────────────────
router.use('/google', googleRoutes);

// ─── Shopify Webhooks (public — HMAC validated) ───────────────────────────────
router.post('/webhooks/shopify', shopifyHmac, handleWebhook);

// ─── Merchant API (protected) ─────────────────────────────────────────────────
const api = Router();
api.use(rateLimiter);
api.use('/:shopDomain', authMiddleware);   // all /api/:shopDomain routes need auth

// Dashboard
api.get('/:shopDomain/dashboard',        getDashboard);
api.get('/:shopDomain/products',         getProducts);
api.post('/:shopDomain/products/create', createProduct);
api.post('/:shopDomain/products/:productId/optimize', optimizeProduct);

// Sync
api.post('/:shopDomain/sync',            triggerSync);
api.get('/:shopDomain/sync/:syncJobId',  getSyncStatus);

// Analysis
api.post('/:shopDomain/analyze',              triggerAnalysis);
api.get('/:shopDomain/analysis/latest',       getLatestAnalysis);
api.get('/:shopDomain/ads/accounts',              getAdsAccounts);
api.post('/:shopDomain/ads/connect/:platform',    connectAdAccount);
api.delete('/:shopDomain/ads/accounts/:id',       disconnectAdAccount);

api.get('/:shopDomain/ads/campaigns',             getAdsCampaigns);
api.post('/:shopDomain/ads/campaigns',            createAdsCampaign);
api.post('/:shopDomain/ads/campaigns/ai-generate', aiGenerateCampaign);
api.put('/:shopDomain/ads/campaigns/:id',         updateAdsCampaign);
api.post('/:shopDomain/ads/campaigns/:id/pause',  pauseAdsCampaign);
api.post('/:shopDomain/ads/campaigns/:id/resume', resumeAdsCampaign);

api.get('/:shopDomain/ads/performance',           getAdsPerformance);
api.get('/:shopDomain/ads/performance/:campaignId', getCampaignPerformance);
api.get('/:shopDomain/ads/performance/trend',     getAdsPerformanceTrend);

api.get('/:shopDomain/ads/ai/suggestions',        getAdsSuggestions);
api.post('/:shopDomain/ads/ai/suggestions/:id/apply', applyAdsSuggestion);
api.post('/:shopDomain/ads/ai/budget-optimize',   aiBudgetOptimize);
api.post('/:shopDomain/ads/ai/audience-suggest',  aiAudienceSuggest);
api.post('/:shopDomain/ads/ai/creative-generate', aiCreativeGenerate);

// ─── SEO Management ──────────────────────────────────────────────────────
api.post('/:shopDomain/seo/audit/run',            runSeoAudit);
api.get('/:shopDomain/seo/audit/latest',          getLatestSeoAudit);
api.get('/:shopDomain/seo/audit/history',         getSeoAuditHistory);
api.get('/:shopDomain/seo/issues',                getSeoIssues);
api.post('/:shopDomain/seo/issues/:id/fix',       fixSeoIssue);
api.post('/:shopDomain/seo/issues/fix-all',       fixAllSeoIssues);

api.get('/:shopDomain/seo/products',              getProductSeoScores);
api.post('/:shopDomain/seo/products/:id/optimize', aiOptimizeProduct);
api.post('/:shopDomain/seo/products/optimize-all', aiOptimizeAllProducts);
api.get('/:shopDomain/seo/products/:id/preview',  previewSeoChanges);

api.get('/:shopDomain/seo/meta-tags',             getMetaTags);
api.put('/:shopDomain/seo/meta-tags/bulk',        bulkUpdateMetaTags);
api.post('/:shopDomain/seo/meta-tags/ai-generate', aiGenerateMetaTags);

api.get('/:shopDomain/seo/keywords',              getSeoKeywords);
api.post('/:shopDomain/seo/keywords',             addSeoKeyword);
api.delete('/:shopDomain/seo/keywords/:id',       deleteSeoKeyword);
api.get('/:shopDomain/seo/keywords/rankings',     getKeywordRankings);
api.post('/:shopDomain/seo/keywords/suggest',     aiSuggestKeywords);

api.get('/:shopDomain/seo/schema',                getSchemaMarkup);
api.post('/:shopDomain/seo/schema/generate',      generateSchemaMarkup);
api.post('/:shopDomain/seo/schema/apply',         applySchemaMarkup);

api.get('/:shopDomain/seo/pagespeed',             getPageSpeedScores);
api.get('/:shopDomain/seo/pagespeed/history',     getPageSpeedHistory);

api.post('/:shopDomain/seo/competitors',          addCompetitor);
api.get('/:shopDomain/seo/competitors/analyze',   analyzeCompetitors);

// Fixes
api.post('/:shopDomain/fix',                 applyFix);
api.get('/:shopDomain/fixes',               listFixes);
api.get('/:shopDomain/fix/:fixActionId',     getFixStatus);

// Health Score History
api.get('/:shopDomain/health-history',       getHealthHistory);

// AI Description Generator (Phase 5.1)
api.post('/:shopDomain/ai/generate-descriptions', generateDescriptions);

// AI Price Optimizer (Phase 5.3)
api.post('/:shopDomain/ai/optimize-prices', optimizePrices);

// Email Campaigns
api.get('/:shopDomain/email/campaigns',              getEmailCampaigns);
api.post('/:shopDomain/email/campaigns',             createEmailCampaign);
api.post('/:shopDomain/email/ai-generate',           generateAiEmail);
api.post('/:shopDomain/email/ai-prompt-compose',     promptComposeEmail);
api.post('/:shopDomain/email/campaigns/:id/send',    sendEmailCampaign);
api.get('/:shopDomain/email/analytics',              getEmailAnalytics);

router.use('/api', api);

export default router;