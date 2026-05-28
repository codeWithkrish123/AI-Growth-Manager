import 'dotenv/config';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port:    parseInt(process.env.PORT || '3001', 10),
  env:     process.env.NODE_ENV || 'development',
  isDev:   process.env.NODE_ENV !== 'production',

  postgres: {
    uri: required('POSTGRES_URI'),
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
    openaiKey: process.env.OPENAI_API_KEY || '',
    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
    provider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },

  cron: {
    sync:          process.env.SYNC_CRON          || '0 */1 * * *',
    healthSnapshot: process.env.HEALTH_SNAPSHOT_CRON || '0 0 * * *',
  },
};