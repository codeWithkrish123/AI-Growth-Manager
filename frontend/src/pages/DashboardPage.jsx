import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Clock, Target, Zap, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
    const { shop } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [syncStatus, setSyncStatus] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [analyzeStatus, setAnalyzeStatus] = useState('')
    const [applyingFix, setApplyingFix] = useState(false)
    const [fixStatus, setFixStatus] = useState('')
    const [toast, setToast] = useState(null)
    const [dashboardData, setDashboardData] = useState(null)

    useEffect(() => {
        document.title = 'Dashboard – AI Growth Manager'
        
        if (!shop) {
            navigate('/signin')
            return
        }

        // Set shop in localStorage for future access
        localStorage.setItem('currentShop', shop)

        fetchDashboardData()
    }, [shop, navigate])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:3001/api/${shop}/dashboard`)
            
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data')
            }
            
            const data = await response.json()
            if (data.success) {
                setDashboardData(data.data)
                console.log('Dashboard data loaded:', {
                    problems: data.data.analysis?.problems?.length || 0,
                    healthScore: data.data.healthScore
                })
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const showToast = (message, type = 'info') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleSync = async () => {
        try {
            setSyncing(true)
            setSyncStatus('Connecting to Shopify...')
            const response = await fetch(`http://localhost:3001/api/${shop}/sync`, {
                method: 'POST',
            })
            
            if (!response.ok) {
                throw new Error('Failed to trigger sync')
            }
            
            const data = await response.json()
            if (data.success) {
                setSyncStatus('Fetching store data from Shopify...')
                // Poll for sync status
                pollSyncStatus(data.data.syncJobId)
            }
        } catch (error) {
            console.error('Sync error:', error)
            setSyncing(false)
            setSyncStatus('')
            showToast('Sync failed. Please try again.', 'error')
        }
    }

    const pollSyncStatus = async (syncJobId) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/${shop}/sync/${syncJobId}`)
                const data = await response.json()
                
                if (data.success && (data.data.status === 'completed' || data.data.status === 'failed')) {
                    clearInterval(interval)
                    setSyncing(false)
                    setSyncStatus('')
                    await fetchDashboardData(true) // Force refresh after sync
                    showToast('Sync completed successfully!', 'success')
                }
            } catch (error) {
                console.error('Sync status poll error:', error)
                clearInterval(interval)
                setSyncing(false)
                setSyncStatus('')
                showToast('Sync failed. Please try again.', 'error')
            }
        }, 2000)
    }

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true)
            setAnalyzeStatus('Connecting to AI engine...')
            
            const response = await fetch(`http://localhost:3001/api/${shop}/analyze`, {
                method: 'POST',
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to trigger analysis')
            }
            
            const data = await response.json()
            if (data.success) {
                setAnalyzeStatus('AI analysis running...')
                // Poll for analysis completion
                setTimeout(() => {
                    setAnalyzing(false)
                    setAnalyzeStatus('')
                    fetchDashboardData()
                    showToast('AI Analysis complete!', 'success')
                }, 3000)
            }
        } catch (error) {
            console.error('Analysis error:', error)
            setAnalyzing(false)
            setAnalyzeStatus('')
            showToast('Analysis failed. Please try again.', 'error')
        }
    }

    const handleApplyFix = async (suggestion) => {
        try {
            if (!suggestion || !suggestion.payload) {
                showToast('This fix has no data to apply. Run Analyze again.', 'error')
                return
            }

            setApplyingFix(true)
            setFixStatus('Applying fix to your store...')
            
            const response = await fetch(`http://localhost:3001/api/${shop}/fix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problemId: suggestion.id,
                    fixType: suggestion.fixType || 'update_product',
                    payload: suggestion.payload,
                }),
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to apply fix')
            }
            
            if (data.success || response.status === 200) {
                setApplyingFix(false)
                setFixStatus('')
                await fetchDashboardData()
                showToast('✅ Fix applied successfully! Your store has been updated in Shopify.', 'success')
            } else {
                throw new Error(data.message || 'Failed to apply fix')
            }
        } catch (error) {
            console.error('Fix error:', error)
            setApplyingFix(false)
            setFixStatus('')
            showToast(`Failed to apply fix: ${error.message}`, 'error')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
            {/* Sync Overlay */}
            {syncing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Syncing Data</h3>
                            <p className="text-slate-600">{syncStatus}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Analyze Overlay */}
            {analyzing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Analysis</h3>
                            <p className="text-slate-600">{analyzeStatus}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Apply Fix Overlay */}
            {applyingFix && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Applying Fix</h3>
                            <p className="text-slate-600">{fixStatus}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg max-w-sm transition-all ${
                    toast.type === 'success' 
                        ? 'bg-green-500 text-white' 
                        : toast.type === 'error' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-slate-800 text-white'
                }`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        ) : toast.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <RefreshCw className="w-5 h-5 flex-shrink-0" />
                        )}
                        <p className="font-medium text-sm">{toast.message}</p>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/signin')}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-slate-900">AI Growth Manager</h1>
                                <p className="text-sm text-slate-500">{shop}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-black hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Fetching data...' : 'Sync Data'}
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {analyzing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Store'
                            )}
                        </button>
                    </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                        Welcome to Your Dashboard
                    </h2>
                    <p className="text-slate-600">
                        Get AI-powered insights and fixes to grow your Shopify store
                    </p>
                </motion.div>

                {dashboardData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Health Score Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-1"
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black text-slate-900">Health Score</h3>
                                    <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div className="relative w-32 h-32 mx-auto mb-4">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="#e2e8f0"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="url(#gradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 56}`}
                                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - (dashboardData.snapshot?.healthScore || 75) / 100)}`}
                                            className="transition-all duration-1000"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-black text-slate-900">
                                            {dashboardData.snapshot?.healthScore ?? dashboardData.healthScore ?? 0}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-center text-sm text-slate-600">
                                    Your store is performing {(dashboardData.snapshot?.healthScore || 75) > 80 ? 'excellently' : (dashboardData.snapshot?.healthScore || 75) > 60 ? 'well' : 'poorly'}
                                </p>
                                
                                {/* Health History Sparkline */}
                                {dashboardData.scoreHistory && dashboardData.scoreHistory.length > 1 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 mb-2 text-center">30-day trend</p>
                                        <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
                                            {(() => {
                                                const data = dashboardData.scoreHistory.map(h => h.healthScore || h.score || 0);
                                                const min = Math.min(...data, 0);
                                                const max = Math.max(...data, 100);
                                                const range = max - min || 1;
                                                const points = data.map((val, i) => {
                                                    const x = (i / (data.length - 1)) * 200;
                                                    const y = 50 - ((val - min) / range) * 45 - 2.5;
                                                    return `${x},${y}`;
                                                }).join(' ');
                                                return (
                                                    <g>
                                                        <polyline
                                                            fill="none"
                                                            stroke="url(#sparkGradient)"
                                                            strokeWidth="2"
                                                            points={points}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                        <defs>
                                                            <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                <stop offset="0%" stopColor="#3b82f6" />
                                                                <stop offset="100%" stopColor="#8b5cf6" />
                                                            </linearGradient>
                                                        </defs>
                                                        {data.map((val, i) => {
                                                            const x = (i / (data.length - 1)) * 200;
                                                            const y = 50 - ((val - min) / range) * 45 - 2.5;
                                                            return (
                                                                <circle
                                                                    key={i}
                                                                    cx={x}
                                                                    cy={y}
                                                                    r="2"
                                                                    fill={i === data.length - 1 ? '#8b5cf6' : '#3b82f6'}
                                                                />
                                                            );
                                                        })}
                                                    </g>
                                                );
                                            })()}
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* KPI Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2 grid grid-cols-2 gap-4"
                        >
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Conversion Rate</span>
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {((dashboardData.snapshot?.metrics?.conversionRate ?? dashboardData.conversionRate ?? 0) * 100).toFixed(2)}%
                                </p>
                                <p className="text-xs text-slate-500">Industry avg: 2.5%</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Avg Order Value</span>
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    ₹{Math.round(dashboardData.snapshot?.metrics?.avgOrderValue ?? dashboardData.avgOrderValue ?? 0)}
                                </p>
                                <p className="text-xs text-slate-500">Last 90 days</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Cart Abandonment</span>
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {((dashboardData.snapshot?.metrics?.cartAbandonRate ?? dashboardData.cartAbandonRate ?? 0) * 100).toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-500">Industry avg: 70%</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Total Orders</span>
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {dashboardData.snapshot?.metrics?.orderCount ?? dashboardData.totalOrders ?? 0}
                                </p>
                                <p className="text-xs text-slate-500">Last 90 days</p>
                            </div>
                        </motion.div>

                        {/* AI Suggestions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-3"
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        AI Suggestions
                                    </h3>
                                    <span className="text-sm text-slate-500">
                                        {dashboardData.suggestions?.length || 3} recommendations
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {(dashboardData.snapshot?.problems || dashboardData.analysis?.problems || []).length > 0 ? (
                                        (dashboardData.snapshot?.problems || dashboardData.analysis?.problems || []).map((problem, index) => (
                                        <div key={problem.id || index} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-black text-slate-900">{problem.title || problem.description}</h4>
                                                        <span className={`px-2 py-1 text-xs font-black rounded ${
                                                            problem.severity === 'critical' 
                                                                ? 'bg-red-100 text-red-700'
                                                                : problem.severity === 'warning'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {problem.severity || 'Medium'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">{problem.description || problem.reason}</p>
                                                    {problem.impact && <p className="text-sm font-black text-primary">{problem.impact}</p>}
                                                </div>
                                                {problem.fixType && problem.fixType !== 'none' && (
                                                    <button
                                                        onClick={() => handleApplyFix(problem)}
                                                        disabled={applyingFix}
                                                        className="ml-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                                    >
                                                        {applyingFix ? (
                                                            <>
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                                Applying...
                                                            </>
                                                        ) : (
                                                            'Apply Fix'
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-black text-slate-900 mb-2">No Issues Found</h3>
                                            <p className="text-slate-600">Your store is performing excellently! Keep up the great work.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">No Data Available</h3>
                        <p className="text-slate-600 mb-6">
                            Connect your store and run an analysis to see your dashboard
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-black hover:bg-primary/90 transition-colors"
                        >
                            Refresh Dashboard
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
