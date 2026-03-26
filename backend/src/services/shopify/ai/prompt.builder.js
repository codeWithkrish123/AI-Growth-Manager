/**
 * Builds the structured prompt sent to the LLM.
 * Keeps all prompt engineering in one place — easy to iterate.
 */
export function buildAnalysisPrompt({ metrics, healthScore, healthBreakdown, topProducts, shopInfo }) {
  const systemPrompt = `You are an expert ecommerce growth analyst specialising in Shopify stores.
Your job is to identify the top 3-4 problems in a store and provide specific, actionable fixes.
You MUST respond with valid JSON only — no markdown, no extra text, no code fences.
The JSON must strictly follow the schema provided.`;

  const userPrompt = `Analyse this Shopify store and return your findings as JSON.

STORE INFO:
- Shop: ${shopInfo?.name || 'Unknown'}
- Currency: ${shopInfo?.currency || 'USD'}

CURRENT METRICS (last 90 days):
- Total Revenue: $${metrics.totalRevenue}
- Orders: ${metrics.orderCount}
- Average Order Value (AOV): $${metrics.avgOrderValue}
- AOV last 30 days: $${metrics.aov30d}
- Cart Abandon Rate: ${metrics.cartAbandonRate}%
- Returning Customer Rate: ${metrics.returningRate}%
- Active Products: ${metrics.activeProducts}
- Products with NO description: ${metrics.noDescriptionCount}
- Products with NO images: ${metrics.noImageCount}
- Out-of-stock products still listed: ${metrics.outOfStockCount}
- Checkouts initiated: ${metrics.checkoutsInitiated}
- Checkouts completed: ${metrics.checkoutsCompleted}

HEALTH SCORE: ${healthScore}/100
BREAKDOWN:
- Conversion: ${healthBreakdown.conversionScore}/25
- Cart Abandon: ${healthBreakdown.abandonScore}/20
- AOV: ${healthBreakdown.aovScore}/20
- Product Quality: ${healthBreakdown.productScore}/15
- Inventory: ${healthBreakdown.inventoryScore}/10
- Customer Retention: ${healthBreakdown.retentionScore}/10

TOP PRODUCTS BY REVENUE:
${topProducts.map(p => `- ${p.title}: $${p.revenue} (${p.unitsSold} units)`).join('\n')}

Return ONLY this JSON structure:
{
  "summary": "2-3 sentence overall assessment of the store",
  "problems": [
    {
      "id": "unique_snake_case_id",
      "category": "product | pricing | ux | inventory | marketing | seo",
      "severity": "critical | warning | info",
      "title": "Short problem title",
      "whyItMatters": "Why this hurts revenue (1-2 sentences)",
      "suggestion": "What to do specifically (2-3 sentences)",
      "fix": {
        "type": "update_product | update_price | add_metafield | add_discount | none",
        "shopifyEndpoint": "/admin/api/2024-01/products/{id}.json or null",
        "shopifyPayload": { "the": "exact body to PUT/POST" },
        "estimatedImpact": "e.g. +8% AOV"
      }
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}