import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// ── Lazy-loaded pages (code splitting per route) ──────────────────────────────
const LandingPage        = lazy(() => import('./pages/LandingPage'))
const DashboardPage      = lazy(() => import('./pages/DashboardPage'))
const PricingPage        = lazy(() => import('./pages/PricingPage'))
const SignInPage         = lazy(() => import('./pages/SignInPage'))
const ResourcesPage      = lazy(() => import('./pages/ResourcesPage'))
const AboutPage          = lazy(() => import('./pages/AboutPage'))
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage'))
const SyncPage           = lazy(() => import('./pages/SyncPage'))
const ProductsPage       = lazy(() => import('./pages/ProductsPage'))
const AIActionsPage      = lazy(() => import('./pages/AIActionsPage'))
const EmailsPage         = lazy(() => import('./pages/EmailsPage'))
const RevenueImpactPage  = lazy(() => import('./pages/RevenueImpactPage'))
const SettingsPage       = lazy(() => import('./pages/SettingsPage'))
const AIDescriptionsPage = lazy(() => import('./pages/AIDescriptionsPage'))
const PriceOptimizerPage = lazy(() => import('./pages/PriceOptimizerPage'))
const AdsPage            = lazy(() => import('./pages/AdsPage'))
const SEOPage            = lazy(() => import('./pages/SEOPage'))

const StoreAccessPage  = lazy(() => import('./pages/StoreAccessPage'))

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )
}

// ── Smart redirect: /dashboard → /dashboard/:shop ────────────────────────────
function DashboardRedirect() {
  const shop = localStorage.getItem('currentShop')
  if (shop && !shop.match(/^[a-z0-9]+(gmail|yahoo|hotmail|outlook)/i)) {
    return <Navigate to={`/dashboard/${shop}`} replace />
  }
  return <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/dashboard"         element={<DashboardRedirect />} />
          <Route path="/dashboard/:shop"   element={<DashboardPage />} />
          <Route path="/pricing"           element={<PricingPage />} />
          <Route path="/signin"            element={<SignInPage />} />
          <Route path="/resources"         element={<ResourcesPage />} />
          <Route path="/about"             element={<AboutPage />} />
          <Route path="/onboarding"        element={<OnboardingPage />} />
          <Route path="/sync"              element={<SyncPage />} />
          <Route path="/products"          element={<ProductsPage />} />
          <Route path="/ai-actions"        element={<AIActionsPage />} />
          <Route path="/emails"            element={<EmailsPage />} />
          <Route path="/revenue"           element={<RevenueImpactPage />} />
          <Route path="/settings"          element={<SettingsPage />} />
          <Route path="/ai-descriptions"   element={<AIDescriptionsPage />} />
          <Route path="/price-optimizer"   element={<PriceOptimizerPage />} />
          <Route path="/ads"              element={<AdsPage />} />
          <Route path="/seo"              element={<SEOPage />} />
          <Route path="/store-access"     element={<StoreAccessPage />} />

          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
