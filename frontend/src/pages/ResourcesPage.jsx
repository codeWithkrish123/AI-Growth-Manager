import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

const CATEGORIES = ['All', 'Guides', 'Case Studies', 'Blog', 'Videos', 'Templates']

const RESOURCES = [
    {
        id: 1, category: 'Guides', badge: 'New',
        icon: 'rocket_launch', color: 'text-indigo-600', bg: 'bg-indigo-50',
        title: 'The Ultimate Guide to AI Ad Optimization for Shopify',
        desc: 'Learn how to leverage AI to cut your customer acquisition cost by 40% and scale winning campaigns automatically.',
        readTime: '12 min read', date: 'Feb 18, 2026', featured: true,
    },
    {
        id: 2, category: 'Case Studies', badge: 'Popular',
        icon: 'trending_up', color: 'text-emerald-600', bg: 'bg-emerald-50',
        title: 'How GlowBeauty Scaled from $30K to $120K/month in 90 days',
        desc: 'A deep-dive into the exact AI rules and automation sequences that quadrupled their revenue.',
        readTime: '8 min read', date: 'Feb 12, 2026', featured: false,
    },
    {
        id: 3, category: 'Blog',
        icon: 'article', color: 'text-amber-600', bg: 'bg-amber-50',
        title: 'Why Your ROAS is Lying to You (And What to Track Instead)',
        desc: 'ROAS is the most misunderstood metric in e-commerce. Here\'s the full picture and what actually matters.',
        readTime: '6 min read', date: 'Feb 9, 2026', featured: false,
    },
    {
        id: 4, category: 'Videos',
        icon: 'play_circle', color: 'text-rose-600', bg: 'bg-rose-50',
        title: 'Dashboard Walkthrough: Setting Up Your First AI Campaign',
        desc: 'A step-by-step video walkthrough to configure your AI Growth Manager from scratch in under 15 minutes.',
        readTime: '15 min watch', date: 'Feb 5, 2026', featured: false,
    },
    {
        id: 5, category: 'Templates', badge: 'Free',
        icon: 'description', color: 'text-purple-600', bg: 'bg-purple-50',
        title: 'AI Health Score Audit Template (Google Sheets)',
        desc: 'A free, pre-built spreadsheet to audit your store health score and identify the top 3 growth levers.',
        readTime: 'Template', date: 'Jan 28, 2026', featured: false,
    },
    {
        id: 6, category: 'Guides',
        icon: 'school', color: 'text-sky-600', bg: 'bg-sky-50',
        title: 'Beginner\'s Guide to Lookalike Audiences with AI Signals',
        desc: 'How to feed your AI health data back into Meta and Google Ads for 2x better lookalike performance.',
        readTime: '10 min read', date: 'Jan 22, 2026', featured: false,
    },
    {
        id: 7, category: 'Case Studies',
        icon: 'store', color: 'text-teal-600', bg: 'bg-teal-50',
        title: 'TechGear Pro\'s Black Friday Playbook Using AI Automation',
        desc: 'How a gadgets brand generated $480K in BFCM revenue using AI-powered campaign scheduling and budget rules.',
        readTime: '9 min read', date: 'Jan 15, 2026', featured: false,
    },
    {
        id: 8, category: 'Blog',
        icon: 'psychology', color: 'text-orange-600', bg: 'bg-orange-50',
        title: 'The Machine Learning Models Behind Your Health Score',
        desc: 'A technical peek into how our AI processes 10,000+ signals per second to give you a single actionable number.',
        readTime: '7 min read', date: 'Jan 8, 2026', featured: false,
    },
    {
        id: 9, category: 'Templates', badge: 'Free',
        icon: 'table_chart', color: 'text-cyan-600', bg: 'bg-cyan-50',
        title: 'Monthly ROI Tracker — AI Campaign Edition',
        desc: 'Track AI-assisted vs manual campaign performance month over month with automated trend calculations.',
        readTime: 'Template', date: 'Dec 30, 2025', featured: false,
    },
]

const QUICK_LINKS = [
    { icon: 'menu_book', label: 'Documentation', color: 'text-primary bg-primary/10', desc: 'Full API & integration docs' },
    { icon: 'forum', label: 'Community', color: 'text-purple-600 bg-purple-100', desc: 'Join 2,000+ Shopify growth hackers' },
    { icon: 'headset_mic', label: 'Help Center', color: 'text-emerald-600 bg-emerald-100', desc: '200+ guides & tutorials' },
    { icon: 'calendar_month', label: 'Book a Demo', color: 'text-amber-600 bg-amber-100', desc: 'Get a 30-min personalized walkthrough' },
]

