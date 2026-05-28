# PostgreSQL Setup Guide for Windows

## Quick Start for Windows

### 1. Install PostgreSQL
If you haven't installed PostgreSQL yet:

1. **Download from official site**: https://www.postgresql.org/download/windows/
2. **Run installer** and remember your password
3. **Note the installation path** (usually: `C:\Program Files\PostgreSQL\16\bin`)

### 2. Open PostgreSQL Command Line

#### Method 1: Using SQL Shell (Recommended)
1. Click Start Menu
2. Type "SQL Shell" and open "SQL Shell (psql)"
3. Enter these prompts:
   - Server: localhost
   - Database: postgres
   - Port: 5432
   - Username: postgres
   - Password: [your password]

#### Method 2: Using Command Prompt
```cmd
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\16\bin"

# Connect to PostgreSQL
psql -U postgres
```

### 3. Create Database and User
Once connected to psql, run these commands:

```sql
-- Create database
CREATE DATABASE ai_growth_manager;

-- Create user (recommended for security)
CREATE USER ai_growth_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_growth_manager TO ai_growth_user;

-- Exit psql
\q
```

### 4. Configure Environment

#### Create .env file
```cmd
# Navigate to backend directory
cd "C:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\backend"

# Copy environment template
copy .env.example .env

# Edit the .env file (use notepad or VS Code)
notepad .env
```

#### Update these lines in .env:
```bash
POSTGRES_URI=postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager
```

### 5. Run Database Migration
```cmd
# Make sure you're in the backend directory
cd "C:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\backend"

# Run migration
node src/database/migration.js
```

### 6. Install Dependencies and Start
```cmd
# Install PostgreSQL client library
npm install

# Start the backend
npm run dev
```

## Windows-Specific Troubleshooting

### Issue: 'psql' command not found
**Solution**: Add PostgreSQL to PATH or use full path

```cmd
# Temporary: Use full path
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres

# Permanent: Add to PATH
# 1. Press Win + R, type "sysdm.cpl"
# 2. Go to Advanced → Environment Variables
# 3. Edit PATH, add: C:\Program Files\PostgreSQL\16\bin
```

### Issue: "Access denied" errors
**Solution**: Run Command Prompt as Administrator

```cmd
# Right-click Command Prompt → "Run as administrator"
```

### Issue: PostgreSQL service not running
**Solution**: Start the service

```cmd
# Open Services (Win + R, type "services.msc")
# Find "postgresql-x64-16" (version may vary)
# Right-click → Start

# Or using command line:
net start postgresql-x64-16
```

### Issue: Connection refused
**Solution**: Check if PostgreSQL is running on correct port

```cmd
# Check if PostgreSQL is listening
netstat -an | findstr 5432

# Should show something like:
# TCP    127.0.0.1:5432           0.0.0.0:0              LISTENING
```

## Alternative: Using pgAdmin (GUI Method)

If you prefer a graphical interface:

1. **Open pgAdmin 4** (installed with PostgreSQL)
2. **Connect to server** with postgres user
3. **Create new database**: Right-click "Databases" → "Create" → "Database"
4. **Create new login role**: Right-click "Login/Group Roles" → "Create" → "Login/Group Role"
5. **Grant privileges**: Right-click new database → "Properties" → "Privileges"

## Testing the Connection

### 1. Test with psql
```cmd
# Test connection with new user
psql -U ai_growth_user -d ai_growth_manager -h localhost

# Should connect without errors
```

### 2. Test with Node.js
```cmd
# In backend directory
node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager'
});
client.connect().then(() => {
  console.log('✅ PostgreSQL connection successful!');
  client.end();
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
});
"
```

### 3. Check Tables
```sql
-- Connect to your database
psql -U ai_growth_user -d ai_growth_manager

-- List tables
\dt

-- Should show:
-- merchants
-- store_snapshots
-- ai_analyses
-- fix_actions
-- sync_jobs
-- health_history
-- webhook_events
-- ai_call_logs
```

## Environment Variables for Windows

### Using PowerShell (Recommended)
```powershell
# Set environment variable
$env:POSTGRES_URI = "postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager"

# Or set permanently
[System.Environment]::SetEnvironmentVariable('POSTGRES_URI', 'postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager', 'User')
```

### Using Command Prompt
```cmd
# Set for current session
set POSTGRES_URI=postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager

# Set permanently (requires admin)
setx POSTGRES_URI "postgresql://ai_growth_user:your_secure_password@localhost:5432/ai_growth_manager"
```

## Common Windows Path Issues

### PostgreSQL Installation Paths
- **Version 16**: `C:\Program Files\PostgreSQL\16\bin`
- **Version 15**: `C:\Program Files\PostgreSQL\15\bin`
- **Version 14**: `C:\Program Files\PostgreSQL\14\bin`

### Data Directory
- **Default**: `C:\Program Files\PostgreSQL\16\data`
- **Custom**: May be in `C:\PostgreSQL\data` or user-specified location

## Backup and Recovery on Windows

### Backup Database
```cmd
# Using pg_dump
"C:\Program Files\PostgreSQL\16\bin\pg_dump" -U ai_growth_user ai_growth_manager > backup.sql

# Compressed backup
"C:\Program Files\PostgreSQL\16\bin\pg_dump" -U ai_growth_user ai_growth_manager | gzip > backup.sql.gz
```

### Restore Database
```cmd
# From backup
"C:\Program Files\PostgreSQL\16\bin\psql" -U ai_growth_user ai_growth_manager < backup.sql
```

## Windows Service Management

### Common PostgreSQL Service Names
- `postgresql-x64-16` (PostgreSQL 16)
- `postgresql-x64-15` (PostgreSQL 15)
- `postgresql-x64-14` (PostgreSQL 14)

### Service Commands
```cmd
# Start service
net start postgresql-x64-16

# Stop service
net stop postgresql-x64-16

# Restart service
net stop postgresql-x64-16 && net start postgresql-x64-16

# Check service status
sc query postgresql-x64-16
```

## Firewall Configuration

If you need remote connections:

1. **Open Windows Firewall** (search "Windows Defender Firewall")
2. **Advanced Settings** → "Inbound Rules"
3. **Add Rule** → "Port"
4. **TCP port 5432**
5. **Allow the connection**

## Performance Tips for Windows

### 1. PostgreSQL Configuration
Edit `postgresql.conf` (usually in `C:\Program Files\PostgreSQL\16\data\`):

```ini
# Memory settings (adjust based on your RAM)
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

### 2. Windows Performance
- **Disable antivirus real-time scanning** for PostgreSQL data directory
- **Use SSD storage** for better performance
- **Allocate sufficient RAM** (minimum 4GB recommended)

## Getting Help

### PostgreSQL Logs
- **Location**: `C:\Program Files\PostgreSQL\16\data\log\`
- **Recent log**: `postgresql-YYYY-MM-DD.log`

### Application Logs
- **Location**: `backend/logs/`
- **Check**: `app.log` for database connection issues

### Common Error Messages
- `"FATAL: password authentication failed"` → Check password in .env
- `"FATAL: database does not exist"` → Run CREATE DATABASE command
- `"Connection refused"` → Start PostgreSQL service
- `"Permission denied"` → Run Command Prompt as administrator

---

**Still having issues?** Check the application logs or create an issue in the repository with your error message.
