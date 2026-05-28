import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { MerchantModel } from '../models/index.js';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { oauth2Client } from '../config/google.js';

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
    console.log('Google OAuth callback received');
    const { code } = req.query;
    console.log('Code received:', !!code);
    
    if (!code) {
      console.log('No code provided');
      return error(res, 'Authorization code not provided', 400);
    }

    // Get tokens from Google
    console.log('Getting tokens from Google...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received successfully');
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    console.log('Getting user info from Google...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    console.log('User info received:', userInfo.email);

    // Find or create merchant
    console.log('Finding merchant for email:', userInfo.email);
    let merchant = await MerchantModel.findOne({ email: userInfo.email });
    console.log('Merchant found:', !!merchant);
    
    if (!merchant) {
      // Create new merchant for Google user
      console.log('Creating new merchant...');
      merchant = await MerchantModel.create({
        email: userInfo.email,
        shopDomain: `${userInfo.email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.myshopify.com`,
        shopInfo: {
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          authProvider: 'google'
        },
        isActive: true,
        planTier: 'free',
        lastSyncAt: null
      });
      console.log('Merchant created successfully');
    } else {
      // Update existing merchant with Google info
      console.log('Updating existing merchant...');
      merchant.shopInfo = {
        ...merchant.shopInfo,
        name: userInfo.name,
        picture: userInfo.picture,
        authProvider: 'google'
      };
      await merchant.save();
      console.log('Merchant updated successfully');
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { 
        merchantId: merchant.id,
        email: merchant.email,
        shopDomain: merchant.shopDomain 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT token generated successfully');

    // Redirect to onboarding page (not dashboard) - user needs to connect store first
    const redirectUrl = `${process.env.FRONTEND_URL}/onboarding?token=${token}&merchant=${encodeURIComponent(merchant.shopDomain)}`;
    console.log('Redirecting to:', redirectUrl);
    
    logger.info({ email: userInfo.email, shopDomain: merchant.shopDomain }, 'Google OAuth successful');
    return res.redirect(redirectUrl);

  } catch (err) {
    logger.error({ err, message: err.message, stack: err.stack }, 'Google auth callback failed');
    
    // Provide more detailed error message
    const errorMessage = err.message || 'Authentication failed';
    return error(res, `Google authentication failed: ${errorMessage}`, 500);
  }
}
