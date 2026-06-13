# PRODUCTION_PLAN.md
# AI Growth Manager — Production Readiness Plan
**Date:** June 5, 2026 | **Store under test:** ai-product-optimizer.myshopify.com

---

## WHAT IS WORKING ✅

### Auth & Onboarding
- Shopify OAuth flow: initiate → Shopify consent → callback → dashboard redirect
- Merchant record saved to PostgreSQL with AES-256 encrypted access token
- Google OAuth (sign-in path) — redirects to Google then back
- OnboardingPage uses `VITE_API_URL` env var (no hardcoded localhost)
- SignInPage uses `VITE_API_URL` env var, demo fallback removed

### Dashboard
- Live Shopify data fetch on every dashboard load (products, orders, customers, checkouts)
- Health score computed from real product quality (missing images, descriptions, tags)
- Health sub-scores: SEO, Products, Speed — from real data
- Per-product revenue from `order.line_items`
- Returning customer rate from email deduplication
- AI suggestions feed (missing images, descriptions, tags, inactive products)
- Token expiry banner → "Reconnect Store" on 401
- Empty state → "Sync your store" when no data
- Fix All button with live progress bar
- Mobile responsive sidebar with hamburger overlay

### Data & Backend
- Sync saves `health_history` row on every call → powers revenue chart over time
- Daily cron job at midnight saves snapshot for all active merchants
- Revenue chart uses real `health_history.metrics.revenue` (no random fallback)
- `getLatestAnalysis` queries PostgreSQL (no hardcoded mock)
- `ADMIN_API_ACCESS_TOKEN` fallback removed — merchant token only
- Webhook registration: `orders/create`, `products/update`, `app/uninstalled`
- Rate limiting: 60 req/min per shop
- CORS, Helmet security headers configured

### Feature Pages
- Products page — real Shopify products, health flags, AI fix descriptions
- AI Actions page — fix history from DB, status per fix
- AI Descriptions — OpenAI GPT-4o-mini → updates product on Shopify
- Price Optimizer — AI price suggestions per product
- Email Campaigns — create, AI-generate, send via Resend
- Revenue Impact — real data from analysis, empty state when no history
- Settings — real store info, env-var URLs (no localhost hardcoding)

### Landing Page
- Fake stats bar (`500+ stores`, Google/Amazon logos) → replaced with feature badges
- Dashboard preview widget → "Example UI Preview" badge, no fake $12,430 or 2.4%
- Solution widget `94/100` → "Your Score" label
- Testimonials (Sarah Jenkins, Mark Davis, Elena Rodriguez) → anonymous + "illustrative" label

---

## WHAT IS BROKEN / MUST FIX BEFORE PUBLISHING 🔴

### P0 — Blockers (App will not work in production without these)

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | `SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here` in `.env` | `backend/.env` | Set real webhook secret from Shopify Partner Dashboard |
| 2 | `APP_URL=http://localhost:3001` in `.env` | `backend/.env` | Must be your real deployed backend URL (e.g. `https://api.yourdomain.com`) |
| 3 | `FRONTEND_URL=http://localhost:5173` in `.env` | `backend/.env` | Must be your real frontend URL for OAuth callback redirect |
| 4 | OAuth callback URL in Shopify Partner Dashboard must match `APP_URL/auth/shopify/callback` | Shopify Dashboard | Update it when you deploy |
| 5 | `VITE_API_URL=http://localhost:3001/api` in frontend `.env` | `frontend/.env` | Set to production backend URL before build |
| 6 | PostgreSQL `DB_PASSWORD=Newdelhi2025` — plain text in .env | `backend/.env` | Use env secrets / vault in production, never commit this |
| 7 | `OPENAI_API_KEY` in `.env` — real key committed to file | `backend/.env` | Move to environment secrets, add `.env` to `.gitignore` |
| 8 | Redis `REDIS_URL=redis://localhost:6379` — needed for BullMQ | `backend/.env` | Provision Redis (Upstash free tier works) or disable BullMQ gracefully |

### P1 — High Priority (will confuse or block real users)

| # | Issue | Where | Fix |
|---|---|---|---|
| 9 | Revenue chart is flat on first connect | DashboardPage | Tell user to "Sync now — chart builds over time". Already shows empty state, just add this message |
| 10 | Conversion rate is estimated (`orders × 42`) | dashboard.controller.js | Label it "Est." in UI; use Shopify Analytics API for real sessions later |
| 11 | Speed score hardcoded to `72` | dashboard.controller.js | Label it "N/A" until Google PageSpeed API is integrated |
| 12 | `getHealthHistory` may return 0 rows on new install | controllers/index.js | First sync already writes a row — just confirm this works end-to-end |
| 13 | Email `from` address is `hello@yourdomain.com` placeholder | `backend/.env` | Set a real verified Resend domain before sending emails to users |
| 14 | `SHOPIFY_SCOPES` mismatch between backend and Shopify Partner Dashboard | Both | Confirm scopes match exactly — mismatch causes silent OAuth failures |
| 15 | No GDPR webhooks registered | shopify.controller.js | Shopify requires `customers/data_request`, `customers/redact`, `shop/redact` for App Store submission |

