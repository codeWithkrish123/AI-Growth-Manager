import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { authAPI, BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function SignInPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [authMethod, setAuthMethod] = useState('google')
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        document.title = 'Welcome to AI Growth Manager'
        if (localStorage.getItem('token')) setIsLoggedIn(true)
    }, [])

    const handleGoogleSignIn = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/google/auth/google`);
            const data = await response.json();
            if (data.success && data.data.authUrl) window.location.href = data.data.authUrl;
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'Google sign-in failed.', icon: 'error', confirmButtonColor: '#6366f1' });
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return
        try {
            const shop = email.includes('.myshopify.com') ? email : `${email}.myshopify.com`
            const response = await authAPI.initiateAuth(shop)
            window.location.href = response.data.redirect_url || response.request.responseURL
        } catch (error) {
            navigate('/onboarding')
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden font-sans">
            {/* Left: Branding */}
            <div className="md:w-1/2 bg-[#5D55F7] p-16 flex flex-col justify-center text-white relative">
                <h1 className="text-6xl font-black leading-tight tracking-tighter">Simplified <br />AI Growth <br />Management.</h1>
                <div className="mt-10 flex gap-2">
                    <div className="w-4 h-2 bg-white/40 rounded-full" />
                    <div className="w-4 h-2 bg-white/40 rounded-full" />
                    <div className="w-12 h-2 bg-white/60 rounded-full" />
                </div>
                <div className="mt-20 opacity-30 text-8xl font-black">AI</div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative">
                <button className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X /></button>
                
                <div className="w-full max-w-[440px]">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome to <br />AI Growth Manager</h2>
                        {isLoggedIn && <p className="text-slate-500 font-bold mt-2">Welcome back!</p>}
                    </div>

                    {isLoggedIn ? (
                        <button onClick={() => navigate('/dashboard')} className="w-full h-[60px] bg-[#5D55F7] text-white font-black rounded-2xl hover:bg-[#4A48D0]">Continue to Dashboard</button>
                    ) : (
                        <div className="space-y-6">
                            {/* Tabs */}
                            <div className="flex bg-[#F0F2F5] p-1.5 rounded-2xl mb-6">
                                <button onClick={() => setAuthMethod('google')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMethod === 'google' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Google Account</button>
                                <button onClick={() => setAuthMethod('shopify')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMethod === 'shopify' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Shopify Store</button>
                            </div>

                            {/* Google Button */}
                            {authMethod === 'google' && (
                                <button onClick={handleGoogleSignIn} className="w-full h-[60px] border-2 border-slate-200 rounded-2xl font-bold text-slate-900 flex items-center justify-center gap-3">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-5 h-5" alt="Google" />
                                    Continue with Google
                                </button>
                            )}

                            {/* Divider */}
                            <div className="relative text-center text-xs font-black text-slate-400 uppercase tracking-widest my-6">Or</div>

                            {/* Email */}
                            {authMethod === 'shopify' && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="border-b border-slate-200 pb-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YOUR EMAIL ADDRESS</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full py-2 outline-none font-bold text-slate-900 placeholder:text-slate-300" />
                                    </div>
                                    <button type="submit" className="w-full h-[60px] bg-[#5D55F7] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#4A48D0]">CONTINUE</button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
