# Design Document: Production Readiness Assessment System

## 1. Introduction

This document details the technical design for the Production Readiness Assessment System for the AI Growth Manager application. The system performs comprehensive analysis of the application's current state, validates infrastructure dependencies, tests authentication flows, and generates a detailed roadmap for achieving production deployment.

### 1.1 Design Goals

- **Comprehensive Coverage**: Assess all critical components (Backend, Frontend, Database, Redis, OAuth, Sync Engine, Webhooks)
- **Actionable Output**: Generate specific, prioritized tasks with time estimates and acceptance criteria
- **Dual Deployment Support**: Validate configurations for both Render/Vercel (quick-start) and Docker-based deployments
- **Automated Validation**: Minimize manual testing through automated checks and health validations
- **Clear Reporting**: Provide structured reports with severity levels and remediation guidance

### 1.2 Technology Stack Context

**Backend**: Node.js 18+, Express 5.x, PostgreSQL, BullMQ, JWT authentication
**Frontend**: React 18, Vite 5, TailwindCSS, Axios
**Infrastructure**: Docker, Redis 7, PostgreSQL 14+
**External APIs**: Shopify Admin API, Google OAuth 2.0, OpenAI/Anthropic AI APIs

## 2. System Architecture

### 2.1 Assessment System Components

The assessment system consists of five primary modules:

```
AssessmentOrchestrator
├── ComponentValidator
│   ├── BackendValidator
│   ├── FrontendValidator
│   ├── DatabaseValidator
│   ├── RedisValidator
│   └── OAuthValidator
├── IntegrationTester
│   ├── SyncEngineTester
│   ├── WebhookTester
│   └── APIEndpointTester
├── ConfigurationAnalyzer
│   ├── DockerConfigAnalyzer
│   ├── RenderConfigAnalyzer
│   └── VercelConfigAnalyzer
├── SecurityAuditor
│   ├── AuthenticationAuditor
│   ├── EncryptionAuditor
│   └── InputValidationAuditor
└── RoadmapGenerator
    ├── TaskPrioritizer
    ├── TimeEstimator
    └── DependencyResolver
```


### 2.2 Assessment Orchestrator

The `AssessmentOrchestrator` is the main entry point that coordinates all assessment activities.

**Responsibilities**:
- Initialize all validator and tester modules
- Execute assessments in dependency order
- Aggregate results from all modules
- Generate final assessment report
- Invoke roadmap generation

**Interface**:
```javascript
class AssessmentOrchestrator {
  async runFullAssessment(options) {
    // Returns: AssessmentReport
  }
  
  async runComponentAssessment(componentName) {
    // Returns: ComponentReport
  }
  
  async generateRoadmap(assessmentReport) {
    // Returns: RoadmapDocument
  }
}
```

**Assessment Flow**:
1. Validate environment configuration
2. Test infrastructure dependencies (Database, Redis)
3. Validate backend service startup and health
4. Test authentication flows (Google OAuth, Shopify OAuth)
5. Validate frontend build and integration
6. Test data synchronization and job processing
7. Audit security configurations
8. Generate prioritized roadmap


## 3. Component Validators

### 3.1 Backend Validator

**Purpose**: Validate backend service configuration, startup process, and runtime health.

**Validation Checks**:
- Environment variable completeness (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY, SHOPIFY_API_KEY, SHOPIFY_API_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY)
- Port availability (3001 default)
- Dependency installation (node_modules presence)
- Server startup success
- Health check endpoint response (/health)
- Error handling middleware presence
- Logging configuration
- Security middleware (helmet, cors, rate limiting)

**Implementation**:
```javascript
class BackendValidator {
  async validateEnvironment() {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 
                      'JWT_SECRET', 'ENCRYPTION_KEY', 'SHOPIFY_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    return { valid: missing.length === 0, missing };
  }
  
  async validateStartup() {
    // Attempt to start server on test port
    // Check for initialization errors
    // Verify health endpoint responds
  }
  
  async validateMiddleware() {
    // Parse app.js to verify helmet, cors, rate limiting
  }
}
```

