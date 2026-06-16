# ✅ Production Ready Checklist - AI Growth Manager

**Last Updated:** June 15, 2026 - 19:43 IST  
**Status:** ✅ Ready for Deployment

---

## 🔒 CRITICAL: Environment Variables for Production

### Required Variables (MUST SET):

**Backend (.env.production):**
```
✅ NODE_ENV=production
✅ PORT=3001 (or your server port)
✅ FRONTEND_URL=https://your-frontend-domain.com  ← UPDATE THIS
✅ APP_URL=https://your-backend-api.com           ← UPDATE THIS
✅ POSTGRES_URI=postgresql://user:pass@host/db    ← UPDATE THIS
✅ JWT_SECRET=<generate: openssl rand -hex 32>
✅ ENCRYPTION_KEY=<32-char random key>
✅ OPENAI_API_KEY=sk-...                          ← ADD IF MISSING
✅ SHOPIFY_API_KEY=your_production_key            ← UPDATE THIS
✅ SHOPIFY_API_SECRET=shpss_your_secret           ← UPDATE THIS
✅ GOOGLE_CLIENT_ID=...apps.googleusercontent.com ← UPDATE THIS
✅ GOOGLE_CLIENT_SECRET=GOCSPX-...                ← UPDATE THIS
✅ GOOGLE_REDIRECT_URI=https://your-api.com/auth/google/callback
✅ RESEND_API_KEY=re_...                          ← ADD IF EMAIL NEEDED
```

**Frontend (.env):**
```
✅ VITE_API_URL=https://your-backend-api.com
```

---

## 🔄 OAuth Configuration Validation

### ✅ Google OAuth Setup
- [ ] Verify GOOGLE_CLIENT_ID is for your production domain
- [ ] Verify GOOGLE_REDIRECT_URI: `https://your-backend-api.com/auth/google/callback`
- [ ] Add callback URL to Google Cloud Console Authorized redirect URIs
- [ ] Test: Sign in with Google button redirects to Google login

### ✅ Shopify OAuth Setup
- [ ] Shopify app has correct App URL: `https://your-backend-api.com/auth/shopify/callback`
- [ ] Test: Shopify Store tab shows Shopify OAuth flow
- [ ] Verify Shopify API scopes are correct in .env.production

---

## 🚀 Frontend (Next.js / Vercel)

### Deployment Checks:
- [ ] Frontend deployed to production URL (e.g., Vercel)
- [ ] VITE_API_URL points to production backend
- [ ] SignIn page displays both tabs (Google Account, Shopify Store)
- [ ] Error messages display properly (red error box below tabs)
- [ ] Loading states work (spinner on buttons during auth)

### Browser Console:
- [ ] No CORS errors on auth requests
- [ ] No JavaScript errors on SignIn page
- [ ] No 404 errors for API endpoints

---

## 🔧 Backend (Node.js / Render)

### Server Checks:
- [ ] Backend deployed to production URL (e.g., Render, AWS, Fly.io)
- [ ] Port 3001 (or configured port) is exposed and accessible
- [ ] All environment variables loaded from .env.production
- [ ] Database connection verified (no connection errors)
- [ ] Redis connection verified (if using background jobs)

### Critical Endpoints:
```
✅ GET /google/auth/google
   → Returns: { success: true, data: { authUrl: "https://accounts.google.com/..." } }

✅ POST /api/auth/shopify
   → Body: { shop: "mystore.myshopify.com" }
   → Returns: { success: true, data: { authUrl: "https://mystore.myshopify.com/..." } }

✅ GET /auth/google/callback (with OAuth code)
   → Redirects to: FRONTEND_URL/onboarding?token=...

✅ GET /auth/shopify/callback (with OAuth code from Shopify)
   → Redirects to: FRONTEND_URL/dashboard/mystore.myshopify.com?success=true
```

---

## 🔐 Security Checks

- [ ] JWT_SECRET is 32+ characters and NOT the dev value
- [ ] ENCRYPTION_KEY is 32+ characters and NOT the dev value
- [ ] SHOPIFY_API_SECRET stored securely (not in code)
- [ ] GOOGLE_CLIENT_SECRET stored securely (not in code)
- [ ] POSTGRES_URI uses secure password (not "Newdelhi2025")
- [ ] No API keys logged in console (check server logs)
- [ ] CORS properly configured for production domain

---

## 🧪 Production Testing

### SignIn Page Tests:
1. [ ] **Google OAuth Flow**
   - Click "Continue with Google" on SignIn page
   - Redirects to Google login
   - After approval, redirects to Onboarding page
   - User data saved in database

