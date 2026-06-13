# AI Growth Manager — Ads & SEO Implementation Plan
**Created:** June 7, 2026  
**Status:** Planning Phase  
**Scope:** AI-Powered Ads Management + SEO Optimization (Independent of Shopify built-in tools)

---

## 1. Problem Statement

AI Growth Manager currently has:
- ✅ Dashboard with health scores
- ✅ Product management & AI descriptions
- ✅ Email campaigns (Resend)
- ✅ Price optimizer
- ✅ Revenue impact tracking

**Missing (what this plan addresses):**
- ❌ **Ads Management** — No Meta Ads / Google Ads integration
- ❌ **SEO Optimization** — No dedicated SEO audit, keyword research, or optimization tools
- ❌ These features are NOT provided by Shopify natively — we must build them ourselves

---

## 2. UI Issues to Fix First (from screenshot)

### Issue: Email Campaigns header text cut off
- **File:** `frontend/src/pages/EmailsPage.jsx`
- **Fix:** The `<main>` element needs proper top padding or the sticky header needs z-index stacking fix
- **Root cause:** The sticky header overlaps with page content on initial render

### Issue: Hardcoded `ml-60` on multiple pages
- **Files:** `RevenueImpactPage.jsx`, `ProductsPage.jsx`, `AIActionsPage.jsx`, `SettingsPage.jsx`
- **Fix:** Add mobile responsive `lg:ml-60` instead of `ml-60`, add hamburger menu support

---

## 3. Feature: AI Ads Manager

### 3.1 Overview
An AI-powered ad campaign manager that connects to **Meta Ads (Facebook/Instagram)** and **Google Ads** APIs to create, manage, optimize, and track advertising campaigns — all from within AI Growth Manager.

### 3.2 What This Feature Does
| Capability | Description |
|---|---|
| **Connect Ad Accounts** | OAuth connect Meta Business Manager + Google Ads |
| **AI Campaign Creator** | Generate ad campaigns from product data using GPT-4 |
| **Budget Optimizer** | AI recommends daily budget allocation across campaigns |
| **Audience Builder** | AI suggests lookalike/similar audiences based on store data |
| **Creative Generator** | AI writes ad copy + suggests image improvements |
| **Performance Dashboard** | Real-time ROAS, CPM, CPC, CTR tracking |
| **Auto-Pause Losers** | AI automatically pauses underperforming ads |
| **A/B Test Manager** | AI creates and evaluates A/B tests |

### 3.3 Tech Stack for Ads Feature

| Layer | Technology | Purpose |
|---|---|---|
| **Meta Ads API** | Facebook Marketing API v19.0 | Create/manage FB/IG ad campaigns |
| **Google Ads API** | Google Ads API v16 | Create/manage Google search/shopping ads |
| **AI Engine** | OpenAI GPT-4o | Ad copy, audience suggestions, budget optimization |
| **Backend** | Express.js controller + routes | API endpoints for ads management |
| **Frontend** | React page + components | Ads dashboard UI |
| **Database** | PostgreSQL (new tables) | Store campaigns, ad accounts, performance data |
| **Queue** | BullMQ + Redis | Async ad sync, performance monitoring |

### 3.4 Database Schema (New Tables)

```sql
-- Connected ad accounts
CREATE TABLE ad_accounts (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  platform VARCHAR(20) NOT NULL, -- 'meta' | 'google'
  account_id VARCHAR(100) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  status VARCHAR(20) DEFAULT 'active',
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ad campaigns
CREATE TABLE ad_campaigns (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  ad_account_id INTEGER REFERENCES ad_accounts(id),
  platform_campaign_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(50), -- 'conversions' | 'traffic' | 'catalog_sales'
  status VARCHAR(20) DEFAULT 'draft',
  daily_budget DECIMAL(10,2),
  total_spend DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ad performance snapshots (daily)
CREATE TABLE ad_performance (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI ad suggestions
CREATE TABLE ad_suggestions (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  type VARCHAR(50), -- 'budget' | 'audience' | 'creative' | 'pause' | 'scale'
  title VARCHAR(255),
  description TEXT,
  expected_impact VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  ai_reasoning TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.5 Backend API Endpoints

```
// Ad Account Management
POST   /api/:shop/ads/connect/meta          — OAuth connect Meta account
POST   /api/:shop/ads/connect/google        — OAuth connect Google Ads
GET    /api/:shop/ads/accounts              — List connected accounts
DELETE /api/:shop/ads/accounts/:id          — Disconnect account

