$path = "E:\AI Growth Manager\frontend\src\pages\DashboardPage.jsx"
$content = @"
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, AlertCircle, CheckCircle, Clock, Target, Zap, RefreshCw, Menu, LayoutDashboard } from 'lucide-react'
import Sidebar from '../components/Sidebar'

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
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

    const toggleDark = () => {
      const next = !isDark; setIsDark(next)
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
    }
"@
Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "Header written"
