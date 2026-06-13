import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Cpu, Mail, DollarSign, Settings,
  Sparkles, ChevronDown, Moon, Sun, LogOut, Zap,
  Tag, Megaphone, Search, TrendingUp, BarChart3,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',      key: 'dashboard',  path: null },
  { icon: Package,         label: 'Products',        key: 'products',   path: '/products' },
  { icon: Cpu,             label: 'AI Actions',      key: 'ai',         path: '/ai-actions', badge: 'Live', badgeClass: 'badge-live' },
  { divider: true,         label: 'Growth Tools' },
  { icon: Megaphone,       label: 'Ads Manager',     key: 'ads',        path: '/ads', badge: 'New', badgeClass: 'badge-blue' },
  { icon: Search,          label: 'SEO Manager',     key: 'seo',        path: '/seo', badge: 'New', badgeClass: 'badge-green' },
  { icon: Mail,            label: 'Emails',          key: 'emails',     path: '/emails' },
  { divider: true,         label: 'AI Tools' },
  { icon: Sparkles,        label: 'AI Descriptions', key: 'ai-desc',    path: '/ai-descriptions', badge: 'New', badgeClass: 'badge-blue' },
  { icon: Tag,             label: 'Price Optimizer', key: 'price-ai',   path: '/price-optimizer', badge: 'AI', badgeClass: 'badge-live' },
  { icon: BarChart3,       label: 'Revenue Impact',  key: 'revenue',    path: '/revenue' },
];

export default function Sidebar({ active, shop, onDarkModeToggle, isDark, mobileOpen, onMobileClose }) {
  const navigate  = useNavigate();
  const shopName  = (shop || '').replace('.myshopify.com', '') || 'My Store';
  const initial   = shopName.charAt(0).toUpperCase();
  const [showStore, setShowStore] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
    document.documentElement.style.setProperty('--c-sidebar-w', collapsed ? '68px' : '240px');
    return () => document.documentElement.style.setProperty('--c-sidebar-w', '240px');
  }, [collapsed]);

  const go = (item) => {
    if (item.path) navigate(item.path);
    else navigate(`/dashboard/${shop}`);
    onMobileClose?.();
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-30 sidebar-dark transition-all duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'collapsed' : ''}`}>

        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-white/5 gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-[#1a73e8]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm leading-none tracking-tight">GrowthAI</p>
              <p className="text-[10px] text-blue-400 font-medium mt-0.5">by Stitch</p>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all flex-shrink-0">
            {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
          {onDarkModeToggle && (
            <button onClick={onDarkModeToggle}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all flex-shrink-0">
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Store switcher */}
        {!collapsed && (
          <div className="px-3 py-2.5">
            <button onClick={() => setShowStore(s => !s)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm bg-white/5 hover:bg-white/10 transition-all">
              <div className="w-7 h-7 rounded-sm bg-white/10 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">{initial}</div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white truncate">{shopName}</p>
                <p className="text-[10px] text-slate-500">Shopify Store</p>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showStore ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-hide pb-4">
          {!collapsed && <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Navigation</p>}
          {collapsed && <div className="pt-2" />}
          {NAV.map((item, i) => {
            if (item.divider) {
              if (collapsed) return <div key={i} className="pt-2 border-t border-white/5 mx-2 my-1" />;
              return (
                <div key={i} className="pt-3 pb-1">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-3">{item.label}</p>
                </div>
              );
            }
            const isActive = item.key === active;
            return (
              <button key={item.key} onClick={() => go(item)} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && item.badge && <span className={`badge ${item.badgeClass} text-[9px]`}>{item.badge}</span>}
                {collapsed && <span className="sidebar-tooltip">{item.label}</span>}
              </button>
            );
          })}

          <div className={`${collapsed ? 'mt-1' : 'pt-3 border-t border-white/5 mt-3'}`}>
            {!collapsed && <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-3 pb-1">More</p>}
            <button onClick={() => { navigate('/settings'); onMobileClose?.(); }}
              className={`sidebar-item ${active === 'settings' ? 'active' : ''}`}>
              <Settings className="w-4 h-4" />
              {!collapsed && <span>Settings</span>}
              {collapsed && <span className="sidebar-tooltip">Settings</span>}
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className={`${collapsed ? 'p-2' : 'p-3'} border-t border-white/5`}>
          {!collapsed && (
            <div className="mb-2 px-3 py-2.5 rounded-md bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/10">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-300">Free Plan</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Upgrade for unlimited AI actions</p>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center" title="Free Plan">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>
          )}
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-1 py-1' : 'px-2 py-1'}`}>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">{initial}</div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{shopName}</p>
                  <p className="text-[10px] text-slate-500">Admin</p>
                </div>
                <button onClick={() => { localStorage.clear(); navigate('/'); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Sign out">
                  <LogOut className="w-3 h-3" />
                </button>
              </>
            )}
            {collapsed && <span className="sidebar-tooltip">Sign out</span>}
          </div>
        </div>
      </aside>
    </>
  );
}
