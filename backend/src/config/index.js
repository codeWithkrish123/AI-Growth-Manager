import 'dotenv/config';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port:    parseInt(process.env.PORT || '3000', 10),
  env:     process.env.NODE_ENV || 'development',
  isDev:   process.env.NODE_ENV !== 'production',

  mongo: {
    uri: required('MONGODB_URI'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  shopify: {
    apiKey:    required('SHOPIFY_API_KEY'),
    apiSecret: required('SHOPIFY_API_SECRET'),
    scopes:    required('SHOPIFY_SCOPES'),
    appUrl:    required('APP_URL'),
  },

  encryption: {
    key: required('ENCRYPTION_KEY'),
  },

  ai: {
    anthropicKey: required('ANTHROPIC_API_KEY'),
    model:        process.env.AI_MODEL || 'claude-sonnet-4-6',
  },

  cron: {
    sync:          process.env.SYNC_CRON          || '0 */1 * * *',
    healthSnapshot: process.env.HEALTH_SNAPSHOT_CRON || '0 0 * * *',
  },
};