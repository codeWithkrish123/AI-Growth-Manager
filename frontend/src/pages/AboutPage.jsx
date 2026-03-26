import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }
const slideLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}
const slideRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

function AnimatedStat({ value, label, color }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-60px' })
    return (
        <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp}
            className="flex flex-col items-center text-center p-6">
            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className={`text-5xl font-extrabold tracking-tight ${color} mb-2`}>
                {value}
            </motion.span>
            <span className="text-sm font-medium text-slate-500">{label}</span>
        </motion.div>
    )
}

const TEAM = [
    {
        name: 'Rohan Malhotra', role: 'CEO & Co-Founder', avatar: 'RM',
        color: 'from-primary to-indigo-600',
        bio: 'Former Meta ads engineer. Built AI bidding systems that processed $2B+ in ad spend.',
        twitter: '#', linkedin: '#',
    },
    {
        name: 'Priya Sharma', role: 'CTO & Co-Founder', avatar: 'PS',
        color: 'from-purple-600 to-pink-600',
        bio: 'ML researcher ex-Google Brain. Designed the health score algorithm from the ground up.',
        twitter: '#', linkedin: '#',
    },
    {
        name: 'Alex Kim', role: 'Head of Growth', avatar: 'AK',
        color: 'from-emerald-500 to-teal-600',
        bio: 'Former Shopify merchant who turned $5K into $1.2M with AI-assisted advertising.',
        twitter: '#', linkedin: '#',
    },
    {
        name: 'Leila Hassan', role: 'Head of Design', avatar: 'LH',
        color: 'from-amber-500 to-orange-600',
        bio: 'Previously Stripe Design. Believes great software should feel like it reads your mind.',
        twitter: '#', linkedin: '#',
    },
]

const TIMELINE = [
    { year: '2022', title: 'The Problem Discovered', desc: 'Rohan and Priya noticed that most e-commerce growth was still painfully manual — a problem AI could elegantly solve.' },
    { year: '2023 Q1', title: 'First Prototype', desc: 'Built the first version of the Health Score algorithm, tested with 10 Shopify beta partners and saw a 28% average revenue lift.' },
    { year: '2023 Q3', title: 'Seed Round Raised', desc: 'Closed $2.4M seed round. Grew to 15 team members and 200 paying customers within 6 months of launch.' },
    { year: '2024', title: 'GPT-4 Integration', desc: 'Integrated large language models to power natural-language campaign suggestions, auto-reporting, and creative feedback.' },
    { year: '2025', title: '500+ Stores & Series A', desc: 'Reached $3.2M ARR, 500+ active stores, and closed a $9M Series A to expand into European and APAC markets.' },
    { year: '2026', title: 'AI Growth Manager V3', desc: 'Launched autonomous budget scaling, real-time competitor intelligence, and the industry\'s first AI Health Score API.' },
]

const VALUES = [
    { icon: 'psychology', title: 'AI-First Thinking', color: 'text-indigo-600 bg-indigo-50', desc: 'Every feature starts with the question: can AI do this better and faster than a human?' },
    { icon: 'favorite', title: 'Merchant Obsession', color: 'text-rose-600 bg-rose-50', desc: 'We\'ve all been Shopify store owners. We build for the founder who can\'t afford to waste a single dollar.' },
    { icon: 'balance', title: 'Radical Transparency', color: 'text-amber-600 bg-amber-50', desc: 'No black boxes. We show you exactly why the AI made each decision, so you learn with it.' },
    { icon: 'speed', title: 'Ship Fast, Win Fast', color: 'text-emerald-600 bg-emerald-50', desc: 'The market doesn\'t wait. We iterate weekly, deploy daily, and measure everything obsessively.' },
]

