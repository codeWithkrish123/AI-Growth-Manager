# QA Testing - Findings & Fix Plan
**Date:** 2026-06-20  
**Status:** IN PROGRESS  
**Test URL:** https://ai-growth-manager.vercel.app/  
**Issue:** Sync fails with "Could not connect to Shopify"

---

## 🔴 CRITICAL ISSUES FOUND

### Issue #1: Shopify Sync API Failure
**Severity:** CRITICAL - Blocks Core Functionality  
**Location:** Production Backend → Shopify API Integration  
**Error Message:** "Sync Failed - Could not connect to Shopify. Please check your connection."

**Root Cause Analysis:**
- Frontend makes request to: `POST /{shopDomain}/sync` (e.g., `/ai-product-optimizer.myshopify.com/sync`)
- Backend endpoint: `src/controllers/index.js` → `triggerSync()`
- The sync attempts to fetch from Shopify using merchant's access token
- **Problem:** Access token is either:
  1. Not stored/encrypted correctly in the database
  2. Expired or invalid
  3. Shopify API endpoint unreachable from backend
  4. CORS/Network issues blocking Shopify API calls

**Evidence:**
- Screenshot shows error modal after clicking "Sync Now"
- Browser console likely shows: `Could not connect to Shopify` error
- Network tab would show 401/403/500 response from backend

---

### Issue #2: SweetAlert Only (No Real-Time Data)
**Severity:** HIGH - UI Feedback Without Actual Functionality  
**Location:** `frontend/src/pages/DashboardPage.jsx` → `handleSync()`

**Problem:**
```javascript
// Current behavior:
1. User clicks "Sync Now"
2. Frontend shows SweetAlert: "Sync Started"
3. setTimeout waits 3 seconds
4. Frontend calls fetchAll() regardless of actual sync result
5. No real status polling or error validation
```

