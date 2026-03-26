import { anthropic }         from '../../../config/ai.js';
import { config }            from '../../../config/index.js';
import { AiAnalysis, AiCallLog } from '../../../models/index.js';
import { buildAnalysisPrompt }   from './prompt.builder.js';
import { hashMetrics }           from '../../../utils/hash.js';
import { AiError }               from '../../../utils/error.js';
import { logger }                from '../../../utils/logger.js';

/**
 * Run AI analysis on a store snapshot.
 * Returns cached result if the metrics haven't changed since last analysis.
 *
 * @param {Object} snapshot  StoreSnapshot document
 * @param {Object} shopInfo  { name, currency, ... }
 * @returns {Object}         AiAnalysis document
 */
export async function runAiAnalysis(snapshot, shopInfo) {
  const metricsHash = hashMetrics(snapshot.metrics);

  // ── Cache check ─────────────────────────────────────────────────────────────
  const cached = await AiAnalysis.findOne({
    merchantId: snapshot.merchantId,
    metricsHash,
    status:     'completed',
  });

  if (cached) {
    logger.info({ shopDomain: snapshot.shopDomain }, 'AI analysis cache hit — skipping LLM call');
    return cached;
  }

  // ── Build prompt ────────────────────────────────────────────────────────────
  const { systemPrompt, userPrompt } = buildAnalysisPrompt({
    metrics:         snapshot.metrics,
    healthScore:     snapshot.healthScore,
    healthBreakdown: snapshot.healthBreakdown,
    topProducts:     snapshot.topProducts,
    shopInfo,
  });

  const startTime = Date.now();
  let   rawText   = '';

  try {
    const response = await anthropic.messages.create({
      model:      config.ai.model,
      max_tokens: 2048,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    rawText = response.content[0]?.text || '';

    const latencyMs        = Date.now() - startTime;
    const promptTokens     = response.usage?.input_tokens  || 0;
    const completionTokens = response.usage?.output_tokens || 0;

    // ── Parse JSON response ─────────────────────────────────────────────────
    let parsed;
    try {
      // Strip accidental markdown fences if present
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed      = JSON.parse(clean);
    } catch {
      throw new AiError(`LLM returned invalid JSON: ${rawText.slice(0, 200)}`);
    }

    // ── Save analysis ───────────────────────────────────────────────────────
    const analysis = await AiAnalysis.create({
      merchantId:       snapshot.merchantId,
      snapshotId:       snapshot._id,
      shopDomain:       snapshot.shopDomain,
      healthScore:      snapshot.healthScore,
      summary:          parsed.summary,
      problems:         parsed.problems || [],
      promptTokens,
      completionTokens,
      modelUsed:        config.ai.model,
      latencyMs,
      metricsHash,
      status:           'completed',
    });

    // ── Log LLM cost for monitoring ─────────────────────────────────────────
    await AiCallLog.create({
      merchantId:       snapshot.merchantId,
      shopDomain:       snapshot.shopDomain,
      callType:         'analysis',
      modelUsed:        config.ai.model,
      promptTokens,
      completionTokens,
      totalTokens:      promptTokens + completionTokens,
      // Approximate cost: claude-sonnet is $3/$15 per 1M tokens in/out
      costUsd:          (promptTokens * 0.000003) + (completionTokens * 0.000015),
      latencyMs,
      success:          true,
    });

    logger.info({ shopDomain: snapshot.shopDomain, latencyMs, score: snapshot.healthScore }, 'AI analysis completed');

    return analysis;

  } catch (err) {
    // Log failed call too (for debugging)
    await AiCallLog.create({
      merchantId:  snapshot.merchantId,
      shopDomain:  snapshot.shopDomain,
      callType:    'analysis',
      modelUsed:   config.ai.model,
      latencyMs:   Date.now() - startTime,
      success:     false,
      errorMsg:    err.message,
    }).catch(() => {});

    if (err instanceof AiError) throw err;
    throw new AiError(`AI analysis failed: ${err.message}`);
  }
}