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

/**
 * Builds prompt for SEO Audit
 */
export function buildSeoAuditPrompt({ products, shopInfo }) {
  const systemPrompt = `You are an expert SEO Specialist for Shopify.
Analyze the provided product data and identify technical SEO issues.
Respond with valid JSON only.`;

  const userPrompt = `Analyze SEO for these Shopify store products:
${products.map(p => `- ${p.title}: ${p.body_html?.substring(0, 100) || 'NO DESCRIPTION'}`).join('\n')}

Return JSON:
{
  "overallScore": 0-100,
  "metaScore": 0-100,
  "contentScore": 0-100,
  "structureScore": 0-100,
  "issues": [
    { "severity": "critical|warning|info", "category": "meta|image|content|speed|mobile", "title": "...", "description": "...", "fixSuggestion": "..." }
  ]
}`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds prompt for Ads Generation
 */
export function buildAdsCreativePrompt({ products, platform }) {
  const systemPrompt = `You are a high-converting Ad Copywriter for ${platform}.
Generate headlines and descriptions for the provided products.
Respond with valid JSON only.`;

  const userPrompt = `Generate ads for:
${products.map(p => `- ${p.title}: ${p.body_html?.substring(0, 100) || ''}`).join('\n')}

Return JSON:
{
  "headlines": ["...", "..."],
  "descriptions": ["...", "..."]
}`;

  return { systemPrompt, userPrompt };
}