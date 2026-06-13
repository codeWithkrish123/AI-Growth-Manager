-- AI Growth Manager PostgreSQL Schema
-- Migration from MongoDB to PostgreSQL

-- Merchants table (replaces Merchant collection)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token_enc TEXT NOT NULL,
    scope TEXT,
    is_active BOOLEAN DEFAULT true,
    plan_tier VARCHAR(50) DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
    
    -- Shop info as JSONB (flexible like MongoDB)
    shop_info JSONB,
    
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store snapshots table (replaces StoreSnapshot collection)
CREATE TABLE IF NOT EXISTS store_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    
    -- Metrics as structured fields (better for querying)
    total_revenue DECIMAL(15,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    checkouts_initiated INTEGER DEFAULT 0,
    checkouts_completed INTEGER DEFAULT 0,
    cart_abandon_rate DECIMAL(5,4) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    returning_rate DECIMAL(5,4) DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    active_products INTEGER DEFAULT 0,
    out_of_stock_count INTEGER DEFAULT 0,
    no_description_count INTEGER DEFAULT 0,
    no_image_count INTEGER DEFAULT 0,
    revenue_30d DECIMAL(15,2) DEFAULT 0,
    orders_30d INTEGER DEFAULT 0,
    aov_30d DECIMAL(10,2) DEFAULT 0,
    
    -- Top products as JSONB array
    top_products JSONB,
    
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    
    -- Health breakdown as JSONB object
    health_breakdown JSONB,
    
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_window_days INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis table (replaces AiAnalysis collection)
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    snapshot_id UUID NOT NULL REFERENCES store_snapshots(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    summary TEXT,
    
    -- Problems as JSONB array (flexible structure)
    problems JSONB,
    
    -- LLM metadata
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    model_used VARCHAR(100),
    latency_ms INTEGER,
    
    -- Used to skip re-analysis
    metrics_hash VARCHAR(64) UNIQUE,
    
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix Actions table (replaces FixAction collection)
CREATE TABLE IF NOT EXISTS fix_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    problem_id VARCHAR(255) NOT NULL,
    fix_type VARCHAR(100) NOT NULL,
    
    -- Payload and response as JSONB
    payload JSONB,
    shopify_response JSONB,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'applying', 'applied', 'failed', 'rolled_back')),
    applied_at TIMESTAMP WITH TIME ZONE,
    error_msg TEXT,
    attempt_count INTEGER DEFAULT 0,
    triggered_by VARCHAR(20) DEFAULT 'merchant' CHECK (triggered_by IN ('merchant', 'auto')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync Jobs table (for background job tracking)
CREATE TABLE IF NOT EXISTS sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) DEFAULT 'full_sync' CHECK (job_type IN ('full_sync', 'partial_sync', 'analysis', 'fix')),
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    
    bull_job_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Result and metadata as JSONB
    result JSONB,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health History table (for tracking health scores over time)
CREATE TABLE IF NOT EXISTS health_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    date DATE NOT NULL,
    
    -- Additional metrics as JSONB
    metrics JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries per day
    UNIQUE(merchant_id, date)
);

-- Webhook Events table (for Shopify webhook processing)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_domain VARCHAR(255) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    
    -- Payload as JSONB
    payload JSONB,
    
    processed BOOLEAN DEFAULT false,
    shopify_webhook_id VARCHAR(255) UNIQUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Call Logs table (for tracking AI usage and costs)
