import { Router } from 'express';
import { authMiddleware, shopifyHmac, rateLimiter } from '../middlewares/index.js';
import { authBegin, authCallback }  from '../controllers/auth.controller.js';
import {
  getDashboard,
  triggerSync, getSyncStatus,
  triggerAnalysis, getLatestAnalysis,
  applyFix, getFixStatus, listFixes,
  handleWebhook,
  getHealthHistory,
} from '../controllers/index.js';

const router = Router();

// ─── Auth (public — no authMiddleware) ───────────────────────────────────────
router.get('/auth/shopify',   authBegin);
router.get('/auth/callback',  authCallback);

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