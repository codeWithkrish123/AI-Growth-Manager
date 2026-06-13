# Implementation Plan: Production Readiness Assessment

## Overview

This plan provides a comprehensive, actionable roadmap to achieve production readiness for the AI Growth Manager application. The assessment analyzes the current codebase state, identifies critical blockers, and provides detailed tasks with time estimates organized into logical phases: Critical Fixes → Testing → Deployment Configuration → Security Hardening → Documentation.

The plan supports both Render/Vercel (quick-start) and Docker-based deployment paths, with tasks prioritized based on their impact on MVP criteria. Total estimated time: **80-100 hours** for full production readiness.

## Current State Summary

**What's Implemented:**
- ✅ Backend API structure (Express, routes, controllers)
- ✅ Database schema and models (PostgreSQL)
- ✅ Redis and BullMQ configuration
- ✅ OAuth flow structure (Google and Shopify)
- ✅ Data sync engine framework
- ✅ Webhook processor structure
- ✅ Frontend React application with routing
- ✅ Docker and docker-compose configuration
- ✅ Render deployment configuration (render.yaml)

**Critical Blockers Identified:**
- ❌ Backend startup failures (database connection issues)
- ❌ Google OAuth redirect URI misconfiguration
- ❌ Shopify OAuth flow incomplete/untested
- ❌ Debug console.log statements in production code
- ❌ Missing error handling in critical paths
- ❌ Sync engine untested end-to-end
- ❌ Webhook signature verification untested
- ❌ Missing comprehensive test coverage
- ❌ Security hardening incomplete (encryption, rate limiting)
- ❌ Production environment variables not fully documented

## Tasks

### Phase 1: Critical Backend Fixes (Priority: CRITICAL)

- [ ] 1. Fix backend startup and database connection
  - [-] 1.1 Remove debug console.log statements from production code
    - Remove `console.log("PASSWORD:", process.env.DB_PASSWORD)` from `backend/src/config/database.js`
    - Remove `console.log(process.env.DATABASE_URL)` from `backend/src/app.js`
    - Remove any other console.log statements in `backend/src/loadEnv.js`
    - Replace with proper logger calls where needed
    - **Time Estimate:** 0.5 hours
    - **Acceptance Criteria:** No console.log statements remain in backend code; all logging uses logger utility
    - _Requirements: 1.9, 9.2, 9.3_

  - [~] 1.2 Fix database connection error handling
    - Update `backend/src/config/database.js` to properly handle connection failures
    - Ensure password is correctly cast to string (already done with `String(process.env.DB_PASSWORD)`)
    - Add retry logic with exponential backoff for initial connection
    - Validate all required DB environment variables before attempting connection
    - Test connection with both local PostgreSQL and Docker PostgreSQL
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Backend starts successfully with valid DB credentials; graceful error message if DB unavailable; connection pool metrics logged
    - _Requirements: 1.2, 2.1, 2.8_

  - [~] 1.3 Implement comprehensive health check endpoint
    - Create `/health` endpoint that checks database, Redis, and worker status
    - Return JSON with status for each component (healthy/unhealthy)
    - Include connection pool metrics and queue status
    - Add response time measurement (<100ms target)
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** `/health` endpoint returns 200 with component status; includes database pool metrics; responds within 100ms
    - _Requirements: 2.4, 2.5, 14.1_ c

  - [ ] 1.4 Validate and document all required environment variables
    - Create comprehensive `.env.example` file with all required variables
    - Add validation function that checks for required variables on startup
    - Document each variable's purpose and format in README
    - Fail fast with clear error message if required variables missing
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** `.env.example` includes all variables; startup validation checks all required vars; clear error messages for missing vars
    - _Requirements: 1.8, 2.3, 8.6, 15.4_

