import { StoreSnapshot, AiAnalysis, FixAction, SyncJob, HealthHistory, WebhookEvent } from '../models/index.js';
import { queueSync }     from '../queues/sync.queue.js';
import { queueAnalysis, queueFix, queueWebhookEvent } from '../queues/index.js';
import { success, error } from '../utils/response.js';
import { logger }         from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/error.js';

// ─── Dashboard Controller ─────────────────────────────────────────────────────

/**
 * GET /api/:shopDomain/dashboard
 * Returns the latest snapshot + analysis for the merchant dashboard.
 */
export async function getDashboard(req, res) {
  try {
    const { merchant } = req;

    const [snapshot, analysis, scoreHistory] = await Promise.all([
      StoreSnapshot.findOne({ merchantId: merchant._id }).sort({ syncedAt: -1 }),
      AiAnalysis.findOne({ merchantId: merchant._id, status: 'completed' }).sort({ createdAt: -1 }),
      HealthHistory.find({ merchantId: merchant._id }).sort({ date: -1 }).limit(30),
    ]);

    return success(res, {
      merchant: {
        shopDomain: merchant.shopDomain,
        shopInfo:   merchant.shopInfo,
        planTier:   merchant.planTier,
        lastSyncAt: merchant.lastSyncAt,
      },
      snapshot:     snapshot  || null,
      analysis:     analysis  || null,
      scoreHistory: scoreHistory.reverse(), // oldest first for chart
    });
  } catch (err) {
    return error(res, err);
  }
}

// ─── Sync Controller ──────────────────────────────────────────────────────────

/**
 * POST /api/:shopDomain/sync
 * Queues a manual full store sync.
 */
export async function triggerSync(req, res) {
  try {
    const { merchant } = req;

    const syncJob = await SyncJob.create({
      merchantId: merchant._id,
      shopDomain: merchant.shopDomain,
      jobType:    'full_sync',
    });

    const bullJob = await queueSync(merchant.shopDomain, syncJob._id);

    syncJob.bullJobId = bullJob.id;
    await syncJob.save();

    logger.info({ shopDomain: merchant.shopDomain }, 'Manual sync queued');
    return success(res, { syncJobId: syncJob._id, bullJobId: bullJob.id, status: 'queued' }, 202);
  } catch (err) {
    return error(res, err);
  }
}

/**
 * GET /api/:shopDomain/sync/:syncJobId
 * Poll the status of a sync job.
 */
export async function getSyncStatus(req, res) {
  try {
    const syncJob = await SyncJob.findOne({
      _id:        req.params.syncJobId,
      merchantId: req.merchant._id,
    });

    if (!syncJob) throw new NotFoundError('Sync job');

    return success(res, syncJob);
  } catch (err) {
    return error(res, err);
  }
}

// ─── Analysis Controller ──────────────────────────────────────────────────────

/**
 * POST /api/:shopDomain/analyze
 * Queues an AI analysis job on the latest snapshot.
 */
export async function triggerAnalysis(req, res) {
  try {
    const { merchant } = req;

    const snapshot = await StoreSnapshot.findOne({ merchantId: merchant._id }).sort({ syncedAt: -1 });
    if (!snapshot) throw new BadRequestError('No snapshot found. Run a sync first.');

    const bullJob = await queueAnalysis(merchant.shopDomain, snapshot._id);

    logger.info({ shopDomain: merchant.shopDomain }, 'Analysis queued');
    return success(res, { bullJobId: bullJob.id, snapshotId: snapshot._id, status: 'queued' }, 202);
  } catch (err) {
    return error(res, err);
  }
}

/**
 * GET /api/:shopDomain/analysis/latest
 * Returns the most recent completed AI analysis.
 */
export async function getLatestAnalysis(req, res) {
  try {
    const analysis = await AiAnalysis.findOne({
      merchantId: req.merchant._id,
      status:     'completed',
    }).sort({ createdAt: -1 });

    if (!analysis) throw new NotFoundError('Analysis');

    return success(res, analysis);
  } catch (err) {
    return error(res, err);
  }
}

// ─── Fix Controller ───────────────────────────────────────────────────────────

/**
 * POST /api/:shopDomain/fix
 * Creates a FixAction and queues it for execution.
 * Body: { analysisId, problemId, fixType, payload }
 */
export async function applyFix(req, res) {
  try {
    const { merchant } = req;
    const { analysisId, problemId, fixType, payload } = req.body;

    if (!analysisId || !problemId || !fixType) {
      throw new BadRequestError('analysisId, problemId, and fixType are required');
    }

    const fixAction = await FixAction.create({
      merchantId:  merchant._id,
      analysisId,
      shopDomain:  merchant.shopDomain,
      problemId,
      fixType,
      payload,
      triggeredBy: 'merchant',
    });

    await queueFix(fixAction._id, merchant.shopDomain);

    logger.info({ shopDomain: merchant.shopDomain, fixType, problemId }, 'Fix queued');
    return success(res, { fixActionId: fixAction._id, status: 'pending' }, 202);
  } catch (err) {
    return error(res, err);
  }
}

/**
 * GET /api/:shopDomain/fix/:fixActionId
 * Get the status of a fix action.
 */
export async function getFixStatus(req, res) {
  try {
    const fixAction = await FixAction.findOne({
      _id:        req.params.fixActionId,
      merchantId: req.merchant._id,
    });

    if (!fixAction) throw new NotFoundError('Fix action');

    return success(res, fixAction);
  } catch (err) {
    return error(res, err);
  }
}

/**
 * GET /api/:shopDomain/fixes
 * List all fix actions for a merchant (audit trail).
 */
export async function listFixes(req, res) {
  try {
    const fixes = await FixAction.find({ merchantId: req.merchant._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return success(res, fixes);
  } catch (err) {
    return error(res, err);
  }
}

// ─── Webhook Controller ───────────────────────────────────────────────────────

/**
 * POST /webhooks/shopify
 * Receives Shopify webhook events. HMAC already validated by middleware.
 */
export async function handleWebhook(req, res) {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const topic      = req.headers['x-shopify-topic'];
    const webhookId  = req.headers['x-shopify-webhook-id'];

    // Idempotency — skip if we've already processed this exact webhook
    const existing = await WebhookEvent.findOne({ shopifyWebhookId: webhookId });
    if (existing) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const event = await WebhookEvent.create({
      shopDomain,
      topic,
      payload:          req.body,
      shopifyWebhookId: webhookId,
    });

    await queueWebhookEvent(event._id);

    // Shopify requires a fast 200 response
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Webhook handler error');
    // Still return 200 to prevent Shopify retries flooding us
    return res.status(200).json({ received: true });
  }
}

// ─── Health Score History Controller ─────────────────────────────────────────

/**
 * GET /api/:shopDomain/health-history
 * Returns last 90 days of daily health scores for the trend chart.
 */
export async function getHealthHistory(req, res) {
  try {
    const history = await HealthHistory.find({ merchantId: req.merchant._id })
      .sort({ date: -1 })
      .limit(90);

    return success(res, history.reverse());
  } catch (err) {
    return error(res, err);
  }
}