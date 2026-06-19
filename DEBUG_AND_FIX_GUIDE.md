# DEBUG & FIX GUIDE - AI Growth Manager Sync Issue

## 🔴 Problem
When clicking "Sync Now" on the production dashboard, users see:
```
Sync Failed
Could not connect to Shopify. Please check your connection.
```

## ✅ What We've Done
1. Enhanced backend error logging in `src/controllers/index.js`
2. Improved frontend error display in `src/pages/DashboardPage.jsx`
3. Added token debugging information
4. Better error classification (auth vs network vs API)

## 🚀 Next Steps - Test Locally

### Step 1: Setup Local Environment

```bash
# In E:\AI Growth Manager\backend
npm install
npm run dev
# Should see: "Server running on port 3001"

# In another terminal, E:\AI Growth Manager\frontend
npm install
npm run dev
# Should see: "VITE v... ready in ... ms"
```

### Step 2: Check PostgreSQL & Redis
```bash
# Verify PostgreSQL is running
# Windows: Services → PostgreSQL

# Verify Redis is running (if using)
# Or check .env if Redis is optional
```

### Step 3: Test Sign-in

1. Open http://localhost:5173
2. Sign in with: sahkrish1406@gmail.com / Newdelhi@2025
3. Select store: ai-product-optimizer
4. Open browser DevTools → Console (F12)

### Step 4: Trigger Sync & Debug

1. Click "Sync Now" button
2. Check browser Console for error details
3. Check backend logs (`npm run dev` terminal) for detailed error
4. Look for these log entries:

```
✅ You should see: "Sync token check"
✅ You should see: "Starting direct sync"
✅ Or error: "Access token not found during sync"
```

### Step 5: Identify Root Cause

**If you see: "Access token not found"**
→ Database is not storing the token after OAuth
→ Go to: Backend OAuth Callback Fix (below)

**If you see: "401 Unauthorized"**
→ Token is expired or revoked
→ Go to: Token Refresh Fix (below)

**If you see: "ECONNREFUSED" or timeout**
→ Cannot reach Shopify API
→ Check firewall, proxy settings

---

## 🔧 Fixes to Apply

### Fix #1: Verify Token Storage After OAuth
**File:** `backend/src/controllers/shopify.controller.js`  
**Lines:** Look for `handleShopifyCallback()`

**Debug this:**
1. Add console.log to verify token is being saved:

```javascript
// In handleShopifyCallback():
const merchant = await Merchant.create({
  shopDomain: normalizedShop,
  accessToken: accessToken,  // ← Should be non-empty
  // ...
});

// Add after create:
logger.info({ 
  merchantId: merchant.id,
  hasToken: !!merchant.getAccessToken(),
  tokenLength: merchant.getAccessToken()?.length
}, 'Token stored after OAuth');
```

2. After OAuth completes, query the database:
```sql
SELECT shop_domain, access_token_enc, is_active FROM merchants WHERE shop_domain = 'ai-product-optimizer.myshopify.com';
```

3. Check if `access_token_enc` field has data (not empty/null)

---

### Fix #2: Check Encryption/Decryption
**File:** `backend/src/utils/encryption.js`

**Verify:**
1. `ENCRYPTION_KEY` env var matches during encrypt and decrypt
2. Add a test:

```javascript
// Temporary test
const { encrypt, decrypt } = await import('../utils/encryption.js');
const testToken = 'shpat_test123456';
const encrypted = encrypt(testToken);
const decrypted = decrypt(encrypted);
console.log('Encrypt/Decrypt test:', { testToken, encrypted, decrypted, match: testToken === decrypted });
```

---

### Fix #3: Validate Shopify API Configuration
**File:** `backend/src/config/shopify.js`

**Verify:**
```javascript
// Log on startup
console.log('Shopify Config:', {
  apiKey: process.env.SHOPIFY_API_KEY ? '✅ SET' : '❌ MISSING',
  apiSecret: process.env.SHOPIFY_API_SECRET ? '✅ SET' : '❌ MISSING',
  appUrl: process.env.APP_URL,
  scopes: process.env.SHOPIFY_SCOPES?.split(',').length + ' scopes'
});
```

---

## 📋 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend connects to backend (check Network tab)
- [ ] Can sign in successfully
- [ ] Store name appears in header
- [ ] Sync button is clickable
- [ ] Clicking sync shows detailed error (not generic message)
- [ ] Backend console shows token status
- [ ] Database has token stored for merchant

---

## 🎯 Success Criteria

✅ Backend returns specific error (not generic "sync failed")  
✅ Frontend shows real error message  
✅ Database has encrypted token stored  
✅ Sync completes and shows health score  
✅ Dashboard shows product data

---

## 📞 If Still Stuck

1. **Screenshot backend logs** when sync is triggered
2. **Screenshot browser Console** error details
3. **Check database** if token is stored:
   ```sql
   SELECT shop_domain, LENGTH(access_token_enc) as token_length, is_active FROM merchants;
   ```
4. **Compare .env values** between local and production

---