**Output**: BackendValidationReport with status (pass/fail), issues array, and recommendations.


### 3.2 Database Validator

**Purpose**: Validate PostgreSQL connection, schema integrity, and production readiness.

**Validation Checks**:
- Connection string format validation
- Connection pool configuration (min: 5, max: 20, idle timeout: 30s)
- Database connectivity test
- Schema existence validation (merchants, store_snapshots, ai_analyses, fix_actions, sync_jobs, health_history, webhook_events, ai_call_logs)
- Index presence validation
- Trigger function validation (update_updated_at_column)
- Health check query performance (<100ms)
- Connection pool metrics (total, idle, waiting counts)

**Implementation**:
```javascript
class DatabaseValidator {
  async validateConnection() {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
  
  async validateSchema() {
    const expectedTables = ['merchants', 'store_snapshots', 'ai_analyses', 
                            'fix_actions', 'sync_jobs', 'health_history', 
                            'webhook_events', 'ai_call_logs'];
    const result = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existing = result.rows.map(r => r.table_name);
    const missing = expectedTables.filter(t => !existing.includes(t));
    return { valid: missing.length === 0, missing };
  }
  
  async validateIndexes() {
    // Check for critical indexes on merchants, store_snapshots, etc.
  }
}
```

**Output**: DatabaseValidationReport with connection status, schema validation, performance metrics.


### 3.3 Redis Validator

**Purpose**: Validate Redis availability, configuration, and BullMQ integration.

**Validation Checks**:
- Redis connection string format
- Redis connectivity test
- Redis version compatibility (7.x)
- Persistence configuration (RDB or AOF)
- Memory configuration and limits
- BullMQ queue initialization
- Worker process registration
- Job retry configuration

**Implementation**:
```javascript
class RedisValidator {
  async validateConnection() {
    try {
      await redisConnection.connect();
      const pong = await redisConnection.ping();
      return { connected: pong === 'PONG' };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
  
  async validateBullMQ() {
    const { syncQueue } = await import('./queues/sync.queue.js');
    const jobCounts = await syncQueue.getJobCounts();
    return { 
      initialized: true, 
      waiting: jobCounts.waiting,
      active: jobCounts.active,
      failed: jobCounts.failed
    };
  }
  
  async validateConfiguration() {
    const info = await redisConnection.info('persistence');
    // Parse persistence settings
  }
}
```

**Output**: RedisValidationReport with connection status, BullMQ health, configuration assessment.


### 3.4 OAuth Validator

**Purpose**: Validate Google OAuth and Shopify OAuth configurations and flows.

**Validation Checks**:
- Google OAuth client ID and secret presence
- Google OAuth redirect URI configuration (local and production)
- Shopify API key and secret presence
- Shopify OAuth scopes configuration
- JWT secret strength (minimum 32 characters)
- Token encryption key presence
- CORS configuration for OAuth callbacks
- Session management configuration

**Implementation**:
```javascript
class OAuthValidator {
  async validateGoogleOAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    const issues = [];
    if (!clientId) issues.push('Missing GOOGLE_CLIENT_ID');
    if (!clientSecret) issues.push('Missing GOOGLE_CLIENT_SECRET');
    if (!redirectUri) issues.push('Missing GOOGLE_REDIRECT_URI');
    
    // Validate redirect URI format
    if (redirectUri && !redirectUri.match(/^https?:\/\/.+\/google\/auth\/google\/callback$/)) {
      issues.push('Invalid GOOGLE_REDIRECT_URI format');
    }
    
    return { valid: issues.length === 0, issues };
  }
  
  async validateShopifyOAuth() {
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    const scopes = process.env.SHOPIFY_SCOPES;
    
    const issues = [];
    if (!apiKey) issues.push('Missing SHOPIFY_API_KEY');
    if (!apiSecret) issues.push('Missing SHOPIFY_API_SECRET');
    if (!scopes) issues.push('Missing SHOPIFY_SCOPES');
    
    return { valid: issues.length === 0, issues };
  }
  
  async validateJWTConfiguration() {
    const secret = process.env.JWT_SECRET;
    if (!secret) return { valid: false, issue: 'Missing JWT_SECRET' };
    if (secret.length < 32) return { valid: false, issue: 'JWT_SECRET too short (min 32 chars)' };
    return { valid: true };
  }
}
```

