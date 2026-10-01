import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  X, 
  CheckCircle2, 
  Lock, 
  RotateCcw, 
  Smartphone, 
  Video, 
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const FloatingNavButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, toggleUserSubscriptionStatus, resetDemoData } = useApp();

  const sections = [
    {
      title: 'Official Reference Screens',
      links: [
        { num: '1', name: 'Splash Screen', path: '/splash' },
        { num: '2', name: 'Login Screen (Unified Account)', path: '/login' },
        { num: '3', name: 'Home / Video Feed', path: '/' },
        { num: '4', name: 'Discover / Categories', path: '/discover' },
        { num: '5', name: 'Creator Showcase Profile', path: '/creator/pavani_official' },
        { num: '6', name: 'User Profile & Influencer Hub', path: '/profile?tab=influencer' },
        { num: '7', name: 'Creator Fan Subscription', path: '/creator/pavani_official?subscribe=true' },
        { num: '8', name: 'Reels Vertical Feed', path: '/reels' },
        { num: '9', name: 'Influencer Analytics (User Hub)', path: '/creator/dashboard' },
        { num: '10', name: 'Influencer Video Manager', path: '/creator/videos' },
        { num: '11', name: 'Influencer Earnings & Payout', path: '/creator/earnings' },
        { num: '12', name: 'Admin Control Center', path: '/admin' },
      ]
    },
    {
      title: 'Monetization & Creation Flows',
      links: [
        { num: '★', name: 'FunFlick Publishing Plans Gate', path: '/subscription' },
        { num: '★', name: 'Create Post Flow', path: '/create/post' },
        { num: '★', name: 'Upload Video / Reel Flow', path: '/create/video' },
        { num: '★', name: 'Create Story Flow', path: '/create/story' },
        { num: '★', name: 'User Wallet & Cashout', path: '/wallet' },
        { num: '★', name: 'Direct Messages & Chat', path: '/messages' },
        { num: '★', name: 'Notifications Center', path: '/notifications' },
        { num: '★', name: 'Content Library Manager', path: '/my-content' },
      ]
    },
    {
      title: 'Admin Management Hub',
      links: [
        { num: '★', name: 'Admin Manage Subscriptions (Global Plans)', path: '/admin/manage-subscriptions' },
        { num: '★', name: 'Admin Creator Payouts (Section 36)', path: '/admin/payouts' },
        { num: '★', name: 'Admin User Management', path: '/admin/users' },
        { num: '★', name: 'Admin Content Moderation', path: '/admin/content' },
        { num: '★', name: 'Admin Revenue Analytics', path: '/admin/revenue' },
        { num: '★', name: 'Admin Community Reports', path: '/admin/reports' },
        { num: '★', name: 'Admin Settings & Rules', path: '/admin/settings' },
      ]
    }
  ];

  return (
    <>
      {/* Discreet floating button in bottom-right corner */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-3 z-40 p-2.5 rounded-full bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-2xl shadow-pink-500/40 hover:scale-110 active:scale-95 transition-all opacity-85 hover:opacity-100 flex items-center gap-1.5"
        title="Prototype Page Directory"
        aria-label="Open Prototype Navigation"
      >
        <Layers className="w-5 h-5 stroke-[2.2]" />
        <span className="hidden sm:inline text-[11px] font-bold pr-1">Pages</span>
      </button>

      {/* Slide-over Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-sm bg-[#0e0920] border-l border-white/10 h-full flex flex-col justify-between p-5 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <img src="/brand/funflick-logo.png" alt="FunFlick" className="w-6 h-6 rounded-lg object-contain" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white font-heading">
                      Prototype Directory
                    </h3>
                    <p className="text-[10px] text-pink-300">Quick Jump to Any Page</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Section Switchers: Unified User App & Admin */}
              <div className="py-3 border-b border-white/10 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Platform Portals
                  </span>
                  <span className="text-[9px] text-pink-300 font-semibold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                    Unified Account System
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      navigate('/');
                      setIsOpen(false);
                    }}
                    className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      !location.pathname.startsWith('/admin')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs">User App (Viewer & Creator)</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsOpen(false);
                    }}
                    className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs">Admin Center</span>
                  </button>
                </div>

                {/* Subscription Gate Tester */}
                <button
                  onClick={toggleUserSubscriptionStatus}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                    currentUser.hasPublishingSubscription
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {currentUser.hasPublishingSubscription ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Publishing Plan:</span>
                  </div>
                  <span className="font-bold underline">
                    {currentUser.hasPublishingSubscription ? 'Active (Click to Lock)' : 'Locked (Click to Unlock)'}
                  </span>
                </button>
              </div>

              {/* Scrollable Links List */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-4">
                {sections.map(sec => (
                  <div key={sec.title} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {sec.title}
                    </span>
                    <div className="space-y-1">
                      {sec.links.map(link => {
                        const isActive = location.pathname === link.path.split('?')[0];
                        return (
                          <button
                            key={link.path}
                            onClick={() => {
                              navigate(link.path);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                              isActive
                                ? 'bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-mono text-purple-300 shrink-0">
                                {link.num}
                              </span>
                              <span className="truncate">{link.name}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/10 shrink-0 flex items-center justify-between text-xs">
                <button
                  onClick={resetDemoData}
                  className="flex items-center gap-1 text-gray-400 hover:text-rose-400 text-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data</span>
                </button>
                <span className="text-[10px] text-gray-500">FunFlick Prototype</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