- [ ] 2. Fix OAuth authentication flows
  - [~] 2.1 Fix Google OAuth redirect URI configuration
    - Update Google Cloud Console to include correct redirect URI: `http://localhost:3001/google/auth/google/callback` (local) and production URL
    - Verify `GOOGLE_REDIRECT_URI` environment variable matches configured URI
    - Test OAuth flow end-to-end in local environment
    - Add detailed error logging for OAuth failures
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** Google Sign-In completes successfully; JWT token generated; user redirected to onboarding page; no internal errors
    - _Requirements: 3.1, 3.2, 3.7_

  - [~] 2.2 Complete and test Shopify OAuth installation flow
    - Verify Shopify OAuth initiation endpoint (`/auth/shopify/initiate`) works correctly
    - Test OAuth callback handler (`/auth/shopify/callback`) processes authorization code
    - Verify access token is encrypted before storage in database
    - Test token refresh logic if applicable
    - Add comprehensive error handling and logging
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** Shopify app installation completes successfully; access token encrypted and stored; merchant record created in database; redirects to dashboard
    - _Requirements: 3.4, 3.5, 10.3_

  - [~] 2.3 Implement JWT token validation and refresh
    - Add JWT token expiration validation in authentication middleware
    - Implement token refresh endpoint if needed
    - Test authentication middleware rejects expired/invalid tokens
    - Add proper error responses (401 for unauthorized)
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Auth middleware validates JWT correctly; expired tokens rejected with 401; invalid tokens rejected with 401; proper error messages returned
    - _Requirements: 3.3, 3.9_

  - [~] 2.4 Validate CORS configuration for OAuth callbacks
    - Verify CORS allows requests from frontend origin
    - Test preflight OPTIONS requests for OAuth endpoints
    - Ensure credentials are properly handled in CORS config
    - Update CORS config for production environment
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** CORS allows frontend origin; OAuth callbacks work with CORS; credentials properly handled; production config restricts origins
    - _Requirements: 3.8_

- [~] 3. Checkpoint - Verify backend startup and authentication
  - Start backend server and verify no errors
  - Test Google OAuth flow end-to-end
  - Test Shopify OAuth flow end-to-end
  - Verify health check endpoint returns correct status
  - Ensure all tests pass, ask the user if questions arise

### Phase 2: Data Synchronization and Job Processing (Priority: HIGH)

- [ ] 4. Validate and fix Redis/BullMQ configuration
  - [~] 4.1 Test Redis connection and configuration
    - Verify Redis connection string format is correct
    - Test Redis connectivity on startup
    - Validate Redis persistence configuration (RDB or AOF)
    - Check Redis memory limits and eviction policy
    - Add Redis health check to `/health` endpoint
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Redis connects successfully; persistence configured; health check includes Redis status; connection errors logged clearly
    - _Requirements: 2.2, 2.5, 2.9_

  - [~] 4.2 Validate BullMQ queue initialization and worker registration
    - Verify sync queue initializes correctly on startup
    - Test worker registration and job processing
    - Validate job retry configuration (max retries, backoff strategy)
    - Add queue metrics to health check endpoint
    - Test graceful shutdown of workers
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Sync queue initializes; workers register successfully; retry config validated; queue metrics available; graceful shutdown works
    - _Requirements: 2.7, 4.2_

- [ ] 5. Test and fix data synchronization engine
  - [~] 5.1 Test sync job creation and enqueueing
    - Create test merchant record in database
    - Trigger sync job for test merchant
    - Verify job is added to queue with correct data
    - Check job status in BullMQ dashboard or logs
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** Sync job created successfully; job appears in queue; job data includes merchant ID and shop domain; job status is "waiting"
    - _Requirements: 4.1, 4.2_

  - [~] 5.2 Test Shopify API data fetching (products, orders, customers)
    - Mock Shopify API responses for testing
    - Test products fetch with pagination
    - Test orders fetch with date filtering
    - Test customers fetch
    - Validate API rate limit handling (429 responses)
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** Products fetched successfully; orders fetched with filters; customers fetched; rate limits handled gracefully; errors logged with context
    - _Requirements: 4.3, 4.6_

  - [~] 5.3 Validate data storage in database after sync
    - Verify store_snapshots record created after sync
    - Check products, orders, customers data stored correctly
    - Validate merchant sync status updated
    - Test data integrity and foreign key constraints
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** store_snapshots record exists; data matches Shopify API response; merchant sync status updated; no database constraint violations
    - _Requirements: 4.4, 4.7_

  - [~] 5.4 Test sync job retry and failure handling
    - Simulate API failure and verify job retry
    - Test exponential backoff between retries
    - Verify failed jobs are logged with error details
    - Test max retry limit and final failure handling
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Failed jobs retry automatically; backoff strategy works; errors logged with context; jobs fail permanently after max retries
    - _Requirements: 4.5, 4.10_

  - [~] 5.5 Test AI analysis trigger after successful sync
    - Verify AI analysis job is created after sync completes
    - Test AI analysis processes store snapshot data
    - Validate AI insights are stored in ai_analyses table
    - Check health score calculation
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** AI analysis triggered after sync; insights generated; ai_analyses record created; health score calculated and stored
    - _Requirements: 4.8_

- [~] 6. Checkpoint - Verify data synchronization works end-to-end
  - Create test merchant and trigger full sync
  - Verify all data fetched from Shopify API
  - Confirm data stored correctly in database
  - Check AI analysis completes successfully
  - Ensure all tests pass, ask the user if questions arise

