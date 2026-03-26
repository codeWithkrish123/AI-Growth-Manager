import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } })
}

export default function PricingPage() {
    const [billing, setBilling] = useState('monthly')
    const [selectedPlan, setSelectedPlan] = useState('growth')

    useEffect(() => {
        document.title = 'Pricing – AI Growth Manager | Plans from $29/mo'
        document.querySelector('meta[name="description"]')?.setAttribute('content', 'Simple, transparent pricing for AI Growth Manager. Choose from Starter ($29/mo), Growth ($79/mo), or Pro ($199/mo) plans to scale your Shopify store.')
    }, [])

    const prices = {
        starter: billing === 'monthly' ? '$29' : '$23',
        growth: billing === 'monthly' ? '$79' : '$63',
        pro: billing === 'monthly' ? '$199' : '$159',
    }

    return (
        <div className="bg-background-light text-slate-900 antialiased font-display">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-10 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="size-8 text-primary">
                        <span className="material-symbols-outlined fill text-3xl">auto_graph</span>
                    </div>
                    <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em]">AI Growth Manager</h2>
                </div>
                <div className="flex flex-1 justify-end gap-8">
                    <div className="hidden md:flex items-center gap-9">
                        <Link to="/" className="text-slate-600 text-sm font-medium hover:text-primary transition-colors">Features</Link>
                        <a className="text-primary text-sm font-medium" href="#">Pricing</a>
                        <a className="text-slate-600 text-sm font-medium hover:text-primary transition-colors" href="#">Resources</a>
                        <Link to="/dashboard" className="text-slate-600 text-sm font-medium hover:text-primary transition-colors">Login</Link>
                    </div>
                    <Link to="/dashboard" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-blue-700 transition-colors text-white text-sm font-bold shadow-md shadow-blue-500/20">
                        Start Free Trial
                    </Link>
                </div>
            </header>

            <main className="flex flex-col items-center justify-center w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
                {/* Hero */}
                <motion.div initial="hidden" animate="visible" variants={fadeUp} className="w-full mb-12 text-center">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-20 shadow-xl sm:px-10 sm:py-24 md:px-12 lg:px-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-purple-900/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40" />
                        <div className="relative mx-auto max-w-2xl text-center">
                            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-6">Simple, transparent pricing</h1>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
                                Unlock your store's potential with AI-driven insights. Choose the plan that scales with your GMV and growth ambitions.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <div className="flex items-center gap-2 p-1 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700">
                                    <button
                                        onClick={() => setBilling('monthly')}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${billing === 'monthly' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Monthly billing
                                    </button>
                                    <button
                                        onClick={() => setBilling('yearly')}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${billing === 'yearly' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Yearly billing <span className="text-green-400 text-xs ml-1">(Save 20%)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start mb-24">
                    {/* Starter */}
                    <motion.div
                        custom={0} initial="hidden" animate="visible" variants={fadeUp}
                        onClick={() => setSelectedPlan('starter')}
                        className={`flex flex-col rounded-2xl border p-8 shadow-sm transition-all duration-300 cursor-pointer relative ${selectedPlan === 'starter'
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-[1.02] shadow-xl'
                                : 'border-slate-200 bg-white hover:border-primary/40'
                            }`}
                    >
                        {selectedPlan === 'starter' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Current Selection</div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-slate-900 text-xl font-bold">Starter</h3>
                            <p className="text-slate-500 text-sm mt-1">Perfect for new stores just starting out.</p>
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tight text-slate-900">{prices.starter}</span>
                            <span className="text-slate-500 font-medium">/mo</span>
                        </div>
                        <Link to="/dashboard" className={`w-full rounded-lg h-12 text-sm font-bold transition-colors mb-8 flex items-center justify-center ${selectedPlan === 'starter' ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                            }`}>
                            {selectedPlan === 'starter' ? 'Proceed with Starter' : 'Select Starter'}
                        </Link>
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Features</p>
                            <ul className="space-y-3">
                                {['Basic AI Health Score', 'Weekly Reports', '1 User Seat', 'Email Support'].map(f => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Growth (Popular) */}
                    <motion.div
                        custom={1} initial="hidden" animate="visible" variants={fadeUp}
                        onClick={() => setSelectedPlan('growth')}
                        className={`relative flex flex-col rounded-2xl border-2 p-8 shadow-2xl transition-all duration-300 cursor-pointer z-10 scale-[1.02] md:scale-105 ${selectedPlan === 'growth'
                                ? 'border-primary ring-4 ring-primary/20 bg-white'
                                : 'border-slate-200 bg-white opacity-90'
                            }`}
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md">Most Popular</div>
                        <div className="mb-6">
                            <h3 className="text-slate-900 text-xl font-bold">Growth</h3>
                            <p className="text-slate-500 text-sm mt-1">For scaling brands needing deeper insights.</p>
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-5xl font-black tracking-tight text-slate-900">{prices.growth}</span>
                            <span className="text-slate-500 font-medium">/mo</span>
                        </div>
                        <Link to="/dashboard" className="w-full rounded-lg bg-primary text-white hover:bg-blue-700 h-12 text-sm font-bold transition-colors mb-8 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                            {selectedPlan === 'growth' ? 'Proceed with Growth' : 'Select Growth'}
                        </Link>
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Everything in Starter, plus:</p>
                            <ul className="space-y-3">
                                {['Revenue Impact Tracking', 'Competitor Analysis', '5 User Seats', 'Priority Chat Support'].map(f => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Pro */}
                    <motion.div
                        custom={2} initial="hidden" animate="visible" variants={fadeUp}
                        onClick={() => setSelectedPlan('pro')}
                        className={`flex flex-col rounded-2xl border p-8 shadow-sm transition-all duration-300 cursor-pointer relative ${selectedPlan === 'pro'
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-[1.02] shadow-xl'
                                : 'border-slate-200 bg-white hover:border-primary/40'
                            }`}
                    >
                        {selectedPlan === 'pro' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Current Selection</div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-slate-900 text-xl font-bold">Pro</h3>
                            <p className="text-slate-500 text-sm mt-1">For established retailers with custom needs.</p>
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tight text-slate-900">{prices.pro}</span>
                            <span className="text-slate-500 font-medium">/mo</span>
                        </div>
                        <Link to="/dashboard" className={`w-full rounded-lg h-12 text-sm font-bold transition-colors mb-8 flex items-center justify-center ${selectedPlan === 'pro' ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                            }`}>
                            {selectedPlan === 'pro' ? 'Proceed with Pro' : 'Select Pro'}
                        </Link>
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Everything in Growth, plus:</p>
                            <ul className="space-y-3">
                                {['Custom API Access', 'Dedicated Account Manager', 'Unlimited User Seats', 'Custom ML Models'].map(f => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* Trusted By */}
                <div className="w-full mb-20">
                    <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by fast-growing brands</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {[
                            { icon: 'diamond', name: 'LuxeStore' },
                            { icon: 'bolt', name: 'BoltRun' },
                            { icon: 'eco', name: 'EcoWare' },
                            { icon: 'waves', name: 'WaveSurfer' },
                            { icon: 'pets', name: 'PetLife' },
                        ].map((b) => (
                            <div key={b.name} className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined">{b.icon}</span> {b.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="w-full max-w-5xl">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="text-3xl font-bold text-center text-slate-900 mb-10">Detailed Feature Comparison</motion.h2>
                    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="py-5 px-6 text-left text-sm font-bold text-slate-900 w-1/4">Feature Category</th>
                                        <th className="py-5 px-6 text-center text-sm font-bold text-slate-900 w-1/4">Starter</th>
                                        <th className="py-5 px-6 text-center text-sm font-bold text-primary w-1/4">Growth</th>
                                        <th className="py-5 px-6 text-center text-sm font-bold text-slate-900 w-1/4">Pro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr><td className="bg-slate-50/50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500" colSpan={4}>Analytics &amp; Insights</td></tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">AI Analysis Depth</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Basic</td>
                                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900 bg-primary/5">Advanced</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Custom ML Models</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">Reporting Frequency</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Weekly</td>
                                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900 bg-primary/5">Daily</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Real-time</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">Revenue Impact Tracking</td>
                                        <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-slate-300 text-[20px]">remove</span></td>
                                        <td className="px-6 py-4 text-center bg-primary/5"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span></td>
                                        <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span></td>
                                    </tr>
                                    <tr><td className="bg-slate-50/50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500" colSpan={4}>Team &amp; Collaboration</td></tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">User Seats</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">1</td>
                                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900 bg-primary/5">5</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">Support Level</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Email</td>
                                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900 bg-primary/5">Priority Chat</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Dedicated Manager</td>
                                    </tr>
                                    <tr><td className="bg-slate-50/50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500" colSpan={4}>Integrations</td></tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">Platforms</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">Shopify</td>
                                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900 bg-primary/5">Shopify, Magento</td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600">All + Custom API</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">API Access</td>
                                        <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-slate-300 text-[20px]">remove</span></td>
                                        <td className="px-6 py-4 text-center bg-primary/5"><span className="material-symbols-outlined text-slate-300 text-[20px]">remove</span></td>
                                        <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="w-full max-w-3xl mt-24">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="text-2xl font-bold text-center text-slate-900 mb-10">Frequently Asked Questions</motion.h2>
                    <div className="flex flex-col gap-4">
                        {[
                            { q: 'Can I change plans later?', a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any payments." },
                            { q: 'Do you offer a free trial?', a: 'Absolutely! All plans come with a 14-day free trial. No credit card required to get started.' },
                            { q: 'What happens if I exceed my user limit?', a: "We'll notify you if you're approaching your limit. You can easily add more seats for a small additional fee or upgrade to the next tier." },
                        ].map((faq, i) => (
                            <motion.div key={faq.q} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-slate-900 text-lg mb-2">{faq.q}</h3>
                                <p className="text-slate-600">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-10 mt-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined fill text-primary text-2xl">auto_graph</span>
                        <span className="text-white font-bold">AI Growth Manager</span>
                    </div>
                    <p className="text-sm">© 2024 AI Growth Manager. All rights reserved.</p>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
