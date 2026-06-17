import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { MerchantModel, Merchant } from '../models/index.js';
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
    
    // Validate shop domain format - allow letters, numbers, and hyphens
    const shopName = shopDomain.replace('.myshopify.com', '');
    if (!shopName.match(/^[a-z0-9][a-z0-9-]*$/)) {
      logger.error({ shop, shopDomain, shopName }, 'Invalid shop domain format');
      return error(res, `Invalid shop domain. Please enter a valid Shopify store name.`, 400);
    }

    // Check if merchant already exists (non-fatal if DB is unavailable)
    let existingMerchant = null;
    try {
      existingMerchant = await MerchantModel.findOne({ shopDomain });
    } catch (dbErr) {
      logger.warn({ shopDomain, err: dbErr.message }, 'DB unavailable during merchant lookup, proceeding with OAuth');
    }

    if (existingMerchant && !force) {
      logger.info({ shopDomain }, 'Merchant already exists, skipping OAuth');
      return success(res, {
        message: 'Store already connected',
        shopDomain,
        redirectTo: `/dashboard/${shopDomain}`
      });
    }

    // If force is true, mark as inactive to allow re-authentication
    if (existingMerchant && force) {
      logger.info({ shopDomain }, 'Force re-auth requested');
      try {
        await MerchantModel.findOneAndUpdate({ shopDomain }, { isActive: false });
      } catch (updateErr) {
        logger.warn({ shopDomain, err: updateErr.message }, 'Failed to mark merchant as inactive');
      }
    }

    // Validate config is set
    if (!config.shopify?.apiKey || !config.shopify?.appUrl) {
      logger.error('Shopify config missing: apiKey or appUrl');
      return error(res, 'Server configuration error. Please contact support.', 500);
    }

    // Build state parameter with optional merchant ID for account linking
    const authHeader = req.headers.authorization;
    let stateData = { nonce: crypto.randomBytes(16).toString('hex') };
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);
        if (decoded.merchantId) {
          stateData.merchantId = decoded.merchantId;
          logger.info({ merchantId: decoded.merchantId }, 'Linking Shopify store to existing merchant record');
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Invalid token during Shopify OAuth initiation, proceeding without linking');
      }
    }
    
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Build Shopify OAuth URL
    const redirectUri = `${config.shopify.appUrl}/auth/shopify/callback`;
    const scopes = config.shopify.scopes?.split(',') || [];
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${config.shopify.apiKey}&` +
      `scope=${scopes.join(',')}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    // Generate JWT token for the session (to keep it alive during OAuth)
    // Extract merchantId from request if user is authenticated via Bearer token
    let merchantId = 'temp'; 
    if (req.user && req.user.merchantId) {
        merchantId = req.user.merchantId;
    } else if (req.user && req.user.email) {
        // Fallback: Lookup by email if merchantId is missing but email is present
        const merchantByEmail = await MerchantModel.findOne({ email: req.user.email });
        if (merchantByEmail) {
            merchantId = merchantByEmail.id;
        }
    } else if (existingMerchant) {
        merchantId = existingMerchant.id;
    }
    
    const token = jwt.sign(
      { merchantId: merchantId },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    logger.info({ shopDomain }, 'Initiating Shopify OAuth');

    return success(res, {
      authUrl,
      shopDomain,
      state,
      token // Return the current token to the frontend
    });

  } catch (err) {
    logger.error({ err, message: err.message }, 'Shopify OAuth initiation failed');
    return error(res, 'Failed to initiate authentication. Please try again later.', 500);
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
      logger.warn({ code, hmac, shop }, 'Missing required OAuth parameters');
      return res.redirect(`${config.frontendUrl}/signin?error=missing_params`);
    }

    const shopDomain = shop.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    
    // Verify HMAC signature
    try {
      const hmacVerified = verifyHmac(req.query, config.shopify.apiSecret);
      if (!hmacVerified) {
        logger.error({ shopDomain }, 'HMAC verification failed');
        return res.redirect(`${config.frontendUrl}/signin?error=invalid_signature`);
      }
    } catch (hmacErr) {
      logger.error({ shopDomain, err: hmacErr.message }, 'HMAC verification error');
      return res.redirect(`${config.frontendUrl}/signin?error=verification_failed`);
    }

    // Decode state to check for merchantId (account linking)
    let merchantId = null;
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        merchantId = decodedState.merchantId;
      } catch (e) {
        logger.warn('Failed to decode OAuth state');
      }
    }

    logger.info({ shopDomain, merchantId }, 'HMAC verified, exchanging code for access token');

    // Exchange authorization code for access token
    let tokenResponse;
    try {
      tokenResponse = await exchangeCodeForToken(shopDomain, code);
    } catch (tokenErr) {
      logger.error({ shopDomain, err: tokenErr.message }, 'Failed to exchange code for token');
      return res.redirect(`${config.frontendUrl}/signin?error=token_exchange_failed`);
    }
    
    if (!tokenResponse?.access_token) {
      logger.error({ shopDomain }, 'No access token received');
      return res.redirect(`${config.frontendUrl}/signin?error=no_access_token`);
    }

    // Get shop information
    let shopInfo;
    try {
      shopInfo = await getShopInfo(shopDomain, tokenResponse.access_token);
    } catch (shopErr) {
      logger.error({ shopDomain, err: shopErr.message }, 'Failed to get shop info');
      return res.redirect(`${config.frontendUrl}/signin?error=shop_info_failed`);
    }

    // Create or update merchant
    let merchant;
    try {
      if (merchantId) {
        // Account linking: update the existing merchant record
        // Force update shopDomain to the real Shopify domain
        merchant = await MerchantModel.findOneAndUpdate(
          { _id: merchantId },
          {
            shopDomain,
            accessToken: tokenResponse.access_token,
            scope: tokenResponse.scope,
            shopInfo: {
              ...shopInfo,
              connectedAt: new Date().toISOString(),
              authProvider: 'shopify_linked'
            },
            isActive: true
          }
        );
        logger.info({ shopDomain, merchantId }, 'Merchant record linked and domain updated');
      }

      if (!merchant) {
        // Fallback or new install: create or update by shopDomain
        merchant = await Merchant.create({
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
      }
      
      // Register webhooks asynchronously (don't block redirect)
      registerWebhooks(shopDomain, tokenResponse.access_token).catch(err => {
        logger.warn({ shopDomain, err: err.message }, 'Webhook registration failed (non-critical)');
      });

    } catch (createErr) {
      logger.error({ shopDomain, err: createErr.message }, 'Failed to create/update merchant');
      return res.redirect(`${config.frontendUrl}/signin?error=merchant_creation_failed`);
    }

    // Generate JWT token for the session
    const token = jwt.sign(
      { merchantId: merchant.id, shopDomain: merchant.shopDomain },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with success and token
    const redirectUrl = `${config.frontendUrl}/dashboard/${encodeURIComponent(shopDomain)}?token=${token}&success=true`;
    res.redirect(redirectUrl);

  } catch (err) {
    logger.error({ err, message: err.message }, 'Shopify OAuth callback failed');
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
