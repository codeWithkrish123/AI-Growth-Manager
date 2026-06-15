# QA Testing Plan - AI Growth Manager

## Phase 1: Authentication & Onboarding Flow (Critical Path)

### 1.1 Sign In Page
- [ ] Google OAuth login works
- [ ] Redirect to onboarding after successful auth
- [ ] Error handling for invalid credentials
- [ ] Token stored in localStorage

### 1.2 Onboarding Page
- [ ] Input validation (store URL format)
- [ ] Auto-format store domain (.myshopify.com)
- [ ] Loading animation displays (3 seconds)
- [ ] Animation progression through 5 steps

### 1.3 Store Access Review Page
- [ ] Store domain displays correctly
- [ ] All 4 permission items visible
- [ ] "Back" button returns to onboarding
- [ ] "Allow Access" button initiates OAuth
- [ ] Loading state during authorization

### 1.4 Dashboard Access
- [ ] After auth, dashboard loads with store data
- [ ] Health score displays (target: 59+)
- [ ] Products sync correctly
- [ ] No blank states or loading errors

---

## Phase 2: Core Features Testing

### 2.1 Dashboard Page
- [ ] Health score card displays
- [ ] All KPIs visible (products, orders, customers)
- [ ] Charts render properly
- [ ] Sidebar navigation works

### 2.2 Price Optimizer
- [ ] Bulk analysis button functional
- [ ] AI suggestions generate
- [ ] UI matches design specs
- [ ] Button styling (btn-primary class)

### 2.3 AI Descriptions
- [ ] Description generation works
- [ ] Product selection functional
- [ ] Apply changes button works

### 2.4 SEO Optimization
- [ ] SEO score calculated
- [ ] Recommendations display
- [ ] Apply fixes functional

### 2.5 Ads & Email Pages
- [ ] Page loads without errors
- [ ] Forms submit data
- [ ] API calls complete

---

## Phase 3: UI/UX Consistency Testing

### 3.1 Design System
- [ ] Buttons use btn-primary / btn-ghost classes
- [ ] Fonts sizes are consistent
- [ ] Colors match brand (indigo-600, blue)
- [ ] Spacing aligns with grid

### 3.2 Responsive Design
- [ ] Mobile (375px) - all pages readable
- [ ] Tablet (768px) - layouts adapt
- [ ] Desktop (1920px) - full experience

### 3.3 Error States
- [ ] Error messages display clearly
- [ ] Network failures handled
- [ ] Retry mechanisms functional

---

## Phase 4: Performance & Security

### 4.1 Performance
- [ ] Dashboard loads in <2 seconds
- [ ] API responses average <500ms
- [ ] No memory leaks (dev tools)
- [ ] Images optimized

### 4.2 Security
- [ ] JWT tokens validated
- [ ] XSS protection active (CSP headers)
- [ ] CSRF tokens present
- [ ] No secrets in localStorage

---

## Testing Checklist - Critical Bugs

**BLOCKER ISSUES (Fix Immediately)**
1. Authorization fails → Cannot proceed
2. Dashboard 500 errors → User stuck
3. Data not syncing → No value provided
4. UI crashes on mobile → Bad user experience

**MAJOR ISSUES (Fix Before Launch)**
5. Buttons don't work → Reduced functionality
6. Styling misaligned → Looks unprofessional
7. API timeout >5s → User frustration

**MINOR ISSUES (Fix Post-Launch)**
8. Missing hover states → Polish
9. Console warnings → Tech debt
10. Typos → Content quality

---

## Test Results Template

| Feature | Status | Issue | Priority |
|---------|--------|-------|----------|
| Google Auth | ✅ PASS | - | - |
| Store Access | ✅ PASS | - | - |
| Dashboard | ✅ PASS | - | - |
| Price Optimizer | 🔴 FAIL | UI misaligned | MAJOR |
| SEO Page | ✅ PASS | - | - |

---

## Sign-Off Criteria

✅ **Ready for Production if:**
- All blocker issues resolved
- >95% of pages load without errors
- Mobile responsive on iPhone/Android
- All authentication flows work
- Dashboard data displays correctly
- Performance metrics acceptable

---

## Testing Environment

**URL:** http://localhost:5173  
**Backend:** http://localhost:3001  
**Test Store:** ai-product-optimizer.myshopify.com  
**Test Account:** sahkrish1406@gmail.com  

---

## Next Steps After QA Sign-Off

1. Deploy to staging environment
2. Run load testing (concurrent users)
3. Security audit by external firm
4. Final UAT with select merchants
5. Deploy to production
