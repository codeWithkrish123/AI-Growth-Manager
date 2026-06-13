import { query } from './src/config/database.js';

// Drop old constraint and add a new permissive one
await query(`ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_type_check`);
await query(`ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_type_check 
  CHECK (type IN ('abandoned_cart','win_back','winback','welcome','manual','promotional','newsletter','announcement'))`);

console.log('✅ email_campaigns type constraint updated');
process.exit(0);
