/**
 * AI-Powered Fix Planner
 *
 * Analyzes detected store problems and generates actionable fix plans.
 */

import { logger } from '../../../utils/logger.js';
import { config } from '../../../config/index.js';

export async function planFixes({ problems, metrics, shopInfo, products }) {
  if (!problems || problems.length === 0) return [];
  if (config.ai.openaiKey) {
    try {
      const aiPlans = await aiFixPlanning({ problems, metrics, shopInfo, products });
      if (aiPlans && aiPlans.length > 0) return aiPlans;
    } catch (err) {
      logger.warn({ err }, 'AI fix planning failed, using fallback');
    }
  }
  return ruleBasedFixPlanning(problems, metrics, products);
}

async function aiFixPlanning({ problems, metrics, shopInfo, products }) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: config.ai.openaiKey });
  const completion = await openai.chat.completions.create({
    model: config.ai.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Generate fix plans as JSON array. Each: { problemId, title, description, priority, estimatedImpact, fixType, shopifyEndpoint, payload, estimatedRevenueImpact }' },
      { role: 'user', content: JSON.stringify({ store: shopInfo?.name, metrics, problems: problems.slice(0, 5), sampleProducts: (products || []).slice(0, 10) }) },
    ],
    max_tokens: 1500, temperature: 0.3,
  });
  const raw = completion.choices[0]?.message?.content || '[]';
  try { const plans = JSON.parse(raw.replace(/'''json|'''/g, '').trim()); return Array.isArray(plans) ? plans : []; }
  catch { return []; }
}

function ruleBasedFixPlanning(problems, metrics, products) {
  const plans = [];
  for (const problem of problems) {
    const type = problem.type || problem.id || '';
    const sev = problem.severity || 'medium';
    const pri = sev === 'critical' ? 'immediate' : sev === 'high' ? 'high' : 'medium';
    switch (type) {
      case 'missing_images': case 'missing-images': case 'img':
        plans.push({ problemId: problem.id, title: 'Add Product Images', description: 'Products need high-quality images.', priority: pri, estimatedImpact: 'high', fixType: 'none', payload: {}, estimatedRevenueImpact: (problem.affectedCount || 1) * 100 });
        break;
      case 'poor_descriptions': case 'missing_descriptions': case 'desc':
        for (const prod of (problem.affectedProducts || []).slice(0, 10)) {
          plans.push({ problemId: problem.id, title: 'Generate Description for ' + prod.title, description: 'Create SEO description.', priority: pri, estimatedImpact: 'high', fixType: 'update_product', shopifyEndpoint: '/admin/api/2024-01/products/' + prod.id + '.json', payload: { product: { id: prod.id, body_html: '<p>' + prod.title + ' — Premium quality product.</p>' } }, estimatedRevenueImpact: 30 });
        }
        break;
      case 'cart_abandonment': case 'cart':
        plans.push({ problemId: problem.id, title: 'Cart Recovery Discount', description: '10% off discount to recover carts.', priority: pri, estimatedImpact: 'high', fixType: 'create_discount', shopifyEndpoint: '/admin/api/2024-01/price_rules.json', payload: { discount: { title: 'Cart Recovery', value_type: 'percentage', value: -10, code: 'SAVE10' } }, estimatedRevenueImpact: Math.round((metrics?.totalRevenue || 1000) * 0.12) });
        break;
      default:
        plans.push({ problemId: problem.id || 'generic', title: problem.title || 'Fix Issue', description: problem.description || 'Review and fix.', priority: pri, estimatedImpact: 'medium', fixType: problem.fixType || 'none', payload: problem.payload || {}, estimatedRevenueImpact: problem.potentialRevenue || 0 });
    }
  }
  return plans.sort((a, b) => ({ immediate: 0, high: 1, medium: 2 }[a.priority] || 99) - ({ immediate: 0, high: 1, medium: 2 }[b.priority] || 99));
}

export default { planFixes };
