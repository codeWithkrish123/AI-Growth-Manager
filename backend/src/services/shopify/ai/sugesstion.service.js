/**
 * AI-Powered Suggestion Service
 *
 * Generates intelligent growth suggestions based on store data analysis.
 * Uses OpenAI when available, with rule-based fallback templates.
 */

import { logger } from '../../../utils/logger.js';
import { config } from '../../../config/index.js';

/**
 * Generate growth suggestions based on store metrics and data
 *
 * @param {Object} options
 * @param {Object} options.metrics     - Store metrics
 * @param {Array}  options.products    - Product list
 * @param {Array}  options.orders      - Recent orders
 * @param {Object} options.shopInfo    - Shop info
 * @param {Array}  options.problems    - Detected problems (optional)
 * @returns {Promise<Array>}           - Prioritised suggestions
 */
export async function generateSuggestions({ metrics, products, orders, shopInfo, problems }) {
  if (config.ai.openaiKey) {
    try {
      const aiSuggestions = await aiGeneratedSuggestions({ metrics, products, orders, shopInfo, problems });
      if (aiSuggestions && aiSuggestions.length > 0) {
        return aiSuggestions;
      }
    } catch (err) {
      logger.warn({ err }, 'AI suggestion generation failed, using templates');
    }
  }

  return templateSuggestions({ metrics, products, orders, shopInfo, problems });
}

async function aiGeneratedSuggestions({ metrics, products, orders, shopInfo, problems }) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: config.ai.openaiKey });

  const productCount = products?.length || 0;
  const productsNoImages = products?.filter(p => !p.images?.length).length || 0;
  const productsNoDesc = products?.filter(p => !p.body_html || p.body_html.length < 50).length || 0;
  const totalRevenue = orders?.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0) || 0;

  const completion = await openai.chat.completions.create({
    model: config.ai.model || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert ecommerce growth consultant. Generate specific, actionable suggestions. Return a JSON array. Each: { id, category: "products"|"marketing"|"conversion"|"retention"|"seo"|"pricing", title, description, impact: "high"|"medium"|"low", effort: "low"|"medium"|"high", estimatedRevenueImpact: number, actionItems: string[] }',
      },
      {
        role: 'user',
        content: JSON.stringify({
          store: shopInfo?.name || 'Store',
          currency: shopInfo?.currency || 'USD',
          metrics: {
            totalProducts: productCount,
            productsWithoutImages: productsNoImages,
            productsWithoutDescription: productsNoDesc,
            totalRevenue,
            orderCount: orders?.length || 0,
          },
          problems: (problems || []).slice(0, 5).map(p => ({
            title: p.title,
            severity: p.severity,
          })),
        }),
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content || '[]';
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    const suggestions = JSON.parse(clean);
    return Array.isArray(suggestions) ? suggestions.slice(0, 10) : [];
  } catch {
    logger.warn('AI suggestions returned invalid JSON');
    return [];
  }
}



function templateSuggestions({ metrics, products, orders, shopInfo, problems }) {
  const suggestions = [];
  const currency = shopInfo?.currency || 'USD';
  if (!metrics || !products) return suggestions;

  const productsNoImages = products.filter(p => !p.images?.length).length;
  const productsNoDesc = products.filter(p => !p.body_html || p.body_html.length < 50).length;
  const totalRevenue = orders?.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0) || 0;

  if (productsNoImages > 0) {
    suggestions.push({
      id: 'sug-images', category: 'products',
      title: 'Add Product Images',
      description: `${productsNoImages} products lack images. Products with images convert up to 40% better.`,
      impact: 'high', effort: 'medium',
      estimatedRevenueImpact: Math.round(productsNoImages * (metrics.avgOrderValue || 35) * 2),
      actionItems: ['Take professional photos', 'Add images', 'Optimize loading'],
    });
  }

  if (productsNoDesc > 0) {
    suggestions.push({
      id: 'sug-desc', category: 'products',
      title: 'Improve Product Descriptions',
      description: `${productsNoDesc} products have poor descriptions. SEO descriptions improve ranking.`,
      impact: 'high', effort: 'low',
      estimatedRevenueImpact: Math.round(productsNoDesc * (metrics.avgOrderValue || 35) * 1.5),
      actionItems: ['Generate AI descriptions', 'Include benefits', 'Add SEO keywords'],
    });
  }

  if (orders?.length > 0) {
    suggestions.push({
      id: 'sug-abandoned', category: 'conversion',
      title: 'Recover Abandoned Carts',
      description: 'Set up cart recovery emails. Stores recover 10-15% of abandoned carts.',
      impact: 'high', effort: 'low',
      estimatedRevenueImpact: Math.round(totalRevenue * 0.12),
      actionItems: ['Install recovery app', 'Create email sequence', 'Offer 10% discount'],
    });
  }

  if (metrics.avgOrderValue < 50) {
    suggestions.push({
      id: 'sug-aov', category: 'pricing',
      title: 'Increase AOV',
      description: `AOV is ${currency}${(metrics.avgOrderValue || 0).toFixed(2)}. Implement upselling.`,
      impact: 'medium', effort: 'medium',
      estimatedRevenueImpact: Math.round((50 - (metrics.avgOrderValue || 0)) * (metrics.orderCount || orders?.length || 0)),
      actionItems: ['Add recommendations', 'Create bundles', 'Free shipping threshold'],
    });
  }

  suggestions.push({
    id: 'sug-email', category: 'marketing',
    title: 'Launch Email Campaigns',
    description: 'Send regular campaigns to drive repeat purchases.',
    impact: 'high', effort: 'medium',
    estimatedRevenueImpact: Math.round(totalRevenue * 0.08),
    actionItems: ['Build email list', 'Create welcome sequence', 'Send weekly campaigns'],
  });

  return suggestions.slice(0, 10);
}

export default { generateSuggestions };
