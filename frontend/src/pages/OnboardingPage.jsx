import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, Lock, ArrowRight, Zap, Globe, Sparkles, CheckCircle2, BarChart3, Users, Package, Search } from 'lucide-react'
import { BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

const ANALYSIS_STEPS = [
    { id: 'connect', label: 'Connecting to Shopify API...', icon: Globe },
    { id: 'products', label: 'Fetching product catalog...', icon: Package },
    { id: 'customers', label: 'Analyzing customer segments...', icon: Users },
    { id: 'revenue', label: 'Calculating revenue potential...', icon: BarChart3 },
    { id: 'ai', label: 'Generating AI growth strategy...', icon: Sparkles }
];

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [storeUrl, setStoreUrl] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Handle token from URL (after Google OAuth)
    useEffect(() => {
        const token = searchParams.get('token')
        const merchant = searchParams.get('merchant')
        
        if (token) {
            localStorage.setItem('token', token)
            localStorage.setItem('currentShop', merchant || '')
            setIsAuthenticated(true)
            window.history.replaceState({}, document.title, '/onboarding')
        } else {
            const existingToken = localStorage.getItem('token')
            const existingShop = localStorage.getItem('currentShop')
            if (existingToken) {
                setIsAuthenticated(true)
                if (existingShop) {
                    navigate(`/dashboard/${existingShop}`)
                }
            } else {
                navigate('/signin')
            }
        }
    }, [searchParams, navigate])

    const startAnalysisAnimation = () => {
        setIsConnecting(true);
        let step = 0;
        const interval = setInterval(() => {
            if (step < ANALYSIS_STEPS.length - 1) {
                step++;
                setCurrentStep(step);
            } else {
                clearInterval(interval);
            }
        }, 1200); // Change step every 1.2s
        return interval;
    };

    const handleConnect = async (e) => {
        e.preventDefault()
        if (!storeUrl) return
        
        const animationInterval = startAnalysisAnimation();
        
        // Format store URL
        let formattedStore = storeUrl
            .replace(/^(https?:\/\/)?/, '') 
            .replace(/\/$/, '')             
            .toLowerCase();                 
        
        if (!formattedStore.includes('.myshopify.com')) {
            formattedStore = formattedStore + '.myshopify.com';
        }

        try {
            const response = await fetch(`${BACKEND_URL}/auth/shopify/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop: formattedStore })
            })
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server returned ${response.status}`);
            }

            const data = await response.json()
            
            // Wait for animation to finish or at least progress significantly
            await new Promise(resolve => setTimeout(resolve, 3000));

            if (data.success && data.data.authUrl) {
                window.location.href = data.data.authUrl
            } else if (data.success && data.data.redirectTo) {
                localStorage.setItem('currentShop', formattedStore)
                window.location.href = data.data.redirectTo
            } else if (data.success && data.data.shop) {
                localStorage.setItem('currentShop', data.data.shop)
                navigate(`/dashboard/${data.data.shop}`)
            } else {
                clearInterval(animationInterval);
                setIsConnecting(false);
                const errorMessage = data.error?.message || data.error || 'Failed to connect store. Please check your store domain.'
                Swal.fire({
                    title: 'Connection Error',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonColor: '#6366f1'
                });
            }

        } catch (error) {
            clearInterval(animationInterval);
            setIsConnecting(false);
            Swal.fire({
                title: 'Connection Failed',
                text: 'Could not connect to the store. Please check your network and try again.',
                icon: 'error',
                confirmButtonColor: '#6366f1'
            });
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Neural Network Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <g opacity="0.15">
                        {/* Neural nodes and connections */}
                        <circle cx="20%" cy="30%" r="4" fill="#6366f1" filter="url(#glow)">
                            <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="80%" cy="20%" r="4" fill="#3b82f6" filter="url(#glow)">
                            <animate attributeName="r" values="4;6;4" dur="3.5s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="15%" cy="70%" r="4" fill="#06b6d4" filter="url(#glow)">
                            <animate attributeName="r" values="4;6;4" dur="4s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="85%" cy="75%" r="4" fill="#8b5cf6" filter="url(#glow)">
                            <animate attributeName="r" values="4;6;4" dur="3.2s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="50%" cy="50%" r="5" fill="#6366f1" filter="url(#glow)">
                            <animate attributeName="r" values="5;7;5" dur="2.5s" repeatCount="indefinite"/>
                        </circle>
                        
                        {/* Connecting lines */}
                        <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="#6366f1" strokeWidth="1.5" opacity="0.6">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
                        </line>
                        <line x1="80%" y1="20%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite"/>
                        </line>
                        <line x1="15%" y1="70%" x2="50%" y2="50%" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite"/>
                        </line>
                        <line x1="85%" y1="75%" x2="50%" y2="50%" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.2s" repeatCount="indefinite"/>
                        </line>
                    </g>
                </svg>
            </div>

            <AnimatePresence mode="wait">
                {!isConnecting ? (
                    <motion.div
                        key="onboarding-form"
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="max-w-[600px] w-full bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 flex flex-col items-center text-center relative z-10"
                    >
                        {/* Icon Header */}
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center shadow-lg border border-indigo-100 mb-8">
                            <Sparkles className="w-10 h-10 text-indigo-600" />
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                            Connect Your Store
                        </h1>

                        {/* Subtext */}
                        <p className="text-slate-600 text-base font-medium leading-relaxed mb-12 max-w-sm mx-auto">
                            Your AI Growth Engine will analyze your revenue, customers, and performance in real-time.
                        </p>

                        {/* Store URL Input */}
                        <form onSubmit={handleConnect} className="w-full flex flex-col items-center gap-6">
                            <div className="w-full space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">
                                    Shopify Store URL
                                </label>
                                <div className={`relative flex items-center h-[64px] transition-all duration-300 ${isFocused ? 'ring-4 ring-indigo-500/10 border-indigo-600' : 'border-slate-200'} border-2 rounded-2xl overflow-hidden bg-white`}>
                                    <div className="pl-5 pr-3">
                                        <ShoppingBag className={`w-5 h-5 ${isFocused ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="your-store-handle"
                                        value={storeUrl}
                                        onChange={(e) => setStoreUrl(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        className="flex-1 bg-transparent border-none outline-none text-slate-900 font-bold text-base placeholder:text-slate-300"
                                    />
                                    <div className="pr-5 text-slate-400 font-bold text-sm uppercase pointer-events-none hidden sm:block">
                                        .myshopify.com
                                    </div>
                                </div>
                            </div>

                            {/* Activate Button */}
                            <motion.button
                                type="submit"
                                disabled={!storeUrl}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-[64px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base uppercase tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                Activate AI Analysis
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="analysis-loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-[500px] w-full bg-white rounded-[40px] p-10 lg:p-14 shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)] border border-blue-50 relative overflow-hidden z-10"
                    >
                        {/* Scanning Animation Header */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-1/3 h-full bg-indigo-600 blur-[2px]"
                            />
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-15px] border-2 border-dashed border-indigo-600/20 rounded-full"
                                />
                                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={ANALYSIS_STEPS[currentStep].id}
                                            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                                            className="text-indigo-600"
                                        >
                                            {(() => {
                                                const Icon = ANALYSIS_STEPS[currentStep].icon;
                                                return <Icon className="w-10 h-10" />;
                                            })()}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                                AI Engine Activating
                            </h2>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-10">
                                Fetching Shopify Data in Real-Time
                            </p>

                            {/* Progress Steps */}
                            <div className="w-full space-y-4">
                                {ANALYSIS_STEPS.map((step, idx) => (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0.3 }}
                                        animate={{ 
                                            opacity: idx <= currentStep ? 1 : 0.3,
                                            x: idx === currentStep ? 4 : 0
                                        }}
                                        className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-transparent transition-all"
                                        style={{
                                            borderColor: idx === currentStep ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                            backgroundColor: idx === currentStep ? 'rgba(79, 70, 229, 0.02)' : ''
                                        }}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${idx < currentStep ? 'bg-emerald-500 text-white' : idx === currentStep ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                                            {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : <div className={`w-1.5 h-1.5 rounded-full ${idx === currentStep ? 'bg-white animate-ping' : 'bg-slate-400'}`} />}
                                        </div>
                                        <span className={`flex-1 text-left text-sm font-bold transition-colors ${idx === currentStep ? 'text-indigo-600' : 'text-slate-600'}`}>
                                            {step.label}
                                        </span>
                                        {idx === currentStep && (
                                            <motion.div
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase"
                                            >
                                                Live
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Bottom Pulse Meter */}
                            <div className="mt-12 flex gap-1 items-end h-8">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ 
                                            height: [8, Math.random() * 24 + 8, 8],
                                        }}
                                        transition={{ 
                                            duration: 1.2, 
                                            repeat: Infinity, 
                                            delay: i * 0.1 
                                        }}
                                        className="w-1.5 bg-indigo-600/20 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
