import { query } from './src/config/database.js';

async function createTables() {
  console.log('🚀 Starting table creation script...');
  
  try {
    console.log('✅ Database connection established');
    
    // First, check what tables currently exist
    console.log('\n📊 Checking current tables...');
    const checkResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Current tables:', checkResult.rows.map(r => r.table_name));
    
    // Create merchants table
    console.log('\n📝 Creating merchants table...');
    await query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_domain VARCHAR(255) UNIQUE NOT NULL,
        access_token_enc TEXT NOT NULL,
        scope TEXT,
        is_active BOOLEAN DEFAULT true,
        plan_tier VARCHAR(50) DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
        shop_info JSONB,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Merchants table created');
    
    // Create store_snapshots table
    console.log('\n📝 Creating store_snapshots table...');
    await query(`
      CREATE TABLE IF NOT EXISTS store_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        shop_domain VARCHAR(255) NOT NULL,
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
        top_products JSONB,
        low_stock_products JSONB,
        abandoned_checkouts JSONB,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Store snapshots table created');
    
    // Create ai_analyses table
    console.log('\n📝 Creating ai_analyses table...');
    await query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        shop_domain VARCHAR(255) NOT NULL,
        snapshot_id UUID REFERENCES store_snapshots(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        analysis_data JSONB,
        insights JSONB,
        recommendations JSONB,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ AI analyses table created');
    
    // Create sync_jobs table
    console.log('\n📝 Creating sync_jobs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS sync_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        shop_domain VARCHAR(255) NOT NULL,
        job_type VARCHAR(50) DEFAULT 'full_sync',
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed')),
        bull_job_id VARCHAR(255),
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_ms INTEGER,
        result JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Sync jobs table created');
    
    // Create fix_actions table
    console.log('\n📝 Creating fix_actions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS fix_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        analysis_id UUID REFERENCES ai_analyses(id) ON DELETE SET NULL,
        shop_domain VARCHAR(255) NOT NULL,
        problem_id VARCHAR(255),
        fix_type VARCHAR(100),
        payload JSONB,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed')),
        result JSONB,
        triggered_by VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ Fix actions table created');
    
    // Create health_history table
    console.log('\n📝 Creating health_history table...');
    await query(`
      CREATE TABLE IF NOT EXISTS health_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        shop_domain VARCHAR(255) NOT NULL,
        health_score INTEGER,
        date DATE NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Health history table created');
    
    // Verify all tables were created
    console.log('\n📊 Verifying tables after creation...');
    const finalResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 All tables now:', finalResult.rows.map(r => r.table_name));
    
    console.log('\n✅✅✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
    throw error;
  }
}

createTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    // Wait a moment to ensure console output is flushed
    setTimeout(() => process.exit(0), 100);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    console.error('❌ Full error:', error);
    setTimeout(() => process.exit(1), 100);
  });
