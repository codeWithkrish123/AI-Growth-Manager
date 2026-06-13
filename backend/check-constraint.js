import { query } from './src/config/database.js';
const r = await query(`SELECT pg_get_constraintdef(c.oid) as def FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'email_campaigns' AND c.conname = 'email_campaigns_type_check'`);
console.log(r.rows[0]?.def);
process.exit(0);
