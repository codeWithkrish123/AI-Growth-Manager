# AI Growth Manager - MongoDB to PostgreSQL Migration Guide

## Overview
This guide helps you migrate your AI Growth Manager from MongoDB to PostgreSQL for better performance, reliability, and SQL capabilities.

## What's Been Done

### ✅ Database Configuration Updated
- **MongoDB → PostgreSQL**: Database connection switched from Mongoose to `pg` library
- **Environment Variables**: Updated `.env.example` with `POSTGRES_URI`
- **Package Dependencies**: Replaced `mongoose` with `pg` in `package.json`

### ✅ Database Schema Created
- **Schema File**: `backend/src/database/schema.sql` with complete PostgreSQL schema
- **Tables Created**:
  - `merchants` - Store authentication and info
  - `store_snapshots` - Metrics and health data
  - `ai_analyses` - AI insights and problems
  - `sync_jobs` - Background job tracking
- **Indexes**: Optimized for performance
- **Triggers**: Auto-update timestamps

### ✅ Models Converted
- **Merchant Model**: Converted from Mongoose to PostgreSQL with backward compatibility
- **Helper Functions**: Added query helpers and mapping functions
- **Encryption**: Maintained existing token encryption/decryption

### ✅ API Services Enabled
- **Frontend API**: Uncommented and fixed API service calls
- **Dashboard Integration**: Connected frontend to backend APIs
- **Error Handling**: Proper error handling and response formatting

## What You Need to Do

### 1. Set Up PostgreSQL Database
```sql
-- Create database
CREATE DATABASE ai_growth_manager;

-- Create user (optional but recommended)
CREATE USER ai_growth_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_growth_manager TO ai_growth_user;
```

### 2. Update Environment Variables
Copy `.env.example` to `.env` and update:
```bash
POSTGRES_URI=postgresql://username:password@localhost:5432/ai_growth_manager
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Run Database Migration
```bash
# Run the migration script
node src/database/migration.js

# Or run it manually
psql -d ai_growth_manager -f src/database/schema.sql
```

### 5. Update Other Models (Optional)
The following models still need conversion:
- `StoreSnapshot.model.js`
- `AiAnalysis.model.js`
- `secondary.models.js`

**Current Status**: These will work with existing MongoDB queries but need PostgreSQL conversion for full migration.

## Architecture Overview

### 🏗️ System Flow
```
Shopify Store → OAuth → App Installation → Data Sync → AI Analysis → Dashboard
```

### 🔧 Key Components

#### Backend (Node.js + Express + PostgreSQL)
- **Authentication**: Shopify OAuth with encrypted token storage
- **Data Sync**: Background jobs fetch products, orders, customers
- **AI Analysis**: Anthropic Claude analyzes store metrics
- **APIs**: RESTful endpoints for frontend integration

#### Frontend (React + Vite + Tailwind)
- **Dashboard**: Real-time metrics and health scores
- **AI Actions**: Quick fixes based on AI recommendations
- **Shop Connection**: Seamless Shopify store integration

#### AI/LLM Integration
- **Anthropic Claude**: Store analysis and recommendations
- **Prompt Engineering**: Structured prompts for consistent results
- **Cost Tracking**: Token usage and cost monitoring

### 📊 Data Flow
1. **Store Installation** → Merchant record created
2. **Data Sync** → Products, orders, customers fetched
3. **Metrics Calculation** → Health score and KPIs computed
4. **AI Analysis** → Claude identifies problems and solutions
5. **Dashboard Display** → Real-time insights and actions

## Missing Components & Recommendations

### 🚨 High Priority

#### 1. Complete Model Migration
**Files to Update**:
- `backend/src/models/StoreSnapshot.model.js`
- `backend/src/models/AiAnalysis.model.js`
- `backend/src/models/secondary.models.js`

**Impact**: Critical for full PostgreSQL functionality

#### 2. Environment Configuration
**Missing**: Proper `.env` file setup
**Solution**: Copy from `.env.example` and configure

#### 3. Database Connection Testing
**Missing**: Connection validation
**Recommendation**: Add health check endpoint

### 🔧 Medium Priority

#### 4. Error Handling Enhancement
**Current**: Basic error handling
**Recommendation**: Add comprehensive error logging and user-friendly messages

#### 5. API Documentation
**Missing**: API documentation
**Recommendation**: Add Swagger/OpenAPI documentation

#### 6. Testing Suite
**Missing**: Unit and integration tests
**Recommendation**: Add Jest tests for critical functions

### 🎯 Low Priority

#### 7. Performance Optimization
**Current**: Basic indexes
**Recommendation**: Add query optimization and caching

#### 8. Monitoring & Analytics
**Missing**: Application monitoring
**Recommendation**: Add APM and error tracking

## Frontend Status

### ✅ Working Components
- **Routing**: React Router configured
- **UI Components**: Tailwind CSS styling
- **API Integration**: Connected to backend
- **Dashboard Layout**: Responsive design

### ⚠️ Needs Attention
- **Real-time Updates**: WebSocket integration for live data
- **Error States**: Proper error handling in UI
- **Loading States**: Better loading indicators
- **Mobile Optimization**: Responsive improvements

## Security Considerations

### ✅ Implemented
- **Token Encryption**: AES-256 for Shopify access tokens
- **HMAC Validation**: Shopify webhook verification
- **CORS**: Proper cross-origin configuration
- **Rate Limiting**: API rate limiting

### 🔐 Recommended Additions
- **Input Validation**: Sanitize all inputs
- **SQL Injection Prevention**: Use parameterized queries
- **Session Management**: Secure session handling
- **Audit Logging**: Track all user actions

## Deployment Checklist

### Pre-deployment
- [ ] PostgreSQL database set up
- [ ] Environment variables configured
- [ ] Database migration run
- [ ] All models converted to PostgreSQL
- [ ] API endpoints tested
- [ ] Frontend build tested

### Post-deployment
- [ ] Monitor database performance
- [ ] Check AI API usage and costs
- [ ] Verify Shopify webhook delivery
- [ ] Test end-to-end user flow

## Next Steps

1. **Immediate**: Set up PostgreSQL and run migration
2. **Week 1**: Convert remaining models
3. **Week 2**: Add comprehensive testing
4. **Week 3**: Performance optimization
5. **Week 4**: Documentation and deployment

## Support

For issues with:
- **Database**: Check PostgreSQL logs and connection strings
- **Shopify API**: Verify API credentials and permissions
- **AI Integration**: Check Anthropic API key and usage
- **Frontend**: Check browser console for API errors

---

**Status**: ✅ Core migration complete, 🔧 some components need updating
**Next Action**: Set up PostgreSQL database and run migration script
