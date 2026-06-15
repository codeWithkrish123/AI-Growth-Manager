import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, BarChart3, Target, Zap } from 'lucide-react'

export default function OnboardingStepsPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Left: Branding */}
            <div className="md:w-[45%] bg-indigo-600 p-20 flex flex-col justify-center">
                <h1 className="text-6xl font-black text-white leading-tight">Setting up<br/>your AI Engine.</h1>
                <p className="text-indigo-200 mt-6 text-lg">Just a few steps to personalize your AI growth strategy.</p>
            </div>

            {/* Right: Steps */}
            <div className="md:w-[55%] p-20 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    {step === 1 && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                            <h2 className="text-3xl font-black mb-8">Define your Goals</h2>
                            <div className="space-y-4">
                                {['Increase Revenue', 'Improve Retention', 'Optimize Ad Spend'].map(g => (
                                    <button key={g} className="w-full p-6 border-2 border-slate-200 rounded-2xl text-left font-bold hover:border-indigo-600 transition-all">{g}</button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                            <h2 className="text-3xl font-black mb-8">Select Data Sources</h2>
                            <div className="space-y-4">
                                {['Google Ads', 'Shopify Orders', 'Email Campaigns'].map(s => (
                                    <button key={s} className="w-full p-6 border-2 border-slate-200 rounded-2xl text-left font-bold hover:border-indigo-600 transition-all">{s}</button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                            <h2 className="text-3xl font-black mb-8">Ready to launch?</h2>
                            <p className="text-slate-500 mb-8">Your AI engine is ready to sync and analyze your store data in real-time.</p>
                        </motion.div>
                    )}

                    <button onClick={handleNext} className="mt-10 w-full h-[64px] bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2">
                        {step === 3 ? 'Finish Setup' : 'Continue'} <ChevronRight className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    )
}