### Phase 3: Webhook Processing and Real-Time Updates (Priority: HIGH)

- [ ] 7. Implement and test webhook signature verification
  - [~] 7.1 Implement HMAC signature verification for Shopify webhooks
    - Create signature verification function using SHOPIFY_API_SECRET
    - Test with valid HMAC signature
    - Test with invalid HMAC signature
    - Add detailed logging for verification failures
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Valid signatures accepted; invalid signatures rejected with 401; verification failures logged; uses constant-time comparison
    - _Requirements: 3.10, 10.7_

  - [~] 7.2 Test webhook event processing for different event types
    - Test orders/create webhook processing
    - Test products/update webhook processing
    - Test customers/create webhook processing
    - Verify database updates after webhook processing
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** All webhook types processed correctly; database updated in real-time; webhook_events table records all webhooks; errors logged
    - _Requirements: 4.9, 9.6_

  - [~] 7.3 Implement webhook error handling and logging
    - Add try-catch blocks for webhook processing
    - Log all received webhooks with topic and shop domain
    - Log processing results (success/failure)
    - Handle malformed webhook payloads gracefully
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** All webhooks logged; processing errors caught and logged; malformed payloads return 400; no unhandled exceptions
    - _Requirements: 9.6, 9.10_

### Phase 4: API Endpoint Validation and Error Handling (Priority: HIGH)

- [ ] 8. Test and fix dashboard API endpoints
  - [~] 8.1 Test dashboard summary endpoint
    - Test `/api/dashboard/summary` with valid authentication
    - Verify response includes health score, revenue, and metrics
    - Test response time (<3 seconds target)
    - Validate response format matches frontend expectations
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Endpoint returns 200 with valid data; includes healthScore, revenue, metrics; responds within 3 seconds; format matches frontend
    - _Requirements: 5.1, 5.6, 5.8_

  - [~] 8.2 Test products endpoint with pagination
    - Test `/api/dashboard/products` with pagination parameters
    - Verify page and pageSize parameters work correctly
    - Test edge cases (page=0, pageSize=0, invalid values)
    - Validate product data includes analytics
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Pagination works correctly; invalid parameters return 400; product data includes analytics; total count returned
    - _Requirements: 5.2, 5.4_

  - [~] 8.3 Test AI insights endpoint
    - Test `/api/dashboard/insights` endpoint
    - Verify insights are actionable and formatted correctly
    - Test when no insights available
    - Validate insights include priority and category
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Endpoint returns insights array; insights include priority and category; handles no insights case; format matches frontend
    - _Requirements: 5.3_

  - [~] 8.4 Implement authentication middleware for all protected endpoints
    - Verify all dashboard endpoints require authentication
    - Test unauthenticated requests return 401
    - Test invalid tokens return 401
    - Test expired tokens return 401
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** All protected endpoints require auth; unauthenticated requests return 401; invalid/expired tokens return 401; error messages clear
    - _Requirements: 5.5_

  - [~] 8.5 Implement comprehensive error handling for API endpoints
    - Add try-catch blocks to all route handlers
    - Implement proper HTTP status codes (400, 401, 404, 500)
    - Return descriptive error messages
    - Test database connection failure handling
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** All endpoints have error handling; proper status codes used; error messages descriptive; database failures handled gracefully
    - _Requirements: 5.7, 5.9, 9.1_

- [~] 9. Checkpoint - Verify all API endpoints work correctly
  - Test all dashboard endpoints with authentication
  - Verify error handling for invalid requests
  - Check response times are acceptable
  - Ensure all tests pass, ask the user if questions arise

### Phase 5: Frontend Build and Integration (Priority: MEDIUM)

