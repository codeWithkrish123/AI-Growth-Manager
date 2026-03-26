import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardOverview from './pages/DashboardOverview'
import HealthIntelligence from './pages/HealthIntelligence'
import PricingPage from './pages/PricingPage'
import SignInPage from './pages/SignInPage'
import ResourcesPage from './pages/ResourcesPage'
import AboutPage from './pages/AboutPage'
import OnboardingPage from './pages/OnboardingPage'
import SyncPage from './pages/SyncPage'
import DarkDashboard from './pages/DarkDashboard'
import ProductsPage from './pages/ProductsPage'
import AIActionsPage from './pages/AIActionsPage'
import EmailsPage from './pages/EmailsPage'
import RevenueImpactPage from './pages/RevenueImpactPage'
import SettingsPage from './pages/SettingsPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardOverview />} />
                <Route path="/health" element={<HealthIntelligence />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/sync" element={<SyncPage />} />
                <Route path="/dark-dashboard" element={<DarkDashboard />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/ai-actions" element={<AIActionsPage />} />
                <Route path="/emails" element={<EmailsPage />} />
                <Route path="/revenue" element={<RevenueImpactPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
