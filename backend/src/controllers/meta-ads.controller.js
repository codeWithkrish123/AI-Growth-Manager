import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { MerchantModel } from '../models/index.js';

const META_VERSION = 'v19.0';
const BASE_URL = 'https://graph.facebook.com/' + META_VERSION;

export async function getMetaAuthUrl(req, res) {
  try {
    const { shop } = req.body;
    const appId = process.env.META_APP_ID || config.ads?.metaAppId;
    const redirectUri = process.env.META_REDIRECT_URI || config.ads?.metaRedirectUri;
    if (!appId || !redirectUri) return error(res, 'Meta Ads not configured on server', 500);
    const state = crypto.randomBytes(16).toString('hex');
    const url = 'https://www.facebook.com/' + META_VERSION + '/dialog/oauth?' +
      'client_id=' + appId +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=ads_read,ads_management,business_management' +
      '&state=' + state +
      (process.env.META_CONFIG_ID ? '&config_id=' + process.env.META_CONFIG_ID : '');
    return success(res, { authUrl: url, state });
  } catch (err) {
    logger.error({ err }, 'Failed to build Meta auth URL');
    return error(res, err.message, 500);
  }
}

export async function handleMetaCallback(req, res) {
  try {
    const { code, state } = req.query;
    const appId = process.env.META_APP_ID || config.ads?.metaAppId;
    const appSecret = process.env.META_APP_SECRET || config.ads?.metaAppSecret;
    const redirectUri = process.env.META_REDIRECT_URI || config.ads?.metaRedirectUri;
    if (!code) return res.redirect('/dashboard?meta_error=no_code');
    // Exchange code for short-lived token
    const tokenResp = await axios.get(BASE_URL + '/oauth/access_token', {
      params: { client_id: appId, redirect_uri: redirectUri, client_secret: appSecret, code },
    });
    const shortToken = tokenResp.data.access_token;
    // Exchange for long-lived token (60 days)
    const longResp = await axios.get(BASE_URL + '/oauth/access_token', {
      params: { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortToken },
    });
    const accessToken = longResp.data.access_token || shortToken;
    // Get ad accounts
    const accountsResp = await axios.get(BASE_URL + '/me/adaccounts', {
      params: { access_token: accessToken, fields: 'id,name,account_id,currency,timezone_name' },
    });
    const adAccounts = accountsResp.data.data || [];
    // Link to merchant via JWT
    const authHeader = req.headers.authorization;
    let merchantId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
        merchantId = decoded.merchantId;
      } catch {}
    }
    if (!merchantId) return res.redirect('/dashboard?meta_error=no_merchant');
    const merchant = await MerchantModel.findOne({ _id: merchantId });
    if (!merchant) return res.redirect('/dashboard?meta_error=merchant_not_found');
    // Save first ad account
    const first = adAccounts[0];
    if (first) {
      const { query: dbQuery } = await import('../config/database.js');
      await dbQuery(
        `INSERT INTO ad_accounts (merchant_id, platform, account_id, account_name, access_token, status)
         VALUES ($1, 'meta', $2, $3, $4, 'active')
         ON CONFLICT (merchant_id, platform) DO UPDATE SET
           account_id = EXCLUDED.account_id,
           account_name = EXCLUDED.account_name,
           access_token = EXCLUDED.access_token,
           status = 'active', updated_at = NOW()`,
        [merchant.id, first.account_id, first.name, accessToken]
      );
    }
    return res.redirect('/dashboard?meta_connected=true&accounts=' + adAccounts.length);
  } catch (err) {
    logger.error({ err }, 'Meta callback failed');
    return res.redirect('/dashboard?meta_error=callback_failed');
  }
}

export async function getMetaAccounts(req, res) {
  try {
    const { merchant } = req;
    const { query: dbQuery } = await import('../config/database.js');
    const result = await dbQuery('SELECT * FROM ad_accounts WHERE merchant_id = $1 AND platform = $2', [merchant.id, 'meta']);
    return success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Failed to get Meta accounts');
    return error(res, err.message, 500);
  }
}