- [ ] 10. Validate frontend build and configuration
  - [~] 10.1 Test frontend build process
    - Run `npm run build` in frontend directory
    - Verify build completes without errors
    - Check dist/ directory is created
    - Analyze bundle size (<500KB target)
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** Build completes successfully; dist/ directory created; bundle size under 500KB; no build warnings
    - _Requirements: 6.1, 6.10_

  - [~] 10.2 Validate frontend environment variables
    - Verify `.env` file includes VITE_API_URL
    - Test frontend connects to backend API
    - Validate environment variable format
    - Update `.env.example` with all required variables
    - **Time Estimate:** 0.5 hours
    - **Acceptance Criteria:** VITE_API_URL configured correctly; frontend connects to backend; .env.example updated
    - _Requirements: 6.2, 6.3_

  - [~] 10.3 Test frontend API integration
    - Test authentication flow from frontend
    - Verify API requests include authentication headers
    - Test error handling for API failures
    - Verify loading states display correctly
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Auth flow works end-to-end; API requests include auth headers; errors display user-friendly messages; loading states work
    - _Requirements: 6.4, 6.5, 6.7_

  - [~] 10.4 Test frontend routing and navigation
    - Test all routes (/signin, /onboarding, /dashboard, etc.)
    - Verify protected routes redirect to signin
    - Test navigation between pages
    - Validate 404 page for invalid routes
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** All routes work correctly; protected routes require auth; navigation works; 404 page displays
    - _Requirements: 6.6_

  - [~] 10.5 Test frontend responsive design
    - Test on mobile viewport (375px width)
    - Test on tablet viewport (768px width)
    - Test on desktop viewport (1920px width)
    - Verify all components are responsive
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Layout works on mobile; layout works on tablet; layout works on desktop; no horizontal scroll
    - _Requirements: 6.8_

  - [~] 10.6 Test frontend error handling
    - Test backend unavailable scenario
    - Verify error messages are user-friendly
    - Test network timeout handling
    - Validate error logging to console
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** Backend unavailable shows error message; error messages user-friendly; timeouts handled; errors logged to console
    - _Requirements: 6.9, 9.8_

### Phase 6: Security Hardening (Priority: CRITICAL)

- [ ] 11. Implement security best practices
  - [~] 11.1 Validate security headers with helmet middleware
    - Verify helmet middleware is configured
    - Test Content-Security-Policy header
    - Test X-Frame-Options header
    - Test other security headers
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** Helmet configured; CSP header present; X-Frame-Options present; all security headers validated
    - _Requirements: 10.1_

  - [~] 11.2 Implement and test access token encryption
    - Verify Shopify access tokens are encrypted before storage
    - Test encryption/decryption functions
    - Validate ENCRYPTION_KEY is strong and not hardcoded
    - Test token retrieval and decryption
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Tokens encrypted before storage; encryption uses strong algorithm; ENCRYPTION_KEY validated; decryption works correctly
    - _Requirements: 10.2, 10.3, 10.10_

  - [~] 11.3 Validate rate limiting configuration
    - Test rate limiting on auth endpoints (20 requests per 15 minutes)
    - Test rate limiting on webhook endpoints (100 requests per minute)
    - Verify rate limit exceeded returns 429 status
    - Test rate limit headers are included in response
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Auth endpoints rate limited; webhook endpoints rate limited; 429 returned when exceeded; rate limit headers present
    - _Requirements: 10.4_

  - [~] 11.4 Validate input sanitization and SQL injection prevention
    - Verify all database queries use parameterized queries
    - Test input validation for all API endpoints
    - Check for SQL injection vulnerabilities
    - Validate user input is sanitized
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** All queries parameterized; input validation on all endpoints; no SQL injection vulnerabilities; user input sanitized
    - _Requirements: 10.5, 10.6_

  - [~] 11.5 Implement HTTPS enforcement for production
    - Add middleware to redirect HTTP to HTTPS in production
    - Verify HTTPS is enforced in production environment
    - Test HTTP requests are rejected or redirected
    - Update CORS and OAuth redirect URIs for HTTPS
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** HTTPS enforced in production; HTTP redirected to HTTPS; CORS configured for HTTPS; OAuth URIs use HTTPS
    - _Requirements: 10.9_

  - [~] 11.6 Validate sensitive data is not exposed in frontend
    - Audit frontend code for exposed secrets
    - Verify API keys not in client-side code
    - Check environment variables are not exposed
    - Validate no sensitive data in error messages
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** No secrets in frontend code; API keys not exposed; env vars not exposed; error messages don't leak sensitive data
    - _Requirements: 10.8_

- [~] 12. Checkpoint - Verify security hardening is complete
  - Test all security measures are in place
  - Run security audit on codebase
  - Verify no vulnerabilities found
  - Ensure all tests pass, ask the user if questions arise

### Phase 7: Testing and Quality Assurance (Priority: HIGH)

