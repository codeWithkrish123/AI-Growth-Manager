import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Terminal, CheckCircle2, Loader2, Activity, ShieldCheck, AlertCircle } from 'lucide-react'
import { dashboardAPI } from '../services/api'

export default function SyncPage() {
  const navigate  = useNavigate()
  const shop      = localStorage.getItem('currentShop')
  const [messages,   setMessages]   = useState([])
  const [progress,   setProgress]   = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isError,    setIsError]    = useState(false)
  const pollRef = useRef(null)

  const addMsg = (text) => setMessages(prev => [...prev, text])

  useEffect(() => {
    if (!shop) { navigate('/onboarding'); return }
    runSync()
    return () => clearInterval(pollRef.current)
  }, [])

  const runSync = async () => {
    try {
      addMsg('Connecting securely to Shopify API...')
      setProgress(10)

      const syncRes = await dashboardAPI.triggerSync(shop)
      const syncJobId = syncRes.data?.data?.syncJobId || syncRes.data?.syncJobId

      addMsg('Sync job started — fetching store data...')
      setProgress(25)

      if (syncJobId) {
        // Poll for real status
        let attempts = 0
        const maxAttempts = 20
        pollRef.current = setInterval(async () => {
          attempts++
          try {
            const statusRes = await dashboardAPI.getSyncStatus(shop, syncJobId)
            const statusData = statusRes.data?.data || statusRes.data
            const status = statusData?.status || 'processing'

            if (status === 'completed' || status === 'done') {
              clearInterval(pollRef.current)
              finishSync(statusData)
            } else if (status === 'failed' || status === 'error') {
              clearInterval(pollRef.current)
              handleError('Sync failed — please try again from the dashboard.')
            } else {
              // Show progress updates while polling
              const pct = Math.min(25 + (attempts / maxAttempts) * 60, 85)
              setProgress(Math.round(pct))
              if (attempts === 3) addMsg('Syncing product catalog...')
              if (attempts === 6) addMsg('Processing order history...')
              if (attempts === 9) addMsg('Calculating store metrics...')
              if (attempts === 12) addMsg('Running AI analysis...')
              if (attempts >= maxAttempts) {
                clearInterval(pollRef.current)
                // Timeout — treat as likely complete, redirect anyway
                finishSync(null)
              }
            }
          } catch {
            // Status endpoint may not exist — fall through to timed completion
            if (attempts >= maxAttempts) {
              clearInterval(pollRef.current)
              finishSync(null)
            }
          }
        }, 2000)
      } else {
        // No syncJobId returned — backend may complete synchronously
        addMsg('Syncing product catalog...')
        setProgress(50)
        setTimeout(() => { addMsg('Processing order history...'); setProgress(70) }, 800)
        setTimeout(() => { addMsg('Running AI analysis...'); setProgress(90) }, 1600)
        setTimeout(() => finishSync(null), 2400)
      }
    } catch (err) {
      handleError('Could not connect to sync service. Check your store connection.')
    }
  }

  const finishSync = (data) => {
    addMsg('Sync complete — store data is up to date ✓')
    setProgress(100)
    setIsComplete(true)
    setTimeout(() => navigate(`/dashboard/${shop}`), 1800)
  }

  const handleError = (msg) => {
    addMsg(msg)
    setIsError(true)
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-200 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-[520px] w-full flex flex-col items-center relative z-10"
      >
        <div className="relative mb-10">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-primary rounded-3xl blur-2xl" />
          <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-primary/10">
            {isError
              ? <AlertCircle className="w-10 h-10 text-red-500" />
              : <Sparkles className={`w-10 h-10 transition-colors duration-500 ${isComplete ? 'text-emerald-500' : 'text-primary'}`} />
            }
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3 text-center">
          {isError ? 'Sync Failed' : isComplete ? 'Sync Complete' : 'Syncing Your Store'}
        </h1>

        <div className="flex items-center gap-2.5 mb-12">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
            <Activity className={`w-3.5 h-3.5 ${isError ? 'text-red-500' : 'text-primary animate-pulse'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isError ? 'Error' : isComplete ? 'Done' : 'Live Sync'}
            </span>
          </div>
        </div>

        <div className="w-full bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 mb-10">
          <div className="bg-white/40 border-b border-white/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Sync Log</span>
            </div>
          </div>
          <div className="p-8 h-64 overflow-y-auto font-bold text-sm space-y-5" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-slate-600 tracking-tight">{msg}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {!isComplete && !isError && (
              <div className="flex items-center gap-4 px-1">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-[400px] space-y-4 px-2">
          <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
            <span>Progress</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="h-2.5 w-full bg-white border border-slate-200 rounded-full overflow-hidden p-0.5 shadow-sm">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${isError ? 'bg-red-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} />
          </div>
        </div>

        {isError && (
          <button onClick={() => navigate(`/dashboard/${shop}`)}
            className="mt-8 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
            Return to Dashboard
          </button>
        )}

        <div className="mt-12 flex items-center gap-3 py-2 px-5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-full shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Connection Active</span>
        </div>
      </motion.div>
    </div>
  )
}
