import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { MerchantModel } from '../models/index.js';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { oauth2Client } from '../config/google.js';

// Purge merchant record (Admin utility)
export async function purgeMerchant(req, res) {
  try {
    const { key } = req.query;
    if (key !== process.env.AI_GROWTH_MANAGER_KEY) {
      return error(res, 'Unauthorized: Invalid key', 401);
    }
    
    const { shopDomain } = req.params;
    const deleted = await MerchantModel.deleteByShopDomain(shopDomain);
    
    logger.info({ shopDomain, deleted }, 'Merchant purged via admin route');
    return success(res, { deleted, shopDomain });
  } catch (err) {
    logger.error({ err }, 'Failed to purge merchant');
    return error(res, 'Failed to purge merchant', 500);
  }
}

// Get Google OAuth URL
export async function getGoogleAuthUrl(req, res) {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    return success(res, { authUrl: url });
  } catch (err) {
    logger.error({ err }, 'Google auth URL generation failed');
    return error(res, 'Failed to generate auth URL', 500);
  }
}

// Handle Google OAuth callback
export async function handleGoogleCallback(req, res) {
  try {
    logger.debug('Google OAuth callback received');
    const { code } = req.query;
    logger.debug({ hasCode: !!code }, 'OAuth code status');
    
    if (!code) {
      logger.warn('Google OAuth callback missing authorization code');
      return error(res, 'Authorization code not provided', 400);
    }

    // Get tokens from Google
    logger.debug('Requesting tokens from Google OAuth');
    const { tokens } = await oauth2Client.getToken(code);
    logger.debug('Google OAuth tokens received successfully');
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    logger.debug('Fetching user info from Google API');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    logger.debug({ email: userInfo.email }, 'Google user info retrieved');

    // Find or create merchant
    logger.debug({ email: userInfo.email }, 'Looking up merchant by email');
    let merchant = await MerchantModel.findOne({ email: userInfo.email });
    logger.debug({ merchantExists: !!merchant }, 'Merchant lookup result');
    
    if (!merchant) {
      // Create a placeholder merchant for Google user — NO fake shopDomain
      // They will connect their real Shopify store in onboarding
      logger.info({ email: userInfo.email }, 'Creating new user record for Google user');
      merchant = await MerchantModel.create({
        shopDomain: `pending-${Date.now()}.myshopify.com`, // temp placeholder, will be updated after Shopify OAuth
        shopInfo: {
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          authProvider: 'google',
          shopifyConnected: false,
        },
        isActive: false, // not active until Shopify store is connected
        planTier: 'free',
        lastSyncAt: null
      });
      logger.info({ merchantId: merchant.id, email: userInfo.email }, 'New user record created — needs Shopify store connection');
    } else {
      // Update existing merchant with Google info
      logger.debug({ merchantId: merchant.id }, 'Updating existing merchant with Google info');
      merchant.shopInfo = {
        ...merchant.shopInfo,
        name: userInfo.name,
        picture: userInfo.picture,
        authProvider: 'google'
      };
      await merchant.save();
      logger.debug({ merchantId: merchant.id }, 'Merchant updated successfully');
    }

    // Generate JWT token
    logger.debug({ merchantId: merchant.id }, 'Generating JWT token');
    const token = jwt.sign(
      { 
        merchantId: merchant.id,
        email: userInfo.email,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Redirect to onboarding — user must connect their real Shopify store
    // Do NOT pass the fake shopDomain — frontend will prompt for real store
    const redirectUrl = `${process.env.FRONTEND_URL}/onboarding?token=${token}`;
    logger.info({ email: userInfo.email }, 'Google OAuth successful — redirecting to onboarding');
    return res.redirect(redirectUrl);

  } catch (err) {
    logger.error({ err, message: err.message, stack: err.stack }, 'Google auth callback failed');
    
    // Provide more detailed error message
    const errorMessage = err.message || 'Authentication failed';
    const errorDetails = err.response?.data || err.code || '';
    return error(res, `Google authentication failed: ${errorMessage} ${JSON.stringify(errorDetails)}`, 500);
  }
}
