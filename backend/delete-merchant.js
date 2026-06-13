import dotenv from 'dotenv';
import { query } from './src/config/database.js';

dotenv.config();

const shopDomain = 'ai-product-optimizer.myshopify.com';

async function deleteMerchant() {
  try {
    console.log(`Attempting to delete merchant: ${shopDomain}`);
    
    // First let's check if the merchant exists
    const checkRes = await query('SELECT id FROM merchants WHERE shop_domain = $1', [shopDomain]);
    
    if (checkRes.rows.length === 0) {
      console.log(`Merchant ${shopDomain} does not exist in the database.`);
      process.exit(0);
    }
    
    const merchantId = checkRes.rows[0].id;
    console.log(`Found merchant with ID: ${merchantId}. Deleting...`);
    
    // Delete the merchant (cascading deletes will handle all other tables automatically)
    const deleteRes = await query('DELETE FROM merchants WHERE id = $1 RETURNING *', [merchantId]);
    
    if (deleteRes.rows.length > 0) {
      console.log(`✓ Successfully deleted merchant: ${shopDomain} (ID: ${merchantId})`);
    } else {
      console.error('Failed to delete merchant.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting merchant:', error);
    process.exit(1);
  }
}

deleteMerchant();
