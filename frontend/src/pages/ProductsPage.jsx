import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Filter, MoreVertical, Plus, RefreshCw, FileText, Tag, Menu, X, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI, errMsg } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ProductsPage() {
  const navigate = useNavigate();
  const shop = localStorage.getItem('currentShop') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({ title: '', price: '', description: '', images: [] });
  const [menuOpenId, setMenuOpenId] = useState(null);

  const toggleDark = () => {
    const next = !isDark; setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  useEffect(() => {
    if (!shop) { navigate('/onboarding'); return; }
    fetchProducts();
  }, [shop]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getProducts(shop);
      if (res.data?.success) setProducts(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddProduct = async () => {
    setModalError('');
    if (!formData.title.trim() || !formData.price.trim()) {
      setModalError('Title and price are required');
      return;
    }

    try {
      setIsSubmitting(true);
      // Send without images (base64 data URLs cause Shopify 422 error)
      const res = await dashboardAPI.createProduct(shop, {
        title: formData.title,
        price: formData.price,
        description: formData.description,
        images: [] // Skip images for now - they must be valid URLs
      });

      if (res.data?.success) {
        Swal.fire({
          title: 'Product Created',
          text: `"${formData.title}" has been successfully pushed to your Shopify store.`,
          icon: 'success',
          confirmButtonColor: '#6366f1',
          background: isDark ? '#1e293b' : '#fff',
          color: isDark ? '#fff' : '#1e293b'
        });

        setShowAddModal(false);
        setFormData({ title: '', price: '', description: '', images: [] });
        fetchProducts();
      }
    } catch (e) {
      const errorMsg = errMsg(e, 'Failed to create product');
      setModalError(errorMsg);

      Swal.fire({
        title: 'Creation Failed',
        text: errorMsg,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(f);
      });
    });
    Promise.all(readers).then(images => {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...images] }));
    });
  };

  const handleOptimize = (product) => {
    navigate(`/ai-descriptions?productId=${product.id}&productName=${encodeURIComponent(product.title)}`);
  };

  const filtered = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar active="products" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] overflow-y-auto scrollbar-hide">

        {/* Header — same pattern as PriceOptimizer */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-7 py-4 border-b backdrop-blur-sm"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--c-text-muted)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                Products
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                Manage and optimize your store inventory with AI.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchProducts} className="btn-ghost text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-4">

          {/* Search + filter bar */}
          <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-subtle)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-9"
              />
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>
                {filtered.length} products
              </span>
              <button className="btn-ghost text-xs">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>AI Health</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                        <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3" style={{ color: 'var(--c-border)' }} />
                        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--c-text-muted)' }}>Loading inventory…</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                          style={{ background: 'var(--c-bg)' }}>
                          <ShoppingBag className="w-7 h-7" style={{ color: 'var(--c-border)' }} />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text)' }}>No products found</p>
                        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Try adjusting your search or sync your store.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, i) => (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="group cursor-default">
                        <td>
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt={p.title}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                style={{ border: '1px solid var(--c-border)' }} />
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
                                <ShoppingBag className="w-4 h-4" style={{ color: 'var(--c-text-subtle)' }} />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{p.title}</p>
                              <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{p.category || 'General'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>₹{p.price}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            p.status === 'active' ? 'badge-green' :
                            p.status === 'draft'  ? 'badge-amber' : 'badge-indigo'
                          }`}>
                            {p.status || 'archived'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${p.hasDescription ? 'badge-green' : 'badge-red'}`}>
                              <FileText className="w-3 h-3" />
                              {p.hasDescription ? 'Desc OK' : 'No Desc'}
                            </span>
                            <span className={`badge ${p.hasImages ? 'badge-green' : 'badge-red'}`}>
                              <Tag className="w-3 h-3" />
                              {p.hasImages ? 'Media OK' : 'No Media'}
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOptimize(p)} className="btn-primary text-xs py-1.5 px-3">
                              Optimize
                            </button>
                            <button onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)} className="btn-ghost text-xs p-1.5 relative">
                              <MoreVertical className="w-4 h-4" />
                              {menuOpenId === p.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 w-40 z-50">
                                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Edit</button>
                                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded">View Details</button>
                                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded">Delete</button>
                                </div>
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Add New Product
                </h2>
                <button onClick={() => { setShowAddModal(false); setModalError(''); }}
                  className="p-1" style={{ color: 'var(--c-text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-200">{modalError}</p>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Amazing T-Shirt"
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description (min 50 characters recommended)"
                    rows="4"
                    className="input-field mt-1 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => { setShowAddModal(false); setModalError(''); }}
                  className="btn-ghost flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="btn-primary flex-1 text-xs"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Push to Shopify'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

