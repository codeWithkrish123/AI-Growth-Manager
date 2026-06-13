import fs from 'fs';
import { query } from './src/config/database.js';

async function runSchema() {
  try {
    console.log('Reading schema.sql...');
    const schema = fs.readFileSync('./src/database/schema.sql', 'utf8');
    
    console.log('Executing full schema...');
    await query(schema);
    
    console.log('✅ Schema execution completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing schema:', err.message);
    process.exit(1);
  }
}

runSchema();
