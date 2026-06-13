import { Pool } from 'pg';
import { config } from './index.js';
import { logger } from '../utils/logger.js';
import { DatabaseErrorHandler, executeQueryWithLogging } from '../utils/databaseErrorHandler.js';

// Connection pool configuration
const poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD), // 🔥 force string
  port: Number(process.env.DB_PORT),
  
  // Connection pooling settings
  max: 20, // Maximum number of connections in pool
  min: 5,  // Minimum number of connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not established
  
  // Retry settings
  retry: 3,
  retryDelay: 1000,
};

const pool = new Pool(poolConfig);

// Enhanced query function with error handling and logging
export async function query(text, params) {
  return executeQueryWithLogging(
    async (q, p) => {
      const start = Date.now();
      try {
        const result = await pool.query(q, p);
        return result;
      } catch (error) {
        throw error;
      }
    },
    text,
    params
  );
}

// Database connection with comprehensive error handling
export async function connectDB() {
  try {
    // Test the connection
    const client = await pool.connect();
    
    try {
      await client.query('SELECT NOW()');
      logger.info('PostgreSQL connected successfully');
      
      // Log connection pool status
      logger.info({
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      }, 'PostgreSQL connection pool status');
      
    } finally {
      client.release();
    }

    // Handle connection pool events
    pool.on('error', (err) => {
      logger.error({ err }, 'PostgreSQL pool error - attempting to reconnect');
      // Don't exit the process, let the pool handle reconnection
    });

    pool.on('connect', (client) => {
      logger.debug('New PostgreSQL client connected to pool');
    });

    pool.on('remove', (client) => {
      logger.debug('PostgreSQL client removed from pool');
    });

    pool.on('acquire', (client) => {
      logger.debug('PostgreSQL client acquired from pool');
    });

  } catch (err) {
    DatabaseErrorHandler.handle(err, 'database connection');
  }
}

// Graceful database shutdown
export async function disconnectDB() {
  try {
    logger.info('Closing PostgreSQL connection pool...');
    await pool.end();
    logger.info('PostgreSQL connection pool closed successfully');
  } catch (err) {
    logger.error({ err }, 'Error closing PostgreSQL connection pool');
    throw err;
  }
}

// Health check for database
export async function healthCheck() {
  try {
    const result = await query('SELECT 1 as health_check');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      }
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message,
    };
  }
}

// Transaction helper
export async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create a query function that uses this client
    const txQuery = async (text, params) => {
      return executeQueryWithLogging(
        async (q, p) => client.query(q, p),
        text,
        params
      );
    };
    
    const result = await callback(txQuery);
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Batch query helper for multiple operations
export async function batchQuery(queries) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const results = [];
    
    for (const { text, params } of queries) {
      const result = await client.query(text, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { pool };