// Campaign Management
GET    /api/:shop/ads/campaigns             — List all campaigns
POST   /api/:shop/ads/campaigns             — Create campaign (manual or AI)
POST   /api/:shop/ads/campaigns/ai-generate — AI generates campaign from products
PUT    /api/:shop/ads/campaigns/:id         — Update campaign
POST   /api/:shop/ads/campaigns/:id/pause   — Pause campaign
POST   /api/:shop/ads/campaigns/:id/resume  — Resume campaign

// Performance
GET    /api/:shop/ads/performance           — Performance overview
GET    /api/:shop/ads/performance/:campaignId — Per-campaign performance
GET    /api/:shop/ads/performance/trend     — Historical trend data

// AI Features
GET    /api/:shop/ads/ai/suggestions        — Get AI optimization suggestions
POST   /api/:shop/ads/ai/suggestions/:id/apply — Apply AI suggestion
POST   /api/:shop/ads/ai/budget-optimize    — AI budget optimization
POST   /api/:shop/ads/ai/audience-suggest   — AI audience suggestions
POST   /api/:shop/ads/ai/creative-generate  — AI ad copy generation
```

### 3.6 Frontend Pages & Components

```
frontend/src/pages/
├── AdsPage.jsx                    # Main ads dashboard
├── AdsCampaignCreatePage.jsx      # Create new campaign (AI or manual)
└── AdsPerformancePage.jsx         # Detailed performance analytics