CREATE TABLE IF NOT EXISTS ai_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255),
    
    call_type VARCHAR(50) DEFAULT 'analysis' CHECK (call_type IN ('analysis', 'suggestion', 'fix_plan')),
    model_used VARCHAR(100),
    
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10,6),
    latency_ms INTEGER,
    
    success BOOLEAN DEFAULT true,
    error_msg TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns table (for email marketing)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'manual' CHECK (type IN ('manual', 'ai_generated', 'abandoned_cart', 'welcome', 'promo')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
    
    subject TEXT,
    body TEXT,
    
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    
    sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs table (for tracking individual email sends)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(255),
    merchant_id VARCHAR(255),
    
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    resend_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchants_shop_domain ON merchants(shop_domain);
CREATE INDEX IF NOT EXISTS idx_merchants_is_active ON merchants(is_active);

CREATE INDEX IF NOT EXISTS idx_store_snapshots_merchant_id ON store_snapshots(merchant_id);
CREATE INDEX IF NOT EXISTS idx_store_snapshots_shop_domain ON store_snapshots(shop_domain);
CREATE INDEX IF NOT EXISTS idx_store_snapshots_synced_at ON store_snapshots(synced_at);
CREATE INDEX IF NOT EXISTS idx_store_snapshots_merchant_synced ON store_snapshots(merchant_id, synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_merchant_id ON ai_analyses(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_snapshot_id ON ai_analyses(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_metrics_hash ON ai_analyses(metrics_hash);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_merchant_created ON ai_analyses(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fix_actions_merchant_id ON fix_actions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_fix_actions_analysis_id ON fix_actions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_fix_actions_status ON fix_actions(status);
CREATE INDEX IF NOT EXISTS idx_fix_actions_merchant_created ON fix_actions(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_merchant_id ON sync_jobs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_shop_domain ON sync_jobs(shop_domain);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_bull_job_id ON sync_jobs(bull_job_id);

CREATE INDEX IF NOT EXISTS idx_health_history_merchant_id ON health_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_health_history_date ON health_history(date);
CREATE INDEX IF NOT EXISTS idx_health_history_merchant_date ON health_history(merchant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_shop_domain ON webhook_events(shop_domain);
CREATE INDEX IF NOT EXISTS idx_webhook_events_topic ON webhook_events(topic);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_shopify_webhook_id ON webhook_events(shopify_webhook_id);

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_merchant_id ON ai_call_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_created_at ON ai_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_call_type ON ai_call_logs(call_type);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE OR REPLACE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_store_snapshots_updated_at BEFORE UPDATE ON store_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_fix_actions_updated_at BEFORE UPDATE ON fix_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_sync_jobs_updated_at BEFORE UPDATE ON sync_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_health_history_updated_at BEFORE UPDATE ON health_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ai_call_logs_updated_at BEFORE UPDATE ON ai_call_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_merchant_id ON email_campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_merchant_id ON email_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- ──────────────────────────────────────────────────────────────────────────────
-- ADS TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Connected ad accounts (Meta/Google)
CREATE TABLE IF NOT EXISTS ad_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('meta', 'google')),
    account_id VARCHAR(100) NOT NULL,
    account_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired')),
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL,
    platform_campaign_id VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(50) CHECK (objective IN ('conversions', 'traffic', 'catalog_sales', 'awareness', 'engagement')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    daily_budget DECIMAL(15,2),
    total_spend DECIMAL(15,2) DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    roas DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad performance snapshots (daily)
CREATE TABLE IF NOT EXISTS ad_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    spend DECIMAL(15,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    ctr DECIMAL(10,2) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    roas DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, date)
);

-- AI ad suggestions
CREATE TABLE IF NOT EXISTS ad_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('budget', 'audience', 'creative', 'pause', 'scale')),
    title VARCHAR(255),
    description TEXT,
    expected_impact VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    ai_reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────────────────────────
-- SEO TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- SEO audits
CREATE TABLE IF NOT EXISTS seo_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    page_speed_score INTEGER CHECK (page_speed_score >= 0 AND page_speed_score <= 100),
    meta_score INTEGER CHECK (meta_score >= 0 AND meta_score <= 100),
    content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
    structure_score INTEGER CHECK (structure_score >= 0 AND structure_score <= 100),
    mobile_score INTEGER CHECK (mobile_score >= 0 AND mobile_score <= 100),
    issues_count INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO issues found during audit
CREATE TABLE IF NOT EXISTS seo_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
    severity VARCHAR(20) CHECK (severity IN ('critical', 'warning', 'info')),
    category VARCHAR(50) CHECK (category IN ('meta', 'heading', 'image', 'content', 'speed', 'schema', 'url', 'mobile')),
    page_url TEXT,
    title VARCHAR(255),
    description TEXT,
    fix_suggestion TEXT,
    auto_fixable BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword tracking
CREATE TABLE IF NOT EXISTS seo_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_id VARCHAR(100),
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER,
    competition VARCHAR(20) CHECK (competition IN ('low', 'medium', 'high')),
    current_rank INTEGER,
    previous_rank INTEGER,
    target_url TEXT,
    status VARCHAR(20) DEFAULT 'tracking' CHECK (status IN ('tracking', 'paused', 'dropped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO optimization history
CREATE TABLE IF NOT EXISTS seo_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_id VARCHAR(100),
    type VARCHAR(50) CHECK (type IN ('title', 'description', 'meta', 'alt_text', 'heading', 'schema')),
    old_value TEXT,
    new_value TEXT,
    ai_reasoning TEXT,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PageSpeed history
CREATE TABLE IF NOT EXISTS seo_pagespeed_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
    first_contentful_paint DECIMAL(6,2),
    largest_contentful_paint DECIMAL(6,2),
    cumulative_layout_shift DECIMAL(5,3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor analysis
CREATE TABLE IF NOT EXISTS seo_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    seo_score INTEGER,
    traffic_estimate INTEGER,
    keyword_overlap INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schema markup store
CREATE TABLE IF NOT EXISTS seo_schema_markup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    schema_type VARCHAR(100),
    schema_json JSONB,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Ads & SEO Indexes
CREATE INDEX IF NOT EXISTS idx_ad_accounts_merchant_id ON ad_accounts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_platform ON ad_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_merchant_id ON ad_campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_ad_account_id ON ad_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_performance_campaign_id ON ad_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_performance_date ON ad_performance(date);
CREATE INDEX IF NOT EXISTS idx_ad_suggestions_merchant_id ON ad_suggestions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ad_suggestions_type ON ad_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_seo_audits_merchant_id ON seo_audits(merchant_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_created_at ON seo_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_issues_audit_id ON seo_issues(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_severity ON seo_issues(severity);
CREATE INDEX IF NOT EXISTS idx_seo_issues_status ON seo_issues(status);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_merchant_id ON seo_keywords(merchant_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_status ON seo_keywords(status);
CREATE INDEX IF NOT EXISTS idx_seo_optimizations_merchant_id ON seo_optimizations(merchant_id);
CREATE INDEX IF NOT EXISTS idx_seo_pagespeed_merchant_id ON seo_pagespeed_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_seo_competitors_merchant_id ON seo_competitors(merchant_id);
CREATE INDEX IF NOT EXISTS idx_seo_schema_merchant_id ON seo_schema_markup(merchant_id);

-- Triggers for auto-updating timestamps on new tables
CREATE OR REPLACE TRIGGER update_ad_accounts_updated_at BEFORE UPDATE ON ad_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ad_suggestions_updated_at BEFORE UPDATE ON ad_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON seo_keywords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_seo_competitors_updated_at BEFORE UPDATE ON seo_competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_seo_schema_markup_updated_at BEFORE UPDATE ON seo_schema_markup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
