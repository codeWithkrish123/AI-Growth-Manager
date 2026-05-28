import dotenv from 'dotenv';
import { query } from './src/config/database.js';
import { MerchantModel } from './src/models/index.js';

dotenv.config();

const shopDomain = 'ai-product-optimizer.myshopify.com';

async function checkMerchant() {
  try {
    console.log('Starting merchant check...');
    console.log(`Checking for merchant with shop domain: ${shopDomain}`);
    
    // First, check all merchants directly via SQL
    console.log('\n--- Checking database directly ---');
    const result = await query('SELECT id, shop_domain, is_active, plan_tier, created_at FROM merchants');
    console.log(`Total merchants found: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log(`  - ${row.shop_domain} (ID: ${row.id}, Active: ${row.is_active})`);
    });
    
    // Now check via MerchantModel
    console.log('\n--- Checking via MerchantModel ---');
    const merchant = await MerchantModel.findOne({ shopDomain });
    
    if (merchant) {
      console.log('✓ Merchant found:');
      console.log('  - ID:', merchant.id);
      console.log('  - Shop Domain:', merchant.shopDomain);
      console.log('  - Is Active:', merchant.isActive);
      console.log('  - Plan Tier:', merchant.planTier);
      console.log('  - Shop Info:', JSON.stringify(merchant.shopInfo, null, 2));
      console.log('  - Last Sync At:', merchant.lastSyncAt);
    } else {
      console.log('✗ Merchant NOT found in database');
      console.log('  You need to create a merchant record for this shop domain.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking merchant:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

checkMerchant();
