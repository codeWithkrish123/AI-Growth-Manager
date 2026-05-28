# PostgreSQL Setup Guide

## Quick Start

### 1. Install PostgreSQL

```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# On Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database and User

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE ai_growth_manager;

-- Create user (recommended for security)
CREATE USER ai_growth_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_growth_manager TO ai_growth_user;

-- Exit
\q
```

### 3. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit the .env file
nano backend/.env
```

Update these lines:

```bash
POSTGRES_URI=postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager
```

### 4. Run Database Migration

```bash
cd backend
node src/database/migration.js
```

### 5. Install Dependencies and Start

```bash
# Install PostgreSQL client library
npm install

# Start the backend
npm run dev
```

## Configuration Options

### Environment Variables

```bash
# Database Configuration
POSTGRES_URI=postgresql://username:password@host:port/database

# Alternative configuration (will override POSTGRES_URI)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=ai_growth_manager
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_SSL=false
```

### Connection Pool Settings

The app uses these default pool settings:

- **max**: 20 connections
- **min**: 5 connections
- **idleTimeoutMillis**: 30 seconds
- **connectionTimeoutMillis**: 10 seconds

You can customize these in `src/config/database.js` if needed.

## Testing the Connection

### 1. Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": {
    "status": "healthy",
    "poolStatus": {
      "totalCount": 5,
      "idleCount": 5,
      "waitingCount": 0
    }
  }
}
```

### 2. Manual Database Test

```bash
# Connect to your database
psql -d ai_growth_manager -U ai_growth_user

# Check tables
\dt

# Should show:
# merchants
# store_snapshots
# ai_analyses
# fix_actions
# sync_jobs
# health_history
# webhook_events
# ai_call_logs
```

## Troubleshooting

### Common Issues

#### Connection Refused

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Make sure PostgreSQL is running

```bash
# Ubuntu/Debian
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services list
brew services start postgresql
```

#### Authentication Failed

```bash
Error: password authentication failed for user "ai_growth_user"
```

**Solution**: Check username/password in .env file

```bash
# Test connection manually
psql -h localhost -p 5432 -U ai_growth_user -d ai_growth_manager
```

#### Database Doesn't Exist

```bash
Error: database "ai_growth_manager" does not exist
```

**Solution**: Create the database

```sql
CREATE DATABASE ai_growth_manager;
```

#### Permission Denied

```bash
Error: permission denied for relation merchants
```

**Solution**: Grant proper privileges

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_growth_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_growth_user;
```

### Performance Tuning

#### 1. PostgreSQL Configuration

Edit `postgresql.conf` (location varies by system):

```ini
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 100
listen_addresses = '*'

# Logging
log_statement = 'all'
log_duration = on
```

#### 2. Index Optimization

The migration script creates optimal indexes. To check index usage:

```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM merchants WHERE shop_domain = 'test.myshopify.com';

-- List all indexes
\di
```

#### 3. Connection Pool Monitoring

Monitor pool status in logs:

```bash
tail -f logs/app.log | grep "pool status"
```

## Backup and Recovery

### 1. Backup Database

```bash
# Full backup
pg_dump -h localhost -U ai_growth_user ai_growth_manager > backup.sql

# Compressed backup
pg_dump -h localhost -U ai_growth_user ai_growth_manager | gzip > backup.sql.gz

# Schema only
pg_dump -h localhost -U ai_growth_user --schema-only ai_growth_manager > schema.sql
```

### 2. Restore Database

```bash
# From backup
psql -h localhost -U ai_growth_user ai_growth_manager < backup.sql

# From compressed backup
gunzip -c backup.sql.gz | psql -h localhost -U ai_growth_user ai_growth_manager
```

### 3. Automated Backups

Add to crontab for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -h localhost -U ai_growth_user ai_growth_manager | gzip > /backups/ai_growth_manager_$(date +\%Y\%m\%d).sql.gz
```

## Security Best Practices

### 1. Network Security

```ini
# In postgresql.conf
listen_addresses = 'localhost'  # Only local connections

# In pg_hba.conf
# Require password for all connections
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

### 2. User Permissions

```sql
-- Create read-only user for reporting
CREATE USER analytics_user WITH PASSWORD 'analytics_password';
GRANT CONNECT ON DATABASE ai_growth_manager TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
```

### 3. SSL Configuration

```bash
# Enable SSL in .env
POSTGRES_SSL=true

# Or in connection string
POSTGRES_URI=postgresql://user:pass@host:port/db?sslmode=require
```

## Monitoring

### 1. Database Metrics

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('ai_growth_manager'));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Application Monitoring

The app logs database operations:

```bash
# View query logs
tail -f logs/app.log | grep "Database query"

# View slow queries
tail -f logs/app.log | grep "Slow database query"
```

## Migration from MongoDB

If you're migrating from MongoDB, the migration script handles the schema conversion automatically. However, you'll need to migrate existing data:

### 1. Export MongoDB Data

```bash
# Export collections
mongoexport --db ai_growth_manager --collection merchants --out merchants.json
mongoexport --db ai_growth_manager --collection storesnapshots --out snapshots.json
mongoexport --db ai_growth_manager --collection aianalyses --out analyses.json
```

### 2. Transform and Import

You'll need to write a script to transform the JSON data to match the PostgreSQL schema and import it using `COPY` commands or INSERT statements.

### 3. Verify Migration

```sql
-- Check record counts
SELECT 'merchants' as table_name, count(*) as record_count FROM merchants
UNION ALL
SELECT 'store_snapshots', count(*) FROM store_snapshots
UNION ALL
SELECT 'ai_analyses', count(*) FROM ai_analyses;
```

## Production Deployment

### 1. Environment Variables

```bash
# Production database settings
POSTGRES_URI=postgresql://prod_user:secure_password@db.example.com:5432/ai_growth_manager_prod
POSTGRES_SSL=true
POSTGRES_POOL_MAX=50
POSTGRES_POOL_MIN=10
```

### 2. Database Server Recommendations

- **RAM**: At least 2GB, preferably 4GB+
- **CPU**: 2+ cores
- **Storage**: SSD with at least 50GB free space
- **Network**: Low latency connection to application server

### 3. High Availability

Consider:

- PostgreSQL streaming replication
- Connection pooling with PgBouncer
- Regular automated backups
- Monitoring and alerting

---

**Need Help?** Check the application logs or create an issue in the repository.