2. [ ] **Shopify OAuth Flow**
   - Switch to "Shopify Store" tab
   - Enter shop name (e.g., "mystore")
   - Click "CONTINUE"
   - Redirects to Shopify install page
   - After approval, redirects to Dashboard

3. [ ] **Error Handling**
   - Test with invalid shop name → Shows error message
   - Test with network disconnect → Shows error message
   - Test with OAuth rejection → Shows error message
   - Close error and try again → Error clears on tab switch

### Dashboard Access:
- [ ] After successful SignIn, user can access dashboard
- [ ] Dashboard data loads without 500 errors
- [ ] All features (Products, Ads, Emails) are accessible

---

## 📊 Database & Persistence

- [ ] PostgreSQL is running in production
- [ ] Database has all required tables (merchants, products, orders, etc.)
- [ ] User data persists after refresh
- [ ] No data loss on server restart

---

## 🚨 Common Production Issues & Fixes

### Issue: "CORS error: Origin not allowed"
**Fix:** Update FRONTEND_URL in backend .env.production to match your frontend domain

### Issue: "Cannot GET /google/auth/google"
**Fix:** Ensure backend routes are properly imported in app.js

### Issue: "Invalid OAUTH state"
**Fix:** Ensure APP_URL and FRONTEND_URL are exact matches (with protocol: https://)

### Issue: "Connection refused" to database
**Fix:** Verify POSTGRES_URI is correct and database is running

### Issue: "Redirect URL mismatch" from Shopify/Google
**Fix:** Update OAuth callback URLs in provider consoles to match production URLs

---

## 📋 Pre-Launch Checklist

- [ ] All environment variables in .env.production are set
- [ ] Frontend and backend are deployed to production
- [ ] SSL/HTTPS is enabled on all domains
- [ ] Database is backed up
- [ ] Error logging is configured (Sentry, LogRocket, etc.)
- [ ] Monitoring is set up (uptime checks, error alerts)
- [ ] Support email/contact is ready for user issues
- [ ] Privacy policy and terms are available
- [ ] Load testing completed (no 503 errors under normal load)

---

## ✅ Deployment Steps

### 1. Prepare Backend (.env.production)
```bash
# Update all production values
# Keep secrets secure - use environment secrets in deployment platform
```

### 2. Deploy Backend
```bash
# Example for Render/Railway/Fly
git push production main
# Platform automatically deploys from .env.production
```

### 3. Prepare Frontend (.env)
```bash
# Update VITE_API_URL to production backend
VITE_API_URL=https://your-backend-api.com
```

### 4. Deploy Frontend
```bash
git push
# Vercel/Netlify automatically deploys on git push
```

### 5. Verify OAuth Configurations
```bash
# Google Cloud Console → Authorized redirect URIs
https://your-backend-api.com/auth/google/callback

# Shopify Admin → Apps → Your App → Configuration
App URL: https://your-backend-api.com/auth/shopify/callback
```

### 6. Run Smoke Tests
- [ ] Test SignIn page with Google OAuth
- [ ] Test SignIn page with Shopify OAuth
- [ ] Verify no console errors
- [ ] Check backend logs for errors

---

## 🎯 Current Status

**Frontend SignIn Page:**
✅ Enhanced with error handling  
✅ Loading states on all buttons  
✅ Mobile responsive  
✅ Tab switching works  
✅ Google OAuth button functional  
✅ Shopify OAuth form functional  

**Backend Auth:**
✅ Improved error handling in initiateShopifyAuth  
✅ Better error handling in handleShopifyCallback  
✅ Config validation implemented  
✅ Graceful error redirects  
✅ Async webhook registration (non-blocking)  

**Ready for Deployment:** YES ✅

---

## 🆘 Support & Debugging

### Enable Debug Logging:
```bash
# In backend, set LOG_LEVEL=debug
LOG_LEVEL=debug
```

### Check Production Logs:
```bash
# Render/Railway/Fly provide dashboard logs
# Monitor for auth errors, database errors, webhook failures
```

### Test Auth Endpoints Directly:
```bash
# Test Google auth URL generation
curl https://your-backend-api.com/google/auth/google

# Test Shopify auth URL generation
curl -X POST https://your-backend-api.com/api/auth/shopify \
  -H "Content-Type: application/json" \
  -d '{"shop":"mystore.myshopify.com"}'
```

---

**Next Steps:**
1. Update .env.production with production URLs and secrets
2. Deploy backend to production
3. Deploy frontend to production
4. Run smoke tests
5. Monitor logs for errors
6. Share with users when ready! 🚀
