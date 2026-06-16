import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function SignInPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [shopDomain, setShopDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [shopifyLoading, setShopifyLoading] = useState(false)
    const [authMethod, setAuthMethod] = useState('google')

    useEffect(() => {
        document.title = 'Sign In – AI Growth Manager'
    }, [])

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        try {
            const response = await fetch(`${BACKEND_URL}/api/google/auth/google`)
            const data = await response.json()
            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl
            } else {
                Swal.fire({ title: 'Error', text: 'Failed to get auth URL', icon: 'error' })
            }
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'Connection failed', icon: 'error' })
        } finally {
            setGoogleLoading(false)
        }
    }

    const handleShopifySignIn = async () => {
        if (!shopDomain) {
            Swal.fire({ text: 'Please enter your Shopify store domain', icon: 'warning' })
            return
        }

        setShopifyLoading(true)
        try {
            const normalizedShop = shopDomain.includes('.myshopify.com') ? shopDomain : `${shopDomain}.myshopify.com`
            const response = await fetch(`${BACKEND_URL}/api/auth/shopify/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop: normalizedShop }),
            })
            const data = await response.json()
            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl
            } else {
                Swal.fire({ title: 'Error', text: data.error || 'Failed to connect', icon: 'error' })
            }
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'Connection failed', icon: 'error' })
        } finally {
            setShopifyLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return
        
        setLoading(true)
        try {
            const shop = email.includes('.myshopify.com') ? email : `${email}.myshopify.com`
            const response = await fetch(`${BACKEND_URL}/api/auth/shopify/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop }),
            })
            const data = await response.json()
            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl
            }
        } catch (error) {
            navigate('/onboarding')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Panel: Branding */}
            <div className="md:w-[45%] bg-indigo-600 relative flex flex-col justify-center p-10 lg:p-20 overflow-hidden">
                <div className="relative z-10 max-w-lg">
                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tighter">
                        Simplified <br />AI Growth <br />Management.
                    </motion.h1>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 flex gap-4">
                        <div className="w-3 h-3 bg-white/40 rounded-full" />
                        <div className="w-3 h-3 bg-white/20 rounded-full" />
                        <div className="w-12 h-3 bg-white/30 rounded-full" />
                    </motion.div>
                </div>
                <div className="absolute bottom-10 left-10 lg:bottom-20 lg:left-20 opacity-20 select-none">
                    <p className="text-[12rem] font-black text-white leading-none">AI</p>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="md:w-[55%] bg-white relative flex flex-col items-center justify-center p-8 lg:p-12">
                <button className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px] px-4">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Welcome to <br />AI Growth Manager
                        </h2>
                    </div>

                    {/* Auth Method Selector */}
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
                        <button onClick={() => setAuthMethod('google')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${authMethod === 'google' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                            Sign in with Google
                        </button>
                        <button onClick={() => setAuthMethod('shopify')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${authMethod === 'shopify' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                            Shopify Store
                        </button>
                    </div>

                    {/* Google Auth */}
                    {authMethod === 'google' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <p className="text-sm font-medium text-slate-500 text-center">Sign in with your Google account</p>
                            <button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full h-[64px] border border-slate-200 rounded-2xl flex items-center justify-center gap-4 hover:bg-slate-50 disabled:opacity-50">
                                {googleLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                <span className="text-base font-bold text-slate-800">{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Shopify Auth */}
                    {authMethod === 'shopify' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <p className="text-sm font-medium text-slate-500 text-center">Enter your Shopify store domain</p>
                            <form onSubmit={(e) => { e.preventDefault(); handleShopifySignIn(); }} className="space-y-6">
                                <div className="space-y-3 group relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Domain</label>
                                    <div className="relative">
                                        <input type="text" value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} placeholder="your-store" className="w-full h-[64px] border border-slate-200 rounded-2xl px-6 pr-32 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 text-slate-900 font-bold text-lg" disabled={shopifyLoading} />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">.myshopify.com</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={shopifyLoading || !shopDomain} className="w-full h-[64px] bg-[#95BF47] hover:bg-[#86ac40] text-white rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 font-black">
                                    {shopifyLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : null}
                                    <span>{shopifyLoading ? 'Connecting...' : 'Connect Shopify Store'}</span>
                                </button>
                            </form>
                        </motion.div>
                    )}

                    <div className="relative my-12 flex items-center">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="px-5 text-xs font-black text-slate-400 uppercase bg-white">Or</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="space-y-3 group border-b-2 border-slate-100 focus-within:border-indigo-600 pb-1">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-transparent border-none outline-none text-slate-900 font-bold text-lg" />
                        </div>
                        <button type="submit" disabled={!email || loading} className="w-full h-[64px] bg-indigo-600 text-white font-black text-sm uppercase rounded-2xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center">
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
