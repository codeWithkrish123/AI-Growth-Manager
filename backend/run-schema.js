import fs from 'fs';
import { query } from './src/config/database.js';

async function runSchema() {
  try {
    console.log('Reading schema.sql...');
    const schema = fs.readFileSync('./src/database/schema.sql', 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        }
      }
    }
    
    console.log('✅ Schema execution completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing schema:', err.message);
    process.exit(1);
  }
}

runSchema();
