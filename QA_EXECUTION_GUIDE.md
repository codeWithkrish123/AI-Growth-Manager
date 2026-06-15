# QA Testing Execution Guide - AI Growth Manager

## Test Environment
- **URL:** http://localhost:5173
- **Test Store:** ai-product-optimizer.myshopify.com
- **Test Account:** sahkrish1406@gmail.com
- **Backend:** http://localhost:3001

---

## Critical Bugs to Test (BLOCKER ISSUES)

### 1. ✅ Authorization Flow
**Steps:**
1. Open http://localhost:5173
2. Click "Sign In with Google"
3. Login with sahkrish1406@gmail.com
4. Should redirect to /onboarding

**Expected:** ✅ Google OAuth successful → token saved in localStorage  
**If fails:** 🔴 BLOCKER - Cannot proceed

**Debug:**
```
Open Console (F12)
Check localStorage.getItem('token')
```

---

### 2. ✅ Onboarding Page
**Steps:**
1. After Google auth, you're on /onboarding
2. Enter store URL: `ai-product-optimizer`
3. Click "Activate AI Analysis"
4. Wait for 3-second loading animation

**Expected:** ✅ Animation completes → redirects to /store-access  
**If fails:** 🔴 BLOCKER - Form submission broken

**Test Mobile:** 
- Open Chrome DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Test on iPhone 12 & Pixel 5 sizes

---

### 3. ✅ Store Access Review Page
**Steps:**
1. On /store-access page
2. Store domain displays: `ai-product-optimizer.myshopify.com`
3. See 4 permission items
4. Click "Allow Access" button

**Expected:** ✅ Redirects to dashboard OR Shopify OAuth  
**If fails:** 🔴 BLOCKER - Authorization fails

**Console check:**
```
Look for: "Authorization response:"
Check for errors in network tab
```

---

### 4. ✅ Dashboard Data Loading
**Steps:**
1. After auth, dashboard loads
2. Health score card displays (should show 59)
3. Products card shows 9 items
4. No 500 errors

**Expected:** ✅ All KPIs load within 2 seconds  
**If fails:** 🔴 BLOCKER - No value provided to user

**Performance check:**
- Open Network tab (F12)
- Check API response times
- `/dashboard` should be <500ms

---

### 5. ✅ Mobile Responsiveness
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test each page at:
   - iPhone 12 (390x844)
   - Pixel 5 (393x851)
   - iPad (768x1024)

**Expected:** ✅ All text readable, no horizontal scroll  
**If fails:** 🔴 BLOCKER - Bad UX on mobile

---

## Major Bugs to Test (FIX BEFORE LAUNCH)

### 6. ✅ Button Functionality
**Test all buttons:**
- [ ] "Sync Now" button on dashboard
- [ ] "Allow Access" on store-access page
- [ ] Navigation menu items on sidebar
- [ ] "Review AI Suggestions" button

**Expected:** ✅ No console errors, loading states work  
**If fails:** 🟠 MAJOR - Reduced functionality

---

### 7. ✅ UI Styling Consistency
**Check:**
- [ ] Buttons use blue color (btn-primary)
- [ ] All fonts readable
- [ ] Spacing aligned consistently
- [ ] No misaligned elements

**Test on:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**If fails:** 🟠 MAJOR - Looks unprofessional

---

### 8. ✅ API Response Time
**Steps:**
1. Open Network tab (F12)
2. Navigate through pages
3. Record response times

**Expected:**
- Dashboard load: <2 seconds
- API calls: <500ms
- Page navigation: <1 second

**If fails:** 🟠 MAJOR - User frustration

---

## Minor Issues (Fix Post-Launch)

### 9. ✅ Hover States
- Check button hover effects
- Link underlines appear
- Cards have shadow on hover

**If fails:** 🟢 MINOR - Polish issue

---

### 10. ✅ Console Warnings
**Steps:**
1. Open Console (F12)
2. Refresh page
3. Look for red errors (ignore yellow warnings)

**Expected:** ✅ No red errors  
**If fails:** 🟢 MINOR - Tech debt

---

## Full Testing Checklist

### Page: Sign In (/signin)
- [ ] Google OAuth button visible
- [ ] Click redirects to Google login
- [ ] After auth, redirects to /onboarding

### Page: Onboarding (/onboarding)
- [ ] Title "Connect Your Store" visible
- [ ] Input field accepts store URL
- [ ] Input validation works (rejects invalid URLs)
- [ ] Loading animation displays (3 seconds)
- [ ] Animation shows 5 progress steps
- [ ] After animation, redirects to /store-access

