/**
 * Meta Ads Service — AI Growth Manager
 * Handles direct communication with the Meta Graph API.
 */

import axios from 'axios';
import { logger } from '../../utils/logger.js';

const META_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${META_VERSION}`;

/**
 * Fetch campaigns for a Meta Ad Account
 */
export async function fetchMetaCampaigns(accountId, accessToken) {
  try {
    const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const response = await axios.get(`${BASE_URL}/${actId}/campaigns`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      }
    });

    return response.data.data.map(c => ({
      platform_campaign_id: c.id,
      name: c.name,
      status: c.status?.toLowerCase() === 'active' ? 'active' : 'paused',
      objective: c.objective?.toLowerCase(),
      daily_budget: (parseFloat(c.daily_budget) || 0) / 100, // Meta uses cents
      start_date: c.start_time,
      end_date: c.stop_time,
    }));
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'Failed to fetch Meta campaigns');
    throw new Error('Meta API Error: ' + (err.response?.data?.error?.message || err.message));
  }
}

/**
 * Update campaign status (PAUSED or ACTIVE)
 */
export async function updateMetaCampaignStatus(campaignId, status, accessToken) {
  try {
    await axios.post(`${BASE_URL}/${campaignId}`, null, {
      params: {
        access_token: accessToken,
        status: status.toUpperCase(), // Meta expects ACTIVE or PAUSED
      }
    });
    return true;
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'Failed to update Meta campaign');
    throw new Error('Meta API Error: ' + (err.response?.data?.error?.message || err.message));
  }
}

/**
 * Fetch insights for a Meta campaign
 */
export async function fetchMetaInsights(campaignId, accessToken) {
  try {
    const response = await axios.get(`${BASE_URL}/${campaignId}/insights`, {
      params: {
        access_token: accessToken,
        fields: 'impressions,clicks,spend,conversions,actions',
        date_preset: 'last_30d',
      }
    });

    const insight = response.data.data[0] || {};
    // Extract revenue from actions array if present
    const revenueAction = insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase');
    
    return {
      impressions: parseInt(insight.impressions) || 0,
      clicks: parseInt(insight.clicks) || 0,
      spend: parseFloat(insight.spend) || 0,
      revenue: parseFloat(revenueAction?.value) || 0,
    };
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'Failed to fetch Meta insights');
    return null;
  }
}