### P2 — Medium Priority (bad experience but not a blocker)

| # | Issue | Where | Fix |
|---|---|---|---|
| 16 | DashboardOverview.jsx (`/dashboard` route) is a separate component from DashboardPage.jsx (`/dashboard/:shop`) — two dashboards exist | App.jsx | Pick one, remove or redirect the other |
| 17 | `alert()` calls used for errors in OnboardingPage | OnboardingPage.jsx | Replace with inline error state |
| 18 | Sidebar `ml-60` missing on ProductsPage, AIActionsPage, EmailsPage, SettingsPage on mobile | Multiple pages | Those pages still have hardcoded `ml-60` — needs same hamburger fix |
| 19 | `SyncPage.jsx` and `DarkDashboard.jsx` exist but are unused dead code | App.jsx | Remove or redirect |
| 20 | `HealthIntelligence.jsx` uses old data model — untested | App.jsx | Audit or remove |
| 21 | Pricing page shows plans ($49/$99/$299) but no payment integration | PricingPage.jsx | Connect Stripe or remove pricing until billing is ready |
| 22 | `© 2024 AI Growth Manager` in footer — wrong year | LandingPage.jsx | Update to 2026 |

---

## SHOPIFY APP STORE CHECKLIST 📋

Before submitting to the Shopify App Store:

- [ ] App deployed to a real domain (not localhost)
- [ ] HTTPS on both frontend and backend
- [ ] OAuth callback URL registered in Partner Dashboard
- [ ] All 3 GDPR webhooks implemented and responding with 200 (`customers/data_request`, `customers/redact`, `shop/redact`)
- [ ] App uninstall webhook deactivates merchant (`app/uninstalled`) — ✅ already coded
- [ ] Privacy Policy page exists and is linked
- [ ] Terms of Service page exists and is linked  
- [ ] App does not request more Shopify scopes than it uses
- [ ] No `console.log` leaking sensitive data in production
- [ ] No secrets in frontend bundle (`VITE_` vars are public — confirm nothing secret is prefixed VITE_)
- [ ] Rate limiting tested under load
- [ ] Embedded app works inside Shopify Admin iframe (Content-Security-Policy frameAncestors set) — ✅ already in Helmet config

---

## WHAT TO DO NEXT — PRIORITY ORDER

### This Week (before any real users)
1. Deploy backend to Render/Railway/Fly.io — get a real `APP_URL`
2. Deploy frontend to Vercel — get a real `FRONTEND_URL`
3. Update all 4 env vars (`APP_URL`, `FRONTEND_URL`, `VITE_API_URL`, Shopify Partner Dashboard callback)
4. Provision Upstash Redis (free) — add `REDIS_URL`
5. Set a real `SHOPIFY_WEBHOOK_SECRET` in Partner Dashboard → backend `.env`
6. Verify `EMAIL_FROM` with Resend — so emails don't land in spam
7. Add GDPR webhook endpoints (required for App Store)

### Next Sprint
8. Replace `alert()` with inline error components
9. Fix mobile `ml-60` on all remaining pages
10. Remove `SyncPage`, `DarkDashboard`, dead routes
11. Add "Est." label to conversion rate, "N/A" to speed score
12. Add Stripe billing for paid plans (plan gating already planned)
13. Write Privacy Policy and Terms of Service pages

### After Launch
14. Google PageSpeed API for real speed score
15. Shopify Analytics API for real session/conversion data
16. Weekly email digest to store owners
17. Multi-store support for agencies

---

## ENV VARS REQUIRED IN PRODUCTION

### Backend (`backend/.env` → server environment secrets)
```
SHOPIFY_API_KEY=          # from Shopify Partner Dashboard
SHOPIFY_API_SECRET=       # from Shopify Partner Dashboard
SHOPIFY_SCOPES=read_products,write_products,read_orders,read_customers,read_checkouts,write_price_rules
SHOPIFY_WEBHOOK_SECRET=   # from Shopify Partner Dashboard → Webhooks
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
PORT=3001
NODE_ENV=production

POSTGRES_URI=             # Neon/Supabase/RDS connection string
REDIS_URL=                # Upstash Redis URL

OPENAI_API_KEY=           # OpenAI dashboard
RESEND_API_KEY=           # Resend dashboard
EMAIL_FROM=AI Growth Manager <hello@yourdomain.com>

JWT_SECRET=               # 32+ char random string
ENCRYPTION_KEY=           # 32 char random string

GOOGLE_CLIENT_ID=         # Google Cloud Console
GOOGLE_CLIENT_SECRET=     # Google Cloud Console
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/google/auth/google/callback
```

### Frontend (`frontend/.env` → Vercel env vars)
```
VITE_API_URL=https://api.yourdomain.com/api
```