- [ ] 13. Implement comprehensive test coverage
  - [ ]* 13.1 Write unit tests for service layer functions
    - Write tests for Shopify service functions
    - Write tests for AI analysis service
    - Write tests for sync service
    - Write tests for webhook processor
    - Target 70% code coverage for services
    - **Time Estimate:** 6 hours
    - **Acceptance Criteria:** Unit tests for all service functions; tests pass; 70% coverage achieved; tests use mocks for external APIs
    - _Requirements: 11.1, 11.7, 11.9_

  - [ ]* 13.2 Write integration tests for API endpoints
    - Write tests for auth endpoints
    - Write tests for dashboard endpoints
    - Write tests for OAuth callback endpoints
    - Write tests for webhook endpoints
    - **Time Estimate:** 5 hours
    - **Acceptance Criteria:** Integration tests for all endpoints; tests pass; both success and failure scenarios covered; tests use test database
    - _Requirements: 11.2, 11.10_

  - [ ]* 13.3 Write end-to-end tests for OAuth flows
    - Write test for Google OAuth flow
    - Write test for Shopify OAuth flow
    - Test token generation and storage
    - Test error scenarios
    - **Time Estimate:** 4 hours
    - **Acceptance Criteria:** E2E tests for both OAuth flows; tests pass; token generation validated; error scenarios covered
    - _Requirements: 11.3_

  - [ ]* 13.4 Write tests for sync engine job processing
    - Write test for job creation
    - Write test for job processing
    - Write test for retry logic
    - Write test for failure handling
    - **Time Estimate:** 4 hours
    - **Acceptance Criteria:** Tests for all sync engine scenarios; tests pass; mocks used for Shopify API; retry logic validated
    - _Requirements: 11.4_

  - [ ]* 13.5 Write tests for webhook signature verification
    - Write test for valid signature
    - Write test for invalid signature
    - Write test for missing signature
    - Write test for malformed payload
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Tests for all signature scenarios; tests pass; constant-time comparison validated
    - _Requirements: 11.5_

  - [ ]* 13.6 Set up CI/CD pipeline for automated testing
    - Create GitHub Actions workflow or similar
    - Configure test execution on pull requests
    - Add code coverage reporting
    - Configure deployment on successful tests
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** CI/CD pipeline configured; tests run automatically; coverage reported; deployment automated
    - _Requirements: 11.8_

### Phase 8: Deployment Configuration (Priority: CRITICAL)

- [ ] 14. Validate and update Render deployment configuration
  - [~] 14.1 Validate render.yaml configuration
    - Verify all services defined (web, database, redis)
    - Check build and start commands are correct
    - Validate environment variables are declared
    - Test health check path configuration
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** render.yaml includes all services; build/start commands correct; all env vars declared; health check path valid
    - _Requirements: 8.1, 8.4_

  - [~] 14.2 Document production environment variables
    - Update `.env.production` with all required variables
    - Document each variable's purpose and format
    - Create secure values for JWT_SECRET and ENCRYPTION_KEY
    - Validate database and Redis connection strings
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** .env.production complete; all variables documented; secure secrets generated; connection strings validated
    - _Requirements: 8.6, 8.7, 8.8_

  - [~] 14.3 Test Render deployment process
    - Deploy backend to Render staging environment
    - Verify build completes successfully
    - Test health check endpoint responds
    - Validate database and Redis connections
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Deployment succeeds; build completes; health check returns 200; database and Redis connected
    - _Requirements: 8.4_

- [ ] 15. Validate and update Vercel deployment configuration
  - [~] 15.1 Validate Vercel configuration for frontend
    - Check vercel.json or package.json build configuration
    - Verify build command is correct (`vite build`)
    - Validate output directory is `dist`
    - Test environment variable configuration
    - **Time Estimate:** 1 hour
    - **Acceptance Criteria:** Build configuration correct; output directory valid; env vars configured; vercel.json valid (if present)
    - _Requirements: 8.5_

  - [~] 15.2 Test Vercel deployment process
    - Deploy frontend to Vercel staging environment
    - Verify build completes successfully
    - Test frontend loads and connects to backend
    - Validate routing works correctly
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Deployment succeeds; build completes; frontend loads; connects to backend API; routing works
    - _Requirements: 8.5_

- [ ] 16. Validate and update Docker deployment configuration
  - [~] 16.1 Validate Dockerfile configuration
    - Check multi-stage build is used
    - Verify non-root user is configured
    - Validate HEALTHCHECK instruction is present
    - Test Dockerfile builds successfully
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Multi-stage build used; non-root user configured; HEALTHCHECK present; Docker image builds successfully
    - _Requirements: 8.2, 8.9, 8.10_

  - [~] 16.2 Validate docker-compose.yml configuration
    - Verify all services defined (app, postgres, redis)
    - Check health checks are configured
    - Validate volume persistence
    - Test depends_on and restart policies
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** All services defined; health checks configured; volumes persistent; dependencies and restart policies correct
    - _Requirements: 8.3, 8.10_

  - [~] 16.3 Test Docker deployment locally
    - Build Docker image locally
    - Run docker-compose up
    - Verify all services start successfully
    - Test application works end-to-end
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Docker image builds; all services start; health checks pass; application works end-to-end
    - _Requirements: 8.2, 8.3_

