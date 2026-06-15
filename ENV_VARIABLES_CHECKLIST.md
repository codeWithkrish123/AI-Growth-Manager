# Production Environment Variables Checklist

## ✅ VERCEL - Frontend Environment Variables

Add these in: **Vercel Dashboard → Project Settings → Environment Variables**

```
VITE_BACKEND_URL = https://ai-growth-backend-XXXX.onrender.com/api
VITE_API_URL = https://ai-growth-backend-XXXX.onrender.com/api
```

**Note:** Replace XXXX with your Render backend service name

---

## ✅ RENDER - Backend Environment Variables

Add these in: **Render Dashboard → Web Service → Environment**

### Node Configuration
```
NODE_ENV = production
PORT = 3001
LOG_LEVEL = info
```

### Database & Cache
```
DATABASE_URL = postgresql://user:password@host.onrender.com:5432/ai_growth_manager
REDIS_URL = redis://:password@host.onrender.com:6379
```

**Get DATABASE_URL from:** Render Dashboard → PostgreSQL → Connection String (URI)  
**Get REDIS_URL from:** Render Dashboard → Redis → Connection String (URI)

### Security & Authentication
```
JWT_SECRET = <GENERATE: Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRY = 7d
```

### Google OAuth (Get from Google Console)
```
GOOGLE_CLIENT_ID = <Your Google Client ID>
GOOGLE_CLIENT_SECRET = <Your Google Client Secret>
```

### Shopify API (Get from Shopify Partners)
```
SHOPIFY_API_KEY = <Your Shopify API Key>
SHOPIFY_API_SECRET = <Your Shopify API Secret>
SHOPIFY_WEBHOOK_SECRET = <Your Shopify Webhook Secret>
```

### URLs
```
BACKEND_URL = https://ai-growth-backend-XXXX.onrender.com
FRONTEND_URL = https://ai-growth-manager-XXXX.vercel.app
```

### Optional: Error Tracking (Sentry)
```
SENTRY_DSN = <Your Sentry DSN URL>
```

---

## 🔑 How to Generate Missing Values

### Generate JWT_SECRET (32 random characters)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Get Google OAuth Credentials
1. Go to: console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Authorized redirect URIs:
   ```
   https://ai-growth-backend-XXXX.onrender.com/google/auth/google/callback
   https://your-frontend.vercel.app/
   ```
6. Copy Client ID and Secret

### Get Shopify API Credentials
1. Go to: partners.shopify.com
2. Create app
3. Admin API scopes needed:
   ```
   read_products
   write_products
   read_orders
   read_customers
   read_shop
   ```
4. Copy API key and secret

---

## ✅ Render PostgreSQL Setup

After creating PostgreSQL on Render:

1. **Get Connection Details:**
   - Dashboard → PostgreSQL instance
   - Copy "Connection String (URI)"
   - Format: `postgresql://user:password@host:5432/database`

2. **Connect to Database (from local terminal):**
   ```bash
   psql "postgresql://user:password@host:5432/database"
   ```

3. **Run Migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Seed Data (optional):**
   ```bash
   npm run seed
   ```

---

## ✅ Render Redis Setup

After creating Redis on Render:

1. **Get Connection String:**
   - Dashboard → Redis instance
   - Copy "Connection String (URI)"
   - Format: `redis://:password@host:6379`

2. **Test Connection:**
   ```bash
   redis-cli -u "redis://:password@host:6379" ping
   # Should return: PONG
   ```

---

## ✅ Verification Checklist

### Before Deploying Backend

- [ ] All required environment variables listed
- [ ] JWT_SECRET generated (32+ characters)
- [ ] Google OAuth credentials obtained
- [ ] Shopify API credentials obtained
- [ ] PostgreSQL connection string verified
- [ ] Redis connection string verified
- [ ] Backend .env file created locally (for testing)
- [ ] Local backend starts: `npm start`
- [ ] Local API responds: `curl http://localhost:3001/health`

### Before Deploying Frontend

- [ ] Backend deployed first (get URL)
- [ ] VITE_BACKEND_URL updated (correct Render URL)
- [ ] Frontend builds locally: `npm run build`
- [ ] Environment variables in Vercel configured
- [ ] Frontend starts: `npm run dev`

### After Both Deployed

- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] Backend responds: `https://your-backend.onrender.com/health`
- [ ] Login works end-to-end
- [ ] No CORS errors in Network tab
- [ ] No console errors
- [ ] API calls successful in Render logs
- [ ] Database connected in Render logs

---

## 🆘 Troubleshooting Environment Variables

### Frontend shows "Cannot connect to API"
```
✗ Check: VITE_BACKEND_URL is correct
✗ Check: Backend URL is accessible
✗ Check: CORS enabled on backend
→ Fix: Update Vercel env var, redeploy
```

### Backend won't start
```
✗ Check: DATABASE_URL is correct format
✗ Check: Database is running
✗ Check: Connection can reach database
→ Fix: Verify Render PostgreSQL connection
```

### Authentication fails
```
✗ Check: JWT_SECRET is set
✗ Check: GOOGLE_CLIENT_ID correct
✗ Check: SHOPIFY_API_KEY correct
→ Fix: Verify all credentials in Render
```

### Redis connection fails
```
✗ Check: REDIS_URL format correct
✗ Check: Redis instance running
✗ Check: Password included in URL
→ Fix: Verify Render Redis connection string
```

---

## 📋 Environment Variables Summary

### Frontend (Vercel)
- 2 variables total
- 1 critical: VITE_BACKEND_URL

### Backend (Render)
- 15+ variables total
- 3 critical: DATABASE_URL, JWT_SECRET, API keys

**Total time to configure:** 15-20 minutes

---

## ✅ Ready to Deploy?

Checklist before clicking "Deploy":

- [ ] All 17 backend variables ready
- [ ] All 2 frontend variables ready
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] Google OAuth credentials obtained
- [ ] Shopify API credentials obtained
- [ ] JWT_SECRET generated
- [ ] vercel.json configured
- [ ] render.yaml configured

**If all checked → You're ready! Click Deploy! 🚀**

---

**Next Step:** Follow DEPLOYMENT_STEPS.md to deploy both services
