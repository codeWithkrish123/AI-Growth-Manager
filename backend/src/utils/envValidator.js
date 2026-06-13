/**
 * Environment Variable Validation Utility
 * 
 * Validates all required environment variables on application startup
 * and provides clear error messages for missing or invalid configurations.
 */

import { logger } from './logger.js';

/**
 * Environment variable validation rules
 */
const ENV_VALIDATION_RULES = {
  // Server Configuration
  PORT: {
    required: false,
    type: 'number',
    default: 3001,
    description: 'Port for the backend server to listen on'
  },
  NODE_ENV: {
    required: false,
    type: 'string',
    default: 'development',
    allowedValues: ['development', 'production', 'test'],
    description: 'Environment mode'
  },
  FRONTEND_URL: {
    required: true,
    type: 'url',
    description: 'Frontend application URL for CORS and redirects'
  },

  // Database Configuration
  POSTGRES_URI: {
    required: true,
    type: 'string',
    pattern: /^postgresql:\/\/.+/,
    description: 'PostgreSQL connection URI'
  },
  DB_HOST: {
    required: false,
    type: 'string',
    description: 'Database host (alternative to POSTGRES_URI)'
  },
  DB_PORT: {
    required: false,
    type: 'number',
    description: 'Database port (alternative to POSTGRES_URI)'
  },
  DB_USER: {
    required: false,
    type: 'string',
    description: 'Database username (alternative to POSTGRES_URI)'
  },
  DB_PASSWORD: {
    required: false,
    type: 'string',
    description: 'Database password (alternative to POSTGRES_URI)'
  },
  DB_NAME: {
    required: false,
    type: 'string',
    description: 'Database name (alternative to POSTGRES_URI)'
  },

  // Redis Configuration
  REDIS_URL: {
    required: true,
    type: 'string',
    pattern: /^redis:\/\/.+/,
    description: 'Redis connection URL for job queues and caching'
  },

  // Shopify Configuration
  SHOPIFY_API_KEY: {
    required: true,
    type: 'string',
    minLength: 10,
    description: 'Shopify Partner App API key'
  },
  SHOPIFY_API_SECRET: {
    required: true,
    type: 'string',
    minLength: 10,
    description: 'Shopify Partner App API secret'
  },
  SHOPIFY_SCOPES: {
    required: true,
    type: 'string',
    pattern: /^[a-z_,]+$/,
    description: 'Shopify API scopes (comma-separated)'
  },
  APP_URL: {
    required: true,
    type: 'url',
    description: 'Public app URL for OAuth callbacks and webhooks'
  },
  SHOPIFY_WEBHOOK_SECRET: {
    required: false,
    type: 'string',
    description: 'Shopify webhook secret for signature verification'
  },

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: {
    required: false,
    type: 'string',
    pattern: /\.apps\.googleusercontent\.com$/,
    description: 'Google OAuth client ID'
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    type: 'string',
    description: 'Google OAuth client secret'
  },
  GOOGLE_REDIRECT_URI: {
    required: false,
    type: 'url',
    description: 'Google OAuth redirect URI'
  },

  // Security & Encryption
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT secret for token signing (minimum 32 characters)'
  },
  ENCRYPTION_KEY: {
    required: true,
    type: 'string',
    exactLength: 32,
    description: 'Encryption key for sensitive data (exactly 32 characters)'
  },

  // AI Configuration
  AI_PROVIDER: {
    required: false,
    type: 'string',
    default: 'openai',
    allowedValues: ['openai', 'anthropic'],
    description: 'AI service provider'
  },
  OPENAI_API_KEY: {
    required: false,
    type: 'string',
    pattern: /^sk-/,
    description: 'OpenAI API key'
  },
  ANTHROPIC_API_KEY: {
    required: false,
    type: 'string',
    description: 'Anthropic API key'
  },
  AI_MODEL: {
    required: false,
    type: 'string',
    default: 'gpt-4o-mini',
    description: 'AI model to use for analysis'
  },

  // Background Job Scheduling
  SYNC_CRON: {
    required: false,
    type: 'string',
    default: '0 */1 * * *',
    description: 'Cron expression for data synchronization'
  },
  HEALTH_SNAPSHOT_CRON: {
    required: false,
    type: 'string',
    default: '0 0 * * *',
    description: 'Cron expression for health snapshots'
  }
};

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(key, value, rule) {
  const errors = [];

  // Check if required variable is missing
  if (rule.required && (!value || value.trim() === '')) {
    errors.push(`${key} is required but not set`);
    return errors;
  }

  // If not required and not set, skip further validation
  if (!value || value.trim() === '') {
    return errors;
  }

  // Type validation
  switch (rule.type) {
    case 'number':
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        errors.push(`${key} must be a valid number, got: ${value}`);
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        errors.push(`${key} must be a valid URL, got: ${value}`);
      }
      break;

    case 'string':
      // String validation is handled by other rules
      break;
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    errors.push(`${key} format is invalid: ${value}`);
  }

  // Length validation
  if (rule.minLength && value.length < rule.minLength) {
    errors.push(`${key} must be at least ${rule.minLength} characters long`);
  }

  if (rule.exactLength && value.length !== rule.exactLength) {
    errors.push(`${key} must be exactly ${rule.exactLength} characters long`);
  }

  // Allowed values validation
  if (rule.allowedValues && !rule.allowedValues.includes(value)) {
    errors.push(`${key} must be one of: ${rule.allowedValues.join(', ')}, got: ${value}`);
  }

  return errors;
}

