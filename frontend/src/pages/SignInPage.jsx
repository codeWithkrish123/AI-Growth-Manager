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
        if (localStorage.getItem('token')) {
            setIsLoggedIn(true)
        }
    }, [])

    const handleContinueToDashboard = () => {
        const shop = localStorage.getItem('currentShop')
        if (shop) navigate(`/dashboard/${shop}`)
        else navigate('/onboarding')
    }

    // Google Sign-In
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        try {
            const response = await fetch(`${BACKEND_URL}/google/auth/google`);
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const data = await response.json();
            if (data.success && data.data.authUrl) window.location.href = data.data.authUrl;
            else throw new Error('Auth initiation failed');
        } catch (error) {
            Swal.fire({ title: 'Authentication Error', text: 'Could not connect to backend.', icon: 'error', confirmButtonColor: '#6366f1' });
        } finally {
            setGoogleLoading(false)
        }
    }

    // Email Submit
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
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Panel */}
            <div className="md:w-[45%] bg-indigo-600 p-10 lg:p-20 flex flex-col justify-center text-white">
                <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter">Simplified <br />AI Growth <br />Management.</h1>
            </div>

            {/* Right Panel */}
            <div className="md:w-[55%] bg-white flex flex-col items-center justify-center p-8 lg:p-12">
                <button className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X /></button>
                
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Welcome to <br /> AI Growth Manager</h2>
                    </div>

                    {isLoggedIn ? (
                        <button onClick={handleContinueToDashboard} className="w-full h-[64px] bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700">Continue to Dashboard</button>
                    ) : (
                        <>
                            {/* Tab Selector */}
                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
                                <button onClick={() => setAuthMethod('google')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${authMethod === 'google' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Google Account</button>
                                <button onClick={() => setAuthMethod('shopify')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${authMethod === 'shopify' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Shopify Store</button>
                            </div>

                            {/* Google Button */}
                            {authMethod === 'google' && (
                                <button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full h-[64px] border border-slate-200 rounded-2xl flex items-center justify-center gap-4 hover:bg-slate-50 font-bold text-slate-800">
                                    Continue with Google
                                </button>
                            )}

                            {/* Divider */}
                            <div className="relative my-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Or</div>

                            {/* Email Input & Continue */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border-b-2 border-slate-100 pb-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your Email Address</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-transparent border-none outline-none text-slate-900 font-bold py-3 text-lg" />
                                </div>
                                <button type="submit" disabled={!email || loading} className="w-full h-[64px] bg-indigo-400 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-500 transition-all">{loading ? '...' : 'Continue'}</button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    )
}