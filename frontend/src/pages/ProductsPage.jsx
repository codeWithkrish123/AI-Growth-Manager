import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Filter, MoreVertical, Plus, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductsPage = () => {
    const products = [
        { id: 1, name: 'Summer Floral Maxi Dress', category: 'Dresses', price: '$89.00', stock: 42, status: 'Active', conv: '3.2%' },
        { id: 2, name: 'Minimalist Leather Tote', category: 'Accessories', price: '$120.00', stock: 15, status: 'Low Stock', conv: '2.8%' },
        { id: 3, name: 'Classic White Sneakers', category: 'Footwear', price: '$75.00', stock: 88, status: 'Active', conv: '4.1%' },
        { id: 4, name: 'Oversized Silk Shirt', category: 'Tops', price: '$65.00', stock: 0, status: 'Out of Stock', conv: '1.9%' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Placeholder (matches Dashboard) */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 fixed h-screen z-20">
                <Link to="/dashboard" className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white" />
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
                    <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary transition-all">
                        <span className="material-symbols-outlined fill">inventory_2</span>
                        <span className="text-sm font-bold">Products</span>
                    </Link>
                </nav>
            </aside>

            <main className="ml-64 flex-1 p-10">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Products</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Manage and optimize your store inventory.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </header>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 text-sm font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white transition-all">
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white">
                                <th className="px-8 py-4">Product</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-primary">AI Conv.</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
                                            <span className="text-sm font-bold text-slate-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-500">{p.category}</td>
                                    <td className="px-6 py-5 text-sm font-bold text-slate-900">{p.price}</td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-500">{p.stock}</td>
                                    <td className="px-6 py-5">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                            p.status === 'Low Stock' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-primary text-sm font-bold">
                                            <ArrowUpRight className="w-4 h-4" />
                                            {p.conv}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-400">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default ProductsPage;
