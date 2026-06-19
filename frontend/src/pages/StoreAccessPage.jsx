import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import { BACKEND_URL } from '../services'
import Swal from 'sweetalert2'

export default function StoreAccessPage() {
    const navigate = useNavigate()
    const shop = localStorage.getItem('currentShop')
    const [isVerifying, setIsVerifying] = useState(false)

    if (!shop) {
        navigate('/onboarding')
        return null
    }

    const handleAuthorize = async () => {
        setIsVerifying(true)
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken')
            const baseUrl = BACKEND_URL || ''

            // Step 1: Try direct activation — if the merchant already has a Shopify
            // access token stored, just flip is_active=true and get a fresh JWT.
            // This handles the case where the DB record is stuck as inactive.
            const activateRes = await fetch(`${baseUrl}/api/auth/activate-store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ shop })
            })

            const activateData = await activateRes.json()

            if (activateRes.ok && activateData.success && activateData.data?.token) {
                // Got a real token — store it and go to dashboard
                console.log('✅ Store activated directly, got real token')
                localStorage.setItem('token', activateData.data.token)
                localStorage.setItem('shopifyConnected', 'true')
                localStorage.setItem('currentShop', shop)
                navigate(`/dashboard/${activateData.data.shopDomain || shop}`)
                return
            }

            // Step 2: No existing Shopify token — must go through full Shopify OAuth
            console.log('⚠️ No stored token, initiating Shopify OAuth...')
            const initiateRes = await fetch(`${baseUrl}/api/auth/shopify/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ shop, force: true })
            })

            const initiateData = await initiateRes.json()

            if (!initiateRes.ok || !initiateData.success) {
                throw new Error(initiateData?.error?.message || initiateData?.error || `HTTP ${initiateRes.status}`)
            }

            if (initiateData.data?.authUrl) {
                window.location.href = initiateData.data.authUrl
            } else {
                throw new Error('No authorization URL returned from server')
            }
        } catch (e) {
            console.error('Authorization error:', e)
            Swal.fire({
                title: 'Access Error',
                text: e.message || 'Failed to connect to store.',
                icon: 'error',
                confirmButtonColor: '#1a73e8'
            })
            setIsVerifying(false)
        }
    }

    const handleDecline = () => {
        localStorage.removeItem('currentShop')
        navigate('/onboarding')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col items-center text-center"
            >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-6">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>

                <h1 className="text-2xl font-black text-slate-900 mb-2">Review Permissions</h1>
                <p className="text-slate-600 text-sm font-medium mb-6">AI Growth Manager requires access to optimize your store.</p>
                
                <div className="w-full bg-slate-50 rounded-lg p-3 mb-6 flex items-center gap-2 border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{shop}</span>
                </div>

                <div className="w-full space-y-2 mb-8 text-left">
                    {[
                        { title: 'Products', desc: 'Read titles, descriptions, images' },
                        { title: 'Orders', desc: 'Read order history and revenue' },
                        { title: 'Analytics', desc: 'Read traffic and conversions' },
                        { title: 'Optimization', desc: 'AI-powered improvements' }
                    ].map((item) => (
                        <div key={item.title} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <p className="text-xs font-bold text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="w-full flex gap-3">
                    <button onClick={handleDecline} className="btn-ghost flex-1">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handleAuthorize}
                        disabled={isVerifying}
                        className="btn-primary flex-[1.5] disabled:opacity-50"
                    >
                        {isVerifying ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Authorizing...
                            </>
                        ) : (
                            <>
                                Allow Access
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

