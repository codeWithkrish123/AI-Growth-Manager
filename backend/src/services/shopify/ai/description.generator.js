import { logger } from '../../../utils/logger.js';
import { updateProduct } from '../products.service.js';

/**
 * Generate AI-powered product description using OpenAI
 * and optionally apply it directly to Shopify
 */
export async function generateProductDescription(product, shopName = '') {
  const title = product.title || 'Product';
  const productType = product.product_type || '';
  const vendor = product.vendor || shopName;
  const tags = Array.isArray(product.tags)
    ? product.tags.join(', ')
    : (product.tags || '');
  const price = product.variants?.[0]?.price || product.price || '';

  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert Shopify product copywriter. Write compelling, SEO-optimized product descriptions that convert browsers into buyers. Always return valid HTML with <p> and <ul> tags. Keep descriptions between 80-150 words.`
          },
          {
            role: 'user',
            content: `Write a product description for:
Product: ${title}
Type: ${productType || 'General product'}
Brand: ${vendor}
Tags: ${tags || 'none'}
Price: ${price ? `₹${price}` : 'not specified'}

Requirements:
- Start with a compelling hook sentence
- 2-3 key benefit bullet points in <ul>
- End with a call-to-action sentence
- Keep it concise (80-120 words)
- Return HTML only`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const description = completion.choices[0]?.message?.content?.trim();
      if (description) {
        logger.info({ productId: product.id, title }, 'AI description generated');
        return description;
      }
    } catch (err) {
      logger.warn({ err, productId: product.id }, 'OpenAI description generation failed, using template');
    }
  }

  // Fallback: quality template
  return generateTemplateDescription(title, productType, vendor, tags, price);
}

function generateTemplateDescription(title, productType, vendor, tags, price) {
  const tagList = tags ? tags.split(',').slice(0, 3).map(t => t.trim()).filter(Boolean) : [];

  return `<p><strong>${title}</strong> — a premium ${productType || 'product'} from ${vendor || 'our store'} designed with quality and customer satisfaction in mind.</p>
<ul>
  <li>✓ Carefully crafted for superior quality and durability</li>
  <li>✓ Designed to meet and exceed your expectations${tagList.length ? ` — ${tagList.join(', ')}` : ''}</li>
  <li>✓ Backed by our commitment to excellent customer service</li>
</ul>
<p>Order today and experience the difference quality makes${price ? ` at just ₹${price}` : ''}.</p>`;
}

/**
 * Generate descriptions for all products missing them
 * and apply directly to Shopify
 */
export async function generateAndApplyDescriptions(shopDomain, accessToken, products, shopName) {
  const productsNeedingDescription = products.filter(
    p => !p.body_html || p.body_html.trim().length < 50
  );

  if (productsNeedingDescription.length === 0) {
    return { updated: 0, message: 'All products already have descriptions' };
  }

  let updated = 0;
  const errors = [];

  for (const product of productsNeedingDescription) {
    try {
      const description = await generateProductDescription(product, shopName);
      await updateProduct(shopDomain, accessToken, product.id, {
        body_html: description,
      });
      updated++;
      logger.info({ shopDomain, productId: product.id, title: product.title }, 'Description applied to Shopify');

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      logger.error({ err, productId: product.id }, 'Failed to apply description');
      errors.push({ productId: product.id, title: product.title, error: err.message });
    }
  }

  return {
    applied: updated,
    updated,
    failed: errors.length,
    errors,
    message: `Updated ${updated} of ${productsNeedingDescription.length} products`,
  };
}
