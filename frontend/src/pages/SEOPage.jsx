import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, BarChart3, Globe, Target, TrendingUp, Plus, RefreshCw, Zap, Sparkles,
  Shield, CheckCircle2, AlertTriangle, Loader2, X, Activity, Menu,
  Type, Image as ImageIcon, Link as LinkIcon, Smartphone, Gauge, Layout,
  Trash2, ExternalLink, ArrowUpRight
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI } from '../services/api'
import Swal from 'sweetalert2'

export default function SEOPage() {
  const navigate = useNavigate()
  const shop     = localStorage.getItem('currentShop') || ''
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleDark = () => {
    const next = !isDark; setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const [loading,       setLoading]       = useState(true)
  const [audit,         setAudit]         = useState(null)
  const [issues,        setIssues]        = useState([])
  const [keywords,      setKeywords]      = useState([])
  const [optimizations, setOptimizations] = useState([])
  const [auditing,      setAuditing]      = useState(false)
  const [fixing,        setFixing]        = useState(null)
  const [toast,         setToast]         = useState(null)

  useEffect(() => {
    if (!shop) { navigate('/signin'); return }
    fetchAllData()
  }, [shop])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [auditRes, issuesRes, kwRes, optRes] = await Promise.allSettled([
        dashboardAPI.getLatestSeoAudit(shop),
        dashboardAPI.getSeoIssues(shop),
        dashboardAPI.getSeoKeywords(shop),
        dashboardAPI.getMetaTags(shop),
      ])

      if (auditRes.status === 'fulfilled') {
        setAudit(auditRes.value.data?.data || auditRes.value.data || null)
      }
      if (issuesRes.status === 'fulfilled') {
        const data = issuesRes.value.data?.data || issuesRes.value.data || []
        setIssues(Array.isArray(data) ? data : [])
      }
      if (kwRes.status === 'fulfilled') {
        const data = kwRes.value.data?.data || kwRes.value.data || []
        setKeywords(Array.isArray(data) ? data : [])
      }
      if (optRes.status === 'fulfilled') {
        const data = optRes.value.data?.data || optRes.value.data || []
        setOptimizations(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAudit = async () => {
    try {
      setAuditing(true)
      await dashboardAPI.runSeoAudit(shop)
      
      Swal.fire({
        title: 'SEO Audit Complete',
        text: 'Your store has been scanned for search engine optimization opportunities.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })

      fetchAllData()
    } catch (e) {
      Swal.fire({
        title: 'Audit Failed',
        text: 'The SEO engine encountered an error: ' + e.message,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally {
      setAuditing(false)
    }
  }

  const handleFixIssue = async (id) => {
    try {
      setFixing(id)
      await dashboardAPI.fixSeoIssue(shop, id)
      
      Swal.fire({
        title: 'SEO Fix Applied',
        text: 'The selected issue has been resolved automatically.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })

      fetchAllData()
    } catch (e) {
      Swal.fire({
        title: 'Fix Failed',
        text: 'Could not apply the automatic fix at this time.',
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally {
      setFixing(null)
    }
  }

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-500/10'
      case 'warning':  return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
      default:         return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
    }
  }

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'meta':    return Type
      case 'image':   return ImageIcon
      case 'speed':   return Gauge
      case 'mobile':  return Smartphone
      case 'content': return Layout
      default:        return Globe
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar active="seo" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

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
                <Search className="w-5 h-5 text-emerald-400" />
                SEO Manager
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                AI SEO Audit - Rank tracking and product optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRunAudit} disabled={auditing} className="btn-primary text-xs">
              {auditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              {auditing ? 'Auditing...' : 'Run SEO Audit'}
            </button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">

          {/* Audit Score Hero */}
          {audit ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 bg-white dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-white/5" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * audit.overall_score) / 100} className="text-emerald-500" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-2xl font-black" style={{ color: 'var(--c-text)' }}>{audit.overall_score}</span>
                </div>
                <p className="text-sm font-black" style={{ color: 'var(--c-text)' }}>Overall SEO Score</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Last Audit: {new Date(audit.created_at).toLocaleDateString()}</p>
              </div>

              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Page Speed', score: audit.page_speed_score, icon: Gauge, color: 'text-blue-500' },
                  { label: 'Meta Tags', score: audit.meta_score, icon: Type, color: 'text-purple-500' },
                  { label: 'Content', score: audit.content_score, icon: Layout, color: 'text-amber-500' },
                  { label: 'Mobile', score: audit.mobile_score, icon: Smartphone, color: 'text-indigo-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-lg font-black" style={{ color: 'var(--c-text)' }}>{stat.score}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div className={`h-full rounded-full ${stat.score > 80 ? 'bg-emerald-500' : stat.score > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${stat.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-12 border border-dashed border-slate-200 dark:border-white/10 text-center">
              <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-black" style={{ color: 'var(--c-text)' }}>No SEO Audit Found</h3>
                AI SEO Audit - Rank tracking and product optimization
              <button onClick={handleRunAudit} disabled={auditing} className="btn-primary">
                {auditing ? 'Running...' : 'Run Audit Now'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Issues */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Technical Issues ({issues.filter(i => i.status === 'open').length})
                </p>
                <button className="text-[10px] font-black uppercase text-indigo-500 hover:underline">Fix All Auto</button>
              </div>

              <div className="space-y-3">
                {issues.length === 0 ? (
                  <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">No issues detected!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500/70 mt-1">Your store SEO is in great shape.</p>
                  </div>
                ) : (
                  issues.map((issue, i) => {
                    const Icon = getCategoryIcon(issue.category)
                    return (
                      <motion.div key={issue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5 flex items-start gap-4"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getSeverityColor(issue.severity)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--c-text)' }}>{issue.title}</p>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${issue.status === 'fixed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{issue.status}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{issue.description}</p>
                        </div>
                        {issue.status === 'open' && (
                          <button onClick={() => handleFixIssue(issue.id)} disabled={fixing === issue.id} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors flex-shrink-0">
                            {fixing === issue.id ? 'Fixing...' : 'Apply Fix'}
                          </button>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right: Keywords */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                  <Target className="w-4 h-4 text-emerald-400" /> Keyword Rankings
                </p>
                <button className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                {keywords.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs font-bold text-slate-400">No keywords tracked</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {keywords.map(kw => (
                      <div key={kw.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--c-text)' }}>{kw.keyword}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{kw.search_volume?.toLocaleString()} vol/mo</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black" style={{ color: 'var(--c-text)' }}>#{kw.current_rank || 'â€”'}</span>
                          {kw.current_rank < kw.previous_rank ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                          ) : kw.current_rank > kw.previous_rank ? (
                            <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Page Speed Mini Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-200" />
                    <span className="text-xs font-black uppercase tracking-widest">Page Speed</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-indigo-200" />
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <p className="text-3xl font-black">{audit?.page_speed_score || '--'}</p>
                  <p className="text-[10px] font-bold text-indigo-200 mb-1.5">/100</p>
                </div>
                <p className="text-[11px] text-indigo-100 font-medium">Your mobile performance is {audit?.page_speed_score > 80 ? 'Excellent' : 'Needs Work'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}