**Output**: OAuthValidationReport with Google OAuth status, Shopify OAuth status, JWT configuration.


### 3.5 Frontend Validator

**Purpose**: Validate frontend build configuration, environment variables, and API integration.

**Validation Checks**:
- Vite configuration presence
- Environment variable configuration (VITE_API_URL)
- Build process execution
- Build output validation (dist/ directory)
- Bundle size analysis (<500KB target)
- API endpoint configuration
- Error handling implementation
- Routing configuration

**Implementation**:
```javascript
class FrontendValidator {
  async validateBuild() {
    try {
      const { execSync } = await import('child_process');
      execSync('npm run build', { cwd: './frontend', stdio: 'pipe' });
      
      const fs = await import('fs');
      const distExists = fs.existsSync('./frontend/dist');
      
      if (distExists) {
        const stats = this.analyzeBundleSize('./frontend/dist');
        return { success: true, bundleSize: stats.totalSize };
      }
      
      return { success: false, error: 'Build succeeded but dist/ not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async validateEnvironment() {
    const envFile = './frontend/.env';
    const fs = await import('fs');
    
    if (!fs.existsSync(envFile)) {
      return { valid: false, issue: 'Missing .env file' };
    }
    
    const content = fs.readFileSync(envFile, 'utf-8');
    const hasApiUrl = content.includes('VITE_API_URL');
    
    return { valid: hasApiUrl, issue: hasApiUrl ? null : 'Missing VITE_API_URL' };
  }
  
  analyzeBundleSize(distPath) {
    // Calculate total size of JS/CSS bundles
  }
}
```

**Output**: FrontendValidationReport with build status, bundle size, environment configuration.


## 4. Integration Testers

### 4.1 Sync Engine Tester

**Purpose**: Test the BullMQ-based data synchronization engine end-to-end.

**Test Scenarios**:
- Job queue initialization
- Job creation and enqueueing
- Worker job processing
- Shopify API data fetching (mocked)
- Database data storage
- Job retry on failure
- Job completion status update
- AI analysis trigger after sync

**Implementation**:
```javascript
class SyncEngineTester {
  async testJobCreation() {
    const { syncQueue } = await import('./queues/sync.queue.js');
    const job = await syncQueue.add('full-sync', {
      merchantId: 'test-merchant-id',
      shopDomain: 'test-shop.myshopify.com'
    });
    
    return { 
      created: !!job.id, 
      jobId: job.id,
      status: await job.getState()
    };
  }
  
  async testJobProcessing(jobId, timeout = 60000) {
    const startTime = Date.now();
    const { syncQueue } = await import('./queues/sync.queue.js');
    
    while (Date.now() - startTime < timeout) {
      const job = await syncQueue.getJob(jobId);
      const state = await job.getState();
      
      if (state === 'completed') {
        return { success: true, duration: Date.now() - startTime };
      }
      
      if (state === 'failed') {
        return { success: false, error: job.failedReason };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { success: false, error: 'Timeout waiting for job completion' };
  }
  
  async testDataStorage(merchantId) {
    const result = await query(
      'SELECT * FROM store_snapshots WHERE merchant_id = $1 ORDER BY synced_at DESC LIMIT 1',
      [merchantId]
    );
    
    return { 
      stored: result.rows.length > 0,
      snapshot: result.rows[0]
    };
  }
}
```

**Output**: SyncEngineTestReport with job creation status, processing time, data storage validation.


### 4.2 Webhook Tester

**Purpose**: Test Shopify webhook signature verification and event processing.

