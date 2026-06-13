# 🚀 Learning AI Growth Manager Platform

Welcome to the AI Growth Manager technical guide. This document explains how the platform works, how to run it, and how to transition from mock data to real-world AI-powered insights.

## 🏗️ Architecture Overview

The platform is a full-stack application designed to help Shopify merchants grow using AI.

- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion (for smooth animations).
- **Backend:** Node.js (Express) + PostgreSQL (Database) + Redis (Queue Management).
- **AI Engine:** OpenAI (GPT-4o-mini) for analyzing store data, generating content, and optimizing ads/SEO.
- **Workers:** BullMQ for background synchronization and AI processing.

## 🏃 How to Run the Platform

### 1. Prerequisites
- **Node.js:** v18 or higher.
- **PostgreSQL:** Running locally or via Docker.
- **Redis:** Running locally or via Docker (required for BullMQ).

### 2. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ai_growth_manager
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key
SHOPIFY_API_KEY=your_shopify_app_key
SHOPIFY_API_SECRET=your_shopify_app_secret
```

### 3. Database Migration
Run the following to set up your tables:
```bash
cd backend
node run-schema.js
```

### 4. Start the Application
You can use the provided `.bat` files on Windows:
- `START_APP.bat`: Starts both frontend and backend.
- `start-local.bat`: Starts the backend with debug logging.

Or manually:
```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

---

## 🎯 Moving from Mock Data to Real Data

Initially, some features (like Ads performance or SEO audits) might show "Sample Data". To activate real data, follow these steps:

### 1. AI-Powered SEO Audits
The `runSeoAudit` controller in `backend/src/controllers/seo.controller.js` currently uses placeholders. To make it real:
- The platform uses `runAiAnalysis` (in `analysis.service.js`) which takes real Shopify store snapshots.
- Ensure your store is synced via the **Dashboard → Sync Store**.
- Once synced, the AI analyzes actual products, revenue, and descriptions.

### 2. Real Google & Meta Ads
Real Ads integration requires **OAuth Credentials** and developer setup.

#### 📘 Meta (Facebook) Ads Setup
1.  **Create App:** Go to [Meta for Developers](https://developers.facebook.com/) and create a "Business" type app.
2.  **Add Permissions:** Add the **Marketing API** and **Facebook Login** products.
3.  **Get Credentials:** Copy your `App ID` and `App Secret` to your backend `.env`.
4.  **User OAuth:** In the platform, go to **Ads Manager → Connect**. Paste your `Ad Account ID` (find this in Meta Ads Manager) and your `User Access Token` (generated via Graph API Explorer or your OAuth flow).
5.  **Live Sync:** Once connected, the backend `fetchMetaCampaigns` service will pull your live campaigns directly from Meta.

#### 📗 Google Ads Setup
1.  **Cloud Project:** Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Enable API:** Enable the **Google Ads API**.
3.  **Credentials:** Create "OAuth 2.0 Client IDs" and a "Developer Token" from the Google Ads API Center.
4.  **Config:** Add `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, and `GOOGLE_ADS_DEVELOPER_TOKEN` to your `.env`.

### 3. AI Descriptions & Keywords
These are already powered by OpenAI!
- When you click **AI Fix Descriptions**, the backend sends your *real* product title and current description to GPT-4.
- The returned data is applied directly to your Shopify store via the Admin API.

## 🛠️ Developer Checklist for Real Data
- [ ] **Sync Shopify:** Use the Dashboard to fetch real products and orders.
- [ ] **Configure OpenAI:** Add a valid `OPENAI_API_KEY` to enable the "Fix Engine".
- [ ] **Database Check:** Run `node check-tables.js` to ensure the schema is ready for real records.
- [ ] **Webhook Setup:** For real-time updates (like abandoned carts), expose your local backend using `ngrok` and register the URL in your Shopify Partner Dashboard.

## 📈 Platform Features
- **Health Score:** A 0-100 metric calculated based on real revenue and product data.
- **Revenue Impact:** Predicts how much money you are losing due to unoptimized products.
- **Email Recovery:** Uses AI to write personalized emails for real abandoned carts.
- **Ads/SEO Manager:** Centralized hub for multi-platform growth.

---
*For support or bugs, use the `/bug` command in the CLI.*
