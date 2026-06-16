import { query } from '../../config/database.js';
import { sendCampaignEmail } from './email.service.js';
import { logger } from '../../utils/logger.js';

// ─── Campaign CRUD ─────────────────────────────────────────────────────────────

export async function createCampaign(merchantId, shopDomain, data) {
  const { name, type = 'manual', subject, body } = data;
  const sql = `
    INSERT INTO email_campaigns (merchant_id, shop_domain, name, type, subject, body)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [merchantId, shopDomain, name, type, subject, body]);
  return result.rows[0];
}

export async function listCampaigns(merchantId) {
  const sql = `
    SELECT * FROM email_campaigns
    WHERE merchant_id = $1
    ORDER BY created_at DESC
  `;
  const result = await query(sql, [merchantId]);
  return result.rows;
}

export async function getCampaign(id, merchantId) {
  const sql = `SELECT * FROM email_campaigns WHERE id = $1 AND merchant_id = $2`;
  const result = await query(sql, [id, merchantId]);
  return result.rows[0] || null;
}

export async function getCampaignAnalytics(merchantId) {
  const sql = `
    SELECT
      ec.id, ec.name, ec.type, ec.status,
      ec.total_sent, ec.total_opened, ec.total_clicked,
      ec.created_at, ec.sent_at,
      CASE WHEN ec.total_sent > 0 
        THEN ROUND((ec.total_opened::numeric / ec.total_sent) * 100, 1)
        ELSE 0 END AS open_rate,
      CASE WHEN ec.total_sent > 0
        THEN ROUND((ec.total_clicked::numeric / ec.total_sent) * 100, 1)
        ELSE 0 END AS click_rate
    FROM email_campaigns ec
    WHERE ec.merchant_id = $1
    ORDER BY ec.created_at DESC
    LIMIT 20
  `;
  const result = await query(sql, [merchantId]);
  return result.rows;
}

// ─── Template fallback ────────────────────────────────────────────────────────

function generateTemplateEmail(shopName, segment, goal, topProducts) {
  const productMentions = topProducts.slice(0, 2).map(p => p.title).join(' and ');

  const templates = {
    increase_repeat_orders: {
      subject: `We miss you at ${shopName} 💙`,
      body: `<p>Hi there,</p>
<p>It's been a while since your last visit to <strong>${shopName}</strong>, and we wanted to reach out personally.</p>
<p>We've got some exciting new arrivals you might love${productMentions ? `, including ${productMentions}` : ''}.</p>
<p>As a valued customer, use code <strong>COMEBACK15</strong> for 15% off your next order.</p>
<p style="text-align:center; margin: 24px 0;">
  <a href="#" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Shop Now →</a>
</p>
<p>Thank you for being part of our community.</p>`,
    },
    new_arrivals: {
      subject: `New arrivals just dropped at ${shopName} 🎉`,
      body: `<p>Hi there,</p>
<p>We're excited to share our latest arrivals at <strong>${shopName}</strong>!</p>
<p>${productMentions ? `Check out our newest additions including ${productMentions}.` : 'We have exciting new products waiting for you.'}</p>
<p style="text-align:center; margin: 24px 0;">
  <a href="#" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">View New Arrivals →</a>
</p>`,
    },
    default: {
      subject: `Special offer from ${shopName} for you`,
      body: `<p>Hi there,</p>
<p>We have something special for you at <strong>${shopName}</strong>.</p>
<p>${productMentions ? `Discover our featured products: ${productMentions}.` : 'Check out our latest collection.'}</p>
<p style="text-align:center; margin: 24px 0;">
  <a href="#" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Shop Now →</a>
</p>`,
    },
  };

  return templates[goal] || templates.default;
}

// ─── AI Email Generation ───────────────────────────────────────────────────────

export async function generateEmailWithAI(shopName, segment, goal, topProducts) {
  if (!process.env.OPENAI_API_KEY) {
    return generateTemplateEmail(shopName, segment, goal, topProducts);
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const productList = topProducts.slice(0, 3).map(p => p.title).join(', ');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert e-commerce email copywriter. Write concise, conversion-focused emails. Return JSON with: subject (string), body_html (HTML string for email body only, no full HTML document).',
        },
        {
          role: 'user',
          content: `Write a ${goal} email for Shopify store "${shopName}".\nTarget segment: ${segment}\nTop products: ${productList}\nKeep it personal, short (3-4 paragraphs), and include a clear CTA.\nReturn JSON only.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return { subject: parsed.subject, body: parsed.body_html };
  } catch (err) {
    logger.error({ err }, 'AI email generation failed, using template');
    return generateTemplateEmail(shopName, segment, goal, topProducts);
  }
}

// ─── AI Prompt-to-Email ────────────────────────────────────────────────────────

export async function generateEmailFromPrompt(shopName, prompt) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce email copywriter. Write concise, conversion-focused emails. Return JSON with: subject (string), body_html (HTML string for email body only, not a full HTML document).',
          },
          {
            role: 'user',
            content: `Write a customer email for the Shopify store "${shopName}".\n\nWhat the merchant wants to communicate:\n${prompt}\n\nMake it personal, concise (3-4 paragraphs), and include a clear CTA button. Return JSON only.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      return { subject: parsed.subject, body: parsed.body_html };
    } catch (err) {
      logger.warn({ code: err.code, status: err.status }, 'OpenAI unavailable, using prompt template fallback');
    }
  }

  // Fallback: build a clean email from the prompt text directly
  return {
    subject: `Message from ${shopName}`,
    body: `<p>Hi there,</p>
<p>${prompt}</p>
<p style="text-align:center; margin: 24px 0;">
  <a href="#" style="background:#3b82f6;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Shop Now &rarr;</a>
</p>
<p>Thank you for being a valued customer.</p>`,
  };
}

// ─── Send Campaign ─────────────────────────────────────────────────────────────

export async function sendCampaign(campaignId, merchantId, customers, shopName, shopDomain) {
  const campaign = await getCampaign(campaignId, merchantId);
  if (!campaign) throw new Error('Campaign not found');

  await query(
    `UPDATE email_campaigns SET status = 'sending', updated_at = NOW() WHERE id = $1`,
    [campaignId]
  );

  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    if (!customer.email) continue;

    try {
      const result = await sendCampaignEmail({
        customerEmail: customer.email,
        customerName: customer.first_name || customer.name,
        subject: campaign.subject,
        htmlBody: campaign.body,
        shopName,
        shopDomain,
      });

      await query(
        `INSERT INTO email_logs (campaign_id, merchant_id, customer_email, customer_name, status, resend_id)
         VALUES ($1, $2, $3, $4, 'sent', $5)`,
        [campaignId, merchantId, customer.email, customer.first_name || '', result?.id || null]
      );

      sent++;
    } catch (err) {
      logger.error({ err, email: customer.email }, 'Failed to send campaign email');
      failed++;
    }
  }

  await query(
    `UPDATE email_campaigns 
     SET status = 'sent', total_sent = $2, sent_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [campaignId, sent]
  );

  logger.info({ campaignId, sent, failed }, 'Campaign send completed');
  return { sent, failed };
}