**Test Scenarios**:
- HMAC signature verification with valid signature
- HMAC signature verification with invalid signature
- Webhook payload parsing
- Event type routing (orders/create, products/update, etc.)
- Database update after webhook processing
- Error handling for malformed payloads

**Implementation**:
```javascript
class WebhookTester {
  async testSignatureVerification() {
    const crypto = await import('crypto');
    const testPayload = JSON.stringify({ id: 123, test: true });
    const secret = process.env.SHOPIFY_API_SECRET;
    
    // Generate valid HMAC
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(testPayload, 'utf8')
      .digest('base64');
    
    // Test with valid signature
    const validResult = await this.verifyWebhook(testPayload, hmac);
    
    // Test with invalid signature
    const invalidResult = await this.verifyWebhook(testPayload, 'invalid-hmac');
    
    return {
      validAccepted: validResult.verified === true,
      invalidRejected: invalidResult.verified === false
    };
  }
  
  async testEventProcessing() {
    const testEvent = {
      topic: 'orders/create',
      shop_domain: 'test-shop.myshopify.com',
      payload: {
        id: 123456,
        total_price: '99.99',
        created_at: new Date().toISOString()
      }
    };
    
    // Process webhook
    const result = await this.processWebhook(testEvent);
    
    // Verify database update
    const stored = await query(
      'SELECT * FROM webhook_events WHERE shopify_webhook_id = $1',
      [testEvent.payload.id]
    );
    
    return {
      processed: result.success,
      stored: stored.rows.length > 0
    };
  }
  
  verifyWebhook(payload, hmac) {
    // Implementation from webhook.processor.js
  }
  
  processWebhook(event) {
    // Implementation from webhook.processor.js
  }
}
```

**Output**: WebhookTestReport with signature verification results, event processing status.


### 4.3 API Endpoint Tester

**Purpose**: Test all backend API endpoints for correct behavior and error handling.

**Test Scenarios**:
- Dashboard summary endpoint (/api/dashboard/summary)
- Products endpoint with pagination (/api/dashboard/products)
- AI insights endpoint (/api/dashboard/insights)
- Authentication required (401 for unauthenticated requests)
- Invalid parameters (400 error with details)
- Database connection failure handling
- Response time under load (<3 seconds)
- Proper HTTP status codes

**Implementation**:
```javascript
class APIEndpointTester {
  async testDashboardEndpoint(authToken) {
    const response = await fetch('http://localhost:3001/api/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      hasHealthScore: 'healthScore' in data,
      hasRevenue: 'revenue' in data,
      hasMetrics: 'metrics' in data,
      responseTime: response.headers.get('x-response-time')
    };
  }
  
  async testAuthenticationRequired() {
    const response = await fetch('http://localhost:3001/api/dashboard/summary');
    
    return {
      status: response.status,
      correctlyRejected: response.status === 401
    };
  }
  
  async testInvalidParameters(authToken) {
    const response = await fetch('http://localhost:3001/api/dashboard/products?page=invalid', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      correctlyRejected: response.status === 400,
      hasErrorMessage: 'error' in data || 'message' in data
    };
  }
  
  async testResponseTime(endpoint, authToken, iterations = 10) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      times.push(Date.now() - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    
    return { average: avg, maximum: max, withinThreshold: max < 3000 };
  }
}
```

**Output**: APIEndpointTestReport with endpoint status, response validation, performance metrics.


## 5. Configuration Analyzers

### 5.1 Docker Configuration Analyzer

**Purpose**: Validate Docker and docker-compose configurations for production deployment.

**Analysis Checks**:
- Dockerfile syntax and best practices
- Multi-stage build optimization
- Non-root user configuration
- Environment variable handling
- docker-compose.yml service orchestration
- Health check definitions
- Volume persistence configuration
- Network configuration
- Resource limits (memory, CPU)

