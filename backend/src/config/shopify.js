import 'dotenv/config';
import { shopifyApi } from '@shopify/shopify-api';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  shopify: {
    apiKey: required('SHOPIFY_API_KEY'),
    apiSecret: required('SHOPIFY_API_SECRET'),
    scopes: required('SHOPIFY_SCOPES').split(','),
    appUrl: required('APP_URL'),
  },
};

export const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: config.shopify.scopes,
  hostName: config.shopify.appUrl.replace(/^https?:\/\//, ''),
  apiVersion: '2024-01', // ✅ fixed
  isEmbeddedApp: true,
});