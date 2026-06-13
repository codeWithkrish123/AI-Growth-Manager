/**
 * Run this script to update the Shopify access token for ai-product-optimizer.
 * Usage: node update-token.js <your-shpat-token>
 * Example: node update-token.js shpat_abc123...
 */
import './src/loadEnv.js';
import CryptoJS from 'crypto-js';
import { Pool } from 'pg';

const token = process.argv[2];
if (!token) {
  console.error('Usage: node update-token.js <shpat_token>');
  console.error('Example: node update-token.js shpat_abc123def456...');
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT),
});

const KEY = process.env.ENCRYPTION_KEY;
const encrypted = CryptoJS.AES.encrypt(token, KEY).toString();

const result = await pool.query(
  `UPDATE merchants 
   SET access_token_enc = $1, is_active = true, updated_at = NOW()
   WHERE shop_domain = 'ai-product-optimizer.myshopify.com'
   RETURNING id, shop_domain`,
  [encrypted]
);

if (result.rows.length > 0) {
  console.log('✅ Token updated for:', result.rows[0].shop_domain);
  console.log('Merchant ID:', result.rows[0].id);
} else {
  console.log('❌ No merchant found. Creating new record...');
  
  const insertResult = await pool.query(
    `INSERT INTO merchants (shop_domain, access_token_enc, scope, is_active, plan_tier, shop_info)
     VALUES ($1, $2, $3, true, 'free', $4)
     ON CONFLICT (shop_domain) DO UPDATE SET
       access_token_enc = EXCLUDED.access_token_enc,
       is_active = true,
       updated_at = NOW()
     RETURNING id, shop_domain`,
    [
      'ai-product-optimizer.myshopify.com',
      encrypted,
      'read_products,write_products,read_orders,read_customers,read_checkouts,read_price_rules,write_price_rules,read_discounts',
      JSON.stringify({ name: 'AI Product Optimizer', authProvider: 'custom_app', connectedAt: new Date().toISOString() })
    ]
  );
  console.log('✅ Created merchant:', insertResult.rows[0]);
}

await pool.end();
console.log('\nNow restart the backend and your dashboard should show real data.');
