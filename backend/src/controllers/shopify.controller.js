import crypto from 'crypto';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { MerchantModel } from '../models/index.js';
import { encrypt } from '../utils/encryption.js';
import { config } from '../config/index.js';

/**
 * Initiate Shopify OAuth flow
 * POST /api/auth/shopify
 */
export async function initiateShopifyAuth(req, res) {
  try {
    const { shop, force } = req.body;
    
    if (!shop) {
      return error(res, 'Shop domain is required', 400);
    }

    // Normalize shop domain
    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    
    // Debug logging
    logger.info({ shop, shopDomain, shopName: shopDomain.replace('.myshopify.com', ''), force }, 'Processing shop domain');
    
    // Validate shop domain format - allow letters, numbers, and hyphens
    const shopName = shopDomain.replace('.myshopify.com', '');
    if (!shopName.match(/^[a-z0-9][a-z0-9-]*$/)) {
      logger.error({ shop, shopDomain, shopName }, 'Invalid shop domain format');
      return error(res, `Invalid shop domain format: ${shopDomain}. Shop name must be lowercase letters, numbers, and hyphens only.`, 400);
    }

    // Check if merchant already exists
    const existingMerchant = await MerchantModel.findOne({ shopDomain });
    if (existingMerchant && !force) {
      logger.info({ shopDomain }, 'Merchant already exists, skipping OAuth');
      return success(res, {
        message: 'Store already connected',
        shopDomain,
        redirectTo: `/dashboard/${shopDomain}`
      });
    }

    // If force is true, delete existing merchant to allow re-authentication
    if (existingMerchant && force) {
      logger.info({ shopDomain }, 'Force re-auth: deleting existing merchant');
      await MerchantModel.updateByShopDomain(shopDomain, { isActive: false });
    }

    // Generate nonce for security
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Build Shopify OAuth URL
    const redirectUri = `${config.shopify.appUrl}/auth/shopify/callback`;
    const scopes = config.shopify.scopes.split(',');
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${config.shopify.apiKey}&` +
      `scope=${scopes.join(',')}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${nonce}`;

    logger.info({ shopDomain, nonce }, 'Initiating Shopify OAuth');

    return success(res, {
      authUrl,
      shopDomain,
      nonce
    });

  } catch (err) {
    logger.error({ err }, 'Shopify OAuth initiation failed');
    return error(res, 'Failed to initiate OAuth', 500);
  }
}

/**
 * Handle Shopify OAuth callback
 * GET /api/auth/shopify/callback
 */
export async function handleShopifyCallback(req, res) {
  try {
    const { code, hmac, shop, state } = req.query;
    
    if (!code || !hmac || !shop) {
      return error(res, 'Missing required OAuth parameters', 400);
    }

    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    
    // Verify HMAC signature
    const hmacVerified = verifyHmac(req.query, config.shopify.apiSecret);
    if (!hmacVerified) {
      logger.error({ shopDomain }, 'HMAC verification failed');
      return error(res, 'Invalid request signature', 400);
    }

    logger.info({ shopDomain }, 'HMAC verified, exchanging code for access token');

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(shopDomain, code);
    
    if (!tokenResponse.access_token) {
      logger.error({ shopDomain, tokenResponse }, 'Failed to get access token');
      return error(res, 'Failed to obtain access token', 500);
    }

    // Get shop information
    const shopInfo = await getShopInfo(shopDomain, tokenResponse.access_token);

    // Create or update merchant
    const merchant = await MerchantModel.create({
      shopDomain,
      accessToken: tokenResponse.access_token,
      scope: tokenResponse.scope,
      shopInfo: {
        ...shopInfo,
        connectedAt: new Date().toISOString(),
        authProvider: 'shopify'
      },
      isActive: true,
      planTier: 'free'
    });

    logger.info({ shopDomain, merchantId: merchant.id }, 'Shopify OAuth completed successfully');

    // Register webhooks for real-time updates
    try {
      await registerWebhooks(shopDomain, tokenResponse.access_token);
      logger.info({ shopDomain }, 'Webhooks registered successfully');
    } catch (webhookErr) {
      logger.warn({ shopDomain, error: webhookErr.message }, 'Failed to register webhooks');
      // Continue anyway - webhooks are not critical for basic functionality
    }

    // Trigger initial sync+analyze — await so data is ready when dashboard loads
    try {
      const { triggerSync } = await import('./index.js');
      const fakeReq = { merchant, params: { shopDomain } };
      const fakeRes = { json: () => {}, status: () => ({ json: () => {} }) };
      await triggerSync(fakeReq, fakeRes);
      logger.info({ shopDomain }, 'Initial sync completed before redirect');
    } catch (e) {
      logger.warn({ shopDomain, error: e.message }, 'Initial sync failed (non-critical)');
    }

    // Redirect to frontend with success using path parameter
    const redirectUrl = `${config.frontendUrl}/dashboard/${encodeURIComponent(shopDomain)}?success=true`;
    res.redirect(redirectUrl);

  } catch (err) {
    logger.error({ err }, 'Shopify OAuth callback failed');
    
    // Redirect to frontend with error
    const redirectUrl = `${config.frontendUrl}/signin?error=auth_failed`;
    res.redirect(redirectUrl);
  }
}

/**
 * Verify HMAC signature from Shopify
 */
function verifyHmac(query, apiSecret) {
  const { hmac, ...map } = query;
  const orderedMap = Object.keys(map)
    .sort()
    .reduce((result, key) => {
      result[key] = map[key];
      return result;
    }, {});
  
  const message = Object.keys(orderedMap)
    .map(key => `${key}=${orderedMap[key]}`)
    .join('&');
  
  const computedHmac = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(computedHmac, 'utf-8'),
    Buffer.from(hmac, 'utf-8')
  );
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(shopDomain, code) {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.shopify.apiKey,
      client_secret: config.shopify.apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get shop information from Shopify
 */
async function getShopInfo(shopDomain, accessToken) {
  const response = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get shop info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.shop;
}

/**
 * Get merchant status
 * GET /api/auth/status
 */
export async function getAuthStatus(req, res) {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return error(res, 'Shop domain is required', 400);
    }

    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    const merchant = await MerchantModel.findOne({ shopDomain });

    if (!merchant) {
      return success(res, {
        connected: false,
        shopDomain
      });
    }

    return success(res, {
      connected: true,
      shopDomain,
      shopInfo: merchant.shopInfo,
      planTier: merchant.planTier,
      lastSyncAt: merchant.lastSyncAt
    });

  } catch (err) {
    logger.error({ err }, 'Failed to get auth status');
    return error(res, 'Failed to get auth status', 500);
  }
}

/**
 * Handle Shopify embedded app launch
 * GET / (root path) - Shopify redirects here when opening embedded app
 */
export async function handleEmbeddedAppLaunch(req, res) {
  try {
    const { shop, hmac, timestamp, host } = req.query;
    
    if (!shop || !hmac) {
      // No Shopify params, redirect to signin page
      return res.redirect(`${config.frontendUrl}/signin`);
    }

    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    
    // Verify HMAC signature
    const hmacVerified = verifyHmac(req.query, config.shopify.apiSecret);
    if (!hmacVerified) {
      logger.error({ shopDomain }, 'HMAC verification failed for embedded app launch');
      return res.redirect(`${config.frontendUrl}/signin?error=invalid_signature`);
    }

    logger.info({ shopDomain, host }, 'Embedded app launch - HMAC verified');

    // Check if merchant exists
    let merchant = await MerchantModel.findOne({ shopDomain });

    if (!merchant) {
      // Merchant doesn't exist - for custom apps, create merchant automatically
      // using the Admin API access token from environment
      logger.info({ shopDomain }, 'Merchant not found, creating from custom app install');
      
      const adminAccessToken = process.env.ADMIN_API_ACCESS_TOKEN;
      
      if (adminAccessToken) {
        try {
          // Fetch shop info from Shopify
          const shopResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
            headers: {
              'X-Shopify-Access-Token': adminAccessToken,
            },
          });
          
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            const shopInfo = shopData.shop;
            
            // Create merchant record
            merchant = await MerchantModel.create({
              shopDomain,
              accessToken: adminAccessToken,
              scope: config.shopify.scopes,
              isActive: true,
              planTier: 'free',
              shopInfo: {
                ...shopInfo,
                connectedAt: new Date().toISOString(),
                authProvider: 'custom_app',
              },
            });
            
            logger.info({ shopDomain, merchantId: merchant.id }, 'Merchant created from custom app install');
          } else {
            logger.error({ shopDomain, status: shopResponse.status }, 'Failed to fetch shop info');
            // Fall through to OAuth flow
          }
        } catch (error) {
          logger.error({ shopDomain, error }, 'Failed to create merchant from custom app');
          // Fall through to OAuth flow
        }
      }
      
      // If still no merchant, initiate OAuth
      if (!merchant) {
        logger.info({ shopDomain }, 'Initiating OAuth flow');
        const nonce = crypto.randomBytes(16).toString('hex');
        const redirectUri = `${config.shopify.appUrl}/auth/shopify/callback`;
        const scopes = config.shopify.scopes.split(',');
        const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
          `client_id=${config.shopify.apiKey}&` +
          `scope=${scopes.join(',')}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${nonce}`;

        return res.redirect(authUrl);
      }
    }

    // Merchant exists, redirect to dashboard
    logger.info({ shopDomain, merchantId: merchant.id }, 'Merchant found, redirecting to dashboard');
    const redirectUrl = `${config.frontendUrl}/dashboard/${encodeURIComponent(shopDomain)}?host=${encodeURIComponent(host || '')}`;
    return res.redirect(redirectUrl);

  } catch (err) {
    logger.error({ err }, 'Embedded app launch failed');
    return res.redirect(`${config.frontendUrl}/signin?error=launch_failed`);
  }
}

/**
 * Disconnect merchant
 * POST /api/auth/disconnect
 */
export async function disconnectShopify(req, res) {
  try {
    const { shop } = req.body;
    
    if (!shop) {
      return error(res, 'Shop domain is required', 400);
    }

    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    const merchant = await MerchantModel.findOne({ shopDomain });

    if (!merchant) {
      return error(res, 'Merchant not found', 404);
    }

    // Mark as inactive instead of deleting
    merchant.isActive = false;
    await merchant.save();

    logger.info({ shopDomain }, 'Merchant disconnected');

    return success(res, {
      message: 'Store disconnected successfully',
      shopDomain
    });

  } catch (err) {
    logger.error({ err }, 'Failed to disconnect merchant');
    return error(res, 'Failed to disconnect store', 500);
  }
}

/**
 * Register Shopify webhooks for real-time updates
 * @param {string} shopDomain - Shopify shop domain
 * @param {string} accessToken - Shopify access token
 */
async function registerWebhooks(shopDomain, accessToken) {
  const webhookUrl = `${process.env.APP_URL}/webhooks/shopify`;
  const topics = [
    'orders/create',
    'orders/updated',
    'products/create',
    'products/update',
    'app/uninstalled'
  ];

  for (const topic of topics) {
    try {
      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: webhookUrl,
            format: 'json',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Ignore duplicate webhook errors
        if (error.errors?.topic?.includes('already exists')) {
          logger.info({ shopDomain, topic }, 'Webhook already registered');
          continue;
        }
        throw new Error(`Failed to register ${topic}: ${JSON.stringify(error)}`);
      }

      logger.info({ shopDomain, topic }, 'Webhook registered');
    } catch (err) {
      logger.warn({ shopDomain, topic, error: err.message }, 'Webhook registration failed');
    }
  }
}
