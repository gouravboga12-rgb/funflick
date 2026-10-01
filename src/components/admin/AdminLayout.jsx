import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Crown, 
  DollarSign, 
  BarChart3, 
  Flag, 
  Tag, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  Smartphone,
  ShieldCheck,
  Search
} from 'lucide-react';

export const AdminLayout = ({ children, title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminPayouts, pendingApprovals, showToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingPayoutCount = adminPayouts.filter(p => p.status === 'Partially Paid').length;

  const navLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Creators', icon: Video, path: '/admin/creators' },
    { label: 'Content Moderation', icon: Video, path: '/admin/content', badge: pendingApprovals.length },
    { label: 'Subscriptions', icon: Crown, path: '/admin/subscriptions' },
    { label: 'Creator Payouts', icon: DollarSign, path: '/admin/payouts', badge: pendingPayoutCount },
    { label: 'Revenue Analytics', icon: BarChart3, path: '/admin/revenue' },
    { label: 'Reports', icon: Flag, path: '/admin/reports', badge: '2' },
    { label: 'Categories', icon: Tag, path: '/admin/categories' },
    { label: 'Platform Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#080512] text-white flex flex-col md:flex-row select-none">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d081f] border-r border-white/5 shrink-0 min-h-screen p-4 justify-between">
        <div className="space-y-6">
          {/* Brand */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer group"
          >
            <img src="/brand/funflick-logo.png" alt="FunFlick" className="w-8 h-8 rounded-xl object-contain shadow" />
            <div>
              <span className="font-extrabold text-lg text-white font-heading">
                fun<span className="text-[#ff007a]">flick</span>
              </span>
              <span className="text-[10px] text-gray-400 block -mt-1 font-semibold">Admin Center</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-gray-400'}`} />
                    <span>{link.label}</span>
                  </div>

                  {link.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff007a] text-white">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area Switcher */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white border border-white/5 transition"
          >
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>Open User App</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#0d081f]/90 backdrop-blur-md px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-xl bg-white/5 text-gray-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-extrabold text-white font-heading">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Administrator</span>
            </span>

            <button
              onClick={() => showToast('No new critical system alerts.', 'info')}
              className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-[#0d081f] h-full p-4 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-bold text-sm text-white">FunFlick Admin</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full bg-white/10 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.map(link => (
                  <button
                    key={link.label}
                    onClick={() => {
                      navigate(link.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                      location.pathname === link.path ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40">
                        {link.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
