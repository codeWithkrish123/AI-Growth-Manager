import { query } from './src/config/database.js';

const shop = 'ai-product-optimizer.myshopify.com';

// Check current state
const check = await query('SELECT id, shop_domain, is_active, access_token_enc FROM merchants WHERE shop_domain = $1', [shop]);

if (check.rows.length === 0) {
  console.log('❌ No merchant found for:', shop);
  console.log('→ You need to connect your store via /onboarding first.');
} else {
  const m = check.rows[0];
  console.log('Found merchant:', { id: m.id, shop: m.shop_domain, is_active: m.is_active, has_token: !!m.access_token_enc });

  if (!m.is_active) {
    const fix = await query('UPDATE merchants SET is_active = true, updated_at = NOW() WHERE shop_domain = $1 RETURNING id, shop_domain, is_active', [shop]);
    console.log('✅ Reactivated merchant:', fix.rows[0]);
  } else {
    console.log('✅ Merchant is already active. Issue might be missing access token.');
    if (!m.access_token_enc) {
      console.log('⚠️  access_token_enc is empty — you need to reconnect your store via /onboarding to get a fresh Shopify token.');
    }
  }
}
process.exit(0);
