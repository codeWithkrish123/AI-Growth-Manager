# AI Growth Manager - Fix & Launch Guide

## Current Issues & Fixes Applied

### ✅ Fixed Issues
1. **OnboardingPage endpoint** - Changed from `/auth/oauth-url` to `/auth/shopify/initiate`
2. **Google OAuth error logging** - Added detailed error messages
3. **Debug console.log statements** - Removed from database.js and loadEnv.js
4. **Analyze error handling** - Fixed to show proper error messages instead of [object Object]

### ⚠️ Remaining Issues
1. **Backend server not running** - Commands running silently
2. **Google OAuth internal error** - Backend not responding
3. **"No Data Available"** - Backend not responding to API calls
4. **Sync data failed** - Backend not responding
5. **Analyze store [object Object]** - May still occur if backend not responding

## Manual Startup Instructions (CRITICAL)

### Step 1: Start Redis
Open Command Prompt and run:
```bash
docker start redis
```

If that fails, run:
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Step 2: Start Backend Server
Open a NEW Command Prompt and run:
```bash
cd "c:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\backend"
npm run dev
```
**Keep this window open** - you should see "AI Growth Manager server running on port 3001"

### Step 3: Start Frontend Server
Open ANOTHER NEW Command Prompt and run:
```bash
cd "c:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\frontend"
npm run dev
```
**Keep this window open** - you should see "Local: http://localhost:5173"

### Step 4: Test the Flow
1. Go to: http://localhost:5173/signin
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Enter store domain: `ai-product-optimizer`
5. Click "Activate AI Analysis"
6. Complete Shopify OAuth
7. Should redirect to dashboard

## Google OAuth Setup (CRITICAL - Must Do This!)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth 2.0 Client ID: `25641668694-l55koqoc68svgu8jqb64moagkr0ac96h`
3. Click to edit
4. Add this Authorized redirect URI: `http://localhost:3001/google/auth/google/callback`
5. Save

**Without this, Google Sign In will always fail with internal error.**

## Troubleshooting

### Backend won't start
- Check if PostgreSQL is running: `docker ps` or check if you have PostgreSQL installed locally
- Check .env file has correct database credentials
- Check port 3001 is not in use: `netstat -ano | findstr :3001`

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Check port 5173 is not in use: `netstat -ano | findstr :5173`

### Redis won't start
- Check if Docker is running: `docker ps`
- Try stopping and removing existing redis container:
  ```bash
  docker stop redis
  docker rm redis
  docker run -d -p 6379:6379 --name redis redis:7-alpine
  ```

### "No Data Available" in dashboard
- This means backend is not responding
- Check backend server window for errors
- Make sure backend is actually running

### Sync data failed
- Check Redis is running: `docker ps`
- Check backend server window for errors
- Sync requires Redis to be running

### Analyze shows [object Object]
- This should be fixed now with improved error handling
- If still occurs, check browser console for actual error

## Quick Start Script
Run this file to start everything automatically:
```
start-local.bat
```

## Production Deployment (After Local Testing Works)

### Frontend (Vercel)
1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
4. Deploy

### Backend (Render)
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Use `render.yaml` configuration
4. Set all environment variables from `.env.production`
5. Deploy PostgreSQL database
6. Deploy Redis instance
7. Add production redirect URI to Google Cloud Console: `https://your-backend-url.com/google/auth/google/callback`
8. Deploy

## Critical Reminder
**You MUST add the Google OAuth redirect URI before testing, or Google Sign In will always fail.**

## Time-Sensitive Notes
- You have until tomorrow to submit
- Focus on getting local development working first
- If local works, production deployment is straightforward
- If local doesn't work, production won't work either
