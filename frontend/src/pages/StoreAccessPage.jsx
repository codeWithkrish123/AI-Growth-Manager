import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ShieldCheck, Zap, RefreshCw, X } from 'lucide-react'
import { BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function StoreAccessPage() {
    const shop = localStorage.getItem('currentShop')
    const [isVerifying, setIsVerifying] = useState(false)

    const handleAuthorize = async () => {
        setIsVerifying(true)
        try {
            const response = await fetch(`${BACKEND_URL}/auth/shopify/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop })
            })
            
            const data = await response.json()
            
            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl
            } else {
                throw new Error('Failed to initiate authorization')
            }
        } catch (e) {
            Swal.fire({
                title: 'Access Error',
                text: 'Failed to connect to store for access authorization.',
                icon: 'error',
                confirmButtonColor: '#6366f1'
            })
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-blue-50/50 to-transparent" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[500px] w-full bg-white rounded-[40px] p-10 shadow-[0_20px_50px_-10px_rgba(30,58,138,0.15)] border border-white/50 flex flex-col items-center text-center relative z-10"
            >
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-100 mb-6">
                    <ShieldCheck className="w-8 h-8 text-indigo-600" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Review Permissions</h1>
                <p className="text-slate-500 text-sm font-medium mb-8">AI Growth Manager requires access to optimize your store.</p>
                
                <div className="w-full bg-slate-50 rounded-xl p-3 mb-8 flex items-center justify-center gap-2 border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-600 font-mono">{shop}</span>
                </div>

                <div className="w-full space-y-3 mb-8 text-left">
                    {[
                        { title: 'Products', desc: 'Read titles, descriptions, images, tags' },
                        { title: 'Orders', desc: 'Read order history and revenue' },
                        { title: 'Analytics', desc: 'Read traffic, sessions, conversion' },
                        { title: 'Metafields', desc: 'Read/write for AI-generated improvements' }
                    ].map((item) => (
                        <div key={item.title} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <p className="text-sm font-black text-slate-900 mb-0.5">{item.title}</p>
                            <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="w-full flex gap-3">
                    <button onClick={() => window.history.back()} className="flex-1 h-[64px] rounded-[24px] bg-slate-100 text-slate-600 font-black text-lg hover:bg-slate-200 transition-all">
                        Decline
                    </button>
                    <button
                        onClick={handleAuthorize}
                        disabled={isVerifying}
                        className="flex-[2] h-[64px] rounded-[24px] bg-indigo-600 text-white font-black text-lg uppercase tracking-[0.1em] shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                        {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Allow Access'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}