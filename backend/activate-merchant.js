/**
 * One-time script to activate merchant(s) stuck as is_active=false
 * Usage on Render shell: node activate-merchant.js
 */
import { query } from './src/config/database.js';

const TARGET_ID = '7fe4aa1e-0d4c-46ef-8470-5235473dd6c5';

async function run() {
  // Show current state
  const before = await query(
    'SELECT id, shop_domain, is_active, (access_token_enc != \'\') as has_token FROM merchants WHERE id = $1',
    [TARGET_ID]
  );

  if (!before.rows.length) {
    console.log('❌ Merchant not found:', TARGET_ID);
    // List all merchants to help debug
    const all = await query('SELECT id, shop_domain, is_active FROM merchants ORDER BY created_at DESC LIMIT 5');
    console.log('📋 Recent merchants:', all.rows);
    process.exit(1);
  }

  console.log('📋 Before:', before.rows[0]);

  // Activate
  const result = await query(
    `UPDATE merchants
     SET is_active   = true,
         updated_at  = NOW()
     WHERE id = $1
     RETURNING id, shop_domain, is_active`,
    [TARGET_ID]
  );

  console.log('✅ Activated:', result.rows[0]);
  process.exit(0);
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