- [~] 17. Checkpoint - Verify deployment configurations are production-ready
  - Test Render deployment works
  - Test Vercel deployment works
  - Test Docker deployment works
  - Ensure all tests pass, ask the user if questions arise

### Phase 9: Performance and Monitoring (Priority: MEDIUM)

- [ ] 18. Implement performance optimizations
  - [~] 18.1 Optimize database queries and connection pooling
    - Review all database queries for N+1 patterns
    - Add indexes for frequently queried columns
    - Validate connection pool configuration (min: 5, max: 20)
    - Test connection pool under load
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** No N+1 queries found; indexes added; connection pool configured; pool handles 20 concurrent connections
    - _Requirements: 13.2, 13.7_

  - [~] 18.2 Optimize frontend bundle size
    - Analyze bundle size with vite build --analyze
    - Implement code splitting for routes
    - Lazy load heavy components
    - Optimize images and assets
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Bundle size under 500KB; code splitting implemented; lazy loading works; images optimized
    - _Requirements: 13.8_

  - [~] 18.3 Test API response times under load
    - Use load testing tool (k6, Artillery, or similar)
    - Test dashboard endpoints with 100 requests per minute
    - Measure average and maximum response times
    - Verify response times under 3 seconds
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Load test executed; 100 req/min handled; average response time measured; max response time under 3 seconds
    - _Requirements: 13.1, 13.6, 13.9_

  - [~] 18.4 Validate sync engine can handle concurrent jobs
    - Test sync engine with 10 concurrent jobs
    - Measure job processing time
    - Verify Redis can handle queue throughput
    - Check for memory leaks or performance degradation
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** 10 concurrent jobs processed; processing time measured; Redis handles throughput; no memory leaks
    - _Requirements: 13.3, 13.5_

- [ ] 19. Implement monitoring and observability
  - [~] 19.1 Enhance health check endpoints
    - Add `/health/liveness` endpoint for container orchestration
    - Add `/health/readiness` endpoint for load balancer
    - Include detailed component status in health checks
    - Add response time measurement
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Liveness endpoint added; readiness endpoint added; component status included; response time measured
    - _Requirements: 14.1_

  - [~] 19.2 Implement structured logging with correlation IDs
    - Add request correlation IDs to all logs
    - Ensure all logs use structured format (JSON)
    - Add log levels (debug, info, warn, error, fatal)
    - Test log aggregation compatibility
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Correlation IDs in all logs; structured JSON format; log levels used correctly; compatible with log aggregation
    - _Requirements: 14.2, 14.7, 9.2, 9.4_

  - [~] 19.3 Add metrics endpoints for monitoring
    - Expose metrics for request count, response time, error rate
    - Add database connection pool metrics
    - Add BullMQ queue metrics (waiting, active, failed jobs)
    - Format metrics for Prometheus or similar
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Metrics endpoint exposed; request metrics available; database metrics available; queue metrics available
    - _Requirements: 14.3, 14.4, 14.5_

  - [~] 19.4 Implement error tracking and alerting
    - Configure error logging for critical errors
    - Add severity levels to error logs
    - Document alerting strategy for production
    - Test error logging captures sufficient context
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Critical errors logged; severity levels used; alerting strategy documented; error context sufficient for debugging
    - _Requirements: 14.6, 9.3_

### Phase 10: Documentation and Knowledge Transfer (Priority: MEDIUM)