**Implementation**:
```javascript
class DockerConfigAnalyzer {
  async analyzeDockerfile(path) {
    const fs = await import('fs');
    const content = fs.readFileSync(path, 'utf-8');
    
    const checks = {
      hasMultiStage: content.includes('FROM') && content.split('FROM').length > 2,
      hasNonRootUser: content.includes('USER') && !content.includes('USER root'),
      hasHealthCheck: content.includes('HEALTHCHECK'),
      copiesNodeModules: content.includes('COPY package*.json'),
      installsDependencies: content.includes('npm install') || content.includes('npm ci'),
      exposesPort: content.includes('EXPOSE'),
      hasWorkdir: content.includes('WORKDIR')
    };
    
    const issues = [];
    if (!checks.hasNonRootUser) issues.push('Container runs as root user (security risk)');
    if (!checks.hasHealthCheck) issues.push('Missing HEALTHCHECK instruction');
    if (!checks.hasMultiStage) issues.push('Not using multi-stage build (larger image size)');
    
    return { checks, issues };
  }
  
  async analyzeDockerCompose(path) {
    const fs = await import('fs');
    const yaml = await import('yaml');
    const content = fs.readFileSync(path, 'utf-8');
    const config = yaml.parse(content);
    
    const checks = {
      hasAppService: 'app' in config.services,
      hasPostgresService: 'postgres' in config.services || 'db' in config.services,
      hasRedisService: 'redis' in config.services,
      hasHealthChecks: Object.values(config.services).some(s => s.healthcheck),
      hasVolumes: 'volumes' in config,
      hasDependsOn: Object.values(config.services).some(s => s.depends_on),
      hasRestartPolicy: Object.values(config.services).some(s => s.restart)
    };
    
    const issues = [];
    if (!checks.hasHealthChecks) issues.push('Services missing health checks');
    if (!checks.hasVolumes) issues.push('No volume persistence configured');
    if (!checks.hasRestartPolicy) issues.push('No restart policy configured');
    
    return { checks, issues };
  }
}
```

**Output**: DockerConfigReport with Dockerfile analysis, docker-compose validation, recommendations.


### 5.2 Render Configuration Analyzer

**Purpose**: Validate render.yaml configuration for Render deployment.

**Analysis Checks**:
- Service definitions (web service for backend)
- Build command configuration
- Start command configuration
- Environment variable declarations
- Database service configuration
- Redis service configuration
- Health check path configuration
- Auto-deploy settings

**Implementation**:
```javascript
class RenderConfigAnalyzer {
  async analyzeRenderYaml(path) {
    const fs = await import('fs');
    const yaml = await import('yaml');
    const content = fs.readFileSync(path, 'utf-8');
    const config = yaml.parse(content);
    
    const checks = {
      hasServices: Array.isArray(config.services) && config.services.length > 0,
      hasWebService: config.services?.some(s => s.type === 'web'),
      hasBuildCommand: config.services?.some(s => s.buildCommand),
      hasStartCommand: config.services?.some(s => s.startCommand),
      hasEnvVars: config.services?.some(s => s.envVars && s.envVars.length > 0),
      hasHealthCheckPath: config.services?.some(s => s.healthCheckPath),
      hasDatabase: config.databases?.length > 0,
      hasRedis: config.services?.some(s => s.type === 'redis')
    };
    
    const requiredEnvVars = [
      'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'ENCRYPTION_KEY',
      'SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'
    ];
    
    const declaredEnvVars = config.services
      ?.flatMap(s => s.envVars || [])
      .map(ev => ev.key);
    
    const missingEnvVars = requiredEnvVars.filter(v => !declaredEnvVars?.includes(v));
    
    const issues = [];
    if (!checks.hasWebService) issues.push('Missing web service definition');
    if (!checks.hasBuildCommand) issues.push('Missing build command');
    if (!checks.hasStartCommand) issues.push('Missing start command');
    if (!checks.hasHealthCheckPath) issues.push('Missing health check path');
    if (missingEnvVars.length > 0) {
      issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    return { checks, issues, missingEnvVars };
  }
}
```

