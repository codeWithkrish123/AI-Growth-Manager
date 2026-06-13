import { logger } from '../../../utils/logger.js';

/**
 * Phase 5.3 — AI Price Optimization
 * Analyzes product performance and suggests optimal price points.
 */

export async function analyzePricing(products, orders, shopName = '') {
  const suggestions = [];

  // Build product revenue map from orders
  const productRevenue = {};
  for (const order of orders) {
    for (const item of (order.line_items || [])) {
      if (!productRevenue[item.product_id]) {
        productRevenue[item.product_id] = {
          totalRevenue: 0,
          totalQuantity: 0,
          avgPrice: 0,
        };
      }
      productRevenue[item.product_id].totalRevenue += parseFloat(item.price) * item.quantity;
      productRevenue[item.product_id].totalQuantity += item.quantity;
    }
  }

  for (const product of products) {
    const price = parseFloat(product.variants?.[0]?.price || '0');
    if (price === 0) continue;

    const perf = productRevenue[product.id];

    if (!perf || perf.totalQuantity === 0) {
      // Zero sales — price might be too high or product has issues
      if (price > 5000) {
        suggestions.push({
          productId: product.id,
          title: product.title,
          currentPrice: price,
          suggestedPrice: Math.round(price * 0.85), // 15% reduction
          reason: 'No sales detected — price may be too high for this market',
          action: 'reduce_price',
          impact: 'medium',
          potentialRevenue: Math.round(price * 0.85 * 2), // estimated 2 sales
        });
      }
    } else {
      // Has sales — analyze margin opportunity
      const avgOrderValue = perf.totalRevenue / perf.totalQuantity;
      if (avgOrderValue < price * 0.9) {
        // Discounts being applied — could hold price
        suggestions.push({
          productId: product.id,
          title: product.title,
          currentPrice: price,
          suggestedPrice: price, // keep price
          reason: 'Customers are buying despite full price — strong demand signal',
          action: 'maintain_price',
          impact: 'low',
          potentialRevenue: 0,
        });
      }
    }
  }

  return {
    totalProducts: products.length,
    analyzedProducts: Object.keys(productRevenue).length,
    suggestions,
    summary: suggestions.length > 0
      ? `Found ${suggestions.length} pricing opportunities`
      : 'All product prices appear well-optimized',
  };
}

/**
 * AI-powered price suggestion using OpenAI
 */
export async function suggestPriceWithAI(product, competitors = [], shopName = '') {
  const title = product.title;
  const currentPrice = parseFloat(product.variants?.[0]?.price || '0');

  if (!process.env.OPENAI_API_KEY) {
    return { suggested: currentPrice, reason: 'No AI key configured — keeping current price', confidence: 'low' };
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing expert for Indian e-commerce. Return JSON only: { "suggested": number, "reason": "string", "confidence": "low|medium|high" }'
        },
        {
          role: 'user',
          content: `Suggest optimal price for:
Product: ${title}
Current Price: ₹${currentPrice}
Store: ${shopName}
Market: India
Competitor prices: ${competitors.length > 0 ? competitors.join(', ') : 'unknown'}

Consider: psychological pricing (₹999 vs ₹1000), market positioning, product type.
Return JSON only.`
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      suggested: parsed.suggested || currentPrice,
      reason: parsed.reason || 'AI analysis complete',
      confidence: parsed.confidence || 'medium',
    };
  } catch (err) {
    logger.warn({ err, productId: product.id }, 'AI price suggestion failed');
    return { suggested: currentPrice, reason: 'AI unavailable — keeping current price', confidence: 'low' };
  }
}