### Page: Store Access Review (/store-access)
- [ ] Store domain displayed correctly
- [ ] 4 permission items visible
- [ ] "Back" button returns to onboarding
- [ ] "Allow Access" button works
- [ ] Loading state shows "Authorizing..."

### Page: Dashboard (/dashboard/[shop])
- [ ] Health score card displays
- [ ] All KPI cards load (Products, Orders, Customers)
- [ ] Sidebar navigation works
- [ ] "Sync Now" button works
- [ ] No 500 errors
- [ ] Charts render properly

### Page: Price Optimizer (/dashboard/[shop]/price-optimizer)
- [ ] Page loads without errors
- [ ] Buttons are blue (btn-primary)
- [ ] Form inputs work
- [ ] No layout issues on mobile

### Page: AI Descriptions (/dashboard/[shop]/ai-descriptions)
- [ ] Page loads
- [ ] Product selection works
- [ ] No errors on mobile

---

## Performance Benchmarks

| Page | Load Time | API Response | Status |
|------|-----------|--------------|--------|
| /signin | <1s | N/A | ✅ |
| /onboarding | <1s | N/A | ✅ |
| /store-access | <1s | N/A | ✅ |
| /dashboard | <2s | <500ms | ✅ |
| /price-optimizer | <2s | <500ms | ✅ |
| /ai-descriptions | <2s | <500ms | ✅ |

---

## Bug Severity Guide

**🔴 BLOCKER (Fix Immediately)**
- Authorization fails
- Dashboard won't load
- 500 errors
- App crashes
- Mobile unreadable

**Status: CANNOT LAUNCH**

---

**🟠 MAJOR (Fix Before Launch)**
- Buttons don't work
- Styling broken
- API timeout >5s
- Missing key features

**Status: NOT READY**

---

**🟢 MINOR (Fix Post-Launch)**
- Typos
- Hover states
- Console warnings
- Polish issues

**Status: ACCEPTABLE**

---

## Testing Results Template

### Test Date: ___________
### Tester: ___________

#### Critical Issues Found:
1. [ ] Authorization: ✅ PASS / 🔴 FAIL
   - Details: _______________________

2. [ ] Onboarding: ✅ PASS / 🔴 FAIL
   - Details: _______________________

3. [ ] Store Access: ✅ PASS / 🔴 FAIL
   - Details: _______________________

4. [ ] Dashboard: ✅ PASS / 🔴 FAIL
   - Details: _______________________

5. [ ] Mobile Responsive: ✅ PASS / 🔴 FAIL
   - Details: _______________________

#### Major Issues Found:
- [ ] Button functionality: ✅ / 🟠
- [ ] UI styling: ✅ / 🟠
- [ ] API response time: ✅ / 🟠

#### Minor Issues Found:
- [ ] Hover states: ✅ / 🟢
- [ ] Console warnings: ✅ / 🟢

---

## Sign-Off Checklist

✅ **Ready for Production if ALL are true:**
- [ ] All 5 critical bugs FIXED
- [ ] No 🔴 BLOCKER issues remain
- [ ] Dashboard loads without errors
- [ ] Mobile responsive on iPhone/Android
- [ ] All authentication flows work
- [ ] <2 second page load times
- [ ] API responses <500ms
- [ ] Zero red console errors

---

## Next Steps After QA Pass

1. Deploy to Vercel (frontend)
2. Deploy to Render (backend)
3. Configure production domains
4. Submit to Shopify app store
5. Launch go-to-market strategy

---

## How to File Bugs

**Format:**
```
Title: [CRITICAL/MAJOR/MINOR] Issue description
Steps to reproduce:
1. Do this
2. Then this
3. Expected result

Actual result: What happened
Screenshot: [Attach image]
Console error: [Copy-paste error]
Environment: Desktop / Mobile
Browser: Chrome version X
```

---

## Quick Debug Commands

### Check token in console:
```javascript
localStorage.getItem('token')
```

### Check API response:
```javascript
// Open Network tab (F12), click API call, copy response
```

### Check localStorage:
```javascript
console.log(localStorage)
```

### Clear all data:
```javascript
localStorage.clear()
```

---

**Start Testing Now! 🚀**

Test each page systematically. Document any issues found. Once all critical bugs are fixed, you're production-ready!