export default function AboutPage() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
    const progressBarWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

    return (
        <div ref={containerRef} className="bg-white text-slate-900 overflow-x-hidden">
            {/* Scroll progress bar */}
            <motion.div style={{ width: progressBarWidth }}
                className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 z-[100]" />

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
                        <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="/resources">Resources</Link>
                        <Link className="text-sm font-medium text-primary font-semibold" to="/about">About</Link>
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
            <section className="relative pt-24 pb-20 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-200/20 to-transparent"
                    />
                </div>
                <div className="mx-auto max-w-5xl px-4 text-center relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={stagger}>
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8">
                            <span className="material-symbols-outlined text-[16px]">handshake</span>
                            Our Story
                        </motion.div>
                        <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                            We're building the future<br />
                            <span className="gradient-text">of e-commerce growth</span>
                        </motion.h1>
                        <motion.p variants={fadeUp} className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            We started as Shopify merchants frustrated by the gap between what AI could do and what was actually available to us. So we built it ourselves.
                        </motion.p>
                        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
                            <Link to="/signin" className="rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 transition-all">
                                Start Free Trial
                            </Link>
                            <a href="#team" className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 transition-all">
                                Meet the Team
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats bar */}
            <section className="border-y border-slate-100 bg-white">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                        <AnimatedStat value="500+" label="Active Shopify Stores" color="gradient-text" />
                        <AnimatedStat value="$3.2M" label="Annual Recurring Revenue" color="text-emerald-600" />
                        <AnimatedStat value="14×" label="Average Customer ROI" color="text-primary" />
                        <AnimatedStat value="28" label="Team Members Worldwide" color="text-purple-600" />
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-24 bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={slideLeft}>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-6">
                                <span className="material-symbols-outlined text-sm">flag</span>
                                Our Mission
                            </div>
                            <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                                Make AI-powered growth accessible to every merchant
                            </h2>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                We believe that the same AI technology used by billion-dollar brands should be available to the independent Shopify merchant with just 1,000 customers. The playing field should be level.
                            </p>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Our platform democratizes access to cutting-edge machine learning, translating raw data signals into clear, actionable decisions — so you spend less time guessing and more time growing.
                            </p>
                        </motion.div>
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={slideRight}>
                            <div className="relative rounded-3xl bg-gradient-to-br from-primary to-indigo-700 p-8 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px]" />
                                {[
                                    { icon: 'bolt', text: 'Autonomous campaign scaling' },
                                    { icon: 'insights', text: 'AI Health Score in real time' },
                                    { icon: 'smart_toy', text: 'GPT-4 powered copywriting' },
                                    { icon: 'bar_chart', text: 'Predictive revenue forecasting' },
                                    { icon: 'shield', text: 'Zero Black-box decisions' },
                                ].map((item, i) => (
                                    <motion.div key={item.text} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08, duration: 0.5 }} viewport={{ once: true }}
                                        className="relative flex items-center gap-3 mb-4 last:mb-0 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3">
                                        <span className="material-symbols-outlined text-white text-[22px]">{item.icon}</span>
                                        <span className="text-white font-medium text-sm">{item.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 mb-4">
                            <span className="material-symbols-outlined text-sm">diamond</span>
                            Our Values
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-slate-900 mb-4">
                            What drives everything we do
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-slate-600 max-w-xl mx-auto">
                            Our values aren't a poster on the wall — they're the filters every product, hire, and decision passes through.
                        </motion.p>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {VALUES.map((v, i) => (
                            <motion.div key={v.title} variants={fadeUp}
                                whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(19,91,236,0.1)' }}
                                className="group flex gap-5 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all">
                                <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl ${v.color} group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-[26px]">{v.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{v.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-24 bg-slate-50 overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 mb-4">
                            <span className="material-symbols-outlined text-sm">history</span>
                            Our Journey
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-slate-900 mb-4">From idea to market leader</motion.h2>
                    </motion.div>
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block" />
                        <div className="space-y-12">
                            {TIMELINE.map((item, i) => (
                                <motion.div key={item.year} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
                                    variants={i % 2 === 0 ? slideLeft : slideRight}
                                    className={`relative flex flex-col md:flex-row gap-8 items-center ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                                >
                                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                        <div className={`inline-block rounded-2xl bg-white border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all ${i % 2 === 0 ? '' : ''}`}>
                                            <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary mb-3">{item.year}</span>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                    {/* Center dot */}
                                    <motion.div whileInView={{ scale: [0, 1.3, 1] }} viewport={{ once: true }}
                                        transition={{ duration: 0.5 }}
                                        className="z-10 hidden md:flex h-5 w-5 -mx-2.5 shrink-0 items-center justify-center rounded-full bg-primary ring-4 ring-white shadow-sm" />
                                    <div className="flex-1" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section id="team" className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 mb-4">
                            <span className="material-symbols-outlined text-sm">groups</span>
                            The Team
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-slate-900 mb-4">Meet the builders</motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-slate-600 max-w-xl mx-auto">
                            A small, focused team obsessed with helping Shopify merchants win.
                        </motion.p>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TEAM.map((member) => (
                            <motion.div key={member.name} variants={fadeUp}
                                whileHover={{ y: -8 }}
                                className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all overflow-hidden">
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${member.color}`} />
                                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${member.color} text-white font-extrabold text-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                                    {member.avatar}
                                </div>
                                <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                                <p className="text-xs font-semibold text-primary mb-3">{member.role}</p>
                                <p className="text-sm text-slate-500 leading-relaxed flex-1">{member.bio}</p>
                                <div className="flex gap-3 mt-4">
                                    {[
                                        { icon: 'twitter', href: member.twitter },
                                        { icon: 'linkedin', href: member.linkedin },
                                    ].map(s => (
                                        <a key={s.icon} href={s.href}
                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all text-xs font-bold">
                                            {s.icon === 'twitter' ? 'X' : 'in'}
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Investors */}
            <section className="py-16 border-y border-slate-100 bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
                        Backed by world-class investors
                    </motion.p>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
                        className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-500">
                        {['Y Combinator', 'Sequoia', 'Andreessen Horowitz', 'Index Ventures', 'Accel'].map(inv => (
                            <motion.span key={inv} variants={fadeIn} className="text-xl font-extrabold text-slate-700">{inv}</motion.span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#135bec_1px,transparent_1px),linear-gradient(to_bottom,#135bec_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10" />
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="mx-auto max-w-3xl px-4 text-center relative z-10">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold mb-4">
                            Ready to join the future of e-commerce?
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
                            Start your free trial today. No credit card required. See your AI Health Score in under 5 minutes.
                        </motion.p>
                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signin" className="rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-primary-dark hover:scale-105 transition-all">
                                Start Free Trial
                            </Link>
                            <button className="rounded-xl border border-slate-700 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-all">
                                Book a Demo
                            </button>
                        </motion.div>
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
