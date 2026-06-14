import { useState } from 'react'
import { User, Shield, Zap, Store, LogOut, Menu, ChevronRight, ExternalLink, Bell, Settings } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'

const AI_SETTINGS_KEY = 'aiSettings'

const DEFAULT_AI_SETTINGS = {
  autoApplyFixes:   true,
  aiEmailGen:       true,
  priceOptimizer:   false,
  dailyAutoAnalysis: true,
}

const SECTIONS = [
  { icon: Store,    label: 'Store Connection', id: 'store' },
  { icon: User,     label: 'Account',          id: 'account' },
  { icon: Zap,      label: 'AI Settings',       id: 'ai' },
  { icon: Bell,     label: 'Notifications',     id: 'notifications' },
  { icon: Shield,   label: 'Security',          id: 'security' },
];

export default function SettingsPage() {
  const navigate = useNavigate()
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [isDark,         setIsDark]         = useState(() => document.documentElement.classList.contains('dark'))
  const [activeSection,  setActiveSection]  = useState('store')
  const [aiSettings,     setAiSettings]     = useState(() => {
    try { return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || '{}') } }
    catch { return DEFAULT_AI_SETTINGS }
  })
  const shop = localStorage.getItem('currentShop') || ''
  const shopName = shop.replace('.myshopify.com', '')

  const toggleDark = () => {
    const next = !isDark; setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const toggleAiSetting = (key) => {
    const next = { ...aiSettings, [key]: !aiSettings[key] }
    setAiSettings(next)
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(next))
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar active="settings" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-7 py-4 border-b backdrop-blur-sm"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--c-text-muted)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                <Settings className="w-5 h-5 text-purple-400" />
                Settings
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                Manage your account, preferences, and security
              </p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/') }} className="btn-ghost text-xs">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="px-7 py-6 space-y-6">
          {/* Left nav */}
          <aside className="w-52 flex-shrink-0">
            <div className="rounded-xl border backdrop-blur-sm p-4 space-y-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
              <div className="p-4 text-center rounded-lg" style={{ background: 'var(--c-border)' }}>
                <div className="w-10 h-10 rounded-full bg-purple-400/20 text-purple-400 font-bold text-sm flex items-center justify-center mx-auto mb-2">
                  {shopName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{shopName}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>Free Plan</p>
              </div>
              <nav className="space-y-1">
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activeSection === s.id ? 'bg-purple-400/20 text-purple-400' : 'hover:opacity-70'}`}
                    style={{ color: activeSection === s.id ? undefined : 'var(--c-text-muted)' }}>
                    <s.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{s.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1 space-y-6">
            {activeSection === 'store' && (
              <div className="rounded-xl border backdrop-blur-sm p-6" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
                <h2 className="text-base font-black mb-1" style={{ color: 'var(--c-text)' }}>Store Connection</h2>
                <p className="text-xs mb-6" style={{ color: 'var(--c-text-muted)' }}>Your connected Shopify store.</p>
                <div className="space-y-3 divide-y" style={{ borderColor: 'var(--c-border)' }}>
                  {[
                    { label: 'Store Domain', value: shop || 'Not connected' },
                    { label: 'Store Name',   value: shopName || '—' },
                    { label: 'Platform',     value: 'Shopify' },
                    { label: 'Plan',         value: 'Free' },
                    { label: 'Status',       value: shop ? 'Connected ✓' : 'Disconnected' },
                  ].map(item => (
                    <div key={item.label} className="py-5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                  {shop && (
                    <a href={`https://${shop}/admin`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <ExternalLink className="w-4 h-4" /> Open Shopify Admin
                    </a>
                  )}
                  <button onClick={() => { localStorage.clear(); navigate('/onboarding') }}
                    className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                    Disconnect Store
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'ai' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-base font-bold text-slate-900 mb-1">AI Settings</h2>
                <p className="text-sm text-slate-400 mb-8">Configure AI behavior for your store.</p>
                <div className="divide-y divide-slate-100">
                  {[
                    { key: 'autoApplyFixes',    label: 'Auto-Apply Safe Fixes',  desc: 'Automatically apply low-risk AI fixes without confirmation' },
                    { key: 'aiEmailGen',         label: 'AI Email Generation',    desc: 'Use AI to write email campaign content' },
                    { key: 'priceOptimizer',     label: 'Price Optimization',     desc: 'Allow AI to suggest price changes based on demand' },
                    { key: 'dailyAutoAnalysis',  label: 'Daily Auto-Analysis',    desc: 'Run automatic store analysis every 24 hours' },
                  ].map(s => (
                    <div key={s.key} className="py-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                      </div>
                      <button onClick={() => toggleAiSetting(s.key)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${aiSettings[s.key] ? 'bg-primary' : 'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${aiSettings[s.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">Settings are saved locally and applied on next action.</p>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-base font-bold text-slate-900 mb-1">Account</h2>
                <p className="text-sm text-slate-400 mb-8">Your subscription and usage.</p>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: 'Current Plan',      value: 'Free Plan' },
                    { label: 'AI Actions Used',   value: '0 / 10 this month' },
                    { label: 'Syncs',             value: 'Unlimited' },
                    { label: 'Products Tracked',  value: 'Up to 100' },
                  ].map(item => (
                    <div key={item.label} className="py-5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => navigate('/pricing')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                    <Zap className="w-4 h-4" /> Upgrade Plan
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-base font-bold text-slate-900 mb-1">Notifications</h2>
                <p className="text-sm text-slate-400 mb-8">Manage how you receive updates.</p>
                <div className="divide-y divide-slate-100">
                  {[
                    { key: 'emailAlerts',      label: 'Email Alerts',        desc: 'Get email notifications for important updates' },
                    { key: 'weeklyReport',     label: 'Weekly Report',       desc: 'Receive weekly store health report' },
                    { key: 'fixNotifications', label: 'Fix Notifications',   desc: 'Alert when AI finds issues to fix' },
                    { key: 'campaignUpdates',  label: 'Campaign Updates',    desc: 'Notify about ad campaign performance' },
                  ].map(s => (
                    <div key={s.key} className="py-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                      </div>
                      <button onClick={() => toggleAiSetting(s.key)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${aiSettings[s.key] ? 'bg-blue-500' : 'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${aiSettings[s.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-base font-bold text-slate-900 mb-1">Security</h2>
                <p className="text-sm text-slate-400 mb-8">Manage your account security.</p>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">API Tokens</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-3">Your Shopify API token is securely stored and never exposed.</p>
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Regenerate Token</button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Active Sessions</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Current Session</p>
                        <p className="text-xs text-slate-500 mt-1">This browser · Last active now</p>
                      </div>
                      <p className="text-xs font-bold text-emerald-600">Active</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Danger Zone</h3>
                    <button className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-100">
                      Delete Account & All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
