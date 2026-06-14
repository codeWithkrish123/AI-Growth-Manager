import '../loadEnv.js';
import { shopifyApi } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || 'default-key',
    apiSecret: process.env.SHOPIFY_API_SECRET || 'default-secret',
    scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_orders').split(','),
    appUrl: process.env.APP_URL || 'http://localhost:3001',
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