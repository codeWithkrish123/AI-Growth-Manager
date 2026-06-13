import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ArrowUpRight, Sparkles, Menu, RefreshCw, BarChart3, Target, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI } from '../services/api'

export default function RevenueImpactPage() {
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [isDark,        setIsDark]        = useState(() => document.documentElement.classList.contains('dark'))
  const [loading,       setLoading]       = useState(true)
  const [dashData,      setDashData]      = useState(null)
  const [healthHistory, setHealthHistory] = useState([])
  const [fixes,         setFixes]         = useState([])
  const shop = localStorage.getItem('currentShop') || ''

  const toggleDark = () => {
    const next = !isDark; setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  useEffect(() => { if (shop) fetchAll() }, [shop])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [dashRes, histRes, fixRes] = await Promise.allSettled([
        dashboardAPI.getDashboardData(shop),
        dashboardAPI.getHealthHistory(shop),
        dashboardAPI.getFixes(shop),
      ])
      if (dashRes.status === 'fulfilled') setDashData(dashRes.value.data)
      if (histRes.status === 'fulfilled') {
        const d = histRes.value.data?.data || histRes.value.data || []
        setHealthHistory(Array.isArray(d) ? d : [])
      }
      if (fixRes.status === 'fulfilled') {
        const d = fixRes.value.data?.data || fixRes.value.data || []
        setFixes(Array.isArray(d) ? d : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const data     = dashData?.data || dashData
  const metrics  = data?.snapshot?.metrics || {}
  const problems = data?.analysis?.problems || data?.snapshot?.problems || []

  // Compute estimated impact from problems
  const estimatedImpact = problems.reduce((t, p) => {
    const n = parseFloat((p.impact || '').replace(/[^0-9.]/g, ''))
    return t + (isNaN(n) ? 0 : n)
  }, 0)

  const appliedFixes   = fixes.filter(f => f.status === 'applied' || f.status === 'completed')
  const pendingFixes   = problems.filter(p => !fixes.find(f => f.problemId === p.id && (f.status === 'applied' || f.status === 'completed')))

  const kpis = [
    { label: 'Est. Revenue Opportunity', value: `₹${estimatedImpact > 0 ? estimatedImpact.toFixed(0) : '—'}`, icon: Sparkles, color: 'text-primary', bg: 'bg-blue-50', sub: 'Estimated from pending AI actions' },
    { label: 'Avg Order Value',          value: `₹${Math.round(metrics.avgOrderValue || 0)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Last 90 days' },
    { label: 'Conversion Rate',          value: `${((metrics.conversionRate || 0) * 100).toFixed(2)}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Industry avg: 2.5%' },
    { label: 'AI Fixes Applied',         value: appliedFixes.length, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'This month' },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <Sidebar active="revenue" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] p-6 md:p-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500"><Menu className="w-6 h-6" /></button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Revenue Impact</h2>
              <p className="text-slate-500 text-sm mt-0.5">AI-driven financial growth breakdown</p>
            </div>
          </div>
          <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Disclaimer banner */}
        <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-blue-700">Revenue figures are <strong>AI-estimated potential</strong> based on identified issues — not actual revenue realized.</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className={`${k.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Health Score trend chart */}
          <motion.div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="font-bold text-slate-900 mb-1">Health Score Trend</h3>
            <p className="text-xs text-slate-400 mb-5">Store performance over time</p>
            <div className="h-48 w-full relative">
              {healthHistory.length > 1 ? (() => {
                const scores = healthHistory.map(d => d.healthScore || d.score || 0)
                const max = Math.max(...scores, 1), H = 160, W = 100
                const pts = scores.map((v, i) => `${(i / (scores.length - 1)) * W},${H - (v / max) * (H * 0.9) - H * 0.05}`).join(' ')
                return (
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 100 ${H}`}>
                    <defs>
                      <linearGradient id="hGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="#1a73e8" strokeWidth="0.8" points={pts} strokeLinecap="round" strokeLinejoin="round" />
                    <polygon fill="url(#hGrad)" points={`0,${H} ${pts} 100,${H}`} />
                  </svg>
                )
              })() : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Sync your store to see trend data</p>
                  </div>
                </div>
              )}
            </div>
            {healthHistory.length > 0 && (
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                {healthHistory.filter((_, i, a) => [0, Math.floor(a.length/2), a.length-1].includes(i))
                  .map((d, i) => <span key={i}>{d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>)}
              </div>
            )}
          </motion.div>

          {/* Applied Fixes summary */}
          <motion.div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="font-bold text-slate-900 mb-1">Applied Fixes</h3>
            <p className="text-xs text-slate-400 mb-4">{appliedFixes.length} AI actions completed</p>
            {appliedFixes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No fixes applied yet</p>
                <p className="text-xs text-slate-400 mt-1">Go to AI Actions to apply fixes</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-48" style={{ scrollbarWidth: 'none' }}>
                {appliedFixes.slice(0, 6).map((f, i) => (
                  <div key={f.id || i} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-slate-700 truncate">{f.fixType || f.problemId || 'AI Fix'}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Opportunities Breakdown Table */}
        <motion.div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">AI Opportunity Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">Estimated revenue from each identified issue</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-600 rounded-full">Estimates Only</span>
          </div>
          {problems.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">No pending opportunities</p>
              <p className="text-sm text-slate-400 mt-1">Run Analyze on your dashboard to detect issues.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Issue</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Severity</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Impact</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {problems.map((p, i) => {
                    const impactVal = parseFloat((p.impact || '').replace(/[^0-9.]/g, ''))
                    const isFixed = fixes.find(f => f.problemId === p.id && (f.status === 'applied' || f.status === 'completed'))
                    return (
                      <tr key={p.id || i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{p.title || p.description}</p>
                          {p.description && p.title && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            p.severity === 'critical' ? 'bg-red-50 text-red-600' :
                            p.severity === 'warning'  ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'}`}>
                            {p.severity || 'info'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!isNaN(impactVal) && impactVal > 0
                            ? <span className="text-sm font-bold text-primary">₹{impactVal.toFixed(0)} <span className="text-xs font-normal text-slate-400">est.</span></span>
                            : <span className="text-sm text-slate-400">{p.impact || '—'}</span>}
                        </td>
                        <td className="px-6 py-4">
                          {isFixed
                            ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Fixed</span>
                            : <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><AlertTriangle className="w-3.5 h-3.5" /> Pending</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-6 py-3 text-xs font-black text-slate-600" colSpan={2}>Total Estimated Opportunity</td>
                    <td className="px-6 py-3 text-sm font-black text-primary">
                      {estimatedImpact > 0 ? `₹${estimatedImpact.toFixed(0)}` : '—'} <span className="text-xs font-normal text-slate-400">est.</span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">{pendingFixes.length} pending</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </motion.div>

        {/* Strategic insight banner */}
        <motion.div className="bg-slate-900 rounded-2xl p-8 text-white flex items-center justify-between overflow-hidden relative"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="max-w-xl relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Insight</span>
            </div>
            <h3 className="text-xl font-bold mb-2">
              {problems.length > 0 ? `${problems.length} issue${problems.length > 1 ? 's' : ''} detected` : 'Store fully optimized'}
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              {problems.length > 0
                ? `Resolving these issues could unlock up to ₹${estimatedImpact > 0 ? estimatedImpact.toFixed(0) : '—'} in estimated revenue. Go to AI Actions to apply fixes.`
                : 'No pending AI actions. Keep syncing to stay ahead of issues.'}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        </motion.div>
      </main>
    </div>
  )
}
