import express from 'express';
import {
  initiateShopifyAuth,
  handleShopifyCallback,
  getAuthStatus,
  disconnectShopify
} from '../controllers/shopify.controller.js';

const router = express.Router();

// Initiate Shopify OAuth flow
router.post('/shopify', initiateShopifyAuth);

// Handle Shopify OAuth callback
router.get('/callback', handleShopifyCallback);

// Get merchant auth status
router.get('/status', getAuthStatus);

// Disconnect Shopify store
router.post('/disconnect', disconnectShopify);

export default router;
