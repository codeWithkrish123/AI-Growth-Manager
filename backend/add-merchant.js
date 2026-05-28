import dotenv from 'dotenv';
import { query } from './src/config/database.js';
import { MerchantModel } from './src/models/index.js';
import { encrypt } from './src/utils/encryption.js';
import fs from 'fs';

dotenv.config();

const shopDomain = 'ai-product-optimizer.myshopify.com';
// This is the Admin API access token from your custom app installation
const accessToken = process.env.ADMIN_API_ACCESS_TOKEN;

const logFile = fs.createWriteStream('add-merchant.log', { flags: 'a' });
const log = (msg) => {
  console.log(msg);
  logFile.write(msg + '\n');
};

async function addMerchant() {
  try {
    log('Starting merchant addition...');
    log(`Shop Domain: ${shopDomain}`);
    log(`Access Token: ${accessToken.substring(0, 20)}...`);
    
    // Check if merchant already exists
    log('Checking if merchant exists...');
    const existingMerchant = await MerchantModel.findOne({ shopDomain });
    
    if (existingMerchant) {
      log('✓ Merchant already exists in database');
      log(`  - ID: ${existingMerchant.id}`);
      log(`  - Active: ${existingMerchant.isActive}`);
      logFile.end();
      process.exit(0);
    }
    
    log('Merchant not found, creating new record...');
    
    // Fetch shop info from Shopify
    log('Fetching shop info from Shopify...');
    const shopResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });
    
    log(`Shop API response status: ${shopResponse.status}`);
    
    if (!shopResponse.ok) {
      const errorText = await shopResponse.text();
      log(`Failed to fetch shop info: ${shopResponse.statusText}`);
      log(`Error response: ${errorText}`);
      throw new Error(`Failed to fetch shop info: ${shopResponse.statusText}`);
    }
    
    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;
    
    log('Shop info fetched:');
    log(`  - Name: ${shopInfo.name}`);
    log(`  - Email: ${shopInfo.email}`);
    
    // Create merchant record
    log('Creating merchant record in database...');
    const merchant = await MerchantModel.create({
      shopDomain,
      accessToken,
      scope: process.env.SHOPIFY_API_SCOPES || 'read_products,write_products,read_orders,read_customers,read_checkouts,read_price_rules,write_price_rules,read_discounts',
      isActive: true,
      planTier: 'free',
      shopInfo: {
        ...shopInfo,
        connectedAt: new Date().toISOString(),
        authProvider: 'custom_app',
      },
    });
    
    log('✓ Merchant created successfully');
    log(`  - ID: ${merchant.id}`);
    log(`  - Shop Domain: ${merchant.shopDomain}`);
    log(`  - Shop Name: ${merchant.shopInfo.name}`);
    
    logFile.end();
    process.exit(0);
  } catch (error) {
    log('Error adding merchant:');
    log(`  - Message: ${error.message}`);
    log(`  - Stack: ${error.stack}`);
    logFile.end();
    process.exit(1);
  }
}

addMerchant();
