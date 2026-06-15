import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, RefreshCw } from 'lucide-react'

export default function StoreConnectedPage() {
    const navigate = useNavigate()
    const shop = localStorage.getItem('currentShop')
    const [progress, setProgress] = useState(0)
    const [storeHandle, setStoreHandle] = useState(shop || '')

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => (prev < 100 ? prev + 1 : 100))
        }, 50)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-blue-50/50 to-transparent" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-[500px] w-full bg-white rounded-[40px] p-12 shadow-[0_20px_50px_-10px_rgba(30,58,138,0.15)] border border-white/50 flex flex-col items-center text-center relative z-10"
            >
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Your store is connected!</h1>

                {/* Store Input */}
                <div className="w-full mb-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block text-left ml-1">Store URL</label>
                    <div className="relative border-2 border-slate-200 rounded-2xl p-1 focus-within:border-indigo-600">
                        <input type="text" value={storeHandle} onChange={(e) => setStoreHandle(e.target.value)} placeholder="your-store" className="w-full px-5 py-4 bg-transparent outline-none font-bold text-slate-900" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">.myshopify.com</span>
                    </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
                    <motion.div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
...
                <div className="w-full space-y-3 mb-10 text-left">
                    {['Fetching Products', 'Analyzing SEO', 'Generating AI Report'].map((task, i) => (
                        <div key={task} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700">{task}</span>
                            {progress >= (i + 1) * 33 ? <CheckCircle2 className="text-emerald-500 w-5 h-5"/> : <RefreshCw className="text-slate-300 w-4 h-4 animate-spin"/>}
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => navigate(`/dashboard/${shop}`)}
                    disabled={progress < 100}
                    className="w-full h-[64px] rounded-[24px] bg-indigo-600 text-white font-black text-lg uppercase tracking-[0.1em] shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Go to Dashboard →
                </button>
            </motion.div>
        </div>
    )
}