frontend/src/components/ads/
├── AdAccountConnect.jsx           # OAuth connect flow UI
├── CampaignCard.jsx               # Individual campaign display
├── CampaignTable.jsx              # Campaign list table
├── AdsPerformanceChart.jsx        # ROAS/spend/conversion charts
├── AiBudgetOptimizer.jsx          # AI budget recommendation UI
├── AiAudienceBuilder.jsx          # AI audience suggestion UI
├── AiCreativeGenerator.jsx        # AI ad copy generator UI
├── AdsSetupBanner.jsx             # "Connect your ad account" prompt
└── AdsMetricsGrid.jsx             # KPI cards (ROAS, CPC, CTR, etc.)
```

### 3.7 AI Ads Features — How They Work

**AI Campaign Generator:**
1. User selects products to advertise
2. AI analyzes: product data, store health score, target audience
3. GPT-4 generates: campaign name, objective, target audience, daily budget, ad copy, placements
4. User reviews → One-click publish to Meta/Google

**AI Budget Optimizer:**
1. Collects 7+ days of campaign performance data
2. AI analyzes: ROAS per campaign, time-of-day patterns, audience segments
3. GPT-4 generates recommendations with expected impact
4. User approves → API updates budgets on Meta/Google

**Auto-Pause Losers:**
1. Daily cron job checks all active campaigns
2. Rules: ROAS < 1.0 for 3+ days → pause; CTR < 0.5% after 1K impressions → pause
3. AI provides reasoning for each pause decision
4. Merchant notified via in-app + email

---

## 4. Feature: AI SEO Manager

### 4.1 Overview
An AI-powered SEO optimization suite that audits store content, optimizes product pages, manages meta tags, tracks keyword rankings, and provides actionable recommendations — all independent of Shopify's basic SEO features.

### 4.2 What This Feature Does
| Capability | Description |
|---|---|
| **SEO Health Audit** | Full site audit: meta tags, headings, images, URLs, speed |
| **Product SEO Optimizer** | AI rewrites titles, descriptions, alt text for search |
| **Meta Tag Manager** | Bulk edit meta titles, descriptions, OG tags |
| **Keyword Research** | AI suggests target keywords per product |
| **Content Optimizer** | AI improves blog posts, collection pages |
| **Schema Markup** | Auto-generate JSON-LD structured data |
| **Competitor Analysis** | Compare SEO vs competitor stores |
| **Rank Tracker** | Track Google keyword rankings over time |
| **Sitemap Manager** | Auto-generate and submit sitemaps |

### 4.3 Tech Stack for SEO Feature

| Layer | Technology | Purpose |
|---|---|---|
| **SEO Crawler** | Custom Node.js crawler + cheerio | Crawl store pages for SEO audit |
| **Google PageSpeed** | PageSpeed Insights API | Core Web Vitals scoring |
| **Search Console** | Google Search Console API | Keyword rankings, impressions, clicks |
| **AI Engine** | OpenAI GPT-4o | Content optimization, keyword suggestions |
| **Keyword Data** | SerpAPI | Search volume, competition data |
| **Backend** | Express.js controller + routes | API endpoints for SEO features |
| **Frontend** | React page + components | SEO dashboard UI |
| **Database** | PostgreSQL (new tables) | Store audits, keywords, rankings |
| **Queue** | BullMQ + Redis | Async crawl jobs, ranking checks |

### 4.4 Database Schema (New Tables)

```sql
-- SEO audits
CREATE TABLE seo_audits (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  overall_score INTEGER DEFAULT 0, -- 0-100
  page_speed_score INTEGER,
  meta_score INTEGER,
  content_score INTEGER,
  structure_score INTEGER,
  mobile_score INTEGER,
  issues_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO issues found during audit
CREATE TABLE seo_issues (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER REFERENCES seo_audits(id),
  severity VARCHAR(20), -- 'critical' | 'warning' | 'info'
  category VARCHAR(50), -- 'meta' | 'heading' | 'image' | 'content' | 'speed' | 'schema'
  page_url TEXT,
  title VARCHAR(255),
  description TEXT,
  fix_suggestion TEXT,
  auto_fixable BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Keyword tracking
CREATE TABLE seo_keywords (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  product_id VARCHAR(100),
  keyword VARCHAR(255) NOT NULL,
  search_volume INTEGER,
  competition VARCHAR(20),
  current_rank INTEGER,
  previous_rank INTEGER,
  target_url TEXT,
  status VARCHAR(20) DEFAULT 'tracking',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEO optimization history
CREATE TABLE seo_optimizations (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  product_id VARCHAR(100),
  type VARCHAR(50), -- 'title' | 'description' | 'meta' | 'alt_text' | 'heading' | 'schema'
  old_value TEXT,
  new_value TEXT,
  ai_reasoning TEXT,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.5 Backend API Endpoints

```
// SEO Audit
POST   /api/:shop/seo/audit/run            - Run full SEO audit
GET    /api/:shop/seo/audit/latest         - Get latest audit results
GET    /api/:shop/seo/audit/history        - Audit history
GET    /api/:shop/seo/issues               - List all SEO issues
POST   /api/:shop/seo/issues/:id/fix       - Auto-fix an issue
POST   /api/:shop/seo/issues/fix-all       - Fix all auto-fixable issues

// Product SEO
GET    /api/:shop/seo/products             - Product SEO scores
POST   /api/:shop/seo/products/:id/optimize - AI optimize single product
POST   /api/:shop/seo/products/optimize-all - AI optimize all products
GET    /api/:shop/seo/products/:id/preview - Preview AI changes

// Meta Tags
GET    /api/:shop/seo/meta-tags            - List all meta tags
PUT    /api/:shop/seo/meta-tags/bulk       - Bulk update meta tags
POST   /api/:shop/seo/meta-tags/ai-generate - AI generate meta tags

// Keywords
GET    /api/:shop/seo/keywords             - List tracked keywords
POST   /api/:shop/seo/keywords             - Add keyword to track
DELETE /api/:shop/seo/keywords/:id         - Remove keyword
GET    /api/:shop/seo/keywords/rankings    - Ranking history
POST   /api/:shop/seo/keywords/suggest     - AI keyword suggestions

// Schema Markup
GET    /api/:shop/seo/schema               - Get current schema markup
POST   /api/:shop/seo/schema/generate      - AI generate JSON-LD schema
POST   /api/:shop/seo/schema/apply         - Apply schema to store

// PageSpeed
GET    /api/:shop/seo/pagespeed            - Core Web Vitals scores
GET    /api/:shop/seo/pagespeed/history    - Speed score history

// Competitor Analysis
POST   /api/:shop/seo/competitors          - Add competitor URL
GET    /api/:shop/seo/competitors/analyze  - Compare SEO metrics
```

### 4.6 Frontend Pages and Components

**SEO Pages:**
- `SEOPage.jsx` — Main SEO dashboard
- `SEOAuditPage.jsx` — Detailed audit results
- `SEOKeywordsPage.jsx` — Keyword tracking dashboard
- `SEOCompetitorPage.jsx` — Competitor analysis

**SEO Components:**
- `SeoScoreRing.jsx` — Circular SEO score display
- `SeoIssueCard.jsx` — Individual issue display
- `SeoIssueTable.jsx` — Issues list with filters
- `KeywordTracker.jsx` — Keyword ranking tracker
- `KeywordChart.jsx` — Ranking trend chart
- `MetaTagEditor.jsx` — Meta tag editing UI
- `ProductSeoCard.jsx` — Per-product SEO score
- `PagespeedGauge.jsx` — Core Web Vitals display
- `SchemaMarkupPreview.jsx` — JSON-LD preview
- `SeoAuditBanner.jsx` — Run audit / X issues found
- `AiContentOptimizer.jsx` — AI content rewriting UI
- `CompetitorCompare.jsx` — Side-by-side SEO comparison

### 4.7 AI SEO Features — How They Work

**AI Product SEO Optimizer:**
1. AI scans product: title, description, images, tags, price
2. GPT-4 generates optimized: product title, meta title (60 chars), meta description (155 chars), image alt text, body HTML
3. User previews diff (old vs new) then one-click apply to Shopify
4. Changes tracked in seo_optimizations table

**AI Keyword Research:**
1. AI analyzes: product catalog, competitor stores, industry trends
2. GPT-4 suggests 20-50 target keywords per product with search volume, competition level, recommended action
3. User selects keywords to track with daily rank monitoring
4. AI generates content plan based on keyword gaps

**Auto Schema Markup:**
1. AI scans product data and generates JSON-LD: Product, Organization, BreadcrumbList, FAQ schemas
2. Preview schema then Apply to Shopify theme
3. Validate with Google Rich Results Test

---

## 5. Implementation Phases

### Phase 1: UI Fixes + Foundation (Week 1)
| Task | Files | Est. Time |
|---|---|---|
| Fix EmailsPage header cut-off | EmailsPage.jsx | 1 hour |
| Fix mobile ml-60 on all pages | Multiple pages | 3 hours |
| Add Ads and SEO to sidebar | Sidebar.jsx | 1 hour |
| Create database migration for new tables | backend/src/db/migrations/ | 4 hours |
| Create Ads controller skeleton | backend/src/controllers/ads.controller.js | 3 hours |
| Create SEO controller skeleton | backend/src/controllers/seo.controller.js | 3 hours |
| Register new routes | backend/src/routes/index.js | 1 hour |

### Phase 2: Ads MVP (Weeks 2-3)
| Task | Files | Est. Time |
|---|---|---|
| Meta Ads OAuth connect flow | ads.controller.js | 6 hours |
| Google Ads OAuth connect flow | ads.controller.js | 6 hours |
| Campaign CRUD API | ads.controller.js | 4 hours |
| Campaign sync (pull from Meta/Google) | ads.service.js | 6 hours |
| AI Campaign Generator | ai/ads.generator.js | 6 hours |
| Ads dashboard page (frontend) | AdsPage.jsx | 8 hours |
| Campaign create/edit UI | AdsCampaignCreatePage.jsx | 6 hours |
| Performance charts | AdsPerformanceChart.jsx | 4 hours |
| Performance sync cron job | jobs/adsSync.js | 4 hours |

### Phase 3: Ads AI Features (Week 4)
| Task | Files | Est. Time |
|---|---|---|
| AI Budget Optimizer | ai/budget.optimizer.js | 5 hours |
| AI Audience Suggestions | ai/audience.suggester.js | 5 hours |
| AI Ad Copy Generator | ai/adcopy.generator.js | 4 hours |
| Auto-pause rules engine | ads/rules.engine.js | 5 hours |
| Suggestion UI + apply flow | AiBudgetOptimizer.jsx etc. | 6 hours |

### Phase 4: SEO MVP (Weeks 5-6)
| Task | Files | Est. Time |
|---|---|---|
| Site crawler (cheerio-based) | seo/crawler.js | 6 hours |
| SEO audit engine | seo/audit.engine.js | 6 hours |
| Product SEO scoring | seo/product.scorer.js | 4 hours |
| Meta tag management API | seo.controller.js | 4 hours |
| SEO dashboard page (frontend) | SEOPage.jsx | 8 hours |
| Audit results page | SEOAuditPage.jsx | 6 hours |
| Issue list with auto-fix | SeoIssueTable.jsx | 4 hours |
| PageSpeed integration | seo/pagespeed.service.js | 4 hours |

### Phase 5: SEO AI Features (Week 7)
| Task | Files | Est. Time |
|---|---|---|
| AI Product SEO Optimizer | ai/seo.optimizer.js | 6 hours |
| AI Keyword Research | ai/keyword.researcher.js | 5 hours |
| AI Meta Tag Generator | ai/metatag.generator.js | 4 hours |
| Schema markup generator | ai/schema.generator.js | 4 hours |
| Keyword tracking + rank monitor | seo/rank.tracker.js | 5 hours |
| Keyword tracking UI | SEOKeywordsPage.jsx | 6 hours |
| Competitor analysis | seo/competitor.analyzer.js | 5 hours |

### Phase 6: Polish and Launch (Week 8)
| Task | Est. Time |
|---|---|
| Testing all flows end-to-end | 8 hours |
| Error handling + empty states | 4 hours |
| Mobile responsive fixes | 4 hours |
| Landing page updates (mention Ads + SEO features) | 3 hours |
| Documentation | 2 hours |

**Total Estimated Time:** ~8 weeks (solo developer) or ~4 weeks (2 developers)
