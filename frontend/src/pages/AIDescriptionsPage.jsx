import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Eye, Zap, CheckCircle2, AlertCircle, Loader2, Package, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI, errMsg } from '../services/api'

export default function AIDescriptionsPage() {
  const navigate = useNavigate()
  const shop     = localStorage.getItem('currentShop')
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const [previews,  setPreviews]  = useState([])
  const [status,    setStatus]    = useState('idle')
  const [result,    setResult]    = useState(null)
  const [expanded,  setExpanded]  = useState(null)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    if (!shop) { navigate('/onboarding'); return }
    loadPreview()
  }, [])

  const loadPreview = async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await dashboardAPI.previewDescriptions(shop)
      const data = res.data?.data || res.data
      setPreviews(data?.previews || [])
      setStatus(data?.previews?.length === 0 ? 'done' : 'preview')
      if (data?.previews?.length === 0) setResult({ applied: 0, message: data.message || 'All products already have descriptions' })
    } catch (e) {
      setError(errMsg(e, 'Could not load preview. Check your store connection.'))
      setStatus('error')
    }
  }

  const applyAll = async () => {
    setStatus('applying')
    setError(null)
    try {
      const res = await dashboardAPI.generateDescriptions(shop, { preview: false })
      const data = res.data?.data || res.data
      setResult(data)
      setPreviews([])
      setStatus('done')
    } catch (e) {
      setError(errMsg(e, 'Generation failed. Ensure OPENAI_API_KEY is configured.'))
      setStatus('error')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar active="ai-desc" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark} />

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-7 py-4 border-b backdrop-blur-sm"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
          <div>
            <h1 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Product Descriptions
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
              GPT-4 powered • SEO-optimized • one-click apply to Shopify
            </p>
          </div>
          {status === 'preview' && (
            <div className="flex items-center gap-2">
              <button onClick={loadPreview} className="btn-ghost text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button onClick={applyAll} className="btn-primary text-xs">
                <Zap className="w-3.5 h-3.5" /> Apply All to Shopify
              </button>
            </div>
          )}
        </div>

        <div className="px-7 py-6 space-y-5 max-w-4xl">

          {/* Status banner */}
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="card p-8 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm font-semibold" style={{ color: 'var(--c-text-muted)' }}>
                  Loading product previews...
                </p>
              </motion.div>
            )}

            {status === 'applying' && (
              <motion.div key="applying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="card p-8 flex flex-col items-center gap-3">
                <div className="relative">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>
                  GPT-4 is writing your descriptions...
                </p>
                <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>This may take 15-30 seconds</p>
                <div className="flex gap-1 mt-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                      style={{ animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </motion.div>
            )}

            {status === 'done' && result && (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card p-6 flex items-center gap-4 border border-emerald-200 dark:border-emerald-500/20">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
                    {result.applied ? `${result.applied} descriptions applied!` : 'Already complete'}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                    {result.message || `${result.applied} products updated in your Shopify store`}
                  </p>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card p-5 flex items-start gap-3 border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                  <button onClick={loadPreview} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-semibold">
                    Try again →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* How it works */}
          {(status === 'idle' || status === 'error') && (
            <div className="card p-6 border border-indigo-100 dark:border-indigo-500/20">
              <p className="section-title mb-4">How it works</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { n: '1', t: 'Scan Products', d: 'We find products without descriptions or with weak copy' },
                  { n: '2', t: 'GPT-4 Writes',  d: 'AI generates SEO-optimized descriptions tailored to your store' },
                  { n: '3', t: 'Auto Apply',     d: 'Descriptions are pushed directly to your Shopify products' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="text-center">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-base font-black text-indigo-500">{n}</span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{t}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview cards */}
          {status === 'preview' && previews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="section-title">
                  Preview — {previews.length} products to update
                </p>
                <span className="badge badge-amber">Preview only • not applied yet</span>
              </div>

              {previews.map((p, i) => (
                <motion.div
                  key={p.id}
                  className="card"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="w-full flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--c-text)' }}>{p.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>Click to preview generated description</p>
                      </div>
                    </div>
                    {expanded === p.id
                      ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--c-text-subtle)' }} />
                      : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--c-text-subtle)' }} />
                    }
                  </button>

                  <AnimatePresence>
                    {expanded === p.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0">
                          <div className="rounded-xl p-4" style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-subtle)' }}>
                              AI Generated Description
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text)' }}
                              dangerouslySetInnerHTML={{ __html: p.generatedDescription || '' }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              <button onClick={applyAll} className="btn-primary w-full justify-center text-sm py-3">
                <Zap className="w-4 h-4" />
                Apply {previews.length} Descriptions to Shopify
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

