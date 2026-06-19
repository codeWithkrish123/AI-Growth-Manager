# Production Deployment Checklist - Today's Fixes

## ✅ Changes Ready to Deploy

### Backend Changes
**Location:** `backend/src/controllers/index.js`

**Lines 56-78:** Enhanced token debugging
```javascript
let accessToken = merchant.getAccessToken();
logger.info({ 
  shopDomain, 
  hasToken: !!accessToken,
  tokenEnc: merchant.accessTokenEnc ? `${merchant.accessTokenEnc.substring(0, 20)}...` : 'NONE'
}, 'Sync token check');
```

**Lines 232-250:** Better error classification
```javascript
// Determine if it's an auth error
if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
  return error(res, 'Shopify authentication failed. Token may be expired.', 401);
}
```

### Frontend Changes
**Location:** `frontend/src/pages/DashboardPage.jsx`

**Lines 215-242:** Show real errors
```javascript
const errorMsg = err.response?.data?.error?.message || err.response?.data?.error || err.message;
Swal.fire({
  title: 'Sync Failed',
  text: errorMsg,  // ← Real error instead of generic
  icon: 'error',
})
```

---

## 🚀 Deployment Steps

### Step 1: Test Locally (15 mins)
```bash
cd backend && npm run dev
# In new terminal:
cd frontend && npm run dev
# Test sync at http://localhost:5173
```

### Step 2: Git Commit
```bash
git add -A
git commit -m "fix: improve sync error logging and frontend error display

- Enhanced backend token debugging
- Better error classification (401 vs network vs timeout)
- Show real Shopify errors to users instead of generic messages
- Improved console logging for developer debugging
"
```

### Step 3: Push to GitHub
```bash
git push origin main
```

### Step 4: Auto-Deploy
- ✅ Frontend: Vercel auto-deploys from main
- ✅ Backend: Render auto-deploys from main
- ⏰ Wait 2-3 minutes for both to redeploy

### Step 5: Test in Production
```
1. Go to https://ai-growth-manager.vercel.app/
2. Sign in with: sahkrish1406@gmail.com / Newdelhi@2025
3. Click "Sync Now"
4. ✅ Should see specific error (not generic message)
5. ✅ Backend logs at Render should show detailed error
```

---

## 🔍 Verification Checklist

- [ ] No console errors on frontend
- [ ] Backend starts without errors
- [ ] Sync button responds with specific error message
- [ ] Backend logs show token status
- [ ] Vercel deployment successful
- [ ] Render deployment successful
- [ ] Production app shows improved error messages

---

## 🐛 If Issues Occur During Deployment

**Frontend not updating?**
- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R

**Backend not updating?**
- Check Render deploy logs: https://dashboard.render.com
- Restart service if needed

**Still seeing old error message?**
- Rebuild frontend: `npm run build`
- Push to main again

---

## 📊 Expected Results After Deployment

**Before:** ❌ Generic "Could not connect to Shopify"  
**After:** ✅ Specific error like "Token may be expired. Please reconnect."

This helps identify the real root cause so we can fix it next.

---

## 🎯 Next Phase After Deployment

Once we see the specific error, we know what to fix:

1. **If "Token not found"** → Fix OAuth callback storage
2. **If "401 Unauthorized"** → Need to refresh/renew token
3. **If "Network error"** → Check firewall/proxy
4. **If "Shopify API error"** → Check API configuration

---
