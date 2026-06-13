/**
 * Usage: node refresh-token.js <your_new_shpat_token>
 * Gets a fresh token from: Shopify Admin → Apps → Your App → API credentials
 */
import 'dotenv/config';
import { encrypt } from './src/utils/encryption.js';
import pkg from 'pg';
const { Pool } = pkg;

const token = process.argv[2];
const shop  = process.argv[3] || 'ai-product-optimizer.myshopify.com';

if (!token || !token.startsWith('shpat_')) {
  console.error('❌  Usage: node refresh-token.js shpat_xxxxx [shop-domain]');
  console.error('   Get token from: Shopify Admin → Settings → Apps → Your app → API credentials');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.POSTGRES_URI });

try {
  const encrypted = encrypt(token);
  const result = await pool.query(
    `UPDATE merchants SET access_token_enc = $1, updated_at = NOW() WHERE shop_domain = $2 RETURNING shop_domain`,
    [encrypted, shop]
  );

  if (result.rowCount === 0) {
    console.error(`❌  No merchant found for ${shop}. Run OAuth first via /onboarding.`);
  } else {
    console.log(`✅  Token updated for ${shop}`);
    console.log('   Restart your backend, then refresh the dashboard.');
  }
} catch (e) {
  console.error('❌  Failed:', e.message);
} finally {
  await pool.end();
}
