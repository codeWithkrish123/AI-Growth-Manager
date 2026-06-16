import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag, BarChart3, Zap, TrendingUp, TrendingDown, Loader2, AlertCircle,
  CheckCircle2, RefreshCw, Plus, X, ArrowRight, Sparkles
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI, errMsg } from '../services/api'
import Swal from 'sweetalert2'

const IMPACT_COLOR = { high: 'badge-red', medium: 'badge-amber', low: 'badge-indigo' }
const ACTION_LABEL = { reduce_price: 'Reduce Price', maintain_price: 'Hold Price', increase_price: 'Raise Price' }

export default function PriceOptimizerPage() {
  const navigate = useNavigate()
  const shop     = localStorage.getItem('currentShop')
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggleDark = () => {
    const next = !isDark; setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const [suggestions, setSuggestions] = useState([])
  const [summary,     setSummary]     = useState(null)
  const [status,      setStatus]      = useState('idle')  // idle|loading|done|error
  const [error,       setError]       = useState(null)

  // Single product AI suggestion
  const [aiMode,     setAiMode]     = useState(false)
  const [productId,  setProductId]  = useState('')
  const [competitors,setCompetitors]= useState([''])
  const [aiResult,   setAiResult]   = useState(null)
  const [aiLoading,  setAiLoading]  = useState(false)

  useEffect(() => {
    if (!shop) { navigate('/onboarding'); return }
  }, [])

  const runBulkAnalysis = async () => {
    setStatus('loading'); setError(null)
    try {
      const res  = await dashboardAPI.optimizePrices(shop, {})
      const data = res.data?.data || res.data
      setSuggestions(data.suggestions || [])
      setSummary(data)
      setStatus('done')

      Swal.fire({
        title: 'Analysis Complete',
        text: `Successfully scanned ${data.analyzedProducts || 0} products for pricing opportunities.`,
        icon: 'success',
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      });
    } catch (e) {
      const errorMsg = errMsg(e, 'Analysis failed. Ensure your store is synced.');
      setError(errorMsg)
      setStatus('error')

      Swal.fire({
        title: 'Analysis Failed',
        text: errorMsg,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      });
    }
  }

  const runAISuggestion = async () => {
    if (!productId.trim()) return
    setAiLoading(true); setAiResult(null)
    try {
      const prices = competitors.map(Number).filter(Boolean)
      const res    = await dashboardAPI.optimizePrices(shop, { productId: productId.trim(), competitorPrices: prices })
      const data   = res.data?.data || res.data
      setAiResult(data)

      if (!data.error) {
        Swal.fire({
          title: 'AI Insight Ready',
          text: 'The optimal price has been calculated based on market signals.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: isDark ? '#1e293b' : '#fff',
          color: isDark ? '#fff' : '#1e293b'
        });
      }
    } catch (e) {
      setAiResult({ error: errMsg(e, 'AI suggestion failed') })
      Swal.fire({
        title: 'AI Error',
        text: 'Could not generate a suggestion for this product ID.',
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      });
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar active="price-ai" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark} />

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-7 py-4 border-b backdrop-blur-sm"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
          <div>
            <h1 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
              <Tag className="w-5 h-5 text-purple-400" />
              Price Optimization AI
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
              Analyze competitor pricing · AI-powered optimal price suggestions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAiMode(m => !m)} className="btn-ghost text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {aiMode ? 'Bulk Mode' : 'Single Product AI'}
            </button>
            {!aiMode && (
              <button onClick={runBulkAnalysis} disabled={status === 'loading'} className="btn-primary text-xs">
                {status === 'loading'
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</>
                  : <><Zap className="w-3.5 h-3.5" />Analyze All Products</>
                }
              </button>
            )}
          </div>
        </div>

        <div className="px-7 py-6 space-y-6 max-w-5xl">

          {/* ── How it works ── */}
          {status === 'idle' && !aiMode && (
            <motion.div className="card p-6 border border-purple-100 dark:border-purple-500/20"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="section-title mb-4">How Price Optimization Works</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { n: '1', t: 'Scan Products',         d: 'Review all your products and their current pricing' },
                  { n: '2', t: 'Analyze Performance',   d: 'Compare sales data to detect over/under-priced items' },
                  { n: '3', t: 'AI Recommendations',    d: 'Get GPT-4 powered suggestions with reasoning' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="text-center">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-base font-black text-purple-500">{n}</span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{t}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>{d}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-5">
                <button onClick={runBulkAnalysis} className="btn-primary">
                  <Zap className="w-4 h-4" /> Run Analysis
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Single Product AI Mode ── */}
          <AnimatePresence>
            {aiMode && (
              <motion.div className="card p-5 border border-purple-100 dark:border-purple-500/20"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p className="section-title mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Single Product AI Suggestion
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--c-text-subtle)' }}>
                      Product ID <span className="normal-case font-normal">(from Shopify)</span>
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. 7890123456789"
                      value={productId}
                      onChange={e => setProductId(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>
                        Competitor Prices (₹) – optional
                      </label>
                      <button
                        type="button"
                        onClick={() => setCompetitors(c => [...c, ''])}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {competitors.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <input
                            type="number"
                            className="input-field w-28 text-sm"
                            placeholder={`₹ Price ${i + 1}`}
                            value={p}
                            onChange={e => setCompetitors(c => c.map((v, j) => j === i ? e.target.value : v))}
                          />
                          {competitors.length > 1 && (
                            <button onClick={() => setCompetitors(c => c.filter((_, j) => j !== i))}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={runAISuggestion} disabled={aiLoading || !productId.trim()} className="btn-primary text-xs">
                    {aiLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Getting AI suggestion…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Get AI Price Suggestion</>
                    }
                  </button>

                  {/* AI Result */}
                  <AnimatePresence>
                    {aiResult && (
                      <motion.div
                        className={`rounded-xl p-4 border ${aiResult.error ? 'border-red-200 dark:border-red-500/20' : 'border-emerald-200 dark:border-emerald-500/20'}`}
                        style={{ background: aiResult.error ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)' }}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      >
                        {aiResult.error ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{aiResult.error}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-bold mb-2" style={{ color: 'var(--c-text)' }}>
                              {aiResult.product?.title || 'Product'}
                            </p>
                            <div className="flex items-center gap-6 mb-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Suggested Price</p>
                                <p className="text-2xl font-black text-emerald-500">₹{aiResult.suggestion?.suggested?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--c-text-subtle)' }}>Confidence</p>
                                <span className={`badge ${
                                  aiResult.suggestion?.confidence === 'high'   ? 'badge-green' :
                                  aiResult.suggestion?.confidence === 'medium' ? 'badge-amber' : 'badge-indigo'
                                }`}>{aiResult.suggestion?.confidence}</span>
                              </div>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
                              {aiResult.suggestion?.reason}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading ── */}
          {status === 'loading' && (
            <motion.div className="card p-12 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Tag className="w-8 h-8 text-purple-400 animate-pulse" />
              <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>Analyzing your product pricing…</p>
              <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Scanning sales data and performance signals</p>
            </motion.div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <motion.div className="card p-5 flex items-start gap-3 border border-red-200 dark:border-red-500/20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                <button onClick={runBulkAnalysis} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-semibold">
                  Try again →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Results ── */}
          {status === 'done' && (
            <>
              {/* Summary */}
              <motion.div className="card p-5 border border-emerald-100 dark:border-emerald-500/20"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: 'var(--c-text)' }}>{summary?.summary}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                      Analyzed {summary?.analyzedProducts || 0} of {summary?.totalProducts || 0} products with sales data
                    </p>
                  </div>
                  <button onClick={runBulkAnalysis} className="btn-ghost text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Re-run
                  </button>
                </div>
              </motion.div>

              {suggestions.length === 0 ? (
                <motion.div className="card p-12 flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Tag className="w-10 h-10 mb-1" style={{ color: 'var(--c-text-subtle)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--c-text-muted)' }}>All prices look optimized!</p>
                  <p className="text-xs" style={{ color: 'var(--c-text-subtle)' }}>No immediate opportunities detected</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <p className="section-title">{suggestions.length} Pricing Opportunities</p>
                  {suggestions.map((s, i) => (
                    <motion.div
                      key={s.productId}
                      className="card p-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--c-text)' }}>{s.title}</p>
                            <span className={`badge ${IMPACT_COLOR[s.impact] || 'badge-indigo'}`}>
                              {s.impact} impact
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{s.reason}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Current</p>
                            <p className="text-base font-black" style={{ color: 'var(--c-text)' }}>₹{s.currentPrice?.toLocaleString()}</p>
                          </div>
                          <ArrowRight className="w-4 h-4" style={{ color: 'var(--c-text-subtle)' }} />
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Suggested</p>
                            <p className={`text-base font-black ${
                              s.suggestedPrice > s.currentPrice ? 'text-emerald-500' :
                              s.suggestedPrice < s.currentPrice ? 'text-red-500' : 'text-indigo-500'
                            }`}>₹{s.suggestedPrice?.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`badge ${
                              s.action === 'reduce_price'   ? 'badge-red' :
                              s.action === 'increase_price' ? 'badge-green' : 'badge-indigo'
                            }`}>
                              {ACTION_LABEL[s.action] || s.action}
                            </span>
                          </div>
                        </div>
                      </div>
                      {s.potentialRevenue > 0 && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--c-border)' }}>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            Estimated +₹{s.potentialRevenue?.toLocaleString()} potential revenue
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

