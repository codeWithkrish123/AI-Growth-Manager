import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Target, Users, BarChart3, ArrowUpRight, Inbox, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmailsPage = () => {
    const campaigns = [
        { id: 1, name: 'Summer Welcome Flow', status: 'Active', opens: '42%', clicks: '12%', sent: '1,240' },
        { id: 2, name: 'Abandoned Cart Recovery', status: 'Paused', opens: '38%', clicks: '8%', sent: '450' },
        { id: 3, name: 'VIP Customer Reward', status: 'Scheduled', opens: '-', clicks: '-', sent: '0' },
        { id: 4, name: 'Product Launch Update', status: 'Active', opens: '51%', clicks: '24%', sent: '5,000' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 fixed h-screen z-20">
                <Link to="/dashboard" className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
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
                    <Link to="/ai-actions" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined">smart_toy</span>
                        <span className="text-sm font-bold">AI Actions</span>
                    </Link>
                    <Link to="/emails" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary transition-all">
                        <span className="material-symbols-outlined fill">mail</span>
                        <span className="text-sm font-bold">Emails</span>
                    </Link>
                </nav>
            </aside>

            <main className="ml-64 flex-1 p-10">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Email Campaigns</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">AI-written flows that convert customers on autopilot.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </button>
                </header>

                <div className="grid grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Sent', value: '42,120', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Avg Open Rate', value: '34.5%', icon: Inbox, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Click Rate', value: '8.2%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Subscribers', value: '12,400', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Campaign Performance
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                    <th className="px-8 py-4">Campaign Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Opens</th>
                                    <th className="px-6 py-4">Clicks</th>
                                    <th className="px-6 py-4">Total Sent</th>
                                    <th className="px-8 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => (
                                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-slate-900">{c.name}</span>
                                        </td>
                                        <td className="px-6 py-6 font-bold">
                                            <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                    c.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-sm font-bold text-slate-900">{c.opens}</td>
                                        <td className="px-6 py-6 text-sm font-bold text-slate-900">{c.clicks}</td>
                                        <td className="px-6 py-6 text-sm font-medium text-slate-500">{c.sent}</td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Edit Flow</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmailsPage;
