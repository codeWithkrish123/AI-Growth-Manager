import { Resend } from 'resend';
import { logger } from '../../utils/logger.js';

let resend = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'AI Growth Manager <onboarding@resend.dev>';

/**
 * Send a single transactional email via Resend
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const resendClient = getResend();
  if (!resendClient) {
    logger.warn('RESEND_API_KEY not configured — email sending is disabled');
    return { id: 'mock-id', simulated: true };
  }

  try {
    const result = await resendClient.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    logger.info({ to, subject, id: result.data?.id }, 'Email sent successfully');
    return result.data;
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    throw err;
  }
}

/**
 * Send abandoned cart recovery email
 */
export async function sendAbandonedCartEmail({ customerEmail, customerName, shopName, cartItems, cartUrl, shopDomain }) {
  const subject = `You left something behind at ${shopName} 🛒`;

  const itemsHtml = cartItems.slice(0, 3).map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
        ${item.title}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">
        ₹${item.price}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">${shopName}</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Don't forget your cart</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <p style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px;">
            Hey ${customerName || 'there'} 👋
          </p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            You left some items in your cart. They're still waiting for you!
          </p>

          <!-- Cart Items -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Item</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${cartUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: 0.05em;">
              Complete Your Purchase →
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
            This offer expires in 24 hours.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Powered by AI Growth Manager • <a href="https://${shopDomain}" style="color: #94a3b8;">Visit Store</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: customerEmail, subject, html });
}

/**
 * Send a custom campaign email (AI-generated or manual)
 */
export async function sendCampaignEmail({ customerEmail, customerName, subject, htmlBody, shopName, shopDomain }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px 32px;">
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 800;">${shopName}</h2>
        </div>
        <div style="padding: 32px;">
          ${htmlBody}
        </div>
        <div style="background: #f8fafc; padding: 16px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Powered by AI Growth Manager • <a href="https://${shopDomain}" style="color: #94a3b8;">Visit Store</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: customerEmail, subject, html });
}