- [ ] 20. Create comprehensive documentation
  - [~] 20.1 Update README with setup instructions
    - Document local development setup steps
    - Include prerequisites (Node.js, PostgreSQL, Redis, Docker)
    - Add troubleshooting section for common issues
    - Document environment variable configuration
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** README includes setup steps; prerequisites documented; troubleshooting section added; env vars documented
    - _Requirements: 15.1, 15.4_

  - [~] 20.2 Create architecture documentation
    - Create system architecture diagram
    - Document component interactions
    - Explain data flow (OAuth → Sync → Analysis → Dashboard)
    - Document technology stack and rationale
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** Architecture diagram created; component interactions documented; data flow explained; tech stack documented
    - _Requirements: 15.2_

  - [~] 20.3 Document API endpoints
    - Create API specification for all endpoints
    - Include request/response examples
    - Document authentication requirements
    - Add error response examples
    - **Time Estimate:** 3 hours
    - **Acceptance Criteria:** All endpoints documented; request/response examples included; auth requirements documented; error examples included
    - _Requirements: 15.3_

  - [~] 20.4 Create deployment documentation
    - Document Render deployment process step-by-step
    - Document Vercel deployment process step-by-step
    - Document Docker deployment process
    - Include environment variable setup for each platform
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Render deployment documented; Vercel deployment documented; Docker deployment documented; env var setup included
    - _Requirements: 15.5_

  - [~] 20.5 Document database schema
    - Create entity-relationship diagram
    - Document all tables and columns
    - Explain foreign key relationships
    - Document indexes and constraints
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** ER diagram created; all tables documented; relationships explained; indexes and constraints documented
    - _Requirements: 15.7_

  - [~] 20.6 Create OAuth setup guide
    - Document Google Cloud Console setup
    - Document Shopify Partner Dashboard setup
    - Include redirect URI configuration
    - Add screenshots for clarity
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Google OAuth setup documented; Shopify OAuth setup documented; redirect URIs documented; screenshots included
    - _Requirements: 15.8_

  - [~] 20.7 Create monitoring and alerting guide
    - Document monitoring strategy
    - Explain health check endpoints
    - Document metrics and their meaning
    - Create alerting recommendations
    - **Time Estimate:** 1.5 hours
    - **Acceptance Criteria:** Monitoring strategy documented; health checks explained; metrics documented; alerting recommendations included
    - _Requirements: 15.9, 14.10_

  - [~] 20.8 Create production incident runbook
    - Document common production issues
    - Create troubleshooting steps for each issue
    - Include rollback procedures
    - Add escalation contacts
    - **Time Estimate:** 2 hours
    - **Acceptance Criteria:** Common issues documented; troubleshooting steps included; rollback procedures documented; escalation contacts added
    - _Requirements: 15.10_

- [~] 21. Final checkpoint - Production readiness review
  - Review all completed tasks
  - Verify MVP criteria are met
  - Test complete user journey end-to-end
  - Conduct security review
  - Ensure all tests pass, ask the user if questions arise

## Notes

### MVP Production Readiness Criteria

The following criteria define the minimum requirements for production launch:

**Critical (Must Have):**
- ✅ User authentication via Google OAuth works end-to-end
- ✅ Shopify app installation and OAuth works end-to-end
- ✅ Initial data synchronization completes within 5 minutes
- ✅ Dashboard displays health score and revenue metrics
- ✅ AI insights generation and display works
- ✅ Webhook processing for order and product updates works
- ✅ Error logging and monitoring capability in place
- ✅ Security headers and HTTPS enforcement configured
- ✅ Database and Redis connections stable

**High Priority (Should Have):**
- ✅ Comprehensive error handling in all critical paths
- ✅ Rate limiting on auth and webhook endpoints
- ✅ Access token encryption
- ✅ Health check endpoints for monitoring
- ✅ Deployment configurations validated (Render/Vercel or Docker)
- ✅ API response times under 3 seconds
- ✅ Frontend responsive design works on mobile and desktop

**Medium Priority (Nice to Have):**
- ⚠️ Unit and integration test coverage (70%+)
- ⚠️ CI/CD pipeline for automated testing
- ⚠️ Performance optimization (bundle size, database queries)
- ⚠️ Comprehensive documentation (API, architecture, deployment)
- ⚠️ Production incident runbook

**Low Priority (Future Enhancement):**
- ⚠️ Advanced monitoring and alerting
- ⚠️ Load testing and performance benchmarks
- ⚠️ Database backup and recovery automation

### Task Prioritization

Tasks are organized into phases based on their impact on MVP criteria:

1. **Phase 1-3 (Critical):** Backend fixes, OAuth, data sync, webhooks - Required for basic functionality
2. **Phase 4-6 (High):** API validation, frontend, security - Required for production deployment
3. **Phase 7 (Medium):** Testing - Recommended but can be done incrementally
4. **Phase 8 (Critical):** Deployment configuration - Required for production deployment
5. **Phase 9-10 (Medium):** Performance, monitoring, documentation - Recommended for production operations

### Time Estimates Summary

- **Phase 1: Critical Backend Fixes** - 10 hours
- **Phase 2: Data Synchronization** - 13.5 hours
- **Phase 3: Webhook Processing** - 6.5 hours
- **Phase 4: API Endpoint Validation** - 8 hours
- **Phase 5: Frontend Build and Integration** - 7 hours
- **Phase 6: Security Hardening** - 8.5 hours
- **Phase 7: Testing and QA** - 24 hours (optional tasks marked with *)
- **Phase 8: Deployment Configuration** - 11 hours
- **Phase 9: Performance and Monitoring** - 13.5 hours
- **Phase 10: Documentation** - 17.5 hours

