import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, BarChart3, DollarSign, Target, TrendingUp, Plus, RefreshCw, Zap, Sparkles,
  Layers, Play, Pause, Loader2, X, Activity, Menu,
  Facebook, Globe, Lightbulb, FlaskConical, Users, CheckCircle2, AlertCircle, Trash2, Type
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI, metaAPI } from '../services/api'
import Swal from 'sweetalert2'

export default function AdsPage() {
  const navigate = useNavigate()
  const shop     = localStorage.getItem('currentShop') || ''
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleDark = () => {
    const next = !isDark; setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const [loading,      setLoading]      = useState(true)
  const [accounts,     setAccounts]     = useState([])
  const [campaigns,    setCampaigns]    = useState([])
  const [performance,  setPerformance]  = useState(null)
  const [suggestions,  setSuggestions]  = useState([])
  const [connecting,   setConnecting]   = useState(null)
  const [disconnecting, setDisconnecting] = useState(null)
  const [pausing,      setPausing]      = useState(null)
  const [toast,        setToast]        = useState(null)

  useEffect(() => {
    if (!shop) { navigate('/signin'); return }
    fetchAllData()
  }, [shop])

  // Added effect to ensure campaigns are re-fetched when the dashboard loads or reconnects
  useEffect(() => {
    const timer = setInterval(() => {
      if (accounts.length > 0) fetchAllData();
    }, 60000); // Poll for updates every 60 seconds
    return () => clearInterval(timer);
  }, [accounts]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      console.log('Fetching all ad data');
      const [accRes, campRes, perfRes, sugRes] = await Promise.allSettled([
        dashboardAPI.getAdsAccounts(shop),
        dashboardAPI.getAdsCampaigns(shop),
        dashboardAPI.getAdsPerformance(shop),
        dashboardAPI.getAdsSuggestions(shop),
      ])
      
      console.log('API results:', { accRes, campRes, perfRes, sugRes });
      
      if (accRes.status === 'fulfilled') {
        const data = accRes.value.data?.data || accRes.value.data || []
        setAccounts(Array.isArray(data) ? data : (data.accounts || []))
      }
      if (campRes.status === 'fulfilled') {
        const data = campRes.value.data?.data || campRes.value.data || {}
        console.log('Setting campaigns:', data);
        setCampaigns(Array.isArray(data) ? data : (data.campaigns || []))
      }
      if (perfRes.status === 'fulfilled') {
        const data = perfRes.value.data?.data || perfRes.value.data || null
        setPerformance(data)
      }
      if (sugRes.status === 'fulfilled') {
        const data = sugRes.value.data?.data || sugRes.value.data || []
        setSuggestions(Array.isArray(data) ? data : (data.suggestions || []))
      }
    } catch (err) {
      console.error('Error fetching ad data:', err);
    } finally {
      setLoading(false)
    }
  }

  const [isCreateOpen,  setIsCreateOpen]  = useState(false)
  const [newCampaign,   setNewCampaign]   = useState({ name: '', objective: 'conversions', dailyBudget: '' })
  const [creating,      setCreating]      = useState(false)

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) return Swal.fire({ text: 'Campaign name is required', icon: 'warning', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    try {
      setCreating(true)
      await dashboardAPI.createAdsCampaign(shop, {
        name: newCampaign.name,
        objective: newCampaign.objective,
        dailyBudget: newCampaign.dailyBudget ? parseFloat(newCampaign.dailyBudget) : null,
      })
      
      Swal.fire({
        title: 'Campaign Created',
        text: `"${newCampaign.name}" has been drafted and pushed to your ad account.`,
        icon: 'success',
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })

      setIsCreateOpen(false)
      setNewCampaign({ name: '', objective: 'conversions', dailyBudget: '' })
      fetchAllData()
    } catch (e) {
      Swal.fire({
        title: 'Creation Failed',
        text: 'Could not create the campaign: ' + e.message,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally {
      setCreating(false)
    }
  }

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState(null);
  const [connectData, setConnectData] = useState({ accountId: '', accountName: '', accessToken: '' });

  const [isCreativeModalOpen, setIsCreativeModalOpen] = useState(false);
  const [creativeData, setCreativeData] = useState(null);
  const [targetProduct, setTargetProduct] = useState({ name: '', desc: '' });

  const handleGenerateCreative = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.createAdsCampaign(shop, {
        productName: targetProduct.name,
        productDescription: targetProduct.desc,
        platform: connectPlatform || 'meta',
        action: 'generate_creative'
      });
      // Assuming createAdsCampaign returns the creative data if action is generate_creative
      // Or I should use a dedicated method. I added aiCreativeGenerate to api.js earlier.
      const creativeRes = await dashboardAPI.aiCreativeGenerate(shop, {
        productName: targetProduct.name,
        productDescription: targetProduct.desc,
        platform: connectPlatform || 'meta'
      });
      setCreativeData(creativeRes.data?.data || creativeRes.data);
      setIsCreativeModalOpen(true);
    } catch (e) {
      Swal.fire({
        title: 'Generation Failed',
        text: 'The AI engine could not generate copy: ' + e.message,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(connectPlatform);
      if (!connectData.accountId || !connectData.accessToken) {
        Swal.fire({ text: 'Account ID and Token are required', icon: 'warning', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
        return;
      }
      await dashboardAPI.connectAdAccount(shop, connectPlatform, {
        accountId: connectData.accountId,
        accountName: connectData.accountName || `${connectPlatform === 'meta' ? 'Meta' : 'Google'} Ads Store`,
        accessToken: connectData.accessToken
      });
      
      Swal.fire({
        title: 'Account Connected',
        text: `Your ${connectPlatform === 'meta' ? 'Meta' : 'Google'} Ads account is now synced.`,
        icon: 'success',
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })

      setIsConnectModalOpen(false);
      setConnectData({ accountId: '', accountName: '', accessToken: '' });
      // Force immediate re-fetch
      await fetchAllData();
    } catch (e) { 
      Swal.fire({
        title: 'Connection Failed',
        text: e.message,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally { 
      setConnecting(null); 
    }
  };

  const openConnectModal = (platform) => {
    setConnectPlatform(platform);
    setIsConnectModalOpen(true);
  };

  const handleDisconnect = async (id, platform) => {
    const result = await Swal.fire({
      title: 'Disconnect Account?',
      text: `Are you sure you want to disconnect your ${platform} Ads account?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, disconnect',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#1e293b'
    });

    if (!result.isConfirmed) return;

    try {
      setDisconnecting(id);
      await dashboardAPI.disconnectAdAccount(shop, id);
      
      Swal.fire({
        title: 'Account Disconnected',
        text: 'The ad account has been removed from your manager.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })

      fetchAllData();
    } catch (e) { 
      Swal.fire({
        title: 'Disconnect Failed',
        text: e.message,
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally { 
      setDisconnecting(null); 
    }
  };

  const handlePauseResume = async (campaign) => {
    try {
      setPausing(campaign.id)
      if (campaign.status === 'active') {
        await dashboardAPI.pauseAdsCampaign(shop, campaign.id)
        Swal.fire({ title: 'Campaign Paused', icon: 'success', timer: 1500, showConfirmButton: false, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
      } else {
        await dashboardAPI.resumeAdsCampaign(shop, campaign.id)
        Swal.fire({ title: 'Campaign Resumed', icon: 'success', timer: 1500, showConfirmButton: false, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
      }
      fetchAllData()
    } catch (e) { 
      Swal.fire({ title: 'Action Failed', text: e.message, icon: 'error', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    } finally { 
      setPausing(null) 
    }
  }

  const handleApplySuggestion = async (id) => {
    try {
      await dashboardAPI.applyAdsSuggestion(shop, id)
      Swal.fire({ title: 'Fix Applied', text: 'AI suggestion has been implemented.', icon: 'success', timer: 2000, showConfirmButton: false, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
      fetchAllData()
    } catch (e) { 
      Swal.fire({ title: 'Failed to Apply', text: e.message, icon: 'error', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    }
  }

  const handleRunBudgetOptimize = async () => {
    try {
      setLoading(true)
      await dashboardAPI.aiBudgetOptimize(shop)
      Swal.fire({
        title: 'Budget Optimized',
        text: 'AI has redistributed your budget for maximum ROAS.',
        icon: 'success',
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
      fetchAllData()
    } catch (e) {
      Swal.fire({ title: 'Optimization Failed', icon: 'error', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    } finally {
      setLoading(false)
    }
  }

  // Derived metrics
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalSpend     = campaigns.reduce((s, c) => s + (parseFloat(c.total_spend) || 0), 0)
  const totalRevenue   = campaigns.reduce((s, c) => s + (parseFloat(c.revenue) || 0), 0)
  const avgRoas        = performance?.summary?.avg_roas || '0.00'
  const activeAccounts  = accounts.filter(a => a.status === 'active').length

  const getPlatformIcon = (platform) => {
    switch ((platform || '').toLowerCase()) {
      case 'meta': return Facebook
      case 'google': return Globe
      default: return Megaphone
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':     return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
      case 'paused':     return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
      case 'completed':  return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
      case 'draft':      return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
      default:            return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar active="ads" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

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
                <Megaphone className="w-5 h-5 text-indigo-400" />
                Ads Manager
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                Meta &amp; Google Ads — AI-powered campaign management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCreativeModalOpen(true)} className="btn-ghost text-xs">
              <Type className="w-3.5 h-3.5" /> AI Copy
            </button>
            <button onClick={handleRunBudgetOptimize} className="btn-primary text-xs">
              <Sparkles className="w-3.5 h-3.5" /> AI Optimize
            </button>
            <button onClick={fetchAllData} className="btn-ghost text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Campaigns', value: activeCampaigns, icon: Layers, iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
              { label: 'Total Spend',      value: '₹' + totalSpend.toLocaleString(), icon: DollarSign, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
              { label: 'Avg ROAS',         value: avgRoas + 'x', icon: TrendingUp, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
              { label: 'Active Accounts',  value: activeAccounts, icon: Users, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
            ].map(({ label, value, icon: Icon, iconBg }, i) => (
              <motion.div key={label} className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-black" style={{ color: 'var(--c-text)' }}>{value}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Ad Accounts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                <Activity className="w-4 h-4 text-indigo-400" /> Connected Accounts
              </p>
              <div className="grid grid-cols-1 gap-3">
                {['meta', 'google'].map(platform => {
                  const account = accounts.find(a => a.platform === platform)
                  const Icon = platform === 'meta' ? Facebook : Globe
                  return (
                    <div key={platform} className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform === 'meta' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold capitalize" style={{ color: 'var(--c-text)' }}>{platform} Ads</p>
                          <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                            {account ? account.account_name : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {account ? (
                        <button onClick={() => handleDisconnect(account.id, platform)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => openConnectModal(platform)} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                          Connect
                        </button>
                      )}
                      </div>
                      )
                      })}
                      </div>
                      </div>

                      {/* AI Suggestions Section */}
            <div className="space-y-4">
              <p className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                <Lightbulb className="w-4 h-4 text-amber-400" /> AI Suggestions
              </p>
              <div className="space-y-3">
                {suggestions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-100 dark:border-white/5 text-center">
                    <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-bold text-slate-400">No suggestions yet</p>
                    <p className="text-xs text-slate-500 mt-1">Run AI Optimization to generate ideas</p>
                  </div>
                ) : (
                  suggestions.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5 border-l-4 border-l-indigo-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{s.title}</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${s.expected_impact === 'high' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {s.expected_impact} Impact
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--c-text-muted)' }}>{s.description}</p>
                      <button onClick={() => handleApplySuggestion(s.id)} className="w-full py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                        Apply Fix
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <p className="text-sm font-black" style={{ color: 'var(--c-text)' }}>Active Campaigns</p>
              <button onClick={() => setIsCreateOpen(true)} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> New Campaign
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-20">
                <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-400">No campaigns found</p>
                <p className="text-sm text-slate-500 mt-1">Connect an account or create your first campaign</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Budget</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Spend</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">ROAS</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {campaigns.map(c => {
                      const Icon = getPlatformIcon(c.platform)
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.platform === 'meta' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{c.name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-50" style={{ color: 'var(--c-text-muted)' }}>{c.objective || 'Conversions'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusBadge(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--c-text)' }}>₹{(parseFloat(c.daily_budget)||0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--c-text)' }}>₹{(parseFloat(c.total_spend)||0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black" style={{ color: 'var(--c-text)' }}>{(parseFloat(c.roas)||0).toFixed(2)}x</span>
                              {(parseFloat(c.roas)||0) > 3 && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => handlePauseResume(c)} disabled={pausing === c.id} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                              {pausing === c.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Create Campaign Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black" style={{ color: 'var(--c-text)' }}>New Campaign</h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-1" style={{ color: 'var(--c-text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Campaign Name</label>
                  <input type="text" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="e.g. Summer Sale 2026" className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Objective</label>
                  <select value={newCampaign.objective} onChange={e => setNewCampaign({ ...newCampaign, objective: e.target.value })} className="input-field mt-1">
                    <option value="conversions">Conversions</option>
                    <option value="traffic">Traffic</option>
                    <option value="awareness">Brand Awareness</option>
                    <option value="retargeting">Retargeting</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Daily Budget (₹)</label>
                  <input type="number" value={newCampaign.dailyBudget} onChange={e => setNewCampaign({ ...newCampaign, dailyBudget: e.target.value })} placeholder="e.g. 500" min="0" className="input-field mt-1" />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setIsCreateOpen(false)} className="btn-ghost flex-1 text-xs">Cancel</button>
                <button onClick={handleCreateCampaign} disabled={creating || !newCampaign.name} className="btn-primary flex-1 text-xs">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Connect Modal */}
      <AnimatePresence>
        {isConnectModalOpen && (
          <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black capitalize" style={{ color: 'var(--c-text)' }}>Connect {connectPlatform} Ads</h3>
                <button onClick={() => setIsConnectModalOpen(false)} className="p-1" style={{ color: 'var(--c-text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Account ID</label>
                  <input type="text" value={connectData.accountId} onChange={e => setConnectData({ ...connectData, accountId: e.target.value })} placeholder="e.g. 123-456-7890" className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Friendly Name</label>
                  <input type="text" value={connectData.accountName} onChange={e => setConnectData({ ...connectData, accountName: e.target.value })} placeholder="Main Ad Account" className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-subtle)' }}>Access Token</label>
                  <input type="password" value={connectData.accessToken} onChange={e => setConnectData({ ...connectData, accessToken: e.target.value })} placeholder="Paste your token here" className="input-field mt-1" />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setIsConnectModalOpen(false)} className="btn-ghost flex-1 text-xs">Cancel</button>
                <button onClick={handleConnect} disabled={connecting} className="btn-primary flex-1 text-xs">
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Creative Modal */}
      <AnimatePresence>
        {isCreativeModalOpen && (
          <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black" style={{ color: 'var(--c-text)' }}>AI Ad Copy Generator</h3>
                <button onClick={() => setIsCreativeModalOpen(false)} className="p-1" style={{ color: 'var(--c-text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              {!creativeData ? (
                <div className="space-y-3">
                  <input type="text" value={targetProduct.name} onChange={e => setTargetProduct({ ...targetProduct, name: e.target.value })} placeholder="Product name" className="input-field" />
                  <textarea value={targetProduct.desc} onChange={e => setTargetProduct({ ...targetProduct, desc: e.target.value })} placeholder="Key features..." rows="3" className="input-field" />
                  <button onClick={handleGenerateCreative} disabled={loading} className="btn-primary w-full">Generate</button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--c-text-subtle)' }}>Headlines</p>
                    {creativeData.headlines?.map((h, i) => <div key={i} className="p-2 bg-slate-50 dark:bg-white/5 rounded text-sm">{h}</div>)}
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--c-text-subtle)' }}>Descriptions</p>
                    {creativeData.descriptions?.map((d, i) => <div key={i} className="p-2 bg-slate-50 dark:bg-white/5 rounded text-sm">{d}</div>)}
                  </div>
                  <button onClick={() => setCreativeData(null)} className="btn-ghost w-full">Generate More</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

