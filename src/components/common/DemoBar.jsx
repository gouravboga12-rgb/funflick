import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, 
  Video, 
  ShieldCheck, 
  Layers, 
  KeyRound, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  ChevronDown,
  Monitor
} from 'lucide-react';

export const DemoBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    toggleUserSubscriptionStatus, 
    resetDemoData,
    showToast
  } = useApp();

  const [screensOpen, setScreensOpen] = useState(false);

  const screens = [
    { num: '1', name: 'Splash Screen', path: '/splash' },
    { num: '2', name: 'Login Screen', path: '/login' },
    { num: '3', name: 'Home / Video Feed', path: '/' },
    { num: '4', name: 'Discover / Categories', path: '/discover' },
    { num: '5', name: 'Influencer Profile', path: '/creator/pavani_official' },
    { num: '6', name: 'User Profile (Srilatha)', path: '/profile' },
    { num: '7', name: 'Creator Fan Subscription', path: '/creator/pavani_official?subscribe=true' },
    { num: '8', name: 'Reels Vertical Feed', path: '/reels' },
    { num: '9', name: 'Creator Dashboard', path: '/creator/dashboard' },
    { num: '10', name: 'Creator Videos Management', path: '/creator/videos' },
    { num: '11', name: 'Creator Earnings & Payout', path: '/creator/earnings' },
    { num: '12', name: 'Admin Control Panel', path: '/admin' },
    { num: '★', name: 'Publishing Plan Gate', path: '/subscription' },
    { num: '★', name: 'Wallet & Cashout', path: '/wallet' },
    { num: '★', name: 'Upload Post / Video Flow', path: '/create' },
    { num: '★', name: 'Direct Messages & Chat', path: '/messages' },
  ];

  const isUserArea = !location.pathname.startsWith('/creator') && !location.pathname.startsWith('/admin');
  const isCreatorStudio = location.pathname.startsWith('/creator');
  const isAdminArea = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0c0819]/90 backdrop-blur-xl border-b border-purple-500/20 px-3 py-2 text-xs select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Demo Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/brand/funflick-logo.png" alt="FunFlick" className="w-5 h-5 rounded-md object-cover" />
            <span className="font-extrabold text-white tracking-wide text-sm font-heading">
              Fun<span className="text-[#ff007a]">Flick</span>
            </span>
          </div>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300">
            Client Presentation Demo
          </span>
        </div>

        {/* Platform View Modes */}
        <div className="flex items-center bg-[#18122f] p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              isUserArea 
                ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>User App</span>
          </button>

          <button
            onClick={() => navigate('/creator/dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              isCreatorStudio 
                ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Creator Studio</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              isAdminArea 
                ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* Right Tools: 12 Screens Dropdown, Subscription Gate Tester, Device Frame Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Jump Dropdown */}
          <div className="relative">
            <button
              onClick={() => setScreensOpen(!screensOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition"
            >
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden md:inline font-medium">12 Reference Screens</span>
              <span className="md:hidden font-medium">Screens</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {screensOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setScreensOpen(false)}
              >
                <div 
                  className="absolute right-4 top-12 z-50 w-72 bg-[#150f29] border border-purple-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl max-h-[80vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 border-b border-white/10 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Official Reference Screens
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {screens.map(s => (
                      <button
                        key={s.path}
                        onClick={() => {
                          navigate(s.path);
                          setScreensOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition ${
                          location.pathname === s.path.split('?')[0]
                            ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 font-bold border border-pink-500/30'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-purple-300">
                            {s.num}
                          </span>
                          <span>{s.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Publishing Subscription Gate Tester Button */}
          <button
            onClick={toggleUserSubscriptionStatus}
            title="Click to toggle user publishing subscription lock for testing paywall"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
              currentUser.hasPublishingSubscription
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            {currentUser.hasPublishingSubscription ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Publishing:</span>
                <span>Active (Unlocked)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Publishing:</span>
                <span>Locked (Test Gate)</span>
              </>
            )}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetDemoData}
            title="Reset demo data"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-gray-400 border border-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
