# AI Growth Manager — Implementation Plan
**Last updated:** June 5, 2026  
**Status:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 pending

---

## 1. What Is Working Right Now ✅

| Feature | Status | Notes |
|---|---|---|
| Shopify OAuth connect flow | ✅ | OAuth initiate → callback → dashboard redirect |
| Merchant record creation | ✅ | PostgreSQL, AES-256 encrypted token |
| Product / Orders / Customers sync | ✅ | Full data from Shopify REST API |
| Abandoned checkout sync | ✅ | Cart abandonment rate computed |
| Dashboard health score | ✅ | Real product quality data |
| Health sub-scores (SEO, Speed, Products) | ✅ | Computed from actual product data |
| Per-product revenue | ✅ | From order line_items |
| Returning customer rate | ✅ | Email deduplication from order history |
| AI issues/suggestions feed | ✅ | Missing images, descriptions, tags |
| Fix executor | ✅ | Shopify REST product update |
| Daily health history snapshots | ✅ | Cron job at midnight, powers revenue chart |
| Revenue chart history | ✅ | From health_history table |
| Token expiry banner | ✅ | 401 detected → "Reconnect Store" banner |
| Fix All with progress bar | ✅ | Sequential apply with % progress |
| Empty state when no data | ✅ | "Sync your store" prompt |
| Mobile sidebar | ✅ | Hamburger + overlay on small screens |
| Products page | ✅ | Real products with health flags |
| AI Descriptions generator | ✅ | OpenAI + Shopify product update |
| AI Price Optimizer | ✅ | OpenAI price suggestions |
| Email campaign system | ✅ | Create, AI-generate, send via Resend |
| Settings page | ✅ | Real store info, env-var URLs |
| Revenue Impact page | ✅ | Real data, no random fallbacks |
| Webhook registration | ✅ | orders/create, products/update, app/uninstalled |
| Rate limiting + CORS + security headers | ✅ | Production-ready |

---

## 2. All Fake Data Fixed ✅ (June 5, 2026)

| Was Fake | Now Real |
|---|---|
| Revenue chart `Math.random()` | Health history `metrics.revenue` per day |
| Product score `Math.random(60–95)` | Real score from product quality check |
| Product revenue `5000 + i * 2000` | Order `line_items` aggregation |
| KPI cards hardcoded `3.2%`, `₹1,240` | Real API values or `—` |
| Health sub-scores hardcoded `92`, `healthScore*0.9` | Real `seoScore`, `productsScore` |
| `getLatestAnalysis` mock JSON | PostgreSQL `AiAnalysisModel` query |
| `ADMIN_API_ACCESS_TOKEN` fallback | Removed — merchant token only |
| SettingsPage `localhost:3001` hardcoded | `VITE_API_URL` env var |
| RevenueImpactPage `Math.random()` | Empty state + real history |
| Returning customers `0` | Email deduplication from orders |

---

## 3. Still Pending ⏳

### Data Gaps (Medium Priority)

| Issue | Fix Needed |
|---|---|
| Conversion rate estimated (orders × 42) | Shopify Analytics API or pixel tracking |
| Speed score placeholder (72) | Google PageSpeed Insights API |
| Revenue chart flat on day 1 | Resolves naturally after 2+ syncs |

### Feature Gaps

| Feature | Priority |
|---|---|
| Token refresh / re-OAuth flow | HIGH — build a proper "Reconnect" page |
| Webhook real-time sync processor | HIGH — currently invalidates cache only |
| Weekly email digest to store owner | MEDIUM |
| Onboarding checklist post-connect | MEDIUM |
| AI tooltip explanations on metrics | MEDIUM |
| Plan gating (free vs pro limits) | HIGH for monetisation |
| Multi-store dashboard | LOW |
| Shopify App Store submission | HIGH when ready |

---

## 4. Phase 4 Roadmap — Scale & Monetize

17. **Plan gating** — free: 3 AI fixes/month, 1 analysis/week; pro: unlimited
18. **Shopify App Store** — pass review, embedded app frame, GDPR webhooks
19. **Multi-store** — agencies manage multiple stores from one account
20. **A/B testing** — AI suggests change, app runs real A/B and reports winner
21. **Weekly digest email** — auto-sends every Monday with store summary
22. **PWA / mobile** — installable, push notifications for critical issues

---

## 5. Developer Quick Reference

```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

**Key env vars:**
- `backend/.env` — `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `POSTGRES_URI`, `OPENAI_API_KEY`
- `frontend/.env` — `VITE_API_URL=http://localhost:3001/api`

**Key endpoints:**
```
POST /auth/shopify/initiate          — start OAuth
GET  /api/:shop/dashboard            — live dashboard (fetches Shopify live)
POST /api/:shop/sync                 — save snapshot + health history row
POST /api/:shop/analyze              — run AI analysis
GET  /api/:shop/health-history       — revenue chart data
POST /api/:shop/fix                  — apply single fix
POST /api/:shop/ai/generate-descriptions
POST /api/:shop/ai/optimize-prices
```

**Revenue chart:** Populates after first `POST /sync`. Builds over time — one row per day from cron job at midnight.
