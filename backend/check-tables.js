import { query } from './src/config/database.js';
import fs from 'fs';

const logFile = 'table-check-log.txt';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

async function checkTables() {
  try {
    log('Starting table check...');
    
    const checkResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = checkResult.rows.map(r => r.table_name);
    log(`Existing tables: ${JSON.stringify(existingTables)}`);
    
    if (existingTables.includes('store_snapshots')) {
      log('✅ store_snapshots table exists');
    } else {
      log('❌ store_snapshots table does NOT exist');
    }
    
    if (existingTables.includes('ai_analyses')) {
      log('✅ ai_analyses table exists');
    } else {
      log('❌ ai_analyses table does NOT exist');
    }
    
    if (existingTables.includes('sync_jobs')) {
      log('✅ sync_jobs table exists');
    } else {
      log('❌ sync_jobs table does NOT exist');
    }
    
    log('Table check completed');
    process.exit(0);
  } catch (error) {
    log(`Error: ${error.message}`);
    log(`Full error: ${JSON.stringify(error, null, 2)}`);
    process.exit(1);
  }
}

checkTables();
