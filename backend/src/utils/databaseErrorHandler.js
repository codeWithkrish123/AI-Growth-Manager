/**
 * Database Error Handler
 * Provides consistent error handling for PostgreSQL operations
 */

import { logger } from './logger.js';
import { DatabaseError } from './error.js';

export class DatabaseErrorHandler {
  static handle(error, operation = 'database operation') {
    logger.error({ error, operation }, 'Database operation failed');

    // PostgreSQL error codes
    const errorCode = error.code;
    const errorMessage = error.message;

    switch (errorCode) {
      case '23505': // Unique constraint violation
        throw new DatabaseError('Duplicate entry detected. This record already exists.', 'DUPLICATE_ENTRY');
      
      case '23503': // Foreign key constraint violation
        throw new DatabaseError('Referenced record does not exist.', 'FOREIGN_KEY_VIOLATION');
      
      case '23502': // Not null constraint violation
        throw new DatabaseError('Required field is missing.', 'NULL_VIOLATION');
      
      case '23514': // Check constraint violation
        throw new DatabaseError('Invalid data provided.', 'CHECK_VIOLATION');
      
      case '28P01': // Authentication failed
        throw new DatabaseError('Database authentication failed.', 'AUTH_ERROR');
      
      case 'ECONNREFUSED': // Connection refused
        throw new DatabaseError('Cannot connect to database.', 'CONNECTION_ERROR');
      
      case 'ENOTFOUND': // Host not found
        throw new DatabaseError('Database server not found.', 'HOST_ERROR');
      
      case '08006': // Connection failure
        throw new DatabaseError('Database connection failed.', 'CONNECTION_FAILURE');
      
      case '08001': // SQL client unable to establish connection
        throw new DatabaseError('Unable to establish database connection.', 'CONNECTION_ESTABLISHMENT_ERROR');
      
      case '53300': // Too many connections
        throw new DatabaseError('Database has too many connections.', 'TOO_MANY_CONNECTIONS');
      
      case '54000': // Statement too complex
        throw new DatabaseError('Query is too complex.', 'QUERY_TOO_COMPLEX');
      
      case '53100': // Disk full
        throw new DatabaseError('Database disk is full.', 'DISK_FULL');
      
      case '55P03': // Lock not available
        throw new DatabaseError('Resource is locked. Please try again.', 'LOCK_NOT_AVAILABLE');
      
      case '55P04': // Deadlock detected
        throw new DatabaseError('Deadlock detected. Please retry the operation.', 'DEADLOCK_DETECTED');
      
      default:
        // Log unknown errors for debugging
        logger.warn({ errorCode, errorMessage }, 'Unknown database error code');
        throw new DatabaseError(`Database error: ${errorMessage}`, 'UNKNOWN_ERROR');
    }
  }

  static async withErrorHandling(operation, errorContext = 'database operation') {
    try {
      return await operation();
    } catch (error) {
      // If it's already a DatabaseError, re-throw it
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      // Handle other database-related errors
      this.handle(error, errorContext);
    }
  }

  static logQuery(query, params = [], duration = null) {
    const logData = {
      query: query.replace(/\s+/g, ' ').trim(),
      params: params.length > 0 ? params : undefined,
      duration: duration ? `${duration}ms` : undefined,
    };

    logger.debug(logData, 'Database query executed');
  }

  static logSlowQuery(query, params = [], duration) {
    const logData = {
      query: query.replace(/\s+/g, ' ').trim(),
      params: params.length > 0 ? params : undefined,
      duration: `${duration}ms`,
    };

    logger.warn(logData, 'Slow database query detected');
  }
}

// Helper function to wrap database operations with error handling
export function withDatabaseErrorHandling(operation, context) {
  return DatabaseErrorHandler.withErrorHandling(operation, context);
}

// Helper function to log and execute queries
export async function executeQueryWithLogging(queryFn, query, params = []) {
  const startTime = Date.now();
  
  try {
    const result = await queryFn(query, params);
    const duration = Date.now() - startTime;
    
    DatabaseErrorHandler.logQuery(query, params, duration);
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      DatabaseErrorHandler.logSlowQuery(query, params, duration);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    DatabaseErrorHandler.logQuery(query, params, duration);
    throw error;
  }
}

export default DatabaseErrorHandler;
