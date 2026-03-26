import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Terminal, CheckCircle2, Loader2, Activity, ShieldCheck } from 'lucide-react'

const analysisMessages = [
    "Connecting securely to Shopify API...",
    "Syncing product catalog (128 items detected)",
    "Processing historical order data...",
    "Calculating predictive LTV metrics...",
    "Scanning for conversion bottlenecks...",
    "Analyzing growth acceleration points...",
    "Finalizing AI optimization strategy..."
]

export default function SyncPage() {
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        let currentIdx = 0
        const interval = setInterval(() => {
            if (currentIdx < analysisMessages.length) {
                setMessages(prev => [...prev, analysisMessages[currentIdx]])
                setProgress(((currentIdx + 1) / analysisMessages.length) * 100)
                currentIdx++
            } else {
                clearInterval(interval)
                setIsComplete(true)
                setTimeout(() => navigate('/dashboard?optimized=true'), 1500)
            }
        }, 900)

        return () => clearInterval(interval)
    }, [navigate])

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-200 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-[520px] w-full flex flex-col items-center relative z-10"
            >
                {/* 1. AI Visualizer (Sparkles Icon) */}
                <div className="relative mb-10">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-primary rounded-3xl blur-2xl"
                    />
                    <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-primary/10">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-2 border-t-2 border-primary/20 rounded-full"
                        />
                        <Sparkles className={`w-10 h-10 ${isComplete ? 'text-emerald-500' : 'text-primary'} transition-colors duration-500`} />
                    </div>
                </div>

                {/* 2. Heading */}
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3 text-center">
                    {isComplete ? "Sync Finalized" : "AI Sync in Progress"}
                </h1>

                {/* 3. Status Indicator */}
                <div className="flex items-center gap-2.5 mb-12">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                        <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                            {isComplete ? "Neural Links Verified" : "Analyzing Channel Metrics"}
                        </span>
                    </div>
                </div>

                {/* 4. Terminal Log (Glassmorphism) */}
                <div className="w-full bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 mb-10">
                    <div className="bg-white/40 border-b border-white/20 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Terminal className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Growth Engine Log</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                        </div>
                    </div>
                    <div className="p-8 h-80 overflow-y-auto font-bold text-sm space-y-5 custom-scrollbar bg-white/20">
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-600 tracking-tight leading-snug">
                                        {msg}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {!isComplete && (
                            <div className="flex items-center gap-4 px-1">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                <motion.div
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-1.5 h-4 bg-primary/20 rounded-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Progress Indicator */}
                <div className="w-full max-w-[400px] space-y-4 px-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Analysis Completion</span>
                        <span className="text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-white border border-slate-200 rounded-full overflow-hidden p-0.5 shadow-sm">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                        />
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="mt-12 flex items-center gap-3 py-2 px-5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-full shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Data Tunnel Active</span>
                </div>
            </motion.div>

            {/* Subtle decorative glows */}
            <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-indigo-400/5 rounded-full blur-[120px] pointer-events-none" />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(15, 23, 42, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