export default function ResourcesPage() {
    const [active, setActive] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [email, setEmail] = useState('')
    const [subscribed, setSubscribed] = useState(false)

    useEffect(() => {
        document.title = 'Resources – AI Growth Manager | Guides, Case Studies & Templates'
        document.querySelector('meta[name="description"]')?.setAttribute('content', 'Free guides, case studies, templates, and videos to help you scale your Shopify store with AI. Learn from expert growth strategies.')
    }, [])

    const filtered = (active === 'All' ? RESOURCES : RESOURCES.filter(r => r.category === active))
        .filter(r =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.category.toLowerCase().includes(searchQuery.toLowerCase())
        )

    const handleSubscribe = (e) => {
        e.preventDefault()
        if (email) { setSubscribed(true) }
    }

    return (
        <div className="bg-white text-slate-900 min-h-screen overflow-x-hidden">
            {/* Navbar */}
            <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                            <span className="material-symbols-outlined fill text-[20px]">auto_graph</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">AI Growth Manager</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/#features">Features</Link>
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/pricing">Pricing</Link>
                        <Link className="text-sm font-medium text-primary font-semibold" to="/resources">Resources</Link>
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/about">About</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link to="/signin" className="text-sm font-medium text-slate-700 hover:text-primary transition-colors">Sign in</Link>
                        <Link to="/signin" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-all">
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-primary/8 blur-[120px]" />
                <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={stagger}>
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-primary" />
                            Learning Hub
                        </motion.div>
                        <motion.h1 variants={fadeUp} className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-5">
                            Grow smarter with<br /><span className="gradient-text">expert resources</span>
                        </motion.h1>
                        <motion.p variants={fadeUp} className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                            Guides, case studies, templates, and videos to help you scale your Shopify store with AI — all free.
                        </motion.p>
                        {/* Search bar */}
                        <motion.div variants={fadeUp} className="relative max-w-md mx-auto">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                placeholder="Search guides, case studies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Quick Links */}
            <section className="border-y border-slate-100 bg-slate-50/50 py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {QUICK_LINKS.map((q) => (
                            <motion.button key={q.label} variants={fadeUp}
                                onClick={() => {
                                    if (q.label === 'Documentation') window.open('https://docs.example.com', '_blank');
                                    else if (q.label === 'Book a Demo') window.location.href = '/signin';
                                    else setActive('All');
                                }}
                                className="group flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all w-full text-left"
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${q.color} transition-all group-hover:scale-110`}>
                                    <span className="material-symbols-outlined text-[22px]">{q.icon}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{q.label}</p>
                                    <p className="text-xs text-slate-500">{q.desc}</p>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Main content */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Category filter */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="flex flex-wrap gap-2 mb-10">
                        {CATEGORIES.map((cat) => (
                            <button key={cat} onClick={() => setActive(cat)}
                                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${active === cat
                                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {cat}
                            </button>
                        ))}
                    </motion.div>

                    {/* Featured card (only in All) */}
                    <AnimatePresence mode="wait">
                        {active === 'All' && (
                            <motion.div key="featured" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-10 rounded-3xl bg-gradient-to-br from-primary to-indigo-700 p-px shadow-xl">
                                <div className="rounded-3xl bg-gradient-to-br from-primary/95 to-indigo-700 p-8 md:p-12 flex flex-col md:flex-row items-start gap-8">
                                    <div className="flex-1">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-4">
                                            <span className="material-symbols-outlined text-sm">star</span>
                                            Featured Resource
                                        </span>
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                                            {RESOURCES[0].title}
                                        </h2>
                                        <p className="text-indigo-100 text-base mb-6 max-w-xl">
                                            {RESOURCES[0].desc}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-indigo-50 transition-all shadow-lg">
                                                Read Guide
                                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                            </button>
                                            <span className="text-indigo-200 text-sm">{RESOURCES[0].readTime}</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col gap-3 min-w-[200px]">
                                        {['Meta Ads Integration', 'Google Ads Sync', 'Real-time Optimization'].map(t => (
                                            <div key={t} className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5">
                                                <span className="material-symbols-outlined text-green-300 text-[18px]">check_circle</span>
                                                <span className="text-white text-sm font-medium">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grid */}
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filtered.filter(r => !r.featured || active !== 'All').map((r) => (
                                <motion.article
                                    key={r.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => alert(`Opening resource: ${r.title}`)}
                                    className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.bg} ${r.color}`}>
                                            <span className="material-symbols-outlined">{r.icon}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {r.badge && (
                                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{r.badge}</span>
                                            )}
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{r.category}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors leading-snug">
                                        {r.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-4">{r.desc}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
                                        <span>{r.date}</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">{r.category === 'Videos' ? 'play_arrow' : 'schedule'}</span>
                                            {r.readTime}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all pointer-events-none" />
                                </motion.article>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="py-20 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(19,91,236,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(19,91,236,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="mx-auto max-w-2xl px-4 text-center relative z-10">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="flex h-14 w-14 mx-auto mb-6 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined text-3xl">mail</span>
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="text-3xl font-extrabold text-white mb-3">
                            Get weekly AI growth tactics
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-slate-400 mb-8">
                            Join 4,200+ Shopify founders who get our best guides delivered every Monday. No spam, ever.
                        </motion.p>
                        <AnimatePresence mode="wait">
                            {subscribed ? (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-4 text-emerald-300 font-semibold">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    You're in! Check your inbox 🎉
                                </motion.div>
                            ) : (
                                <motion.form key="form" variants={fadeUp} onSubmit={handleSubscribe}
                                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        placeholder="your@email.com"
                                    />
                                    <button type="submit"
                                        className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all whitespace-nowrap">
                                        Subscribe Free
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white">
                            <span className="material-symbols-outlined fill text-[16px]">auto_graph</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">AI Growth Manager</span>
                    </Link>
                    <p className="text-sm text-slate-400">© 2026 AI Growth Manager. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Privacy</a>
                        <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
