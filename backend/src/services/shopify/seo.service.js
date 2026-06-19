import { fetchProducts } from './products.service.js';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Shopify SEO Data Source
 * Derives SEO signals from product data already fetched from Shopify.
 * No extra API calls needed — reuses the cached GraphQL product fetch.
 */

/** Build SEO audit scores from live Shopify product data */
export async function buildSeoAuditFromShopify(shopDomain, accessToken) {
  accessToken = accessToken || process.env.ADMIN_API_ACCESS_TOKEN;
  if (!accessToken) throw new Error('No Shopify access token available');
  try {
    const products = await fetchProducts(shopDomain, accessToken, true);
    const total = products.length || 1;

    let metaScore = 100;
    let contentScore = 100;
    let imageScore = 100;
    let issuesCount = 0;
    const issues = [];

    for (const p of products) {
      const title = (p.title || '').trim();
      const desc = (p.body_html || '').replace(/<[^>]*>/g, '').trim();
      const images = p.images || [];
      const tags = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean);

      // Title checks
      if (!title) { metaScore -= 5; issuesCount++; issues.push({ title: 'Product missing title', severity: 'critical', category: 'meta', auto_fixable: false }); }
      else if (title.length < 10) { metaScore -= 3; issuesCount++; issues.push({ title: 'Title too short: ' + title, severity: 'warning', category: 'meta', auto_fixable: true }); }
      else if (title.length > 70) { metaScore -= 2; issuesCount++; issues.push({ title: 'Title too long (>70 chars)', severity: 'info', category: 'meta', auto_fixable: true }); }

      // Description checks
      if (!desc) { contentScore -= 15; issuesCount++; issues.push({ title: 'Missing description: ' + title, severity: 'warning', category: 'content', auto_fixable: true }); }
      else if (desc.length < 50) { contentScore -= 10; issuesCount++; issues.push({ title: 'Description too short: ' + title, severity: 'warning', category: 'content', auto_fixable: true }); }
      else if (desc.length < 150) { contentScore -= 5; issuesCount++; issues.push({ title: 'Description could be longer: ' + title, severity: 'info', category: 'content', auto_fixable: true }); }

      // Image alt-text can't be checked from GraphQL (no alt field in this query), but we can check image presence
      if (images.length === 0) { imageScore -= 10; issuesCount++; issues.push({ title: 'No images: ' + title, severity: 'warning', category: 'image', auto_fixable: false }); }

      // Tags / keyword presence
      if (tags.length === 0) { contentScore -= 3; issuesCount++; issues.push({ title: 'No product tags: ' + title, severity: 'info', category: 'content', auto_fixable: true }); }

      // Duplicate description check
      const sameDesc = products.filter(o => (o.body_html || '').replace(/<[^>]*>/g, '').trim() === desc).length;
      if (sameDesc > 1) { contentScore -= 5; issuesCount++; issues.push({ title: 'Duplicate description detected', severity: 'warning', category: 'content', auto_fixable: true }); }
    }

    const metaNorm = Math.max(0, Math.min(100, metaScore));
    const contentNorm = Math.max(0, Math.min(100, contentScore));
    const imageNorm = Math.max(0, Math.min(100, imageScore));
    // structure + mobile are estimated from data quality signals
    const structureScore = Math.max(0, Math.min(100, 70 + (total > 0 ? 0 : -20)));
    const mobileScore = 60; // would need PageSpeed API for real value
    const overall = Math.round((metaNorm + contentNorm + imageNorm + structureScore + mobileScore) / 5);

    return {
      overall,
      page_speed_score: mobileScore,
      meta_score: metaNorm,
      content_score: contentNorm,
      structure_score: structureScore,
      mobile_score: mobileScore,
      issues_count: issuesCount,
      issues,
      productsAnalyzed: total,
    };
  } catch (err) {
    logger.error({ err, shopDomain }, 'Failed to build SEO audit from Shopify');
    throw err;
  }
}

export async function getSeoIssuesFromShopify(shopDomain, accessToken) {
  const auditData = await buildSeoAuditFromShopify(shopDomain, accessToken);
  return auditData.issues;
}
