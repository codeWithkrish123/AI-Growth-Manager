# Deployment Steps - Vercel Frontend & Render Backend

## Prerequisites
- GitHub account with repo pushed
- Vercel account (free tier)
- Render account (free tier)
- API keys ready:
  - Google OAuth credentials
  - Shopify API key & secret
  - JWT secret

---

## PART 1: Deploy Frontend to Vercel

### Step 1.1: Create Vercel Account
1. Go to vercel.com
2. Sign up with GitHub
3. Authorize GitHub access
4. Select your repository

### Step 1.2: Configure Vercel Project
1. Click "Import Project"
2. Select: `AI-Growth-Manager` repository
3. Framework Preset: **Vite**
4. Root Directory: **frontend**
5. Build Command: `npm run build`
6. Install Command: `npm install`
7. Output Directory: `dist`

### Step 1.3: Set Environment Variables
In Vercel dashboard → Settings → Environment Variables

```
VITE_BACKEND_URL = https://ai-growth-backend-XXXX.onrender.com/api
VITE_API_URL = https://ai-growth-backend-XXXX.onrender.com/api
```

**Note:** Replace XXXX with your actual Render service name (get this after deploying backend)

### Step 1.4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Get your domain: `https://yourproject.vercel.app`
4. Custom domain (optional):
   - Add domain in Vercel Settings
   - Point DNS to Vercel

**Expected:** ✅ Frontend live and accessible

---

## PART 2: Deploy Backend to Render

### Step 2.1: Create Render Account
1. Go to render.com
2. Sign up with GitHub
3. Authorize GitHub access

### Step 2.2: Create PostgreSQL Database
1. Dashboard → Create New → PostgreSQL
2. Name: `ai-growth-db`
3. Region: Choose closest to you
4. Database name: `ai_growth_manager`
5. Click "Create Database"
6. Copy connection string (will need this)

### Step 2.3: Create Redis Cache (Optional but Recommended)
1. Dashboard → Create New → Redis
2. Name: `ai-growth-cache`
3. Region: Same as database
4. Click "Create Redis"
5. Copy connection string

### Step 2.4: Create Web Service
1. Dashboard → Create New → Web Service
2. Connect GitHub repo
3. Repository: Select your repo
4. Branch: `main`
5. Root Directory: `backend`
6. Runtime: **Node**
7. Build Command: `npm install`
8. Start Command: `npm start`
9. Plan: **Free**

### Step 2.5: Set Environment Variables
Click "Environment" and add each variable:

```
NODE_ENV = production
PORT = 3001
LOG_LEVEL = info

DATABASE_URL = postgresql://user:pass@host:port/ai_growth_manager
REDIS_URL = redis://host:port

JWT_SECRET = <generate 32 random characters>
JWT_EXPIRY = 7d

GOOGLE_CLIENT_ID = <your Google OAuth ID>
GOOGLE_CLIENT_SECRET = <your Google OAuth secret>

SHOPIFY_API_KEY = <your Shopify API key>
SHOPIFY_API_SECRET = <your Shopify API secret>
SHOPIFY_WEBHOOK_SECRET = <your Shopify webhook secret>

BACKEND_URL = https://ai-growth-backend-XXXX.onrender.com
FRONTEND_URL = https://ai-growth-manager-XXXX.vercel.app

SENTRY_DSN = <optional: Sentry error tracking>
```

### Step 2.6: Deploy
1. Click "Create Web Service"
2. Wait for build and deployment (~5-10 minutes)
3. Get your URL: `https://ai-growth-backend-XXXX.onrender.com`

**Expected:** ✅ Backend live and accessible

---

## PART 3: Update Frontend Environment Variables

After backend deployment, update Vercel with correct backend URL:

1. Go to Vercel project → Settings → Environment Variables
2. Update `VITE_BACKEND_URL`:
   ```
   https://ai-growth-backend-XXXX.onrender.com/api
   ```
3. Redeploy frontend:
   - Push a commit to main (e.g., update README)
   - OR click "Redeploy" in Vercel dashboard
4. Wait for build to complete

---

## PART 4: Verify Deployments

### Test Frontend
1. Open `https://your-frontend.vercel.app`
2. You should see login page
3. Open DevTools (F12)
4. Check Network tab for API calls
5. Expected: No CORS errors

### Test Backend
1. Open API directly:
   ```
   https://your-backend-XXXX.onrender.com/health
   ```
2. Should return: `{"status":"ok"}`

### Test Connection
1. Login to frontend
2. Should make API call to backend
3. Check Network tab → API calls should be to backend URL
4. No 403/CORS errors

---

## PART 5: Configure Domains (Optional)

### Add Custom Domain to Vercel
1. Vercel → Project → Settings → Domains
2. Add domain (e.g., `aigrowthmanager.com`)
3. Update DNS records:
   - CNAME: `cname.vercel-dns.com`
   - Or A record: Vercel's IP

### Add Custom Domain to Render
1. Render → Web Service → Settings → Custom Domain
2. Add domain (e.g., `api.aigrowthmanager.com`)
3. Update DNS records to point to Render

---

## PART 6: Setup Monitoring

### Vercel Monitoring
- Automatic: Vercel monitors uptime
- View logs: Deployments → click deployment → Logs
- View errors: click deployment name

### Render Monitoring
- View logs: Service page → Logs
- View metrics: Service page → Metrics
- Set up alerts: Settings → Notifications

### Add Error Tracking (Sentry)
1. Go to sentry.io
2. Create project (Select "Node")
3. Get DSN URL
4. Add to backend `.env`: `SENTRY_DSN=<your-dsn>`
5. Errors now tracked automatically

---

## Troubleshooting

### Frontend 404 after refresh
- **Cause:** React Router not configured
- **Fix:** Already configured in vercel.json ✅

### CORS errors
- **Cause:** Backend URL wrong in frontend
- **Fix:** Update VITE_BACKEND_URL in Vercel
- Redeploy frontend

### Backend won't start
- **Cause:** Database not connected
- **Fix:** Check DATABASE_URL is correct
- Check database is running
- Review Render logs

### API calls fail
- **Cause:** Auth tokens invalid
- **Fix:** Clear localStorage, login again
- Check JWT_SECRET matches

### Slow performance
- **Cause:** Free tier limitations
- **Fix:** Upgrade to paid tier OR optimize queries

---

## URLs After Deployment

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | https://your-frontend.vercel.app | Or custom domain |
| Backend | https://your-backend-XXXX.onrender.com | Or custom domain |
| Database | PostgreSQL connection string | From Render dashboard |
| Cache | Redis connection string | From Render dashboard |

---

## Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Database created and connected
- [ ] Environment variables set on both platforms
- [ ] Frontend updated with backend URL
- [ ] Login flow tested end-to-end
- [ ] API calls working (check Network tab)
- [ ] No CORS errors
- [ ] No console errors
- [ ] Custom domains configured (optional)
- [ ] Monitoring setup (Sentry or Vercel/Render native)
- [ ] Backups enabled (if paid tier)

---

## Next Steps

1. **Test in production:** Follow QA_EXECUTION_GUIDE.md
2. **Setup monitoring:** Configure Sentry + Uptime Robot
3. **Configure DNS:** Point custom domains
4. **Submit to Shopify:** Shopify app store listing
5. **Start marketing:** Launch growth campaigns

---

## Support

**Vercel Issues:** vercel.com/support  
**Render Issues:** render.com/support  
**GitHub Issues:** github.com/support

Good luck! 🚀
