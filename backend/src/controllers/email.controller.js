import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { MerchantModel } from '../models/index.js';
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  getCampaignAnalytics,
  generateEmailWithAI,
  generateEmailFromPrompt,
  sendCampaign,
} from '../services/email/campaign.service.js';
import { fetchProducts } from '../services/shopify/products.service.js';
import { fetchCustomers } from '../services/shopify/customers.service.js';

/**
 * GET /api/:shopDomain/email/campaigns
 */
export async function getEmailCampaigns(req, res) {
  try {
    const { merchant } = req;
    const campaigns = await listCampaigns(merchant.id);
    const analytics = await getCampaignAnalytics(merchant.id);
    return success(res, { campaigns, analytics });
  } catch (err) {
    logger.error({ err }, 'Failed to get email campaigns');
    return error(res, 'Failed to get email campaigns', 500);
  }
}

/**
 * POST /api/:shopDomain/email/campaigns
 * Create a new campaign (manual or AI-generated)
 */
export async function createEmailCampaign(req, res) {
  try {
    const { merchant } = req;
    const { name, type, subject, body, aiGenerate, segment, goal } = req.body;

    if (!name) return error(res, 'Campaign name is required', 400);

    let finalSubject = subject;
    let finalBody = body;

    // AI generation requested
    if (aiGenerate) {
      const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
      let topProducts = [];

      try {
        // Get top products for context
        const products = await fetchProducts(merchant.shopDomain, accessToken).catch(() => []);
        topProducts = products.slice(0, 5);
      } catch { topProducts = []; }

      const shopName = merchant.shopInfo?.name || merchant.shopDomain;
      const generated = await generateEmailWithAI(shopName, segment || 'all customers', goal || 'increase_repeat_orders', topProducts);
      finalSubject = generated.subject;
      finalBody = generated.body;
    }

    const campaign = await createCampaign(merchant.id, merchant.shopDomain, {
      name,
      type: type || 'manual',
      subject: finalSubject,
      body: finalBody,
    });

    return success(res, campaign);
  } catch (err) {
    logger.error({ err }, 'Failed to create email campaign');
    return error(res, 'Failed to create campaign: ' + err.message, 500);
  }
}

/**
 * POST /api/:shopDomain/email/ai-generate
 * Generate email copy using AI
 */
export async function generateAiEmail(req, res) {
  try {
    const { merchant } = req;
    const { segment = 'all customers', goal = 'increase_repeat_orders', topProducts = [] } = req.body;

    const shopName = merchant.shopInfo?.name || merchant.shopDomain;
    const generated = await generateEmailWithAI(shopName, segment, goal, topProducts);

    return success(res, generated);
  } catch (err) {
    logger.error({ err }, 'Failed to generate AI email');
    return error(res, 'Failed to generate email: ' + err.message, 500);
  }
}

/**
 * POST /api/:shopDomain/email/campaigns/:id/send
 * Send a campaign to all customers
 */
export async function sendEmailCampaign(req, res) {
  try {
    const { merchant } = req;
    const { id } = req.params;

    const campaign = await getCampaign(id, merchant.id);
    if (!campaign) return error(res, 'Campaign not found', 404);

    if (!campaign.subject || !campaign.body) {
      return error(res, 'Campaign must have subject and body before sending', 400);
    }

    // Fetch customers from Shopify
    const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
    if (!accessToken) return error(res, 'No access token — please reconnect your store', 400);

    let customers = [];
    try {
      customers = await fetchCustomers(merchant.shopDomain, accessToken);
    } catch (err) {
      return error(res, 'Failed to fetch customers from Shopify: ' + err.message, 500);
    }

    if (customers.length === 0) {
      return error(res, 'No customers found in your store', 400);
    }

    const shopName = merchant.shopInfo?.name || merchant.shopDomain;
    const result = await sendCampaign(id, merchant.id, customers, shopName, merchant.shopDomain);

    return success(res, {
      message: `Campaign sent to ${result.sent} customers`,
      ...result,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send email campaign');
    return error(res, 'Failed to send campaign: ' + err.message, 500);
  }
}

/**
 * POST /api/:shopDomain/email/ai-prompt-compose
 * Takes a free-text prompt and returns a complete subject + body HTML
 */
export async function promptComposeEmail(req, res) {
  try {
    const { merchant } = req;
    const { prompt } = req.body;
    if (!prompt) return error(res, 'prompt is required', 400);

    const shopName = merchant.shopInfo?.name || merchant.shopDomain;
    const generated = await generateEmailFromPrompt(shopName, prompt);
    return success(res, generated);
  } catch (err) {
    logger.error({ err }, 'Failed to compose email from prompt');
    return error(res, 'Failed to compose email: ' + err.message, 500);
  }
}

/**
 * GET /api/:shopDomain/email/analytics
 */
export async function getEmailAnalytics(req, res) {
  try {
    const { merchant } = req;
    const analytics = await getCampaignAnalytics(merchant.id);
    return success(res, analytics);
  } catch (err) {
    logger.error({ err }, 'Failed to get email analytics');
    return error(res, 'Failed to get analytics', 500);
  }
}
