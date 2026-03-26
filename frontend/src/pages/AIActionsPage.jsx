import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, CheckCircle2, Clock, Play, ArrowRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { aiAPI } from '../services';

const AIActionsPage = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shop] = useState(localStorage.getItem('currentShop') || 'demo-shop.myshopify.com');

    useEffect(() => {
        fetchAIActions();
    }, [shop]);

    const fetchAIActions = async () => {
        try {
            setLoading(true);
            const response = await aiAPI.getAIActions();
            setActions(response.data || [
                { id: 1, type: 'Optimization', title: 'A/B Test Product Descriptions', status: 'In Progress', impact: 'Medium', time: 'Started 2h ago' },
                { id: 2, type: 'Security', title: 'Encryption Protocol Update', status: 'Completed', impact: 'High', time: 'Yesterday' },
                { id: 3, type: 'Revenue', title: 'Dynamic Pricing Adjustment', status: 'Running', impact: 'High', time: 'Continuous' },
                { id: 4, type: 'Growth', title: 'SEO Keyword Tagging', status: 'Scheduled', impact: 'Low', time: 'Starting in 4h' },
            ]);
        } catch (error) {
            console.error('Error fetching AI actions:', error);
            // Use demo data as fallback
            setActions([
                { id: 1, type: 'Optimization', title: 'A/B Test Product Descriptions', status: 'In Progress', impact: 'Medium', time: 'Started 2h ago' },
                { id: 2, type: 'Security', title: 'Encryption Protocol Update', status: 'Completed', impact: 'High', time: 'Yesterday' },
                { id: 3, type: 'Revenue', title: 'Dynamic Pricing Adjustment', status: 'Running', impact: 'High', time: 'Continuous' },
                { id: 4, type: 'Growth', title: 'SEO Keyword Tagging', status: 'Scheduled', impact: 'Low', time: 'Starting in 4h' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async (actionId) => {
        try {
            await aiAPI.executeAIAction({ actionId, shop });
            // Refresh actions after execution
            fetchAIActions();
        } catch (error) {
            console.error('Error executing AI action:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 fixed h-screen z-20">
                <Link to="/dashboard" className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
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
                    <Link to="/ai-actions" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary transition-all">
                        <span className="material-symbols-outlined fill">smart_toy</span>
                        <span className="text-sm font-bold">AI Actions</span>
                    </Link>
                </nav>
            </aside>

            <main className="ml-64 flex-1 p-10">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Actions</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Direct control over autonomous optimization tasks.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            <Settings className="w-4 h-4" />
                            Auto-Pilot Settings
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                            <Play className="w-4 h-4 fill-white" />
                            Run New Scan
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    {/* Active Jobs */}
                    <div className="col-span-8 space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Live Action Feed</h3>
                        {actions.map((a) => (
                            <motion.div key={a.id} whileHover={{ y: -2 }} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                            a.status === 'In Progress' ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                        {a.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">AI {a.type}</span>
                                            <h4 className="text-base font-bold text-slate-900">{a.title}</h4>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{a.time} • Impact: <span className="text-primary font-bold">{a.impact}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${a.status === 'Completed' ? 'text-emerald-500' : 'text-primary'}`}>
                                            {a.status}
                                        </span>
                                        {a.status === 'In Progress' && (
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <motion.div
                                                    animate={{ x: [-100, 100] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                    className="w-full h-full bg-primary"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="col-span-4 space-y-6">
                        <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl overflow-hidden relative group">
                            <Sparkles className="absolute top-6 right-6 w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                            <h3 className="text-xl font-bold mb-2">AI Efficiency</h3>
                            <p className="text-slate-400 text-sm mb-6 font-medium">Auto-pilot has saved you 12h of manual work this week.</p>
                            <div className="text-4xl font-black mb-1">98.2%</div>
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Success Rate</div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                            <h3 className="text-slate-900 font-bold mb-4">Total Tokens Used</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500">Analysis</span>
                                        <span className="text-slate-900">12k / 50k</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-[24%] h-full bg-primary" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500">Generation</span>
                                        <span className="text-slate-900">42k / 100k</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-[42%] h-full bg-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIActionsPage;
