import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
            Swal.fire({ title: 'Authentication Error', text: 'Could not connect to backend.', icon: 'error', confirmButtonColor: '#4f46e5' });
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
        <div className="min-h-screen flex bg-slate-50 font-sans">
            {/* Left: Branding Panel */}
            <div className="hidden lg:flex w-[45%] bg-indigo-600 p-20 flex-col justify-center text-white relative overflow-hidden">
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

            {/* Right: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <button className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px] bg-white p-10 rounded-[32px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100">
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
                            <div className="flex bg-slate-100 p-1 rounded-2xl">
                                <button onClick={() => setAuthMethod('google')} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${authMethod === 'google' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Google Account</button>
                                <button onClick={() => setAuthMethod('shopify')} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${authMethod === 'shopify' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Shopify Store</button>
                            </div>

                            {authMethod === 'google' && (
                                <button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full h-[64px] border-2 border-slate-200 rounded-2xl font-bold text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-4">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    {googleLoading ? 'Connecting...' : 'Continue with Google'}
                                </button>
                            )}

                            {authMethod === 'shopify' && (
                                <form onSubmit={(e) => { e.preventDefault(); handleShopifySignIn(); }} className="space-y-4">
                                    <div className="relative border-2 border-slate-200 rounded-2xl p-1 focus-within:border-indigo-600">
                                        <input type="text" value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} placeholder="your-store" className="w-full px-5 py-4 bg-transparent outline-none font-bold" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">.myshopify.com</span>
                                    </div>
                                    <button type="submit" className="w-full h-[64px] bg-emerald-500 text-white font-black rounded-2xl">Connect Shopify</button>
                                </form>
                            )}

                            <div className="relative text-center text-xs font-black text-slate-400 uppercase tracking-widest">Or</div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border-b-2 border-slate-100">
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