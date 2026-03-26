import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, X } from 'lucide-react'
// import { authAPI } from '../services'

export default function SignInPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        document.title = 'Sign In – AI Growth Manager | Start Your Free Trial'
        document.querySelector('meta[name="description"]')?.setAttribute('content', 'Sign in to AI Growth Manager or start your free 14-day trial. Connect your Shopify store and let AI optimize your growth.')
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        
        try {
            // Extract shop domain from email or use email as shop identifier
            const shop = email.includes('.myshopify.com') ? email : `${email}.myshopify.com`
            
            // Initiate Shopify OAuth
            const response = await authAPI.initiateAuth(shop)
            
            // Redirect to Shopify for authorization
            window.location.href = response.data.redirect_url || response.request.responseURL
            
        } catch (error) {
            console.error('Authentication error:', error)
            // Fallback for demo - proceed to onboarding
            await new Promise(r => setTimeout(r, 1200))
            navigate('/onboarding')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Panel: Branding & Topography */}
            <div className="md:w-1/2 bg-primary relative flex flex-col justify-center p-10 lg:p-20 overflow-hidden">
                {/* Topographical Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <filter id="noise">
                            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" stitchTiles="stitch" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5" />
                        <path d="M0,100 C150,200 350,0 500,100 S850,200 1000,100" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
                        <path d="M0,200 C150,300 350,100 500,200 S850,300 1000,200" stroke="white" strokeWidth="2" fill="none" opacity="0.2" />
                        <path d="M0,300 C150,400 350,200 500,300 S850,400 1000,300" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
                        <path d="M0,400 C150,500 350,300 500,400 S850,500 1000,400" stroke="white" strokeWidth="2" fill="none" opacity="0.05" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight lg:leading-[1.1] tracking-tight"
                    >
                        Simplified <br />
                        AI Growth <br />
                        Management.
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 flex gap-4"
                    >
                        <div className="w-4 h-4 bg-white/30 rounded-full" />
                        <div className="w-4 h-4 bg-white/10 rounded-full" />
                        <div className="w-16 h-4 bg-white/20 rounded-full" />
                    </motion.div>
                </div>

                {/* Floating "IPO" Style Text Mockup */}
                <div className="absolute bottom-10 left-10 lg:bottom-20 lg:left-20 opacity-20">
                    <p className="text-8xl font-black text-white selection:bg-transparent">AI</p>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="md:w-1/2 bg-white relative flex flex-col items-center justify-center p-8 lg:p-12">
                {/* Close Button Mobile */}
                <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[420px]"
                >
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10">
                        Welcome to <br /> AI Growth Manager
                    </h2>

                    {/* Google Login Button */}
                    <button className="w-full h-[60px] border border-slate-200 rounded-xl flex items-center justify-center gap-3 px-6 hover:bg-slate-50 transition-colors group">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-black text-slate-700">Continue with Google</span>
                    </button>

                    <div className="relative my-10 flex items-center">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="px-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white relative z-10">Or</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12">
                        <div className="space-y-2 border-b-2 border-slate-100 focus-within:border-primary transition-colors pb-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Your Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full bg-transparent border-none outline-none text-slate-900 font-bold py-2 placeholder:text-slate-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!email || loading}
                            className="w-full h-[60px] bg-primary text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Continue"
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] items-center justify-center font-bold text-slate-400">
                            By proceeding, I agree to <Link className="text-slate-900 underline underline-offset-4 decoration-slate-200 hover:decoration-primary">T&C</Link>, <Link className="text-slate-900 underline underline-offset-4 decoration-slate-200 hover:decoration-primary">Privacy Policy</Link> & <Link className="text-slate-900 underline underline-offset-4 decoration-slate-200 hover:decoration-primary">Tariff Rates</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
