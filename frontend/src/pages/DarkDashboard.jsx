import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    Zap,
    Settings,
    HelpCircle,
    Bell,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Activity,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const DarkDashboard = () => {
    const location = useLocation();
    const isOptimized = new URLSearchParams(location.search).get('optimized') === 'true';
    const [healthScore, setHealthScore] = useState(0);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (isOptimized) {
            setShowBanner(true);
            setHealthScore(62);
            const timer = setTimeout(() => {
                setHealthScore(96);
            }, 800);
            const bannerTimer = setTimeout(() => setShowBanner(false), 5000);
            return () => {
                clearTimeout(timer);
                clearTimeout(bannerTimer);
            };
        } else {
            const timer = setTimeout(() => setHealthScore(84), 500);
            return () => clearTimeout(timer);
        }
    }, [isOptimized]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', active: true },
        { icon: TrendingUp, label: 'Analytics', active: false },
        { icon: Users, label: 'Customers', active: false },
        { icon: Zap, label: 'AI Intelligence', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    const suggestions = [
        { title: 'Optimize low-converting products', priority: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'A/B Test Checkout Flow', priority: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: 'Retarget abandoned carts (last 24h)', priority: 'High', color: 'text-primary', bg: 'bg-primary/5' },
    ];

    const timeline = [
        ...(isOptimized ? [{ action: 'AI Optimization: Strategy Executed', time: 'Just now', icon: Sparkles }] : []),
        { action: 'AI Optimized Ad Spend', time: '2h ago', icon: Zap },
        { action: 'Inventory Alert: Product #402 Low', time: '5h ago', icon: AlertCircle },
        { action: 'Weekly Report Generated', time: 'Yesterday', icon: CheckCircle2 },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 flex selection:bg-primary/10 selection:text-primary">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 fixed h-screen z-20 shadow-sm">
                <Link to="/" className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <Zap className="w-5 h-5 text-white fill-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">GrowthAI</span>
                </Link>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${item.active
                                ? 'bg-primary/5 text-primary'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${item.active ? 'text-primary' : 'group-hover:text-slate-700'}`} />
                            <span className="text-sm font-bold">{item.label}</span>
                            {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-slate-100 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-slate-900 transition-colors">
                        <HelpCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">Support Center</span>
                    </button>
                    <div className="p-4 bg-slate-50 rounded-2xl mt-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Active Store</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                JS
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-900 truncate">John's Shop</p>
                                <p className="text-[10px] text-slate-500 truncate font-semibold">Growth Plan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 min-h-screen p-10 relative">
                <AnimatePresence>
                    {showBanner && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
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
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Monitor your store's AI performance and growth.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search analytics..."
                                className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all w-64 font-medium"
                            />
                        </div>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors relative shadow-sm">
                            <Bell className="w-5 h-5 text-slate-500" />
                            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8">
                    {/* Health Score Card */}
                    <div className="col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-center items-center relative overflow-hidden group">
                        <div className="absolute top-6 right-6">
                            <Sparkles className="w-6 h-6 text-primary/30 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="88"
                                    cy="88"
                                    r="78"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-slate-100"
                                />
                                <motion.circle
                                    cx="88"
                                    cy="88"
                                    r="78"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeDasharray={490}
                                    initial={{ strokeDashoffset: 490 }}
                                    animate={{ strokeDashoffset: 490 - (490 * healthScore) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="text-primary"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-slate-900 leading-none">{healthScore}</span>
                                <span className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">Score</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Excellent Health</h3>
                        <p className="text-sm text-slate-500 text-center font-medium leading-relaxed px-4">
                            Your store performance is $12k above average for your category.
                        </p>
                    </div>

                    {/* Revenue Sparkline Chart */}
                    <div className="col-span-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-black mb-2">Total AI Revenue</p>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-4xl font-black text-slate-900">$42,850.12</h3>
                                    <div className="flex items-center text-emerald-600 text-sm font-bold px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                        <TrendingUp className="w-4 h-4 mr-1.5" />
                                        +12.5%
                                    </div>
                                </div>
                            </div>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <button className="px-4 py-1.5 text-xs font-bold bg-white text-primary rounded-lg shadow-sm">Monthly</button>
                                <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">Yearly</button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[200px] relative mt-4">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#135bec" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    d="M0,80 Q10,75 20,85 T40,60 T60,70 T80,40 T100,50"
                                    fill="none"
                                    stroke="#135bec"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <motion.path
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1, duration: 1 }}
                                    d="M0,80 Q10,75 20,85 T40,60 T60,70 T80,40 T100,50 L100,100 L0,100 Z"
                                    fill="url(#chartGradient)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 pointer-events-none">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                                    <span key={m} className="text-[11px] text-slate-400 font-bold">{m}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Metric Card: AOV */}
                    <div className="col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all group">
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-4">Avg Order Value</p>
                        <div className="flex items-center justify-between">
                            <h4 className="text-3xl font-black text-slate-900">$85.40</h4>
                            <div className="w-16 h-8 overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                                <svg viewBox="0 0 100 40" className="w-full h-full flex-shrink-0">
                                    <path d="M0,30 Q25,10 50,25 T100,20" fill="none" stroke="#135bec" strokeWidth="3" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 mt-2">↑ 4.2% from last month</p>
                    </div>

                    {/* Metric Card: Conversion Rate */}
                    <div className="col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-4">Conversion Rate</p>
                        <h4 className="text-3xl font-black text-slate-900">2.41%</h4>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <TrendingUp className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold text-slate-600">+0.3% against market</span>
                        </div>
                    </div>

                    {/* AI Suggestions Panel */}
                    <div className="col-span-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-lg">Growth Recommendations</h3>
                            </div>
                            <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">View Intelligence</button>
                        </div>
                        <div className="space-y-4">
                            {suggestions.map((s, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer">
                                    <div className={`w-2 h-2 rounded-full ${s.bg === 'bg-emerald-50' ? 'bg-emerald-500' : s.bg === 'bg-amber-50' ? 'bg-amber-500' : 'bg-primary'}`} />
                                    <p className="text-sm font-bold flex-1 text-slate-700 transition-colors">{s.title}</p>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${s.bg} ${s.color}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{s.priority}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="col-span-12 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm mb-12">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" />
                                Recent Intelligence Actions
                            </h3>
                            <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="relative border-l-2 border-slate-100 ml-6 pl-10 space-y-10">
                            {timeline.map((t, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[54px] top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm">
                                        <t.icon className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{t.action}</p>
                                        <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-[0.1em] font-black">{t.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DarkDashboard;
