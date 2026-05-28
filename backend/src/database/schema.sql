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
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_snapshots_updated_at BEFORE UPDATE ON store_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fix_actions_updated_at BEFORE UPDATE ON fix_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_jobs_updated_at BEFORE UPDATE ON sync_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_history_updated_at BEFORE UPDATE ON health_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_call_logs_updated_at BEFORE UPDATE ON ai_call_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
