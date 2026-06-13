const content1 = `import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, BarChart3, DollarSign, Target, TrendingUp, Plus, RefreshCw, Zap, Sparkles,
  Layers, Play, Pause, Loader2, X, Activity, Menu,
  Facebook, Globe, Lightbulb, FlaskConical, Users
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI } from '../services/api'

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

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [accRes, campRes, perfRes, sugRes] = await Promise.allSettled([
        dashboardAPI.getAdsAccounts(shop),
        dashboardAPI.getAdsCampaigns(shop),
        dashboardAPI.getAdsPerformance(shop),
        dashboardAPI.getAdsSuggestions(shop),
      ])
      if (accRes.status === 'fulfilled') {
        const data = accRes.value.data?.data || accRes.value.data || {}
        setAccounts(Array.isArray(data) ? data : (data.accounts || []))
      }
      if (campRes.status === 'fulfilled') {
        const data = campRes.value.data?.data || campRes.value.data || {}
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
    } catch {}
    finally { setLoading(false) }
  }`;