**Why This Fails:**
- The sync API call fails (Issue #1)
- But the UI shows success anyway (setTimeout ignores error)
- User thinks data is syncing when backend silently failed
- Dashboard shows old/stale data

---

## 🟠 HIGH PRIORITY ISSUES

### Issue #3: Access Token Not Properly Passed/Validated
**Location:** `backend/src/controllers/index.js` line ~59

**Current Code Problem:**
```javascript
const accessToken = merchant.getAccessToken() || process.env.ADMIN_API_ACCESS_TOKEN;
if (!accessToken) {
  return error(res, 'Access token not found. Please reconnect your store.', 401);
}
```

**Why It Fails:**
- `merchant.getAccessToken()` may return null/undefined
- Fallback to `process.env.ADMIN_API_ACCESS_TOKEN` which is:
  - Either missing
  - Or expired (see `.env` comment: "This token is expired")
- Store was connected via OAuth, but token not stored correctly

---

### Issue #4: Database Token Storage Issue
**Location:** `backend/src/models/Merchant.model.js`

**Problem:**
- During Shopify OAuth callback, access token should be encrypted and stored
- Current implementation may not be saving the token
- Or encryption/decryption is failing

---

## 🟡 MEDIUM PRIORITY ISSUES

### Issue #5: Missing Error Details in Frontend
**Location:** `frontend/src/pages/DashboardPage.jsx`

**Problem:**
```javascript
catch (err) {
  Swal.fire({
    title: 'Sync Failed',
    text: 'Could not connect to Shopify. Please check your connection.', // Generic message
    icon: 'error',
  })
}
```

**Why It's Bad:**
- User doesn't know actual error (token expired? API down? Network issue?)
- Developer can't debug without checking browser console
- No error logging to backend for diagnostics

---

### Issue #6: No Real-Time Sync Status Polling
**Location:** `frontend/src/pages/DashboardPage.jsx`

**Current Behavior:**
```javascript
setTimeout(() => { fetchAll(); setSyncing(false) }, 3000) // Hardcoded 3 second wait
```

**Problem:**
- Doesn't actually check if sync completed
- If sync takes 30 seconds, UI shows "done" after 3 seconds
- No status endpoint being called

---

## 📋 ROOT CAUSE SUMMARY

The main blocker is **the backend cannot connect to Shopify API**:

1. ❌ Access token not properly stored in database after OAuth
2. ❌ Token decryption failing
3. ❌ Token is expired
4. ❌ Shopify API calls failing from backend

---

## ✅ FIX PLAN - PHASES

### ✅ COMPLETED: Enhanced Error Logging & Frontend Feedback
**Status:** ✅ APPLIED TO CODEBASE

**Changes Made:**

1. **Backend Improvements** (`src/controllers/index.js`):
   - Added detailed token status logging
   - Improved error classification (401 vs network vs API)
   - Real error messages instead of generic "Sync failed"
   - Full error context for debugging

2. **Frontend Improvements** (`src/pages/DashboardPage.jsx`):
   - Show actual error message from backend
   - Display health score on successful sync
   - Better error logging to browser console
   - Real success/error icons

### PHASE 1: Debug & Verify (LOCAL - 30 mins)
Start localhost to test with new error messages:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`
4. Sign in with: sahkrish1406@gmail.com / Newdelhi@2025
5. Click "Sync Now" and observe specific error

**What to Look For:**
- Backend logs: "Sync token check" with token status
- Frontend: Real error message (e.g., "Token may be expired")
- Database: Check if `access_token_enc` is populated
- Network tab: See actual response from `/sync` endpoint

---

### PHASE 2: Fix Token Storage (Backend - 30 mins)
**File:** `backend/src/controllers/shopify.controller.js`

**Fix:**
- Verify `handleShopifyCallback()` properly saves encrypted token
- Add validation that token is actually stored
- Add error handling if database save fails
- Log token storage success/failure

**Code to Check:**
```javascript
// In handleShopifyCallback():
// Make sure this line works:
const merchant = await MerchantModel.update({ accessToken: encryptedToken });
// Should verify it actually updated
```

---

### PHASE 3: Add Token Validation (Backend - 20 mins)
**File:** `backend/src/controllers/index.js`

**Fix:**
```javascript
// Before calling Shopify API:
export async function triggerSync(req, res) {
  const { merchant } = req;
  let accessToken = merchant.getAccessToken();
  
  // If no token, try to refresh from DB
  if (!accessToken) {
    const freshMerchant = await MerchantModel.findOne({ id: merchant.id });
    accessToken = freshMerchant?.getAccessToken();
  }
  
  // If STILL no token, error clearly
  if (!accessToken) {
    logger.error({ merchantId: merchant.id }, 'NO ACCESS TOKEN AVAILABLE');
    return error(res, 'Store not properly connected. Please reconnect.', 401);
  }

  // Try the sync, catch errors properly
  try {
    const products = await fetchProducts(shopDomain, accessToken);
    // ... rest of sync
  } catch (err) {
    logger.error({ err: err.message, code: err.code }, 'SHOPIFY API CALL FAILED');
    return error(res, `Shopify API error: ${err.message}`, 502);
  }
}
```

---

### PHASE 4: Improve Frontend Error Handling (Frontend - 20 mins)
**File:** `frontend/src/pages/DashboardPage.jsx`

**Fix:**
```javascript
const handleSync = async () => {
  try {
    setSyncing(true);
    
    // Actual response
    const response = await dashboardAPI.triggerSync(shop);
    
    // Get job ID from response
    const jobId = response.data?.jobId;
    
    Swal.fire({
      title: 'Sync Started',
      text: 'Fetching latest data from Shopify...',
      icon: 'info',
      timer: 3000,
    });

    // Poll actual status instead of hardcoded timeout
    if (jobId) {
      await pollSyncStatus(shop, jobId);
    } else {
      // Fallback to old behavior
      setTimeout(() => { fetchAll(); setSyncing(false); }, 3000);
    }
  } catch (err) {
    // Show ACTUAL error, not generic message
    const errorMsg = err.response?.data?.error?.message || err.message;
    
    Swal.fire({
      title: 'Sync Failed',
      text: errorMsg, // Real error, not "Please check your connection"
      icon: 'error',
    });
    
    // Log for debugging
    console.error('Sync error:', { 
      message: errorMsg, 
      code: err.response?.status,
      data: err.response?.data 
    });
    
    setSyncing(false);
  }
};
```

---

### PHASE 5: Add Real-Time Status Polling (Frontend/Backend - 45 mins)
**New Endpoint Needed:**
```javascript
// Backend: Already exists at GET /:shopDomain/sync/:syncJobId
// Frontend: Use it for polling

async function pollSyncStatus(shop, jobId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await dashboardAPI.getSyncStatus(shop, jobId);
        
        if (status.data?.status === 'completed') {
          clearInterval(interval);
          fetchAll();
          setSyncing(false);
          resolve();
        }
        
        if (status.data?.status === 'failed') {
          clearInterval(interval);
          setSyncing(false);
          reject(new Error(status.data?.error));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 1000); // Poll every 1 second
  });
}
```

---

## 🔧 IMPLEMENTATION CHECKLIST

### LOCAL TESTING SETUP
- [ ] Delete any old node_modules: `rm -r backend/node_modules frontend/node_modules`
- [ ] Install dependencies: `npm install` in both backend and frontend
- [ ] Verify PostgreSQL is running locally
- [ ] Verify Redis is running locally (if needed)
- [ ] Verify `.env` files have correct values
- [ ] Start backend on port 3001: `npm run dev`
- [ ] Start frontend on port 5173: `npm run dev`

### DEBUG FIRST
- [ ] Open browser to http://localhost:5173
- [ ] Sign in with test credentials
- [ ] Click "Sync Now"
- [ ] Check backend console for actual error message
- [ ] Check browser Network tab: see full response from /sync endpoint
- [ ] Check browser Console: any client-side errors

### THEN APPLY FIXES
- [ ] Fix #1: Verify token is stored in DB after OAuth
- [ ] Fix #2: Add token validation in triggerSync()
- [ ] Fix #3: Improve error messages in backend
- [ ] Fix #4: Show real errors in frontend
- [ ] Fix #5: Add status polling

### VERIFY FIXES
- [ ] Sync succeeds locally
- [ ] Real data appears in dashboard
- [ ] Error messages are clear
- [ ] No hardcoded timeouts
- [ ] Status shows "Syncing..." until actually done

---

## 📊 IMPACT SUMMARY

| Feature | Status | Impact |
|---------|--------|--------|
| Sign-in | ✅ Works | Can log in |
| Dashboard Load | ⚠️ Partial | Loads but no data |
| Sync Data | ❌ Broken | Main blocker |
| Analyze | ❌ Broken | Depends on sync |
| AI Features | ❌ Blocked | No data to analyze |
| Ads | ❌ Blocked | No product data |
| SEO | ❌ Blocked | No product data |
| Emails | ❌ Blocked | No product data |

---

## 📞 NEXT STEPS

1. **Immediately:** Start localhost and debug the sync error
2. **Quick Win (15 mins):** Enable backend error logging to see real error
3. **Fix (1-2 hours):** Apply fixes in Phase 1-4
4. **Test:** Verify sync works with real Shopify store data
5. **Deploy:** Push fixes to production Vercel/Render

---

## 🎯 SUCCESS CRITERIA

✅ Sync completes without error  
✅ Dashboard shows real product data  
✅ Health score updates after sync  
✅ AI analysis runs automatically  
✅ All other features have data to work with  

