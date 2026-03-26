import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
// import { dashboardAPI, shopifyAPI } from '../services'

const navItems = [
    { icon: 'dashboard', label: 'Overview', to: '/dashboard' },
    { icon: 'health_metrics', label: 'Health Score', to: '/health' },
    { icon: 'inventory_2', label: 'Products', to: '/products' },
    { icon: 'smart_toy', label: 'AI Actions', to: '/ai-actions', badge: 'New' },
    { icon: 'mail', label: 'Emails', to: '/emails' },
    { icon: 'monetization_on', label: 'Revenue Impact', to: '/revenue' },
]

export default function DashboardOverview() {
    const location = useLocation()
    const isOptimized = new URLSearchParams(location.search).get('optimized') === 'true'
    const [healthScore, setHealthScore] = useState(0)
    const [showBanner, setShowBanner] = useState(false)
    const [loading, setLoading] = useState(true)
    const [shop, setShop] = useState(localStorage.getItem('currentShop') || 'demo-shop.myshopify.com')
    const [dashboardData, setDashboardData] = useState(null)
    const [stats, setStats] = useState({
        conversion: '2.4%',
        aov: '$85.00',
        cart: '64%'
    })

    useEffect(() => {
        fetchDashboardData()
    }, [shop])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const response = await dashboardAPI.getDashboardData(shop)
            setDashboardData(response.data)
            
            // Update stats with real data
            if (response.data) {
                setStats({
                    conversion: `${response.data.conversionRate || '2.4'}%`,
                    aov: `$${response.data.averageOrderValue || '85.00'}`,
                    cart: `${response.data.cartAbandonmentRate || '64'}%`
                })
                setHealthScore(response.data.healthScore || 84)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            // Use demo data as fallback
            const timer = setTimeout(() => setHealthScore(84), 500)
            return () => clearTimeout(timer)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full bg-background-light overflow-hidden font-display">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 transition-all duration-300">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined fill text-3xl">auto_graph</span>
                        <span className="text-xl font-bold tracking-tight text-slate-900">GrowthAI</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to
                        return (
                            <Link key={item.label} to={item.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium group transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>{item.icon}</span>
                                <span>{item.label}</span>
                                {item.badge && <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
                            </Link>
                        )
                    })}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System</p>
                        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors group">
                            <span className="material-symbols-outlined">settings</span>
                            <span>Settings</span>
                        </Link>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100">
                    <Link to="/" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">SJ</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">Sarah Jenkins</p>
                            <p className="text-xs text-slate-500 truncate">Growth Manager</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">logout</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <AnimatePresence>
                    {showBanner && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
                        >
                            <div className="bg-primary text-white p-4 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-between border border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Optimization Successful!</p>
                                        <p className="text-primary-foreground/80 text-xs">AI resolved 3 bottlenecks and raised your health score.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBanner(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 flex-shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-slate-900 font-semibold hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">storefront</span>
                                <span>Fashion Nova Clone</span>
                                <span className="material-symbols-outlined text-slate-400">expand_more</span>
                            </button>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="relative max-w-md w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input className="block w-full pl-10 pr-3 py-2 border-none rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm transition-shadow" placeholder="Search insights..." type="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            Last 30 Days
                        </button>
                        <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                        </button>
                        <Link to="/pricing" className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
                            <span className="material-symbols-outlined text-[18px]">upgrade</span>
                            Upgrade
                        </Link>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Page Title */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                                <p className="text-sm text-slate-500 mt-1">Welcome back, Sarah. Here's what's happening.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                AI Sync Active
                            </div>
                        </div>

                        {/* Top Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Health Score Card */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-slate-900">Store Health Score</h3>
                                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">+2 pts</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="relative h-32 w-32 flex-shrink-0">
                                        <svg className="h-full w-full" viewBox="0 0 100 100">
                                            <circle className="text-slate-100 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
                                            <motion.circle
                                                className="text-primary stroke-current"
                                                cx="50"
                                                cy="50"
                                                fill="transparent"
                                                r="40"
                                                strokeDasharray="251.2"
                                                initial={{ strokeDashoffset: 251.2 }}
                                                animate={{ strokeDashoffset: 251.2 - (251.2 * healthScore) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                strokeLinecap="round"
                                                strokeWidth="8"
                                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <motion.span
                                                key={healthScore}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="text-3xl font-bold text-slate-900"
                                            >
                                                {healthScore}
                                            </motion.span>
                                            <span className="text-xs text-slate-500 uppercase font-semibold">{healthScore > 90 ? 'Excellent' : 'Good'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 flex-1">
                                        <div className="flex items-start gap-2">
                                            <span className={`material-symbols-outlined text-[20px] mt-0.5 ${healthScore > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {healthScore > 90 ? 'check_circle' : 'warning'}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{healthScore > 90 ? 'Store Fully Optimized' : '3 Issues Detected'}</p>
                                                <p className="text-xs text-slate-500">{healthScore > 90 ? 'All growth parameters are peak.' : 'SEO missing on 4 products.'}</p>
                                            </div>
                                        </div>
                                        <Link to="/health" className="mt-1 w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                                            <span className="material-symbols-outlined text-[18px]">{healthScore > 90 ? 'auto_awesome' : 'auto_fix_high'}</span>
                                            {healthScore > 90 ? 'View Full Intel' : 'Review AI Suggestions'}
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>

                            {/* AI Revenue Impact */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-primary/5 to-white rounded-xl p-6 border border-primary/20 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-primary text-9xl">monetization_on</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                        <span className="bg-primary/10 p-1 rounded-md text-primary"><span className="material-symbols-outlined text-sm">smart_toy</span></span>
                                        AI Revenue Impact
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">Total value generated by AI actions this month.</p>
                                </div>
                                <div className="mt-6">
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-bold text-primary tracking-tight">$12,430</h2>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                            <span className="material-symbols-outlined text-sm mr-1">trending_up</span>14x ROI
                                        </span>
                                        <span className="text-sm text-slate-500">vs. last month</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Metrics Grid */}
                            <div className="grid grid-rows-3 gap-4">
                                {[
                                    { label: 'Conversion Rate', value: stats.conversion, change: isOptimized ? '+1.4%' : '+0.4%', path: 'M0 30 Q 20 35, 40 20 T 100 5' },
                                    { label: 'Avg Order Value', value: stats.aov, change: isOptimized ? '+$9.20' : '+$5.00', path: 'M0 35 Q 30 35, 50 20 T 100 10' },
                                    { label: 'Abandoned Cart', value: stats.cart, change: isOptimized ? '-22%' : '-2%', path: 'M0 10 Q 20 5, 40 15 T 100 30' },
                                ].map((m, i) => (
                                    <motion.div key={m.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * (i + 3) }} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{m.label}</p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <motion.span
                                                    key={m.value}
                                                    initial={{ y: 5, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    className="text-xl font-bold text-slate-900"
                                                >
                                                    {m.value}
                                                </motion.span>
                                                <span className={`text-xs font-medium ${m.label === 'Abandoned Cart' ? 'text-blue-600' : 'text-emerald-600'}`}>{m.change}</span>
                                            </div>
                                        </div>
                                        <div className="h-8 w-20">
                                            <svg className={`h-full w-full ${m.label === 'Abandoned Cart' ? 'text-blue-500' : 'text-emerald-500'}`} preserveAspectRatio="none" viewBox="0 0 100 40">
                                                <path d={m.path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Middle Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Chart */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
                                        <p className="text-sm text-slate-500">Total vs. AI-Driven Revenue</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-300" /><span className="text-slate-600">Total</span></div>
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary shadow shadow-blue-200" /><span className="text-slate-900 font-medium">AI-Driven</span></div>
                                    </div>
                                </div>
                                <div className="h-72 w-full relative">
                                    <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-400 pl-8">
                                        {['$50k', '$40k', '$30k', '$20k', '$10k', '0'].map(l => (
                                            <div key={l} className="border-b border-slate-100 h-0 w-full flex items-center"><span className="-ml-8">{l}</span></div>
                                        ))}
                                    </div>
                                    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="primaryGradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#135bec" stopOpacity="0.1" />
                                                <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,220 C100,210 200,180 300,150 S500,120 600,80 S800,90 1200,40" fill="none" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                        <path d="M0,280 C100,260 200,240 300,180 S500,100 600,90 S800,110 1200,60" fill="url(#primaryGradient)" stroke="#135bec" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                                        <circle cx="600" cy="90" fill="#135bec" r="6" stroke="white" strokeWidth="2" />
                                    </svg>
                                    <div className="absolute top-[25%] left-[50%] bg-slate-900 text-white text-xs rounded px-2 py-1 transform -translate-x-1/2 -translate-y-full shadow-lg pointer-events-none">$28,450</div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-slate-400 px-2">
                                    {['Nov 1', 'Nov 7', 'Nov 14', 'Nov 21', 'Nov 28'].map(d => <span key={d}>{d}</span>)}
                                </div>
                            </motion.div>

                            {/* AI Actions Feed */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">AI Actions Feed</h3>
                                    <button className="text-xs font-semibold text-primary hover:text-blue-700">View All</button>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                    {[
                                        { title: 'Optimized Product Title', time: '2h ago', desc: 'Changed title to "Summer Floral Maxi Dress - Boho Style" for better SEO.', impact: '+12% Click-through exp.', active: true },
                                        { title: 'Sent Recovery Emails', time: '5h ago', desc: 'Triggered sequence for 45 abandoned carts.', impact: null, active: false },
                                        { title: 'Pricing Adjustment', time: 'Yesterday', desc: 'Adjusted bundle "Summer Set" pricing to $120 based on demand.', impact: null, active: false },
                                    ].map((item) => (
                                        <div key={item.title} className={`relative pl-6 border-l ${item.active ? 'border-primary/30' : 'border-slate-200'} pb-2`}>
                                            <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ${item.active ? 'bg-primary' : 'bg-slate-300'} ring-4 ring-white`} />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-900">{item.title}</span>
                                                    <span className="text-xs text-slate-400">{item.time}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 leading-snug">{item.desc}</p>
                                                {item.impact && (
                                                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                                        {item.impact}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
