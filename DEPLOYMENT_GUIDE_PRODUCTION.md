# Deployment Guide - AI Growth Manager

## Pre-Deployment Checklist

### Environment Setup
- [ ] Production domain registered (e.g., aigrowthmanager.com)
- [ ] SSL certificate obtained
- [ ] Database backups configured
- [ ] CDN setup (CloudFlare/AWS CloudFront)
- [ ] Email service configured (SendGrid/AWS SES)

### Backend Deployment
- [ ] Node.js v18+ installed on server
- [ ] PostgreSQL 14+ running
- [ ] Redis cache configured
- [ ] Environment variables set (.env.production)
- [ ] Database migrations run
- [ ] API rate limiting active

### Frontend Deployment
- [ ] Build optimized (`npm run build`)
- [ ] Environment variables set
- [ ] Analytics configured (Google Analytics)
- [ ] Error tracking setup (Sentry)

---

## Step 1: Backend Deployment (Render/Railway/AWS)

### Option A: Render.com (Recommended - Free tier)

```bash
# 1. Connect GitHub repo to Render
# 2. Create new Web Service
# 3. Configure environment

BACKEND_URL=https://api.aigrowthmanager.com
DATABASE_URL=postgresql://user:pass@db-host:5432/aigrowth
REDIS_URL=redis://cache-host:6379
JWT_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
SHOPIFY_API_KEY=your-shopify-key
SHOPIFY_API_SECRET=your-shopify-secret

# 4. Deploy
git push origin main
```

### Option B: AWS EC2

```bash
# 1. Launch Ubuntu 22.04 instance
# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql-client

# 3. Clone repo
git clone https://github.com/your-repo/ai-growth-manager.git
cd ai-growth-manager/backend
npm install

# 4. Setup PM2 for process management
npm install -g pm2
pm2 start src/server.js --name "ai-growth-manager"
pm2 startup
pm2 save

# 5. Setup Nginx reverse proxy
sudo apt-get install nginx
```

---

## Step 2: Frontend Deployment (Vercel/Netlify)

### Option A: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from project root
cd frontend
vercel --prod

# 3. Configure environment variables in Vercel dashboard
VITE_BACKEND_URL=https://api.aigrowthmanager.com

# 4. Domain setup
# Go to Vercel Settings > Domains > Add Domain
```

### Option B: Netlify

```bash
# 1. Connect GitHub repo
# 2. Build settings:
#    - Build command: npm run build
#    - Publish directory: frontend/dist

# 3. Environment variables
VITE_BACKEND_URL=https://api.aigrowthmanager.com

# 4. Add redirect rules (netlify.toml)
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

---

## Step 3: Database Migration to Production

```bash
# 1. Backup local database
pg_dump -U postgres -d ai_growth_manager > backup.sql

# 2. Create production database
# (On RDS/Managed Postgres)
CREATE DATABASE ai_growth_manager_prod;

# 3. Run migrations
npm run db:migrate -- --env production

# 4. Seed initial data (optional)
npm run db:seed -- --env production
```

---

## Step 4: Domain & SSL Configuration

### Using Route53 (AWS)

```
A Record:    api.aigrowthmanager.com → ELB/EC2 IP
CNAME:       www.aigrowthmanager.com → aigrowthmanager.com
MX Record:   (for email services)
TXT Record:  (for SPF/DKIM)
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d aigrowthmanager.com -d api.aigrowthmanager.com
sudo certbot renew --dry-run
```

---

## Step 5: Monitoring & Logging

### Setup Error Tracking

```javascript
// sentry.io integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://key@sentry.io/project",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### Setup Uptime Monitoring

- Uptime Robot (free tier)
- Set check intervals to 5 minutes
- Configure alerts to your email

### Setup Performance Monitoring

- Google Analytics 4
- Datadog / New Relic (premium)
- AWS CloudWatch (if using AWS)

---

## Step 6: Shopify App Setup

### Register as Shopify App Developer

1. Visit: https://partners.shopify.com
2. Create app
3. Set redirect URIs:
   ```
   https://aigrowthmanager.com/auth/shopify/callback
   https://aigrowthmanager.com/store-access
   ```
4. Get API credentials
5. Update backend `.env`

### Install on Test Store

1. Upload to: https://partners.shopify.com/apps
2. Create public app listing
3. Test on: ai-product-optimizer.myshopify.com
4. Get approval from Shopify (2-3 weeks review time)

---

## Production Checklist

- [ ] Backend API responding on production domain
- [ ] Frontend loads without CORS errors
- [ ] Google OAuth working with prod credentials
- [ ] Shopify OAuth configured and tested
- [ ] Database connections encrypted
- [ ] Backups running daily
- [ ] Monitoring alerts configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Rate limiting enabled on API
- [ ] DDoS protection active (CloudFlare)
- [ ] SSL certificate valid
- [ ] CDN cache optimized
- [ ] Sentry error tracking working
- [ ] Uptime monitoring active

---

## Estimated Costs (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Vercel (Frontend) | ✅ | $20-200 |
| Render (Backend) | ✅ | $7+ |
| PostgreSQL DB | - | $15-100 (Managed) |
| Redis Cache | - | $5-50 |
| CDN (CloudFlare) | ✅ | $200+ |
| Monitoring (Sentry) | ✅ | $29+ |
| Email Service | - | $10-50 |
| **Total** | **~$0** | **$260-500/month** |

---

## Post-Deployment Tasks

1. Monitor error rates for 24 hours
2. Check database performance metrics
3. Review API response times
4. Test all user flows on production
5. Verify backups are working
6. Setup status page (statuspage.io)