**Total Estimated Time:** 119.5 hours

**MVP Minimum (Critical + High Priority):** 64.5 hours
**Production Ready (Including Medium Priority):** 119.5 hours

### Deployment Path Recommendations

**Quick Start (Render + Vercel):**
- Fastest path to production
- Managed infrastructure (PostgreSQL, Redis)
- Automatic SSL certificates
- Easy environment variable management
- Recommended for MVP launch
- Estimated setup time: 2-3 hours after code is ready

**Docker-Based Deployment:**
- More control over infrastructure
- Can deploy to any cloud provider (AWS, GCP, Azure)
- Requires more DevOps expertise
- Better for scaling and customization
- Recommended for post-MVP optimization
- Estimated setup time: 4-6 hours after code is ready

### Testing Strategy

Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP deployment. However, they are strongly recommended for production stability:

- **Unit Tests (13.1):** Test individual service functions in isolation
- **Integration Tests (13.2):** Test API endpoints with database
- **E2E Tests (13.3):** Test complete OAuth flows
- **Sync Engine Tests (13.4):** Test background job processing
- **Webhook Tests (13.5):** Test signature verification
- **CI/CD Pipeline (13.6):** Automate testing on every commit

### Security Checklist

Before production deployment, verify:

- [~] JWT_SECRET is strong (32+ characters) and unique
- [~] ENCRYPTION_KEY is strong and unique
- [~] Shopify access tokens are encrypted in database
- [~] All API endpoints use parameterized queries
- [~] Rate limiting is configured on auth and webhook endpoints
- [~] HTTPS is enforced in production
- [~] CORS is restricted to frontend origin in production
- [~] Security headers are configured (helmet middleware)
- [~] No secrets or API keys in frontend code
- [~] Error messages don't leak sensitive information

### Common Issues and Solutions

**Backend won't start:**
- Check PostgreSQL is running and credentials are correct
- Verify all required environment variables are set
- Check port 3001 is not in use
- Review logs for specific error messages

**Google OAuth fails:**
- Verify redirect URI is configured in Google Cloud Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure redirect URI matches exactly (including protocol and path)

**Shopify OAuth fails:**
- Verify SHOPIFY_API_KEY and SHOPIFY_API_SECRET are correct
- Check Shopify app is configured with correct redirect URI
- Ensure scopes are properly configured

**Data sync fails:**
- Verify Redis is running and accessible
- Check Shopify access token is valid and not expired
- Review BullMQ worker logs for errors
- Verify Shopify API rate limits are not exceeded

**Webhooks not processing:**
- Verify SHOPIFY_API_SECRET is correct for HMAC verification
- Check webhook endpoint is publicly accessible
- Review webhook logs for signature verification failures
- Ensure webhook topics are registered in Shopify

### Next Steps After Task Completion

1. **Local Testing:** Test complete user journey in local environment
2. **Staging Deployment:** Deploy to staging environment (Render/Vercel staging)
3. **Staging Testing:** Test all functionality in staging environment
4. **Production Deployment:** Deploy to production environment
5. **Production Testing:** Smoke test critical paths in production
6. **Monitoring Setup:** Configure monitoring and alerting
7. **Documentation Review:** Ensure all documentation is up-to-date
8. **Launch:** Make application available to users
9. **Post-Launch Monitoring:** Monitor logs and metrics closely for first 48 hours
10. **Iteration:** Address any issues found in production and iterate

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.4"]
    },
    {
      "id": 1,
      "tasks": ["1.2", "1.3", "2.1", "2.4"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.3", "4.1"]
    },
    {
      "id": 3,
      "tasks": ["4.2", "5.1", "7.1", "11.1", "14.1", "14.2", "15.1", "16.1", "16.2"]
    },
    {
      "id": 4,
      "tasks": ["5.2", "7.2", "8.4", "10.1", "10.2", "11.2", "11.6", "20.1", "20.5", "20.6"]
    },
    {
      "id": 5,
      "tasks": ["5.3", "5.4", "7.3", "8.1", "8.5", "10.3", "10.4", "11.3", "11.4", "18.1", "20.2", "20.3"]
    },
    {
      "id": 6,
      "tasks": ["5.5", "8.2", "8.3", "10.5", "10.6", "11.5", "13.1", "13.2", "18.2", "19.1", "19.2", "20.4"]
    },
    {
      "id": 7,
      "tasks": ["13.3", "13.4", "13.5", "14.3", "15.2", "16.3", "18.3", "18.4", "19.3", "20.7"]
    },
    {
      "id": 8,
      "tasks": ["13.6", "19.4", "20.8"]
    }
  ]
}
```
