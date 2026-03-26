import React from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Lock, Shield, Settings, Zap, ArrowRight, Edit3, ChevronRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const sidebarItems = [
        { icon: User, label: 'Basic Details', active: true },
        { icon: FileText, label: 'Reports' },
        { icon: Lock, label: 'Change Password' },
        { icon: Shield, label: 'Change Groww PIN' },
        { icon: Settings, label: 'Trading controls' },
        { icon: Zap, label: 'Trading APIs' },
        { icon: ArrowRight, label: 'Sell authorisation mode' },
        { icon: FileText, label: 'Trading Details' },
        { icon: FileText, label: 'Account Related Forms' },
    ];

    const personalDetails = [
        { label: 'Full Name', value: 'Krish Sah', editable: false },
        { label: 'Date of Birth', value: '-', editable: false },
        { label: 'Mobile Number', value: '*****81038', editable: true },
        { label: 'Email Address', value: 'sah*******6@gmail.com', editable: true },
        { label: 'Marital Status', value: '-', editable: true },
        { label: 'Gender', value: '-', editable: false },
        { label: 'Income Range', value: '-', editable: true },
        { label: 'Occupation', value: '-', editable: true },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Minimal Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
                <Link to="/dashboard" className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined fill text-2xl">auto_graph</span>
                    <span className="text-lg font-bold tracking-tight text-slate-900">GrowthAI</span>
                </Link>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold text-sm transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto flex p-8 gap-8">
                {/* Profile Sidebar */}
                <aside className="w-72 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div className="p-8 flex flex-col items-center text-center border-b border-slate-100">
                            <div className="w-20 h-20 rounded-full bg-orange-700 text-white flex items-center justify-center text-3xl font-bold mb-4">
                                K
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900">Krish Sah</h3>
                        </div>
                        <nav className="p-2">
                            {sidebarItems.map((item, i) => (
                                <button
                                    key={i}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`w-4 h-4 ${item.active ? 'text-primary' : ''}`} />
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-30" />
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Profile Content */}
                <section className="flex-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-slate-900 mb-1">Personal Details</h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">PAN - </p>
                        </div>

                        <div className="space-y-0 text-sm">
                            {personalDetails.map((detail, i) => (
                                <div key={i} className="group border-t border-slate-100 first:border-0 py-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">{detail.label}</p>
                                        <p className="text-slate-900 font-bold text-base transition-all group-hover:text-primary">{detail.value}</p>
                                    </div>
                                    {detail.editable && (
                                        <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;
