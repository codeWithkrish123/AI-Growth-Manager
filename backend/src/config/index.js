import 'dotenv/config';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function validated(key, minLength = 0, warnIfWeak = '') {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  if (minLength && val.length < minLength) {
    throw new Error(`${key} is too short — minimum ${minLength} characters required for security`);
  }
  if (warnIfWeak && val === warnIfWeak) {
    throw new Error(`${key} is using a default/weak value — please set a secure secret`);
  }
  return val;
}

export const config = {
  port:  parseInt(process.env.PORT || '3001', 10),
  env:   process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  postgres: {
    uri: required('POSTGRES_URI'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  shopify: {
    apiKey:        required('SHOPIFY_API_KEY'),
    apiSecret:     required('SHOPIFY_API_SECRET'),
    webhookSecret: required('SHOPIFY_WEBHOOK_SECRET'),
    scopes:        required('SHOPIFY_SCOPES'),
    appUrl:        required('APP_URL'),
  },

  jwt: {
    secret: validated('JWT_SECRET', 32, 'supersecurejwtkey'),
  },

  encryption: {
    key: validated('ENCRYPTION_KEY', 32, 'abcdefghijklmnopqrstuvwxyz123456'),
  },

  ai: {
    openaiKey:    process.env.OPENAI_API_KEY    || '',
    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
    provider:     process.env.AI_PROVIDER       || 'openai',
    model:        process.env.AI_MODEL          || 'gpt-4o-mini',
  },

  email: {
    resendKey: process.env.RESEND_API_KEY || '',
    from:      process.env.EMAIL_FROM     || 'AI Growth Manager <onboarding@resend.dev>',
  },

  ads: {
    metaAppId:     process.env.META_APP_ID     || '',
    metaAppSecret: process.env.META_APP_SECRET || '',
    googleClientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    googleDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  },
};
