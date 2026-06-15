import { useState, useEffect } from 'react';
import { Mail, Send, Target, Users, BarChart3, Inbox, Plus, Menu, RefreshCw, X, Sparkles, Wand2, Edit3, Eye, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { dashboardAPI, errMsg } from '../services/api'
import Swal from 'sweetalert2'

export default function EmailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark,       setIsDark]     = useState(() => document.documentElement.classList.contains('dark'))
  const [campaigns,    setCampaigns]  = useState([])
  const [analytics,    setAnalytics]  = useState(null)
  const [loading,      setLoading]    = useState(true)
  const [showCreate,   setShowCreate] = useState(false)
  const [creating,     setCreating]   = useState(false)
  const [toast,        setToast]      = useState(null)
  const [previewCamp,  setPreviewCamp]= useState(null)
  const [confirmSend,  setConfirmSend]= useState(null)
  const [sending,      setSending]    = useState(false)

  const [mode,       setMode]      = useState('manual')
  const [form,       setForm]      = useState({ name: '', subject: '', type: 'promotional', body: '' })
  const [aiPrompt,   setAiPrompt]  = useState('')
  const [generating, setGenerating]= useState(false)
  const [aiResult,   setAiResult]  = useState(null)

  const shop = localStorage.getItem('currentShop') || ''

  const toggleDark = () => { const n = !isDark; setIsDark(n); document.documentElement.classList.toggle('dark', n); localStorage.setItem('theme', n ? 'dark' : 'light') }
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => { if (shop) fetchAll() }, [shop])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [campRes, analRes] = await Promise.allSettled([
        dashboardAPI.getEmailCampaigns(shop),
        dashboardAPI.getEmailAnalytics(shop),
      ])
      if (campRes.status === 'fulfilled') {
        const d = campRes.value.data?.data || campRes.value.data || []
        setCampaigns(Array.isArray(d) ? d : [])
      }
      if (analRes.status === 'fulfilled') setAnalytics(analRes.value.data?.data || analRes.value.data || null)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return Swal.fire({ text: 'Enter a prompt first', icon: 'warning', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    try {
      setGenerating(true)
      const res = await dashboardAPI.aiPromptComposeEmail(shop, { prompt: aiPrompt })
      const data = res.data?.data || res.data
      setAiResult({ subject: data.subject, body: data.body })
      setForm(p => ({ ...p, subject: data.subject, body: data.body, name: p.name || aiPrompt.slice(0, 40) }))
      Swal.fire({
        title: 'Email Generated!',
        text: 'Review and edit the copy below.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } catch (e) { Swal.fire({ title: 'Generation Failed', text: errMsg(e), icon: 'error', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' }) }
    finally { setGenerating(false) }
  }

  const handleCreate = async () => {
    if (!form.name) return Swal.fire({ text: 'Campaign name is required', icon: 'warning', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    const subject = form.subject || aiResult?.subject
    if (!subject) return Swal.fire({ text: 'Subject is required', icon: 'warning', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' })
    try {
      setCreating(true)
      await dashboardAPI.createEmailCampaign(shop, { name: form.name, type: form.type, subject, body: form.body || aiResult?.body })
      Swal.fire({
        title: 'Campaign Created!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
      closeModal(); fetchAll()
    } catch (e) { Swal.fire({ title: 'Create Failed', text: errMsg(e), icon: 'error', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#1e293b' }) }
    finally { setCreating(false) }
  }

  const handleSendRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Send to all customers?',
      text: 'This will email all customers in your Shopify store. This action cannot be undone.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, send now',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#1e293b'
    });

    if (result.isConfirmed) {
      handleSendConfirmed(id);
    }
  }

  const handleSendConfirmed = async (id) => {
    try {
      setSending(true)
      const res = await dashboardAPI.sendEmailCampaign(shop, id)
      const data = res.data?.data || res.data
      Swal.fire({
        title: 'Campaign Sent!',
        text: `Success! Email delivered to ${data?.sent ?? '?'} customers.`,
        icon: 'success',
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
      fetchAll()
    } catch (e) {
      Swal.fire({
        title: 'Send Failed',
        text: errMsg(e),
        icon: 'error',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#1e293b'
      })
    } finally {
      setSending(false)
    }
  }

  const closeModal = () => {
    setShowCreate(false); setMode('manual')
    setForm({ name: '', subject: '', type: 'promotional', body: '' })
    setAiPrompt(''); setAiResult(null)
  }

  const stats = [
    { label: 'Total Sent',     value: campaigns.reduce((s,c)=>s+(c.total_sent||0),0),      icon: Send,   color: 'text-blue-500',    bg: 'badge-blue' },
    { label: 'Avg Open Rate',  value: campaigns.length ? `${(campaigns.reduce((s,c)=>s+parseFloat(c.open_rate||0),0)/campaigns.length).toFixed(1)}%` : '—', icon: Inbox,  color: 'text-emerald-500', bg: 'badge-green' },
    { label: 'Avg Click Rate', value: campaigns.length ? `${(campaigns.reduce((s,c)=>s+parseFloat(c.click_rate||0),0)/campaigns.length).toFixed(1)}%` : '—', icon: Target, color: 'text-purple-500',  bg: 'badge-purple' },
    { label: 'Campaigns',      value: campaigns.length,                                     icon: Users,  color: 'text-amber-500',   bg: 'badge-amber' },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar active="emails" shop={shop} onDarkModeToggle={toggleDark} isDark={isDark}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

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
                <Mail className="w-5 h-5 text-blue-400" />
                Email Campaigns
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                Create, send, and track emails to your Shopify customers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="btn-ghost text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`} /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> New Campaign
            </button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-5 max-w-5xl">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${s.bg}`} style={{ padding: '6px' }}>
                    <s.icon className="w-3.5 h-3.5" />
                  </span>
                  <p className="text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>{s.label}</p>
                </div>
                <p className="stat-number">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Campaigns table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border-light)' }}>
              <p className="section-title flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: 'var(--c-primary)' }} />
                Campaign Performance
              </p>
              <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{campaigns.length} campaigns</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--c-primary)' }} />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16">
                <Mail className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--c-border)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--c-text-muted)' }}>No campaigns yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-subtle)' }}>Create your first campaign above</p>
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Open Rate</th>
                      <th>Click Rate</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{c.name}</p>
                          <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--c-text-muted)' }}>{c.subject}</p>
                        </td>
                        <td>
                          <span className="text-xs capitalize" style={{ color: 'var(--c-text-secondary)' }}>
                            {c.type?.replace('_',' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            c.status==='sent'    ? 'badge-green' :
                            c.status==='draft'   ? 'badge-indigo' :
                            c.status==='sending' ? 'badge-blue' : 'badge-amber'
                          }`}>{c.status}</span>
                        </td>
                        <td><span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{c.total_sent ?? 0}</span></td>
                        <td>
                          <span className={`text-sm font-semibold ${c.status==='sent' ? 'text-emerald-500' : ''}`} style={c.status!=='sent'?{color:'var(--c-text-subtle)'}:{}}>
                            {c.status==='sent' ? `${c.open_rate ?? 0}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`text-sm font-semibold ${c.status==='sent' ? 'text-purple-500' : ''}`} style={c.status!=='sent'?{color:'var(--c-text-subtle)'}:{}}>
                            {c.status==='sent' ? `${c.click_rate ?? 0}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {c.body && (
                              <button onClick={() => setPreviewCamp(c)} className="btn-ghost text-xs p-1.5" title="Preview">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(c.status==='draft' || c.status==='scheduled') ? (
                              <button onClick={() => setConfirmSend(c.id)} className="btn-primary text-xs">
                                <Send className="w-3 h-3" /> Send
                              </button>
                            ) : c.status==='sent' ? (
                              <span className="text-xs" style={{ color: 'var(--c-text-subtle)' }}>Delivered</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {campaigns.some(c => c.status === 'draft') && (
                  <div className="px-5 py-3 border-t flex items-start gap-2"
                    style={{ borderColor: 'var(--c-border-light)', background: 'var(--c-primary-light)' }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--c-primary)' }} />
                    <p className="text-xs" style={{ color: 'var(--c-primary)' }}>
                      Draft campaigns show — until sent. Click <strong>Send</strong> to deliver to all your Shopify customers.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Preview Modal ── */}
      {previewCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewCamp(null)} />
          <div className="relative rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: 'var(--c-surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{previewCamp.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>Subject: {previewCamp.subject}</p>
              </div>
              <button onClick={() => setPreviewCamp(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--c-border)' }}>
                <div className="px-6 py-4" style={{ background: 'var(--c-primary)' }}>
                  <p className="text-white font-bold">{shop.replace('.myshopify.com','')}</p>
                </div>
                <div className="p-6" dangerouslySetInnerHTML={{ __html: previewCamp.body || '<p>No email body.</p>' }} />
                <div className="px-6 py-3 text-center" style={{ background: 'var(--c-bg)' }}>
                  <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Powered by AI Growth Manager</p>
                </div>
              </div>
            </div>
            {(previewCamp.status==='draft'||previewCamp.status==='scheduled') && (
              <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
                <button onClick={() => { setPreviewCamp(null); handleSendRequest(previewCamp.id) }} className="btn-primary w-full justify-center">
                  <Send className="w-4 h-4" /> Send This Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Campaign Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: 'var(--c-surface)' }}>

            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <p className="text-base font-bold" style={{ color: 'var(--c-text)' }}>New Email Campaign</p>
              <button onClick={closeModal} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 px-6 mt-4">
              <button onClick={() => setMode('manual')}
                className={mode==='manual' ? 'btn-primary flex-1 justify-center text-xs' : 'btn-ghost flex-1 justify-center text-xs'}>
                <Edit3 className="w-3.5 h-3.5" /> Manual
              </button>
              <button onClick={() => setMode('ai')}
                className={mode==='ai' ? 'btn-primary flex-1 justify-center text-xs' : 'btn-ghost flex-1 justify-center text-xs'}>
                <Wand2 className="w-3.5 h-3.5" /> AI Compose
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--c-text-muted)' }}>Campaign Name</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. Summer Sale Promo" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--c-text-muted)' }}>Type</label>
                <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} className="input-field">
                  <option value="promotional">Promotional</option>
                  <option value="abandoned_cart">Abandoned Cart</option>
                  <option value="welcome">Welcome Flow</option>
                  <option value="winback">Win-back</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              {mode==='ai' && (
                <>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--c-text-muted)' }}>
                      What do you want to tell customers?
                    </label>
                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
                      placeholder="e.g. Summer sale — 30% off all products this weekend. Make it exciting and urgent."
                      className="input-field resize-none" />
                  </div>
                  <button onClick={handleGenerate} disabled={generating || !aiPrompt.trim()} className="btn-primary w-full justify-center">
                    {generating
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>
                    }
                  </button>
                  {aiResult && (
                    <div className="rounded-lg p-4 border space-y-3" style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary)' }}>
                      <p className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--c-primary)' }}>
                        <Sparkles className="w-3 h-3" /> AI Generated — edit before saving
                      </p>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--c-text-muted)' }}>Subject Line</label>
                        <input value={form.subject} onChange={e => setForm(p=>({...p,subject:e.target.value}))} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--c-text-muted)' }}>Email Body (HTML)</label>
                        <textarea value={form.body} onChange={e => setForm(p=>({...p,body:e.target.value}))} rows={8}
                          className="input-field resize-y font-mono text-xs" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {mode==='manual' && (
                <>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--c-text-muted)' }}>Subject Line</label>
                    <input value={form.subject} onChange={e => setForm(p=>({...p,subject:e.target.value}))}
                      placeholder="e.g. You left something behind 👀" className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--c-text-muted)' }}>Email Body (HTML)</label>
                    <textarea value={form.body} onChange={e => setForm(p=>({...p,body:e.target.value}))} rows={6}
                      placeholder="<p>Hi there,</p><p>Your message...</p>"
                      className="input-field resize-y font-mono text-xs" />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 pb-6 pt-2">
              <button onClick={handleCreate} disabled={creating || (mode==='ai' && !aiResult)} className="btn-primary w-full justify-center">
                {creating
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                  : <><Plus className="w-3.5 h-3.5" /> Create Campaign</>
                }
              </button>
              {mode==='ai' && !aiResult && (
                <p className="text-center text-xs mt-2" style={{ color: 'var(--c-text-subtle)' }}>Generate the email first, then create</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
