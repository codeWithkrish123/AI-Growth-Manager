import { shopify } from '../config/shopify.js';
import { Merchant } from '../models/Merchant.model.js';
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
    let merchant = await Merchant.findOne({ shopDomain: session.shop });

    if (!merchant) {
      merchant = new Merchant({
        shopDomain: session.shop,
        scope: session.scope,
        isActive: true,
      });
    } else {
      merchant.scope = session.scope;
      merchant.isActive = true;
    }

    merchant.setAccessToken(session.accessToken);
    await merchant.save();

    logger.info({ shopDomain: session.shop }, 'Merchant installed / re-authenticated');

    // Redirect to your frontend dashboard
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard?shop=${session.shop}`);

  } catch (err) {
    logger.error({ err }, 'OAuth callback error');
    return res.status(500).send('Authentication failed. Please try again.');
  }
}

// ─── App Uninstall ────────────────────────────────────────────────────────────
// Called by webhook worker — kept here for clarity.
export async function handleUninstall(shopDomain) {
  await Merchant.findOneAndUpdate({ shopDomain }, { isActive: false });
  logger.info({ shopDomain }, 'Merchant uninstalled');
}