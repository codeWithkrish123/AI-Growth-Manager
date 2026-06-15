import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, Zap, AlertCircle, RefreshCw } from 'lucide-react'
import { BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function StoreAccessPage() {
    const navigate = useNavigate()
    const shop = localStorage.getItem('currentShop')
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState(null)

    const handleAuthorize = async () => {
        setIsVerifying(true)
        setError(null)
        try {
            // Initiate authorization check
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
            setError('Could not verify access. Please try again.')
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
        <div className="min-h-screen bg-[#F0F7FF] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[500px] w-full bg-white rounded-[40px] p-10 shadow-[0_20px_50px_-10px_rgba(30,58,138,0.1)] border border-white/50 flex flex-col items-center text-center relative z-10"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center shadow-lg border border-emerald-100 mb-8">
                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                    Store Access Required
                </h1>

                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                    To continue, please authorize <strong className="text-slate-900">{shop}</strong> to grant AI Growth Manager read-only access to your analytics.
                </p>

                <div className="w-full space-y-4 mb-8">
                    {['Read-only store data', 'Analytics access', 'No order modifications'].map((feat) => (
                        <div key={feat} className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            {feat}
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleAuthorize}
                    disabled={isVerifying}
                    className="w-full h-[64px] rounded-[24px] bg-indigo-600 text-white font-black text-lg uppercase tracking-[0.1em] shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                    {isVerifying ? (
                        <><RefreshCw className="w-5 h-5 animate-spin" /> Authorizing...</>
                    ) : (
                        'Authorize Access'
                    )}
                </button>
            </motion.div>
        </div>
    )
}