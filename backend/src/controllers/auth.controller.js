import { shopify } from '../config/shopify.js';
import { config } from '../config/index.js';
import { MerchantModel } from '../models/Merchant.model.js';
import { logger } from '../utils/logger.js';

// ─── Step 1: Begin OAuth ──────────────────────────────────────────────────────
// Shopify calls this when a merchant installs your app.
export async function authBegin(req, res) {
  await shopify.auth.begin({
    shop: req.query.shop,
    callbackPath: '/auth/callback',
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
}

// ─── Step 2: OAuth Callback ───────────────────────────────────────────────────
// Shopify redirects here after merchant approves.
export async function authCallback(req, res) {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    // Upsert merchant record with encrypted token
    let merchant = await MerchantModel.findOne({ shopDomain: session.shop });

    if (!merchant) {
      merchant = await MerchantModel.create({
        shopDomain: session.shop,
        accessToken: session.accessToken,
        scope: session.scope,
        isActive: true,
        planTier: 'free',
      });
    } else {
      merchant = await MerchantModel.findOneAndUpdate(
        { shopDomain: session.shop },
        {
          accessToken: session.accessToken,
          scope: session.scope,
          isActive: true,
        }
      );
    }

    logger.info({ shopDomain: session.shop }, 'Merchant installed / re-authenticated');

    // Redirect to your frontend dashboard
    return res.redirect(`${config.frontendUrl}/dashboard?shop=${session.shop}`);

  } catch (err) {
    logger.error({ err }, 'OAuth callback error');
    return res.status(500).send('Authentication failed. Please try again.');
  }
}

// ─── OAuth URL Generator (for frontend) ────────────────────────────────────────
// Returns OAuth URL for frontend to redirect to
export async function getOAuthUrl(req, res) {
  try {
    const { shop } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    // Generate OAuth URL
    const oauthUrl = await shopify.auth.getAuthUrl({
      shop: shop,
      callbackPath: '/auth/callback',
      isOnline: false,
    });

    return res.json({ oauthUrl });
  } catch (err) {
    logger.error({ err }, 'Failed to generate OAuth URL');
    return res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
}

// ─── App Uninstall ────────────────────────────────────────────────────────────
// Called by webhook worker — kept here for clarity.
export async function handleUninstall(shopDomain) {
  await MerchantModel.findOneAndUpdate({ shopDomain }, { isActive: false });
  logger.info({ shopDomain }, 'Merchant uninstalled');
}