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
} from '../controllers/dashboard.controller.js';
import {
  triggerSync, getSyncStatus,
  getLatestAnalysis,
  applyFix, getFixStatus, listFixes,
  handleWebhook,
  getHealthHistory,
} from '../controllers/index.js';
import googleRoutes from './google.routes.js';
import dashboardRoutes from './dashboard.routes.js';

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

// Sync
api.post('/:shopDomain/sync',            triggerSync);
api.get('/:shopDomain/sync/:syncJobId',  getSyncStatus);

// Analysis
api.post('/:shopDomain/analyze',              triggerAnalysis);
api.get('/:shopDomain/analysis/latest',       getLatestAnalysis);

// Fixes
api.post('/:shopDomain/fix',                 applyFix);
api.get('/:shopDomain/fix/:fixActionId',     getFixStatus);
api.get('/:shopDomain/fixes',               listFixes);

// Health Score History
api.get('/:shopDomain/health-history',       getHealthHistory);

router.use('/api', api);

export default router;