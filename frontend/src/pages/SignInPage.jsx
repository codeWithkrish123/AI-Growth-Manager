import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { authAPI, BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function SignInPage() {
    const navigate = useNavigate()
    const [shopDomain, setShopDomain] = useState('')
    const [googleLoading, setGoogleLoading] = useState(false)
    const [shopifyLoading, setShopifyLoading] = useState(false)
    const [authMethod, setAuthMethod] = useState('google') // 'google' or 'shopify'
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        document.title = 'Sign In – AI Growth Manager'
        if (localStorage.getItem('token')) {
            setIsLoggedIn(true)
        }
    }, [])

    const handleContinueToDashboard = () => {
        const shop = localStorage.getItem('currentShop')
        if (shop) {
            navigate(`/dashboard/${shop}`)
        } else {
            navigate('/onboarding')
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        try {
            const response = await fetch(`${BACKEND_URL}/google/auth/google`);
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const data = await response.json();
            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl;
            } else {
                Swal.fire({ title: 'Authentication Error', icon: 'error', confirmButtonColor: '#6366f1' });
            }
        } catch (error) {
            Swal.fire({ title: 'Connection Failed', icon: 'error', confirmButtonColor: '#6366f1' });
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
            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl;
            } else if (data.success && data.data.redirectTo) {
                navigate(data.data.redirectTo);
            } else {
                Swal.fire({ title: 'Connection Error', text: data.error || 'Failed to connect store.', icon: 'error', confirmButtonColor: '#6366f1' });
            }
        } catch (error) {
            Swal.fire({ title: 'Connection Failed', icon: 'error', confirmButtonColor: '#6366f1' });
        } finally {
            setShopifyLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Panel */}
            <div className="md:w-[45%] bg-indigo-600 relative flex flex-col justify-center p-10 lg:p-20 overflow-hidden">
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                        Simplified <br />
                        AI Growth <br />
                        Management.
                    </h1>
                </div>
                <div className="absolute bottom-10 left-10 lg:bottom-20 lg:left-20 opacity-20 select-none">
                    <p className="text-[12rem] font-black text-white leading-none">AI</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="md:w-[55%] bg-white relative flex flex-col items-center justify-center p-8 lg:p-12">
                <button className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px] px-4 text-center">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                            Welcome to <br /> AI Growth Manager
                        </h2>
                        {isLoggedIn && <p className="text-slate-500 font-bold mt-2">Welcome back!</p>}
                    </div>

                    {isLoggedIn ? (
                        <button
                            onClick={handleContinueToDashboard}
                            className="w-full h-[64px] bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all"
                        >
                            Continue to Dashboard
                        </button>
                    ) : (
                        <>
                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
                                <button onClick={() => setAuthMethod('google')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${authMethod === 'google' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Google Account</button>
                                <button onClick={() => setAuthMethod('shopify')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${authMethod === 'shopify' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Shopify Store</button>
                            </div>

                            {authMethod === 'google' && (
                                <button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full h-[64px] border border-slate-200 rounded-2xl flex items-center justify-center gap-4 px-6 hover:bg-slate-50 transition-all font-bold text-slate-800">
                                    {googleLoading ? 'Connecting...' : 'Continue with Google'}
                                </button>
                            )}

                            {authMethod === 'shopify' && (
                                <form onSubmit={(e) => { e.preventDefault(); handleShopifySignIn(); }} className="space-y-6">
                                    <div className="relative group">
                                        <input type="text" value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} placeholder="your-store" className="w-full h-[64px] border border-slate-200 rounded-2xl px-6 pr-32 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-slate-900 font-bold" />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">.myshopify.com</span>
                                    </div>
                                    <button type="submit" disabled={shopifyLoading || !shopDomain} className="w-full h-[64px] bg-[#95BF47] text-white rounded-2xl font-black text-lg hover:shadow-lg transition-all">
                                        {shopifyLoading ? 'Connecting...' : 'Connect Shopify Store'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    )
}