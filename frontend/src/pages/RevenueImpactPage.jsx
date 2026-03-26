import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, PieChart, ArrowUpRight, Calendar, Download, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const RevenueImpactPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 fixed h-screen z-20">
                <Link to="/dashboard" className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-slate-900">GrowthAI</span>
                </Link>
                <nav className="flex-1 space-y-1">
                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-bold">Overview</span>
                    </Link>
                    <Link to="/health" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined">health_metrics</span>
                        <span className="text-sm font-bold">Health Score</span>
                    </Link>
                    <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="text-sm font-bold">Products</span>
                    </Link>
                    <Link to="/revenue" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary transition-all">
                        <span className="material-symbols-outlined fill">monetization_on</span>
                        <span className="text-sm font-bold">Revenue</span>
                    </Link>
                </nav>
            </aside>

            <main className="ml-64 flex-1 p-10">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Revenue Impact</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Detailed breakdown of AI-driven financial growth.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            <Calendar className="w-4 h-4" />
                            Date Range
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">
                            <Download className="w-4 h-4" />
                            Export Data
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8 mb-10">
                    {/* Big Metric */}
                    <div className="col-span-12 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Net Impact (30D)</p>
                            <h3 className="text-6xl font-black text-slate-900 mb-4">$42,850.12</h3>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                                    +12.5% increase
                                </span>
                                <span className="text-sm text-slate-500 font-medium">compared to previous 30 days</span>
                            </div>
                        </div>
                        <div className="w-1/3 h-48 relative z-10">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                                <path d="M0,35 Q20,30 40,25 T80,10 T100,5" fill="none" stroke="#135bec" strokeWidth="4" strokeLinecap="round" />
                                <path d="M0,35 Q20,30 40,25 T80,10 T100,5 L100,40 L0,40 Z" fill="url(#grad)" opacity="0.1" />
                                <defs>
                                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#135bec" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                            <DollarSign className="w-64 h-64 text-primary" />
                        </div>
                    </div>

                    {/* Breakdown Cards */}
                    {[
                        { title: 'AI Recommendation ROI', value: '$8,420', desc: 'Revenue from direct AI suggestions' },
                        { title: 'Recovered Revenue', value: '$12,140', desc: 'From abandoned cart recovery' },
                        { title: 'A/B Testing Gain', value: '$4,290', desc: 'Incremental lift from experiments' },
                    ].map((card, i) => (
                        <div key={i} className="col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{card.title}</h4>
                            <div className="text-3xl font-black text-slate-900 mb-2">{card.value}</div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Growth Insights */}
                <div className="bg-slate-900 rounded-[40px] p-10 text-white flex items-center justify-between overflow-hidden relative group">
                    <div className="max-w-xl relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Strategic Insight</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Your Store is in the Top 5%</h3>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            Based on your current trajectory, AI actions are projected to generate an additional <span className="text-white font-bold">$120,000</span> in net revenue over the next 12 months.
                        </p>
                    </div>
                    <button className="relative z-10 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                        Upgrade Strategy
                    </button>
                    <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                </div>
            </main>
        </div>
    );
};

export default RevenueImpactPage;
