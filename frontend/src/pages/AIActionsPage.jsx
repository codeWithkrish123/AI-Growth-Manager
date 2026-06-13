import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, RefreshCw, Zap, AlertCircle, Menu } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI, errMsg } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AIActionsPage() {
  const [problems,    setProblems]    = useState([]);
  const [fixes,       setFixes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [applying,    setApplying]    = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark,      setIsDark]      = useState(() => document.documentElement.classList.contains('dark'));
  const [toast,       setToast]       = useState(null);
  const navigate = useNavigate();
  const shop = localStorage.getItem('currentShop') || '';

  const toggleDark = () => { const n = !isDark; setIsDark(n); document.documentElement.classList.toggle('dark', n); localStorage.setItem('theme', n ? 'dark' : 'light'); };
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { if (shop) fetchAll(); else navigate('/onboarding'); }, [shop]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [analysisRes, fixesRes] = await Promise.allSettled([
        dashboardAPI.getLatestAnalysis(shop),
        dashboardAPI.getFixes(shop),
      ]);
      if (analysisRes.status === 'fulfilled') {
        const d = analysisRes.value.data?.data || analysisRes.value.data;
        setProblems(d?.problems || []);
      }
      if (fixesRes.status === 'fulfilled') {
        const d = fixesRes.value.data?.data || fixesRes.value.data || [];
        setFixes(Array.isArray(d) ? d : []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleApplyFix = async (problem) => {
    if (!problem.payload) return showToast('Run Analyze on Dashboard first to generate fix data.', 'error');
    try {
      setApplying(problem.id);
      await dashboardAPI.applyFix(shop, { problemId: problem.id, fixType: problem.fixType, payload: problem.payload });
      showToast('✅ Fix applied to your Shopify store!');
      fetchAll();
    } catch (e) {
      showToast('Fix failed: ' + errMsg(e), 'error');
    } finally { setApplying(null); }
  };

  const severityBadge = (s) => {
    if (s === 'critical' || s === 'high')   return 'badge-red';
    if (s === 'medium' || s === 'warning') return 'badge-amber';
    return 'badge-blue';
  };

  const appliedCount = fixes.filter(f => f.status === 'applied' || f.status === 'completed').length;
  const autoFixable  = problems.filter(p => p.fixType && p.fixType !== 'none' && p.payload).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar active="ai" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.msg}
        </div>
      )}

      <main className="flex-1 lg:ml-[var(--c-sidebar-w)] overflow-y-auto scrollbar-hide">

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-7 py-4 border-b backdrop-blur-sm"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--c-text-muted)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                <Zap className="w-5 h-5 text-amber-400" />
                AI Actions
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                AI-detected issues with one-click fixes for your store.
              </p>
            </div>
          </div>
          <button onClick={fetchAll} className="btn-ghost text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="px-7 py-6">
          <div className="grid grid-cols-12 gap-5">

            {/* Main feed */}
            <div className="col-span-12 lg:col-span-8 space-y-3">
              <p className="section-title font-semibold uppercase tracking-widest text-xs" style={{ color: 'var(--c-text-muted)' }}>
                Live Action Feed {problems.length > 0 && `· ${problems.length} issue${problems.length > 1 ? 's' : ''} found`}
              </p>

              {loading ? (
                <div className="card p-12 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--c-primary)' }} />
                </div>
              ) : problems.length === 0 ? (
                <div className="card p-10 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text)' }}>All Good!</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--c-text-muted)' }}>
                    No issues detected. Go to Dashboard and click <strong>Analyze</strong> to generate AI suggestions.
                  </p>
                  <button onClick={() => navigate(`/dashboard/${shop}`)} className="btn-primary text-xs">
                    Go to Dashboard →
                  </button>
                </div>
              ) : (
                problems.map((p, i) => (
                  <motion.div key={p.id || i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 badge ${severityBadge(p.severity)}`}
                        style={{ padding: 0 }}>
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`badge ${severityBadge(p.severity)}`}>{p.severity}</span>
                          <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{p.title}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>{p.description}</p>
                        {p.potentialRevenue > 0 && (
                          <p className="text-xs font-semibold text-emerald-600 mt-1.5">
                            💰 Potential: +₹{Math.round(p.potentialRevenue).toLocaleString()} estimated revenue
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {p.fixType && p.fixType !== 'none' && p.payload ? (
                          <button onClick={() => handleApplyFix(p)} disabled={applying === p.id} className="btn-primary text-xs">
                            {applying === p.id
                              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Applying…</>
                              : <><Zap className="w-3.5 h-3.5" /> Apply Fix</>
                            }
                          </button>
                        ) : (
                          <span className="badge badge-indigo">Manual</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {/* Fix history */}
              {fixes.length > 0 && (
                <div className="mt-4">
                  <p className="section-title font-semibold uppercase tracking-widest text-xs mb-3" style={{ color: 'var(--c-text-muted)' }}>
                    Fix History ({fixes.length})
                  </p>
                  <div className="card overflow-hidden divide-y" style={{ '--divide-color': 'var(--c-border-light)' }}>
                    {fixes.slice(0, 10).map((f, i) => (
                      <div key={f.id || i} className="flex items-center gap-4 px-5 py-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.status === 'applied' || f.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{f.fixType || f.problemId || 'Fix'}</p>
                          <p className="text-xs" style={{ color: 'var(--c-text-subtle)' }}>{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                        <span className={`badge ${f.status === 'applied' || f.status === 'completed' ? 'badge-green' : 'badge-amber'}`}>
                          {f.status || 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar stats */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              {/* Dark card — same as PriceOptimizer style */}
              <div className="rounded-xl p-6 relative overflow-hidden" style={{ background: 'var(--c-sidebar-bg)' }}>
                <Sparkles className="absolute top-4 right-4 w-5 h-5 opacity-20 text-white" />
                <p className="text-sm font-semibold text-white mb-1">AI Efficiency</p>
                <p className="text-xs mb-5" style={{ color: 'var(--c-sidebar-text)' }}>Automated fixes save hours of manual work.</p>
                <div className="text-4xl font-black text-white mb-1">98.2%</div>
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Success Rate</div>
              </div>

              <div className="card p-5">
                <p className="section-title mb-4">Summary</p>
                {[
                  { label: 'Issues Found',  value: problems.length,                 color: problems.length > 0 ? 'text-red-500' : '' },
                  { label: 'Auto-Fixable',  value: autoFixable,                     color: 'text-primary' },
                  { label: 'Applied Fixes', value: appliedCount,                    color: 'text-emerald-600' },
                  { label: 'Est. Revenue',  value: '₹' + Math.round(problems.reduce((t,p) => t+(p.potentialRevenue||0), 0)).toLocaleString(), color: 'text-emerald-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--c-border-light)' }}>
                    <span className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>{label}</span>
                    <span className={`text-sm font-bold ${color}`} style={!color ? { color: 'var(--c-text)' } : {}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
