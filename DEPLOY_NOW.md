# 🚀 DEPLOY NOW - Complete Guide

## Status: ✅ READY TO DEPLOY

Your AI Growth Manager is production-ready. Follow this guide to deploy to Vercel (frontend) and Render (backend).

---

## 📋 What You Need

Before starting, gather these credentials:

- [x] GitHub account (repo already pushed)
- [ ] Vercel account (free)
- [ ] Render account (free)
- [ ] Google OAuth credentials (from console.cloud.google.com)
- [ ] Shopify API credentials (from partners.shopify.com)
- [ ] Generated JWT_SECRET (see below)

### Generate JWT_SECRET NOW

Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - you'll need it for Render.

---

## 🔴 QUICK START - 5 Steps to Live

### Step 1: Create Vercel Account (5 min)
1. Go to **vercel.com**
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access GitHub
5. ✅ Done

### Step 2: Deploy Frontend (10 min)
1. On Vercel dashboard, click "Add New..." → "Project"
2. Import repository: `AI-Growth-Manager`
3. Root Directory: **frontend**
4. Click "Deploy"
5. Wait for build (~3-5 min)
6. Get URL: `https://your-project.vercel.app`
7. ✅ Done

### Step 3: Create Render Account (5 min)
1. Go to **render.com**
2. Click "Get Started"
3. Choose "Continue with GitHub"
4. Authorize Render to access GitHub
5. ✅ Done

### Step 4: Create Database on Render (5 min)
1. Click "Create New" → "PostgreSQL"
2. Name: `ai-growth-db`
3. Region: Choose closest
4. Click "Create Database"
5. Copy connection string (will see it after creation)
6. ✅ Done

### Step 5: Deploy Backend (15 min)
1. Click "Create New" → "Web Service"
2. Choose your GitHub repo
3. Root Directory: **backend**
4. Click "Create Web Service"
5. Add environment variables (see below)
6. Wait for build (~5-10 min)
7. Get URL: `https://your-backend-XXXX.onrender.com`
8. ✅ Done

---

## 🔑 Environment Variables - Copy & Paste

### For Vercel (Frontend)
Go to: **Vercel Project → Settings → Environment Variables**

Add these 2 variables:
```
VITE_BACKEND_URL = https://your-backend-XXXX.onrender.com/api
VITE_API_URL = https://your-backend-XXXX.onrender.com/api
```

Then redeploy frontend.

### For Render (Backend)
Go to: **Render Web Service → Environment**

Add all these variables:

```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

DATABASE_URL=<from PostgreSQL connection string>
REDIS_URL=redis://default:@localhost:6379

JWT_SECRET=<paste the one you generated>
JWT_EXPIRY=7d

GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

SHOPIFY_API_KEY=<from Shopify Partners>
SHOPIFY_API_SECRET=<from Shopify Partners>
SHOPIFY_WEBHOOK_SECRET=<from Shopify Partners>

BACKEND_URL=https://your-backend-XXXX.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app

SENTRY_DSN=<optional>
```

---

## ✅ Verify Deployment

### Test Frontend
```
Open: https://your-frontend.vercel.app
Expected: See login page
```

### Test Backend
```
Open: https://your-backend-XXXX.onrender.com/health
Expected: {"status":"ok"}
```

### Test Connection
```
1. Login on frontend
2. Open DevTools (F12)
3. Go to Network tab
4. Check API calls go to backend URL
5. Expected: No 403/CORS errors
```

---

## 🎯 Next: Get API Credentials

### 1. Google OAuth Credentials
1. Go to **console.cloud.google.com**
2. Create new project
3. Search "Google+ API" → Enable
4. Click "Create Credentials" → OAuth 2.0 Client ID
5. Select "Web application"
6. Add Authorized redirect URI:
   ```
   https://your-backend-XXXX.onrender.com/google/auth/google/callback
   ```
7. Copy Client ID and Secret
8. Add to Render environment variables

### 2. Shopify API Credentials
1. Go to **partners.shopify.com**
2. Create app
3. Admin API → Review scopes needed
4. Install app on test store
5. Copy API key and secret
6. Add to Render environment variables

### 3. Set Shopify Webhook Secret
1. In Shopify app settings
2. Set webhook URL: `https://your-backend-XXXX.onrender.com/shopify/webhooks`
3. Copy webhook secret
4. Add to Render environment variables

---

## 🆘 If Something Breaks

### Frontend won't load
```
→ Check: Vercel build succeeded (click deployment)
→ Check: VITE_BACKEND_URL is correct
→ Check: Frontend was redeployed after updating env vars
```

### Backend won't start
```
→ Check: DATABASE_URL is correct
→ Check: PostgreSQL database exists
→ Check: All required env vars set (don't leave blank)
```

### API calls fail
```
→ Check: Backend URL is correct in Vercel env var
→ Check: Frontend was redeployed
→ Check: No CORS errors in Network tab
```

### Login doesn't work
```
→ Check: Google OAuth credentials are correct
→ Check: Redirect URI matches in Google Console
→ Check: Backend has GOOGLE_CLIENT_ID set
```

---

## 📊 Deployment Checklist

- [ ] Vercel account created
- [ ] Render account created
- [ ] Frontend deployed to Vercel
- [ ] PostgreSQL created on Render
- [ ] Backend deployed to Render
- [ ] DATABASE_URL configured
- [ ] Frontend env vars updated
- [ ] Backend env vars set
- [ ] Google OAuth credentials obtained
- [ ] Shopify API credentials obtained
- [ ] JWT_SECRET generated and set
- [ ] Frontend redeploy after env var changes
- [ ] Frontend loads without errors
- [ ] Backend responds to /health
- [ ] Login works end-to-end
- [ ] No console errors

---

## 🎉 You're Live!

Once all checks pass:

1. **Frontend:** `https://your-frontend.vercel.app`
2. **Backend:** `https://your-backend-XXXX.onrender.com`
3. **Both connected:** Users can login, use app

---

## 📚 More Help

- **Detailed steps:** See DEPLOYMENT_STEPS.md
- **Env variables:** See ENV_VARIABLES_CHECKLIST.md
- **Troubleshooting:** See PRODUCTION_READINESS_SUMMARY.md
- **QA testing:** See QA_EXECUTION_GUIDE.md

---

## ⏱️ Expected Timeline

```
5-10 min: Vercel setup + frontend deploy
5 min: Render account setup
5 min: Create PostgreSQL database
5-10 min: Create Redis cache (optional)
15 min: Backend deploy + env vars
10 min: Get API credentials
10 min: Final verification

Total: 60-75 minutes to live product
```

---

## 🚀 START NOW!

1. Go to vercel.com
2. Sign up with GitHub
3. Import your repo
4. Deploy
5. Get Render account
6. Deploy backend
7. Add env vars
8. Done! 🎉

**Questions?** Check DEPLOYMENT_STEPS.md or ENV_VARIABLES_CHECKLIST.md

**Let's launch! 🚀**