**Output**: RenderConfigReport with service validation, environment variable completeness, issues.


### 5.3 Vercel Configuration Analyzer

**Purpose**: Validate Vercel configuration for frontend deployment.

**Analysis Checks**:
- vercel.json presence and configuration
- Build command configuration
- Output directory configuration
- Environment variable configuration
- Routing rules
- Redirects and rewrites
- API proxy configuration (if needed)

**Implementation**:
```javascript
class VercelConfigAnalyzer {
  async analyzeVercelConfig(path) {
    const fs = await import('fs');
    
    // Check for vercel.json
    const vercelJsonPath = `${path}/vercel.json`;
    let config = {};
    
    if (fs.existsSync(vercelJsonPath)) {
      config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    }
    
    // Check package.json for build script
    const packageJson = JSON.parse(fs.readFileSync(`${path}/package.json`, 'utf-8'));
    
    const checks = {
      hasVercelJson: fs.existsSync(vercelJsonPath),
      hasBuildScript: 'build' in packageJson.scripts,
      buildCommand: packageJson.scripts?.build || 'vite build',
      hasOutputDir: config.buildCommand?.includes('dist') || packageJson.scripts?.build?.includes('dist'),
      hasRewrites: config.rewrites && config.rewrites.length > 0,
      hasEnvVars: config.env && Object.keys(config.env).length > 0
    };
    
    const issues = [];
    if (!checks.hasBuildScript) issues.push('Missing build script in package.json');
    
    // Check for VITE_API_URL in .env.example
    const envExamplePath = `${path}/.env.example`;
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');
      if (!envContent.includes('VITE_API_URL')) {
        issues.push('Missing VITE_API_URL in .env.example');
      }
    } else {
      issues.push('Missing .env.example file');
    }
    
    return { checks, issues };
  }
}
```

**Output**: VercelConfigReport with configuration validation, build settings, issues.


## 6. Security Auditor

### 6.1 Authentication Auditor

**Purpose**: Audit authentication and authorization implementations.

**Audit Checks**:
- JWT secret strength and storage
- Token expiration configuration
- Refresh token implementation
- Password hashing (if applicable)
- Session management
- OAuth token encryption
- CORS configuration
- Authentication middleware coverage

**Implementation**:
```javascript
class AuthenticationAuditor {
  async auditJWTConfiguration() {
    const secret = process.env.JWT_SECRET;
    const issues = [];
    
    if (!secret) {
      issues.push({ severity: 'critical', message: 'JWT_SECRET not configured' });
    } else if (secret.length < 32) {
      issues.push({ severity: 'high', message: 'JWT_SECRET too short (min 32 chars)' });
    } else if (secret === 'your-secret-key' || secret === 'secret') {
      issues.push({ severity: 'critical', message: 'JWT_SECRET using default/weak value' });
    }
    
    return { issues };
  }
  
  async auditTokenEncryption() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const issues = [];
    
    if (!encryptionKey) {
      issues.push({ severity: 'critical', message: 'ENCRYPTION_KEY not configured' });
    }
    
    // Check if encryption is actually used in code
    const fs = await import('fs');
    const merchantModel = fs.readFileSync('./backend/src/models/Merchant.model.js', 'utf-8');
    
    if (!merchantModel.includes('encrypt') && !merchantModel.includes('decrypt')) {
      issues.push({ severity: 'high', message: 'Encryption functions not used for token storage' });
    }
    
    return { issues };
  }
  
  async auditCORSConfiguration() {
    const fs = await import('fs');
    const appJs = fs.readFileSync('./backend/src/app.js', 'utf-8');
    
    const issues = [];
    
    if (!appJs.includes('cors')) {
      issues.push({ severity: 'high', message: 'CORS middleware not configured' });
    } else if (appJs.includes("origin: '*'")) {
      issues.push({ severity: 'medium', message: 'CORS allows all origins (should restrict in production)' });
    }
    
    return { issues };
  }
}
```

**Output**: AuthenticationAuditReport with security issues categorized by severity.

