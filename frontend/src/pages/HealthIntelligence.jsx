import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const sideNavItems = [
    { icon: 'grid_view', label: 'Overview', to: '/dashboard' },
    { icon: 'ecg_heart', label: 'Health Score', to: '/health', active: true },
    { icon: 'inventory_2', label: 'Products', to: '/products' },
    { icon: 'smart_toy', label: 'AI Actions', to: '/ai-actions' },
    { icon: 'mail', label: 'Emails', to: '/emails' },
    { icon: 'monetization_on', label: 'Revenue Impact', to: '/revenue' },
    { icon: 'settings', label: 'Settings', to: '/settings' },
]

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } })
}

export default function HealthIntelligence() {
    const location = useLocation()

    return (
        <div className="flex min-h-screen w-full flex-col bg-background-light font-display">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-slate-900">
                        <div className="size-8 text-primary"><span className="material-symbols-outlined text-3xl">smart_toy</span></div>
                        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Store Intelligence</h2>
                    </div>
                    <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                            <div className="text-slate-500 flex border-none bg-slate-100 items-center justify-center pl-4 rounded-l-xl border-r-0">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </div>
                            <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 focus:outline-0 focus:ring-0 border-none bg-slate-100 focus:border-none h-full placeholder:text-slate-500 px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal" placeholder="Search metrics..." />
                        </div>
                    </label>
                </div>
                <div className="flex flex-1 justify-end gap-6 items-center">
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link to="/dashboard" className="text-slate-600 hover:text-primary text-sm font-medium transition-colors">Dashboard</Link>
                        <a className="text-primary text-sm font-medium" href="#">Analytics</a>
                        <a className="text-slate-600 hover:text-primary text-sm font-medium transition-colors" href="#">Campaigns</a>
                        <a className="text-slate-600 hover:text-primary text-sm font-medium transition-colors" href="#">Settings</a>
                    </nav>
                    <button className="relative bg-slate-100 p-2 rounded-full text-slate-600 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    <div className="bg-gradient-to-br from-primary to-purple-600 rounded-full size-10 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm">SJ</div>
                </div>
            </header>

            <main className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white p-4 gap-2 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex gap-3 p-2 bg-slate-50 rounded-lg">
                            <div className="bg-gradient-to-br from-primary to-purple-500 rounded-lg size-10 flex items-center justify-center text-white font-bold text-sm">ME</div>
                            <div className="flex flex-col justify-center">
                                <h1 className="text-slate-900 text-sm font-semibold leading-tight">My Eco Store</h1>
                                <p className="text-primary text-xs font-medium">Pro Plan</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {sideNavItems.map((item) => {
                            const isActive = location.pathname === item.to
                            return (
                                <Link key={item.label} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <span className={`material-symbols-outlined group-hover:text-primary transition-colors ${isActive ? 'fill-current' : ''}`}>{item.icon}</span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-200">
                        <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-xl border border-primary/20">
                            <div className="flex items-center gap-2 mb-2 text-primary">
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                <span className="text-xs font-bold uppercase">AI Insight</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-3 leading-relaxed">Your conversion rate dropped by 0.4% this weekend. Check your checkout flow.</p>
                            <button className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                                Fix Issue <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-background-light">
                    {/* Breadcrumb & Actions */}
                    <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-b border-slate-100">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <a className="hover:text-primary transition-colors" href="#">Analytics</a>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-slate-900 font-medium">Store Health</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">AI Store Health Intelligence</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-base">calendar_month</span>
                                <span>Last 30 Days</span>
                                <span className="material-symbols-outlined text-base ml-1">expand_more</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-primary/20">
                                <span className="material-symbols-outlined text-base">download</span>
                                Export Report
                            </button>
                        </div>
                    </div>

                    <div className="px-6 pb-10 pt-6 space-y-6">
                        {/* Gauge & Metric Cards */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Gauge */}
                            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
                                className="xl:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <span className="material-symbols-outlined text-9xl">health_and_safety</span>
                                </div>
                                <h3 className="text-slate-500 font-medium text-sm mb-4 uppercase tracking-wider text-center w-full">Overall Health Score</h3>
                                <div className="relative w-48 h-48 flex items-center justify-center mb-2">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" fill="none" r="40" stroke="#e2e8f0" strokeWidth="8" />
                                        <circle cx="50" cy="50" fill="none" r="40" stroke="#135bec" strokeDasharray="251.2" strokeDashoffset="70" strokeLinecap="round" strokeWidth="8" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black text-slate-900 tracking-tight">72</span>
                                        <span className="text-sm font-medium text-slate-500 mt-1">/ 100</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Good Condition</span>
                                    <p className="text-sm text-slate-500 mt-2">Your store is performing well, but there is room for optimization in email automation.</p>
                                </div>
                            </motion.div>

                            {/* Metric Cards */}
                            <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: 'shopping_cart_checkout', iconBg: 'bg-orange-100 text-orange-600', badge: 'Warning', badgeColor: 'text-orange-600 bg-orange-50', label: 'Conversion Rate', value: '3.2%', change: '-0.4%', changeColor: 'text-red-500', barColor: 'bg-orange-500', barWidth: 'w-[60%]', changeIcon: 'trending_down' },
                                    { icon: 'star', iconBg: 'bg-blue-100 text-blue-600', badge: 'Excellent', badgeColor: 'text-green-600 bg-green-50', label: 'Product Quality', value: '4.8', change: '/ 5.0', changeColor: 'text-slate-400', barColor: 'bg-green-500', barWidth: 'w-[96%]', changeIcon: null },
                                    { icon: 'mail', iconBg: 'bg-purple-100 text-purple-600', badge: 'Critical', badgeColor: 'text-red-600 bg-red-50', label: 'Email Open Rate', value: '12%', change: '-5.2%', changeColor: 'text-red-500', barColor: 'bg-red-500', barWidth: 'w-[24%]', changeIcon: 'trending_down' },
                                    { icon: 'monetization_on', iconBg: 'bg-teal-100 text-teal-600', badge: 'Average', badgeColor: 'text-slate-600 bg-slate-100', label: 'Ad ROI', value: '$1.20', change: '+$0.05', changeColor: 'text-green-500', barColor: 'bg-slate-400', barWidth: 'w-[50%]', changeIcon: 'trending_up' },
                                ].map((m, i) => (
                                    <motion.div key={m.label} custom={i + 1} initial="hidden" animate="visible" variants={fadeUp}
                                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`${m.iconBg} p-2 rounded-lg`}><span className="material-symbols-outlined">{m.icon}</span></div>
                                            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded ${m.badgeColor}`}>{m.badge}</span>
                                        </div>
                                        <h4 className="text-slate-500 text-sm font-medium mb-1">{m.label}</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-slate-900">{m.value}</span>
                                            <span className={`text-xs font-medium ${m.changeColor} flex items-center`}>
                                                {m.changeIcon && <span className="material-symbols-outlined text-sm">{m.changeIcon}</span>}
                                                {m.change}
                                            </span>
                                        </div>
                                        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${m.barColor} ${m.barWidth} rounded-full`} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations & Projection Chart */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* AI Recommendations */}
                            <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">auto_fix_high</span>
                                            AI Improvement Suggestions
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Actions to improve your store health score.</p>
                                    </div>
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">2 High Priority</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2">
                                    {[
                                        { icon: 'link_off', iconBg: 'bg-red-100 text-red-600', title: 'Fix Broken Links in Checkout', desc: '4 broken links detected on critical path causing drop-offs.', impact: 'High', impactColor: 'bg-red-500', result: '+1.2% Conv.', btnText: 'Apply Fix', btnClass: 'bg-slate-900 text-white hover:opacity-90' },
                                        { icon: 'mark_email_unread', iconBg: 'bg-purple-100 text-purple-600', title: 'Activate Abandoned Cart Sequence', desc: 'AI generated a 3-part email sequence for high-value carts.', impact: 'Medium', impactColor: 'bg-orange-500', result: '+8% Recovery', btnText: 'Review', btnClass: 'border border-slate-300 text-slate-700 hover:bg-slate-50' },
                                        { icon: 'image', iconBg: 'bg-blue-100 text-blue-600', title: 'Optimize Product Images', desc: 'Compress 12 large images to improve load speed by 0.8s.', impact: 'Low', impactColor: 'bg-green-500', result: 'SEO Boost', btnText: 'Optimize', btnClass: 'border border-slate-300 text-slate-700 hover:bg-slate-50' },
                                    ].map((s) => (
                                        <div key={s.title} className="p-4 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-100 last:border-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                            <div className={`p-3 ${s.iconBg} rounded-full flex-shrink-0`}><span className="material-symbols-outlined">{s.icon}</span></div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-slate-900">{s.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impact:</span>
                                                    <span className={`text-[10px] font-bold text-white ${s.impactColor} px-2 py-0.5 rounded-full`}>{s.impact}</span>
                                                    <span className="text-[10px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full ml-auto sm:ml-0">{s.result}</span>
                                                </div>
                                            </div>
                                            <button className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg transition-all ${s.btnClass}`}>{s.btnText}</button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Projection Chart */}
                            <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Projected Revenue Impact</h3>
                                        <p className="text-sm text-slate-500">Potential growth after applying AI recommendations.</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300" /><span className="text-slate-600">Current</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary shadow shadow-primary/40" /><span className="text-primary font-bold">Projected (AI)</span></div>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end justify-between gap-2 h-64 w-full relative pt-10">
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                                        {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-slate-100" />)}
                                    </div>
                                    {[
                                        { label: 'Week 1', currentH: '40%', projH: '55%' },
                                        { label: 'Week 2', currentH: '45%', projH: '62%' },
                                        { label: 'Week 3', currentH: '38%', projH: '68%' },
                                        { label: 'Week 4', currentH: '50%', projH: '75%' },
                                        { label: 'Week 5', currentH: '55%', projH: '85%', highlight: true },
                                    ].map((bar) => (
                                        <div key={bar.label} className="relative z-10 flex flex-col items-center justify-end h-full w-full group">
                                            <div className="flex gap-1 items-end w-full justify-center h-full px-2">
                                                <div className="w-3 bg-slate-300 rounded-t-sm group-hover:bg-slate-400 transition-all" style={{ height: bar.currentH }} />
                                                <div className={`w-3 rounded-t-sm transition-all group-hover:bg-primary ${bar.highlight ? 'bg-primary relative shadow-lg shadow-primary/30' : 'bg-primary/40'}`} style={{ height: bar.projH }}>
                                                    {bar.highlight && (
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">+35% Growth</div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-2">{bar.label}</span>
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
