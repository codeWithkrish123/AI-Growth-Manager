import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const Reveal = ({ children, delay = 0, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px"
            }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={ref}
            className={`transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${isVisible
                ? "opacity-100 translate-y-0 blur-0"
                : "opacity-0 translate-y-[60px] blur-[4px]"
                } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    )
}

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.12 } }
}

export default function LandingPage() {
    const [selectedPlan, setSelectedPlan] = useState('growth')
    return (
        <div className="bg-white text-slate-900 overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                            <span className="material-symbols-outlined fill text-[20px]">auto_graph</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">AI Growth Manager</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" href="#features">Features</a>
                        <a className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/pricing">Pricing</Link>
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/resources">Resources</Link>
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/about">About</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link className="hidden sm:block text-sm font-medium text-slate-900 hover:text-primary transition-colors" to="/signin">Log in</Link>
                        <Link to="/signin" className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-all">
                            Start Trial
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex flex-col">
                {/* Hero Section */}
                <Reveal>
                    <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                        <div className="absolute inset-0 -z-10 hero-glow" />
                        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
                        <div className="absolute top-40 -left-20 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[80px]" />
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                            <motion.div initial="hidden" animate="visible" variants={stagger}>
                                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8">
                                    <span className="flex h-2 w-2 rounded-full bg-primary" />
                                    Now with GPT-4 Omni Integration
                                </motion.div>
                                <motion.h1 variants={fadeUp} className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl mb-6">
                                    Your <span className="gradient-text">AI Growth Manager</span> for Shopify
                                </motion.h1>
                                <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
                                    Stop guessing with your ads. Our AI automatically optimizes your revenue, lowers CAC, and scales your winning products 24/7.
                                </motion.p>
                                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                                    <Link to="/signin" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all hover:-translate-y-0.5">
                                        Start Free Trial
                                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                    </Link>
                                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                                        <span className="material-symbols-outlined text-[20px] text-primary">play_circle</span>
                                        See How It Works
                                    </button>
                                </motion.div>
                                {/* Dashboard Preview */}
                                <motion.div variants={fadeUp} className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                                    <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                                <div className="h-3 w-3 rounded-full bg-green-400" />
                                                <div className="flex-1 h-5 bg-white rounded-full mx-4 border border-slate-200" />
                                            </div>
                                            <div className="grid grid-cols-4 gap-3 flex-1">
                                                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 col-span-1">
                                                    <p className="text-xs text-slate-400 font-medium">Health Score</p>
                                                    <p className="text-2xl font-bold text-slate-900 mt-1">94<span className="text-sm text-slate-400">/100</span></p>
                                                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-primary w-[94%] rounded-full" /></div>
                                                </div>
                                                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 col-span-1">
                                                    <p className="text-xs text-slate-400 font-medium">AI Revenue</p>
                                                    <p className="text-2xl font-bold text-primary mt-1">$12,430</p>
                                                    <p className="text-xs text-emerald-600 mt-1">↑ 14x ROI</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 col-span-1">
                                                    <p className="text-xs text-slate-400 font-medium">Conv. Rate</p>
                                                    <p className="text-2xl font-bold text-slate-900 mt-1">2.4%</p>
                                                    <p className="text-xs text-emerald-600 mt-1">↑ +0.4%</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 col-span-1">
                                                    <p className="text-xs text-slate-400 font-medium">Avg Order</p>
                                                    <p className="text-2xl font-bold text-slate-900 mt-1">$85</p>
                                                    <p className="text-xs text-emerald-600 mt-1">↑ +$5</p>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 h-32 relative overflow-hidden">
                                                <p className="text-xs font-semibold text-slate-500 mb-2">Revenue Overview</p>
                                                <svg className="w-full h-20" viewBox="0 0 400 80" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                                                            <stop offset="0%" stopColor="#135bec" stopOpacity="0.15" />
                                                            <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M0,70 C80,60 120,40 200,30 S320,20 400,10" fill="url(#revGrad)" stroke="#135bec" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                                                    <path d="M0,75 C80,70 120,60 200,55 S320,48 400,45" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Floating Badge */}
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute -right-6 top-12 hidden lg:flex items-center gap-3 rounded-xl border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur-md"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <span className="material-symbols-outlined">trending_up</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Revenue Optimized</p>
                                            <p className="text-lg font-bold text-slate-900">+$12,450</p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </section>
                </Reveal>

                {/* Social Proof */}
                <Reveal delay={200}>
                    <section className="border-y border-slate-100 bg-slate-50/50 py-10">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                            <p className="mb-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Trusted by 500+ High-Growth Shopify Stores</p>
                            <div className="flex flex-wrap justify-center gap-10 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                {['Google', 'Shopify', 'Amazon', 'Stripe', 'IBM'].map((name) => (
                                    <div key={name} className="text-xl font-bold text-slate-700">{name}</div>
                                ))}
                            </div>
                        </div>
                    </section>
                </Reveal>

                {/* Problem Section */}
                <Reveal>
                    <section id="features" className="py-24 bg-white relative">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
                                <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">The Problem: Manual Growth is Slow</motion.h2>
                                <motion.p variants={fadeUp} className="text-lg text-slate-600">Stop wasting budget on manual testing. Most store owners lose 30% of ad spend on inefficient targeting and slow reaction times.</motion.p>
                            </motion.div>
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { icon: 'credit_card_off', bg: 'bg-red-50', color: 'text-red-600', hoverBg: 'group-hover:bg-red-100', title: 'Manual Ad Spend', desc: 'Wasting hours tweaking bids manually instead of letting AI decide instantly based on real-time data.' },
                                    { icon: 'trending_down', bg: 'bg-amber-50', color: 'text-amber-600', hoverBg: 'group-hover:bg-amber-100', title: 'Lost Revenue', desc: 'Missed opportunities on trending products due to slow reaction times to market shifts.' },
                                    { icon: 'dataset', bg: 'bg-slate-50', color: 'text-slate-600', hoverBg: 'group-hover:bg-slate-100', title: 'Data Overload', desc: 'Drowning in spreadsheets rather than actionable growth insights that move the needle.' },
                                ].map((card) => (
                                    <motion.div key={card.title} variants={fadeUp} className="group relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                                        <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} ${card.color} ${card.hoverBg} transition-colors`}>
                                            <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
                                        </div>
                                        <h3 className="mb-3 text-xl font-bold text-slate-900">{card.title}</h3>
                                        <p className="text-slate-600 leading-relaxed">{card.desc}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </section>
                </Reveal>

                {/* Solution Section */}
                <Reveal>
                    <section className="py-24 bg-slate-50 overflow-hidden">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12 lg:mb-0">
                                    <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-6">
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        AI-Powered Solution
                                    </motion.div>
                                    <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">Turn Data into Decisions Automatically</motion.h2>
                                    <motion.p variants={fadeUp} className="text-lg text-slate-600 mb-8">Our Optimization Engine connects directly to your store and ad accounts. It analyzes 10,000+ data points per second to make profitable decisions while you sleep.</motion.p>
                                    <motion.div variants={stagger} className="space-y-6">
                                        {[
                                            { title: 'AI Health Score', desc: 'Get a single metric that tells you exactly how your business is performing and where to improve.' },
                                            { title: 'Auto-Scaling', desc: 'Automatically increase budget on winning campaigns and kill losers instantly.' },
                                        ].map((item) => (
                                            <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <span className="material-symbols-outlined text-lg">check</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                                                    <p className="text-slate-600 mt-1">{item.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative">
                                    <div className="relative rounded-2xl bg-white p-6 shadow-xl border border-slate-100 z-10">
                                        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Store Health</p>
                                                <h3 className="text-2xl font-bold text-slate-900">94/100</h3>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                                                <span className="material-symbols-outlined">trending_up</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Ad Spend Efficiency', badge: '+12%', badgeColor: 'text-green-600 bg-green-50', bar: 'w-[85%] bg-primary' },
                                                { label: 'Conversion Rate', badge: '+4.2%', badgeColor: 'text-green-600 bg-green-50', bar: 'w-[65%] bg-purple-500' },
                                                { label: 'Customer LTV', badge: 'Stable', badgeColor: 'text-slate-600 bg-slate-200', bar: 'w-[92%] bg-slate-400' },
                                            ].map((item) => (
                                                <div key={item.label} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                        <div className={`h-full ${item.bar} rounded-full`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-purple-200 opacity-30 blur-3xl" />
                                    <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-blue-200 opacity-30 blur-3xl" />
                                </motion.div>
                            </div>
                        </div>
                    </section>
                </Reveal>

                {/* How It Works */}
                <Reveal>
                    <section id="how-it-works" className="py-24 bg-white">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                                <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How It Works</motion.h2>
                                <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-600">Get started in minutes, not days.</motion.p>
                            </motion.div>
                            <div className="relative">
                                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-primary/30 to-slate-200" />
                                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {[
                                        { icon: 'link', step: '1. Connect', desc: 'Securely link your Shopify store and ad accounts with one click.' },
                                        { icon: 'analytics', step: '2. Analyze', desc: 'Our AI scans your historical data to identify winning patterns.' },
                                        { icon: 'rocket_launch', step: '3. Grow', desc: 'Watch as the AI optimizes your campaigns and scales revenue.' },
                                    ].map((item) => (
                                        <motion.div key={item.step} variants={fadeUp} className="relative flex flex-col items-center text-center">
                                            <div className="z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-lg mb-6 text-primary">
                                                <span className="material-symbols-outlined text-4xl">{item.icon}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.step}</h3>
                                            <p className="text-slate-600">{item.desc}</p>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </section>
                </Reveal>

                {/* Testimonials */}
                <Reveal>
                    <section className="py-24 bg-slate-50">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold tracking-tight text-slate-900 text-center sm:text-4xl mb-16">What Founders Are Saying</motion.h2>
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { quote: '"This tool paid for itself in the first 4 hours. The AI caught a losing ad set that I had missed for days."', name: 'Sarah Jenkins', role: 'Founder, GlowBeauty', avatar: 'SJ' },
                                    { quote: '"Finally, I can sleep without worrying about my ad spend. The automated rules are a game changer for scaling."', name: 'Mark Davis', role: 'CEO, TechGear', avatar: 'MD' },
                                    { quote: '"The data visualization is stunning. It simplifies complex metrics into something actionable instantly."', name: 'Elena Rodriguez', role: 'Marketing Director, PureLife', avatar: 'ER' },
                                ].map((t) => (
                                    <motion.div key={t.name} variants={fadeUp} className="flex flex-col rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-1 text-yellow-400 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="material-symbols-outlined fill text-sm">star</span>
                                            ))}
                                        </div>
                                        <p className="text-slate-700 mb-6 flex-grow">{t.quote}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">{t.avatar}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                                <p className="text-xs text-slate-500">{t.role}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </section>
                </Reveal>

                {/* Pricing Preview */}
                <Reveal>
                    <section className="py-24 bg-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                                <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple Pricing for Every Stage</motion.h2>
                                <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-600">Start free, upgrade as you grow.</motion.p>
                            </motion.div>
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                <motion.div
                                    variants={fadeUp}
                                    onClick={() => setSelectedPlan('starter')}
                                    className={`rounded-2xl border p-8 shadow-sm cursor-pointer transition-all duration-300 ${selectedPlan === 'starter'
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-105 shadow-xl'
                                            : 'border-slate-200 bg-white hover:border-primary/40'
                                        }`}
                                >
                                    <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                                    <div className="mt-4 flex items-baseline"><span className="text-4xl font-bold tracking-tight text-slate-900">$49</span><span className="ml-1 text-sm font-semibold text-slate-500">/month</span></div>
                                    <p className="mt-4 text-sm text-slate-600">Perfect for new stores just getting started.</p>
                                    <ul className="mt-6 space-y-4">
                                        {['Up to $5k ad spend', 'Basic AI Optimization', 'Email Support'].map(f => (
                                            <li key={f} className="flex items-start"><span className="material-symbols-outlined text-green-500 text-lg mr-2">check</span><span className="text-sm text-slate-600">{f}</span></li>
                                        ))}
                                    </ul>
                                    <Link to="/pricing" className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${selectedPlan === 'starter' ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                                        }`}>
                                        {selectedPlan === 'starter' ? 'Proceed with Starter' : 'Select Starter'}
                                    </Link>
                                </motion.div>
                                <motion.div
                                    variants={fadeUp}
                                    onClick={() => setSelectedPlan('growth')}
                                    className={`relative rounded-2xl border-2 p-8 shadow-xl transition-all duration-300 cursor-pointer z-10 scale-105 ${selectedPlan === 'growth'
                                            ? 'border-primary ring-4 ring-primary/20 bg-white rotate-0'
                                            : 'border-slate-200 bg-white opacity-90'
                                        }`}
                                >
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">Most Popular</div>
                                    <h3 className="text-lg font-semibold text-primary">Growth</h3>
                                    <div className="mt-4 flex items-baseline"><span className="text-4xl font-bold tracking-tight text-slate-900">$99</span><span className="ml-1 text-sm font-semibold text-slate-500">/month</span></div>
                                    <p className="mt-4 text-sm text-slate-600">For scaling brands that need full power.</p>
                                    <ul className="mt-6 space-y-4">
                                        {['Up to $25k ad spend', 'Advanced AI Rules', 'Hourly Optimization', 'Priority Chat Support'].map(f => (
                                            <li key={f} className="flex items-start"><span className="material-symbols-outlined text-primary text-lg mr-2">check</span><span className="text-sm text-slate-900 font-medium">{f}</span></li>
                                        ))}
                                    </ul>
                                    <Link to="/signin" className="mt-8 block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all">
                                        {selectedPlan === 'growth' ? 'Proceed with Growth' : 'Select Growth'}
                                    </Link>
                                </motion.div>
                                <motion.div
                                    variants={fadeUp}
                                    onClick={() => setSelectedPlan('pro')}
                                    className={`rounded-2xl border p-8 shadow-sm cursor-pointer transition-all duration-300 ${selectedPlan === 'pro'
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-105 shadow-xl'
                                            : 'border-slate-200 bg-white hover:border-primary/40'
                                        }`}
                                >
                                    <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
                                    <div className="mt-4 flex items-baseline"><span className="text-4xl font-bold tracking-tight text-slate-900">$299</span><span className="ml-1 text-sm font-semibold text-slate-500">/month</span></div>
                                    <p className="mt-4 text-sm text-slate-600">Enterprise grade for high volume stores.</p>
                                    <ul className="mt-6 space-y-4">
                                        {['Unlimited ad spend', 'Custom AI Models', 'Dedicated Account Manager'].map(f => (
                                            <li key={f} className="flex items-start"><span className="material-symbols-outlined text-green-500 text-lg mr-2">check</span><span className="text-sm text-slate-600">{f}</span></li>
                                        ))}
                                    </ul>
                                    <Link to="/pricing" className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${selectedPlan === 'pro' ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                                        }`}>
                                        {selectedPlan === 'pro' ? 'Proceed with Pro' : 'Select Pro'}
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>
                    </section>
                </Reveal>

                {/* CTA */}
                <Reveal>
                    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#135bec_1px,transparent_1px),linear-gradient(to_bottom,#135bec_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10" />
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">Ready to scale your store?</motion.h2>
                            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">Join the new wave of e-commerce growth. No credit card required for the trial.</motion.p>
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <motion.div variants={fadeUp}>
                                    <Link to="/signin" className="w-full sm:w-auto rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-primary-dark hover:scale-105 transition-all inline-block">Get Started for Free</Link>
                                </motion.div>
                                <motion.div variants={fadeUp}>
                                    <button className="w-full sm:w-auto rounded-xl border border-slate-700 bg-transparent px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-all">Book a Demo</button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </section>
                </Reveal>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white">
                                    <span className="material-symbols-outlined fill text-[16px]">auto_graph</span>
                                </div>
                                <span className="text-lg font-bold text-slate-900">AI Growth Manager</span>
                            </div>
                            <p className="text-sm text-slate-500 max-w-xs mb-6">The #1 AI-powered growth tool for Shopify merchants. Scale your ads, optimize your funnel, and grow your revenue automatically.</p>
                        </div>
                        {[
                            { title: 'Product', links: ['Features', 'Integrations', 'Pricing', 'Roadmap'] },
                            { title: 'Resources', links: ['Blog', 'Documentation', 'Community', 'Help Center'] },
                            { title: 'Company', links: ['About', 'Careers', 'Legal', 'Privacy'] },
                        ].map((col) => (
                            <div key={col.title}>
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">{col.title}</h3>
                                <ul className="space-y-3">
                                    {col.links.map(link => <li key={link}><a className="text-sm text-slate-600 hover:text-primary" href="#">{link}</a></li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-400">© 2024 AI Growth Manager. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a className="text-sm text-slate-400 hover:text-slate-600" href="#">Privacy Policy</a>
                            <a className="text-sm text-slate-400 hover:text-slate-600" href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