/**
 * Validate AI provider configuration
 */
function validateAIConfiguration() {
  const errors = [];
  const provider = process.env.AI_PROVIDER || 'openai';

  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required when AI_PROVIDER is "openai"');
  }

  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is required when AI_PROVIDER is "anthropic"');
  }

  return errors;
}

/**
 * Validate Google OAuth configuration
 */
function validateGoogleOAuthConfiguration() {
  const errors = [];
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

  // If any Google OAuth variable is set, all must be set
  if (hasClientId || hasClientSecret || hasRedirectUri) {
    if (!hasClientId) errors.push('GOOGLE_CLIENT_ID is required when using Google OAuth');
    if (!hasClientSecret) errors.push('GOOGLE_CLIENT_SECRET is required when using Google OAuth');
    if (!hasRedirectUri) errors.push('GOOGLE_REDIRECT_URI is required when using Google OAuth');
  }

  return errors;
}

/**
 * Validate database configuration
 */
function validateDatabaseConfiguration() {
  const errors = [];
  const hasPostgresUri = !!process.env.POSTGRES_URI;
  const hasIndividualParams = !!(
    process.env.DB_HOST && 
    process.env.DB_PORT && 
    process.env.DB_USER && 
    process.env.DB_PASSWORD && 
    process.env.DB_NAME
  );

  if (!hasPostgresUri && !hasIndividualParams) {
    errors.push('Either POSTGRES_URI or all individual DB_* parameters (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) must be provided');
  }

  return errors;
}

/**
 * Main validation function
 */
export function validateEnvironmentVariables() {
  const errors = [];
  const warnings = [];

  logger.info('Validating environment variables...');

  // Validate individual environment variables
  for (const [key, rule] of Object.entries(ENV_VALIDATION_RULES)) {
    const value = process.env[key];
    const varErrors = validateEnvVar(key, value, rule);
    errors.push(...varErrors);

    // Set default values for optional variables
    if (!value && rule.default !== undefined) {
      process.env[key] = rule.default.toString();
      logger.debug(`Set default value for ${key}: ${rule.default}`);
    }
  }

  // Validate complex configurations
  errors.push(...validateAIConfiguration());
  errors.push(...validateGoogleOAuthConfiguration());
  errors.push(...validateDatabaseConfiguration());

  // Check for security issues
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && (jwtSecret === 'supersecurejwtkey' || jwtSecret === 'your-secret-key')) {
    warnings.push('JWT_SECRET appears to be using a default/example value - use a secure random string in production');
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey === 'your_32_character_encryption_key_here') {
    warnings.push('ENCRYPTION_KEY appears to be using a default/example value - use a secure random string in production');
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn({ warnings }, 'Environment variable security warnings');
    warnings.forEach(warning => logger.warn(warning));
  }

  // If there are errors, throw validation error
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed with ${errors.length} error(s):\n${errors.map(e => `  - ${e}`).join('\n')}`;
    
    logger.error({ errors }, 'Environment validation failed');
    
    // Log helpful information
    logger.info('To fix these issues:');
    logger.info('1. Copy .env.example to .env: cp .env.example .env');
    logger.info('2. Fill in the required values in .env');
    logger.info('3. Restart the application');
    
    throw new ValidationError(errorMessage, errors);
  }

  logger.info('Environment validation completed successfully');
  
  // Log configuration summary (without sensitive values)
  const configSummary = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    aiProvider: process.env.AI_PROVIDER,
    hasDatabase: !!process.env.POSTGRES_URI,
    hasRedis: !!process.env.REDIS_URL,
    hasShopify: !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET),
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY
  };
  
  logger.info({ config: configSummary }, 'Environment configuration summary');
  
  return {
    valid: true,
    warnings,
    config: configSummary
  };
}

/**
 * Get environment variable documentation
 */
export function getEnvironmentDocumentation() {
  const docs = {};
  
  for (const [key, rule] of Object.entries(ENV_VALIDATION_RULES)) {
    docs[key] = {
      required: rule.required,
      type: rule.type,
      description: rule.description,
      default: rule.default,
      allowedValues: rule.allowedValues,
      example: getExampleValue(key, rule)
    };
  }
  
  return docs;
}

/**
 * Generate example values for documentation
 */
function getExampleValue(key, rule) {
  const examples = {
    PORT: '3001',
    NODE_ENV: 'development',
    FRONTEND_URL: 'http://localhost:5173',
    POSTGRES_URI: 'postgresql://username:password@localhost:5432/ai_growth_manager',
    REDIS_URL: 'redis://localhost:6379',
    SHOPIFY_API_KEY: 'your_shopify_api_key_here',
    SHOPIFY_API_SECRET: 'your_shopify_api_secret_here',
    SHOPIFY_SCOPES: 'read_products,write_products,read_orders',
    APP_URL: 'https://your-app-url.ngrok.io',
    GOOGLE_CLIENT_ID: 'your_client_id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'your_google_client_secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3001/google/auth/google/callback',
    JWT_SECRET: 'your_super_secure_jwt_secret_key_minimum_32_chars',
    ENCRYPTION_KEY: 'your_32_character_encryption_key_here',
    OPENAI_API_KEY: 'sk-your_openai_api_key_here',
    AI_PROVIDER: 'openai',
    AI_MODEL: 'gpt-4o-mini'
  };
  
  return examples[key] || `your_${key.toLowerCase()}_here`;
}

export { ValidationError };