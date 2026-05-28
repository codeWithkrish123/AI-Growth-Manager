/**
 * Database Migration Script
 * Converts MongoDB models to PostgreSQL
 * Run this once to migrate existing data
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    logger.info('Starting database migration...');
    
    // Read and execute schema
    const schemaPath = path.join(import.meta.dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema creation
    await query(schema);
    
    logger.info('Database migration completed successfully');
    
  } catch (error) {
    logger.error({ error }, 'Database migration failed');
    throw error;
  }
}

// Export for use in setup scripts
export { runMigration };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      logger.info('Migration completed - exiting');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Migration failed - exiting');
      process.exit(1);
    });
}
