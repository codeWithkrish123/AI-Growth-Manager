import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RefreshCw, Menu, Sparkles, TrendingUp, Bell, Search, Calendar } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI } from '../services/api'
import Swal from 'sweetalert2'

// Sparkline SVG
function Sparkline({ color = '#22c55e', up = true }) {
  const path = up
    ? 'M0 35 Q 20 38, 40 28 T 80 18 T 120 8'
    : 'M0 12 Q 20 10, 40 18 T 80 28 T 120 32'
  return (
    <svg className="h-8 w-24" viewBox="0 0 120 40" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Animated health score ring
function HealthRing({ score }) {
  const r = 56, circ = 2 * Math.PI * r
  const offset = circ - (circ * score) / 100
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <motion.circle cx="64" cy="64" r={r} fill="none" stroke="#2563eb" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-4xl font-black text-slate-900"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {score}
        </motion.span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {score >= 80 ? 'GOOD' : score >= 60 ? 'FAIR' : 'POOR'}
        </span>
      </div>
    </div>
  )
}

// Revenue chart using real health history data
function RevenueChart({ data }) {
  if (!data || data.length < 2) return (
    <div className="h-64 flex items-center justify-center text-slate-300">
      <div className="text-center">
        <TrendingUp className="w-10 h-10 mx-auto mb-2" />
        <p className="text-sm">Sync your store to see revenue data</p>
      </div>
    </div>
  )
  const H = 200, W = 600
  const scores = data.map(d => d.healthScore || d.score || 0)
  const maxV = Math.max(...scores, 1)
  const pts = scores.map((v, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - (v / maxV) * (H * 0.85) - H * 0.05
    return `${x},${y}`
  }).join(' ')
  // midpoint for tooltip
  const mid = Math.floor(scores.length / 2)
  const midX = (mid / (scores.length - 1)) * W
  const midY = H - (scores[mid] / maxV) * (H * 0.85) - H * 0.05

  return (
    <div className="relative h-64">
      {/* Y labels */}
      <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-slate-400 pr-2">
        {['100', '75', '50', '25', '0'].map(l => <span key={l}>{l}</span>)}
      </div>
      <svg className="absolute left-8 right-0 top-0 bottom-6" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Dotted baseline */}
        <polyline fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6,4"
          points={`0,${H * 0.7} ${W},${H * 0.4}`} />
        {/* Main area */}
        <polygon fill="url(#revGrad)" points={`0,${H} ${pts} ${W},${H}`} />
        <polyline fill="none" stroke="#2563eb" strokeWidth="2.5"
          points={pts} strokeLinecap="round" strokeLinejoin="round" />
        {/* Midpoint tooltip dot */}
        <circle cx={midX} cy={midY} r="5" fill="#1e40af" stroke="white" strokeWidth="2" />
        {/* Tooltip */}
        <rect x={midX - 36} y={midY - 28} width="72" height="22" rx="5" fill="#1e293b" />
        <text x={midX} y={midY - 13} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
          Score: {scores[mid]}
        </text>
      </svg>
      {/* X labels */}
      <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-slate-400">
        {data.filter((_, i, a) => [0, Math.floor(a.length/5), Math.floor(2*a.length/5), Math.floor(3*a.length/5), Math.floor(4*a.length/5), a.length-1].includes(i))
          .map((d, i) => <span key={i}>{d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { shop } = useParams()
  const navigate  = useNavigate()
  const [loading,       setLoading]       = useState(true)
  const [syncing,       setSyncing]       = useState(false)
  const [analyzing,     setAnalyzing]     = useState(false)
  const [dashData,      setDashData]      = useState(null)
  const [aiActions,     setAiActions]     = useState([])
  const [historyData,   setHistoryData]   = useState([])
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [isDark,        setIsDark]        = useState(() => document.documentElement.classList.contains('dark'))
  const [lastSynced,    setLastSynced]    = useState(null)
  const [toast,         setToast]         = useState(null)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)

  const toggleDark = () => { const n = !isDark; setIsDark(n); document.documentElement.classList.toggle('dark', n); localStorage.setItem('theme', n ? 'dark' : 'light') }
  const showToast  = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    document.title = 'Dashboard – AI Growth Manager'
    if (!shop) { navigate('/onboarding'); return }
    
    // Capture token if present in URL (e.g. after Shopify OAuth)
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    
    if (urlToken) {
      console.log('🎟️ New session token received from URL')
      localStorage.setItem('token', urlToken)
      // Mark Shopify as connected — this token comes from the Shopify OAuth callback
      // and is the only token that has a real, active merchant record in the DB.
      localStorage.setItem('shopifyConnected', 'true')
      localStorage.setItem('currentShop', shop)
    }

    const currentToken = urlToken || localStorage.getItem('token')
    if (!currentToken) {
      console.warn('⚠️ No token found, redirecting to signin')
      navigate('/signin')
      return
    }

    localStorage.setItem('currentShop', shop)
    
    // Small delay to ensure localStorage is effectively updated before axios interceptor runs
    // although localStorage is synchronous, this helps with some race conditions in React
    const timer = setTimeout(() => {
      fetchAll()
    }, 100)

    // Clean URL
    if (urlToken) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Auto-refresh once after 4s if this is a fresh connect (success=true in URL)
    if (params.get('success') === 'true') {
      const refreshTimer = setTimeout(() => fetchAll(), 4000)
      return () => {
        clearTimeout(timer)
        clearTimeout(refreshTimer)
      }
    }
    
    return () => clearTimeout(timer)
  }, [shop, navigate])

  const fetchAll = async () => {
    setLoading(true)
    console.log('🔄 Fetching dashboard data for:', shop)
    try {
      const [dashRes, histRes, fixRes] = await Promise.allSettled([
        dashboardAPI.getDashboardData(shop),
        dashboardAPI.getHealthHistory(shop),
        dashboardAPI.getFixes(shop),
      ])
      
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data?.data || dashRes.value.data
        setDashData(d)
        setLastSynced(new Date().toLocaleTimeString())
        if (d?.tokenExpired) showToast('⚠️ Token expired — showing cached data. Reconnect store.', 'error')
      } else {
        console.error('❌ Dashboard data fetch failed:', dashRes.reason)
        if (dashRes.reason?.response?.status === 401) {
          // If we get 401 even after setting token, something is wrong with the token
          console.error('🎟️ Token invalid or expired')
        }
      }
      
      if (histRes.status === 'fulfilled') {
        const d = histRes.value.data?.data || histRes.value.data || []
        setHistoryData(Array.isArray(d) ? d : [])
      }
      
      if (fixRes.status === 'fulfilled') {
        const d = fixRes.value.data?.data || fixRes.value.data || []
        setAiActions(Array.isArray(d) ? d.slice(0, 5) : [])
      }
    } catch (err) {
      console.error('❌ fetchAll fatal error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await dashboardAPI.triggerSync(shop)
      
      Swal.fire({
        title: 'Sync Started',
        text: 'Fetching latest data from Shopify. Refreshing dashboard...',
        icon: 'info',
        timer: 3000,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })

      setTimeout(() => { fetchAll(); setSyncing(false) }, 3000)
    } catch (err) {
      Swal.fire({
        title: 'Sync Failed',
        text: 'Could not connect to Shopify. Please check your connection.',
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
      setSyncing(false)
    }
  }

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true)
      await dashboardAPI.triggerAnalysis(shop)
      
      Swal.fire({
        title: 'Analysis Complete',
        text: 'AI has finished scanning your store for growth opportunities.',
        icon: 'success',
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
      
      await fetchAll()
    } catch (err) {
      Swal.fire({
        title: 'Analysis Failed',
        text: 'The AI engine encountered an error. Please try again later.',
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const metrics    = dashData?.snapshot?.metrics || {}
  const healthScore = dashData?.snapshot?.healthScore ?? dashData?.healthScore ?? 0
  const problems   = dashData?.analysis?.problems || dashData?.snapshot?.problems || []
  const shopName   = shop?.replace('.myshopify.com', '') || 'My Store'
  const aiRevenue  = problems.reduce((t, p) => t + (parseFloat((p.impact || '').replace(/[^0-9.]/g, '')) || 0), 0)

  const isFirstConnect = new URLSearchParams(window.location.search).get('success') === 'true'

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        {isFirstConnect && (
          <p className="text-sm text-slate-500 font-medium">Setting up your store… syncing data</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active="dashboard" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.msg}
        </div>
      )}

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] flex flex-col h-screen overflow-hidden">

        {/* Top header bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden text-slate-400 hover:text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
            {/* Store name + dropdown look */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-slate-200">
              <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center">
                <span className="text-white text-[9px] font-black">S</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{shopName}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg w-52">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search insights..."
                className="bg-transparent outline-none text-sm text-slate-700 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Date range */}
            <button className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </button>
            {/* Notification */}
            <div className="relative">
              <button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                title={`${dashData?.snapshot?.healthBreakdown?.productsWithoutImages || 0} issues detected`}>
                <Bell className="w-5 h-5 text-slate-500" />
                {(dashData?.analysis?.problems?.length > 0) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </button>
              {notificationOpen && dashData?.analysis?.problems && (
                <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-72 max-h-64 overflow-y-auto z-50">
                  <p className="text-xs font-bold text-slate-700 px-2 py-1">Issues ({dashData.analysis.problems.length})</p>
                  {dashData.analysis.problems.slice(0, 5).map((p, i) => (
                    <div key={i} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 rounded">
                      • {p.title || p.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Action buttons */}
            <button onClick={handleAnalyze} disabled={analyzing}
              className="btn-ghost text-xs disabled:opacity-50">
              <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} style={{ color: 'var(--c-primary)' }} />
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            <button onClick={handleSync} disabled={syncing}
              className="btn-primary text-xs disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

            {/* Token expired banner */}
            {dashData?.tokenExpired && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-amber-800">⚠️ Shopify token expired — showing cached data.</p>
                <a href="/onboarding" className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors flex-shrink-0">
                  Reconnect Store
                </a>
              </div>
            )}

            {/* TOP ROW: Health Score | AI Revenue Impact | 3 KPI sparklines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Store Health Score */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900">Store Health Score</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    {healthScore >= 80 ? '+2 pts' : healthScore >= 60 ? '+0 pts' : '-1 pts'}
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <HealthRing score={healthScore} />
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-4">
                      <span className={`text-lg ${problems.length === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {problems.length === 0 ? '✓' : '⚠'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {problems.length === 0 ? 'Store Fully Optimized' : `${problems.length} Issues Detected`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {problems.length === 0
                            ? 'All parameters are peak.'
                            : problems.slice(0, 2).map(p => p.title || p.description).join(', ')}
                        </p>
                      </div>
                    </div>
                    <Link to="/ai-actions"
                      className="flex items-center justify-center gap-2 w-full bg-primary text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-primary/20">
                      <Sparkles className="w-3.5 h-3.5" />
                      Review AI Suggestions
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* AI Revenue Impact */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-primary/5 to-white rounded-2xl border border-primary/20 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.07] pointer-events-none">
                  <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" stroke="#2563eb" strokeWidth="8" />
                    <text x="50" y="62" textAnchor="middle" fill="#2563eb" fontSize="40" fontWeight="900">₹</text>
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">AI Revenue Impact</h3>
                </div>
                <p className="text-xs text-slate-500 mb-5">Total value generated by AI actions this month.</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-primary">
                    ₹{aiRevenue > 0 ? aiRevenue.toFixed(0) : (metrics.totalRevenue ? Math.round(metrics.totalRevenue).toLocaleString() : '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" /> 14x ROI
                  </span>
                  <span className="text-xs text-slate-400">vs. last month</span>
                </div>
              </motion.div>

              {/* 3 KPI sparkline cards stacked */}
              <div className="flex flex-col gap-3">
                {(() => {
                  // Compute real change deltas from health history if available
                  const prev = historyData.length >= 2 ? historyData[historyData.length - 2] : null
                  const cur  = historyData.length >= 1 ? historyData[historyData.length - 1] : null
                  const prevMetrics = prev?.metrics || {}
                  const curMetrics  = cur?.metrics  || metrics

                  const convRate     = (curMetrics.conversionRate  || metrics.conversionRate  || 0) * 100
                  const prevConv     = (prevMetrics.conversionRate || metrics.conversionRate  || 0) * 100
                  const convChange   = convRate - prevConv

                  const aov          = Math.round(curMetrics.avgOrderValue  || metrics.avgOrderValue  || 0)
                  const prevAov      = Math.round(prevMetrics.avgOrderValue || metrics.avgOrderValue  || 0)
                  const aovChange    = aov - prevAov

                  const abandon      = (curMetrics.cartAbandonRate  || metrics.cartAbandonRate  || 0) * 100
                  const prevAbandon  = (prevMetrics.cartAbandonRate || metrics.cartAbandonRate  || 0) * 100
                  const abandonChange = abandon - prevAbandon

                  return [
                    {
                      label: 'CONVERSION RATE',
                      value: `${convRate.toFixed(1)}%`,
                      change: convChange === 0 ? '—' : `${convChange > 0 ? '+' : ''}${convChange.toFixed(1)}%`,
                      up: convChange >= 0, color: convChange >= 0 ? '#22c55e' : '#ef4444',
                    },
                    {
                      label: 'AVG ORDER VALUE',
                      value: `₹${aov.toLocaleString()}`,
                      change: aovChange === 0 ? '—' : `${aovChange > 0 ? '+₹' : '-₹'}${Math.abs(aovChange)}`,
                      up: aovChange >= 0, color: aovChange >= 0 ? '#22c55e' : '#ef4444',
                    },
                    {
                      label: 'ABANDONED CART',
                      value: `${abandon.toFixed(0)}%`,
                      change: abandonChange === 0 ? '—' : `${abandonChange > 0 ? '+' : ''}${abandonChange.toFixed(0)}%`,
                      up: abandonChange <= 0, color: abandonChange <= 0 ? '#22c55e' : '#ef4444',
                    },
                  ]
                })().map((kpi, i) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.06 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-black text-slate-900">{kpi.value}</span>
                        <span className={`text-xs font-semibold ${kpi.up ? 'text-emerald-500' : 'text-red-500'}`}>{kpi.change}</span>
                      </div>
                    </div>
                    <Sparkline color={kpi.color} up={kpi.up} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* BOTTOM ROW: Revenue Overview chart | AI Actions Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Revenue Overview — 2/3 width */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Total vs. AI-Driven Revenue</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-300" />
                      <span className="text-slate-500 text-xs">Total</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/40" />
                      <span className="text-slate-900 text-xs font-medium">AI-Driven</span>
                    </div>
                  </div>
                </div>
                <RevenueChart data={historyData} />
              </motion.div>

              {/* AI Actions Feed — 1/3 width */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900">AI Actions Feed</h3>
                  <Link to="/ai-actions" className="text-xs font-semibold text-primary hover:text-blue-700">View All</Link>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto scrollbar-hide">
                  {aiActions.length > 0 ? (
                    aiActions.map((a, i) => (
                      <div key={a.id || i} className={`relative pl-5 border-l-2 pb-1 ${a.status === 'applied' || a.status === 'completed' ? 'border-primary' : 'border-slate-200'}`}>
                        <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${a.status === 'applied' || a.status === 'completed' ? 'bg-primary' : 'bg-slate-300'}`} />
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">{a.fixType || a.problemId || 'AI Fix'}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{a.status} — {a.fixType || 'auto-fix applied'}</p>
                        {(a.status === 'applied' || a.status === 'completed') && (
                          <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Successfully applied
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    /* Show problems as pending actions if no fixes yet */
                    problems.length > 0 ? problems.slice(0, 4).map((p, i) => (
                      <div key={i} className="relative pl-5 border-l-2 border-slate-200 pb-1">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-amber-400" />
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">Pending</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                        {p.potentialRevenue > 0 && (
                          <p className="text-xs font-semibold text-emerald-600 mt-1">
                            +₹{Math.round(p.potentialRevenue).toLocaleString()} potential
                          </p>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400">No AI actions yet</p>
                        <p className="text-xs text-slate-400 mt-1">Click Analyze to generate</p>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

