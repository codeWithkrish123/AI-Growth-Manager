import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { authAPI, BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function SignInPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [shopDomain, setShopDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [shopifyLoading, setShopifyLoading] = useState(false)
    const [authMethod, setAuthMethod] = useState('google') // 'google' or 'shopify'
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        document.title = 'Sign In – AI Growth Manager'
        if (localStorage.getItem('token')) setIsLoggedIn(true)
    }, [])

    const handleContinueToDashboard = () => {
        const shop = localStorage.getItem('currentShop')
        if (shop) navigate(`/dashboard/${shop}`)
        else navigate('/onboarding')
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        try {
            const response = await fetch(`${BACKEND_URL}/google/auth/google`);
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const data = await response.json();
            if (data.success && data.data.authUrl) window.location.href = data.data.authUrl;
            else throw new Error('Auth initiation failed');
        } catch (error) {
            Swal.fire({ title: 'Authentication Error', icon: 'error', confirmButtonColor: '#6366f1' });
        } finally {
            setGoogleLoading(false)
        }
    }

    const handleShopifySignIn = async () => {
        if (!shopDomain) {
            Swal.fire({ text: 'Please enter your Shopify store domain', icon: 'warning' });
            return;
        }
        setShopifyLoading(true)
        try {
            const normalizedShop = shopDomain.includes('.myshopify.com') ? shopDomain : `${shopDomain}.myshopify.com`;
            const response = await fetch(`${BACKEND_URL}/auth/shopify/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop: normalizedShop }),
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const data = await response.json();
            if (data.success && data.data.authUrl) window.location.href = data.data.authUrl;
            else if (data.success && data.data.redirectTo) navigate(data.data.redirectTo);
            else Swal.fire({ title: 'Connection Error', text: data.error || 'Failed to connect store.', icon: 'error', confirmButtonColor: '#6366f1' });
        } catch (error) {
            Swal.fire({ title: 'Connection Failed', icon: 'error', confirmButtonColor: '#6366f1' });
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
            const response = await authAPI.initiateAuth(shop)
            window.location.href = response.data.redirect_url || response.request.responseURL
        } catch (error) {
            navigate('/onboarding')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden font-sans">
            {/* Left: Branding */}
            <div className="md:w-[45%] bg-indigo-600 p-20 flex flex-col justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500 opacity-50" />
                <h1 className="relative z-10 text-6xl xl:text-7xl font-black leading-tight tracking-tighter">
                    Simplified <br />AI Growth <br />Management.
                </h1>
                <p className="relative z-10 text-indigo-200 mt-8 text-xl font-medium max-w-sm">
                    Connect your store and start driving actionable insights with our advanced AI engine.
                </p>
                <div className="relative z-10 mt-16 opacity-30 select-none">
                    <p className="text-[10rem] font-black leading-none">AI</p>
                </div>
            </div>

            {/* Right: Login/Card Panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
                <button className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X /></button>
                
                {/* Floating Card UI */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px] bg-white p-10 rounded-[32px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-slate-100">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome to AI Growth Manager</h2>
                        {isLoggedIn && <p className="text-indigo-600 font-bold mt-2">Welcome back!</p>}
                    </div>

                    {isLoggedIn ? (
                        <button onClick={handleContinueToDashboard} className="w-full h-[64px] bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all">
                            Continue to Dashboard
                        </button>
                    ) : (
                        <div className="space-y-8">
                            {/* Tabs */}
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                <button onClick={() => setAuthMethod('google')} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${authMethod === 'google' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Google Account</button>
                                <button onClick={() => setAuthMethod('shopify')} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${authMethod === 'shopify' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Shopify Store</button>
                            </div>

                            {/* Google Option */}
                            {authMethod === 'google' && (
                                <button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full h-[64px] border-2 border-slate-200 rounded-2xl font-bold text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-4">
                                    Continue with Google
                                </button>
                            )}

                            {/* Shopify Option */}
                            {authMethod === 'shopify' && (
                                <form onSubmit={(e) => { e.preventDefault(); handleShopifySignIn(); }} className="space-y-4">
                                    <div className="relative border-2 border-slate-200 rounded-2xl p-1 focus-within:border-indigo-600">
                                        <input type="text" value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} placeholder="your-store" className="w-full px-5 py-4 bg-transparent outline-none font-bold" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">.myshopify.com</span>
                                    </div>
                                    <button type="submit" className="w-full h-[64px] bg-emerald-500 text-white font-black rounded-2xl">Connect Shopify</button>
                                </form>
                            )}

                            {/* Divider */}
                            <div className="relative text-center text-xs font-black text-slate-400 uppercase tracking-widest">Or</div>

                            {/* Email */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border-b-2 border-slate-100 pb-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Email Address</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-transparent py-3 outline-none font-bold text-lg" />
                                </div>
                                <button type="submit" disabled={!email || loading} className="w-full h-[64px] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                    {loading ? '...' : 'Continue'}
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}