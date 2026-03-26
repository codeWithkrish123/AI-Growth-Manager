/**
 * Compute the 0–100 store health score from metrics.
 *
 * The score is DETERMINISTIC — the AI never calculates this number.
 * The AI only narrates the result. This prevents hallucination on scores.
 *
 * Weights:
 *   Conversion rate  25 pts  (benchmark: ~2.5%)
 *   Cart abandon     20 pts  (benchmark: <60%)
 *   AOV              20 pts  (benchmark: >$35)
 *   Product quality  15 pts  (descriptions + images)
 *   Inventory health 10 pts  (no OOS listed)
 *   Customer return  10 pts  (benchmark: >20%)
 */
export function calculateHealthScore(metrics) {
  const {
    conversionRate,
    cartAbandonRate,
    avgOrderValue,
    noDescriptionCount,
    noImageCount,
    activeProducts,
    outOfStockCount,
    returningRate,
  } = metrics;

  // ── Conversion Rate (0–25) ─────────────────────────────────────────────────
  // Scale: 0%=0pts, 1%=10pts, 2.5%=20pts, 4%+=25pts
  const conversionScore = Math.min(25, (conversionRate / 4) * 25);

  // ── Cart Abandon (0–20) ────────────────────────────────────────────────────
  // Lower abandon = higher score. 40% abandon = 20pts, 80%+ = 0pts
  const abandonScore = Math.max(0, ((80 - cartAbandonRate) / 40) * 20);

  // ── AOV (0–20) ────────────────────────────────────────────────────────────
  // Scale: $0=0pts, $20=10pts, $40+=20pts
  const aovScore = Math.min(20, (avgOrderValue / 40) * 20);

  // ── Product Quality (0–15) ────────────────────────────────────────────────
  // Penalise missing descriptions (-0.5 per product) and missing images (-0.5)
  const total           = activeProducts || 1;
  const descPenalty     = (noDescriptionCount / total) * 7.5;
  const imagePenalty    = (noImageCount      / total) * 7.5;
  const productScore    = Math.max(0, 15 - descPenalty - imagePenalty);

  // ── Inventory Health (0–10) ───────────────────────────────────────────────
  // Penalise OOS products still listed
  const oosPenalty      = (outOfStockCount / total) * 10;
  const inventoryScore  = Math.max(0, 10 - oosPenalty);

  // ── Customer Retention (0–10) ─────────────────────────────────────────────
  // Scale: 0%=0pts, 20%+=10pts
  const retentionScore  = Math.min(10, (returningRate / 20) * 10);

  const total_score = Math.round(
    conversionScore + abandonScore + aovScore +
    productScore    + inventoryScore + retentionScore
  );

  return {
    healthScore: Math.max(0, Math.min(100, total_score)),
    healthBreakdown: {
      conversionScore: Math.round(conversionScore),
      abandonScore:    Math.round(abandonScore),
      aovScore:        Math.round(aovScore),
      productScore:    Math.round(productScore),
      inventoryScore:  Math.round(inventoryScore),
      retentionScore:  Math.round(retentionScore),
    },
  };
}