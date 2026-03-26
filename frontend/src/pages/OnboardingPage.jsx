import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, Lock, ArrowRight, Zap, Globe, Sparkles } from 'lucide-react'

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [storeUrl, setStoreUrl] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    const handleConnect = async (e) => {
        e.preventDefault()
        if (!storeUrl) return
        setIsConnecting(true)
        
        // Format store URL
        let formattedStore = storeUrl
            .replace(/^(https?:\/\/)?/, '') // 1. Strip http:// or https://
            .replace(/\/$/, '')             // 2. Strip trailing slash /
            .toLowerCase();                 // 3. Normalize to lowercase
        
        // Add .myshopify.com if not present
        if (!formattedStore.includes('.myshopify.com')) {
            formattedStore = formattedStore + '.myshopify.com';
        }
        try {
            // Call your backend to get OAuth URL
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/oauth-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop: formattedStore })
            })
            
            const data = await response.json()
            
            // Redirect to Shopify OAuth
         window.location.href = data.oauthUrl

        } catch (error) {
            console.error('Connection failed:', error)
            setIsConnecting(false)
            alert('failed to connect store.please try again.')
            // Show error message
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-200 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Content Wrapper */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-[480px] w-full flex flex-col items-center text-center relative z-10"
            >
                {/* 1. AI Icon */}
                <div className="relative mb-8">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-primary rounded-2xl blur-xl"
                    />
                    <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-primary/10">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                </div>

                {/* 2. Heading */}
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                    Connect Your Store
                </h1>

                {/* 3. Subtext */}
                <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12 max-w-sm">
                    Your AI Growth Engine will analyze your revenue, customers, and performance in real-time.
                </p>

                {/* 4. Shopify Store URL Input */}
                <form onSubmit={handleConnect} className="w-full space-y-8 flex flex-col items-center">
                    <div className="w-full space-y-2 text-left">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors ${isFocused ? 'text-primary' : 'text-slate-400'}`}>
                            Shopify Store URL
                        </label>
                        <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'ring-4 ring-primary/10 border-primary bg-white' : 'border-slate-200 bg-white/80 hover:bg-white'} border rounded-2xl overflow-hidden shadow-sm`}>
                            <div className="pl-5 pr-2">
                                <ShoppingBag className={`w-5 h-5 transition-colors ${isFocused ? 'text-primary' : 'text-slate-400'}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="your-store-handle"
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                className="flex-1 py-5 bg-transparent border-none outline-none text-slate-900 font-bold text-base placeholder:text-slate-300"
                            />
                            <div className="pr-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest pointer-events-none hidden sm:block">
                                .myshopify.com
                            </div>
                        </div>
                    </div>

                    {/* 5. Activate AI Analysis Button */}
                    <motion.button
                        type="submit"
                        disabled={!storeUrl || isConnecting}
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(37,99,235,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full max-w-[400px] h-[64px] rounded-2xl bg-gradient-to-r from-primary to-blue-700 text-white font-black text-base uppercase tracking-widest shadow-xl shadow-primary/20 hover:from-primary-dark hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group shadow-primary/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full duration-700 transition-transform -translate-x-full" />
                        {isConnecting ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Activate AI Analysis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* 6. Divider line */}
                <div className="w-full max-w-[400px] h-px bg-slate-200 my-10" />

                {/* 7. Security badges */}
                <div className="space-y-6 w-full max-w-[400px]">
                    <div className="flex items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OAuth Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AES-256 Link</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 justify-center py-3 px-6 rounded-2xl bg-white/50 border border-slate-100 backdrop-blur-sm shadow-sm">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Read-only analytics access only</span>
                    </div>
                </div>

                {/* 8. Cancel & Return link */}
                <div className="mt-12">
                    <Link to="/signin" className="text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-primary pb-1">
                        Cancel & Return
                    </Link>
                </div>
            </motion.div>

            {/* Subtle decorative glows in background */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />
        </div>
    )
}
