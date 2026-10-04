import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { EditProfileModal } from './EditProfileModal';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { HelpSupportModal } from './HelpSupportModal';
import { 
  ChevronLeft, 
  Settings, 
  Heart, 
  Bookmark, 
  History, 
  Crown, 
  Wallet, 
  Video, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Play,
  UploadCloud,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  DollarSign,
  Award,
  Zap,
  Info,
  Trash2
} from 'lucide-react';

export const UserProfileScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'influencer' ? 'influencer' : 'viewer';
  
  const { 
    currentUser, 
    userSubmissions, 
    deleteUserSubmission,
    deleteUserPost,
    setSubscriptionGateModalOpen, 
    setCreateModalOpen,
    showToast 
  } = useApp();

  const [activeProfileMode, setActiveProfileMode] = useState(initialTab); // 'viewer' | 'influencer'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const viewerMenuItems = [
    {
      icon: Heart,
      color: 'text-pink-400',
      label: 'Liked Videos',
      badge: '48',
      path: '/my-content?tab=liked'
    },
    {
      icon: Bookmark,
      color: 'text-amber-400',
      label: 'Saved Videos',
      badge: '19',
      path: '/my-content?tab=saved'
    },
    {
      icon: History,
      color: 'text-blue-400',
      label: 'Watch History',
      badge: null,
      path: '/my-content?tab=history'
    },
    {
      icon: Crown,
      color: 'text-purple-400',
      label: 'Fan Subscriptions',
      badge: '2 Subscribed',
      badgeColor: 'bg-purple-500/20 text-purple-300',
      path: '/subscription'
    },
    {
      icon: Wallet,
      color: 'text-emerald-400',
      label: 'Wallet & Payouts',
      badge: `₹${(currentUser.walletBalance || 125430).toLocaleString()}`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      path: '/wallet'
    },
    {
      icon: Video,
      color: 'text-rose-400',
      label: 'My Content Library',
      badge: `${currentUser.stats?.posts || 128} posts`,
      path: '/my-content'
    },
    {
      icon: Settings,
      color: 'text-gray-300',
      label: 'Account Settings',
      badge: 'Preferences',
      badgeColor: 'bg-white/10 text-gray-300',
      action: 'settings'
    },
    {
      icon: HelpCircle,
      color: 'text-cyan-400',
      label: 'Help & Support',
      badge: '24/7 Desk',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      action: 'help'
    }
  ];

  const handleLogout = () => {
    showToast('Logged out of FunFlick session', 'info');
    navigate('/login');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header with Prominent FunFlick Branding */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition"
            title="FunFlick: Comedy. Entertainment. Always On!"
          >
            <img 
              src="/brand/funflick-logo.png" 
              alt="FunFlick" 
              className="w-7 h-7 rounded-xl object-contain shadow-md drop-shadow" 
            />
            <span className="text-base font-extrabold text-white font-heading">
              fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
            </span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs font-bold text-white font-heading block leading-tight">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-pink-400 font-medium">
            @{currentUser.username}
          </span>
        </div>

        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-1.5 text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition"
          title="Account Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        
        {/* User Card */}
        <div className="flex flex-col items-center text-center space-y-2.5 pt-1">
          <div className="relative">
            {/* Same profile icon style for both Users and Influencers */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-xl"
            />
            {currentUser.isInfluencer && (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 flex items-center justify-center text-xs shadow-md border-2 border-[#090514]" title="Active Influencer Subscription">
                ⭐
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-extrabold text-white font-heading">
                {currentUser.name}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                currentUser.isInfluencer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {currentUser.isInfluencer ? '⭐ Influencer' : 'User (Free Member)'}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-semibold block">
              @{currentUser.username} · Hyderabad
            </span>
            <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto leading-relaxed">
              {currentUser.bio}
            </p>

            {/* Official Company Affiliation Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-amber-500/15 border border-pink-500/30 text-[10px] font-bold text-pink-300 shadow-sm mt-1">
              <img src="/brand/funflick-logo.png" alt="FunFlick" className="w-3.5 h-3.5 object-contain" />
              <span>FunFlick Creator & Entertainment Network</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-8 py-2 w-full border-y border-white/5">
            <div className="text-center">
              <span className="font-extrabold text-base text-white block font-heading">
                {currentUser.stats?.posts || 128}
              </span>
              <span className="text-[11px] text-gray-400">Posts</span>
            </div>
            <div className="text-center">
              <span className="font-extrabold text-base text-white block font-heading">
                {currentUser.stats?.following || 420}
              </span>
              <span className="text-[11px] text-gray-400">Following</span>
            </div>
            <div className="text-center">
              <span className="font-extrabold text-base text-white block font-heading">
                {currentUser.stats?.followers || '2.3K'}
              </span>
              <span className="text-[11px] text-gray-400">Followers</span>
            </div>
          </div>

          {/* Edit Profile CTA Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-wide border border-white/10 transition"
          >
            Edit Profile
          </button>
        </div>

        {/* ======================================================== */}
        {/* UNIFIED ACCOUNT MODE SWITCHER (Viewer vs Influencer Hub) */}
        {/* ======================================================== */}
        <div className="p-1 rounded-2xl bg-[#140d2d] border border-white/10 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setActiveProfileMode('viewer')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeProfileMode === 'viewer'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Viewer Profile</span>
          </button>

          <button
            onClick={() => setActiveProfileMode('influencer')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
              activeProfileMode === 'influencer'
                ? 'bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-md'
                : 'text-pink-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Influencer Hub</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: INFLUENCER & CREATOR HUB (Unified Account View)    */}
        {/* ======================================================== */}
        {activeProfileMode === 'influencer' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Unified Account Info Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-[#181035] border border-pink-500/30 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-white font-heading block">
                    Influencer & Creator Status
                  </span>
                  <p className="text-[10px] text-gray-300">
                    Free upload for all! Upgrade to Influencer to unlock in-depth media analytics & Admin monetary rewards.
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                currentUser.isInfluencer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/10 text-gray-400 border-white/10'
              }`}>
                {currentUser.isInfluencer ? 'Influencer Active' : 'User (Free)'}
              </span>
            </div>

            {/* Influencer Subscription Banner */}
            <div 
              onClick={() => navigate('/subscription')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                currentUser.isInfluencer
                  ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-[#120d29] border-amber-500/40'
                  : 'bg-gradient-to-r from-pink-950/60 via-purple-950/50 to-amber-950/40 border-pink-500/50 shadow-lg shadow-pink-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  currentUser.isInfluencer 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-gradient-to-tr from-pink-500 to-amber-500 shadow'
                }`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-heading">
                      {currentUser.isInfluencer
                        ? `Influencer Plan: ${currentUser.subscriptionPlan || 'Monthly Pass'}`
                        : 'Upgrade to Influencer Status'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      currentUser.isInfluencer
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {currentUser.isInfluencer ? 'SUBSCRIBED' : 'BOOST REACH'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {currentUser.isInfluencer
                      ? 'Deep analytics (Views, Likes, Comments, Shares, Saves, Performance) & Admin rewards eligible'
                      : 'Free uploads active for everyone. Subscribe to become an Influencer and unlock deep analytics & rewards!'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>

            {/* Quick Action Influencer Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => navigate('/create/video')}
                className="p-3 rounded-2xl bg-[#160f33] hover:bg-[#1f1545] border border-white/10 flex flex-col items-center text-center gap-1.5 transition active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  Upload Reel
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold">100% Free</span>
              </button>

              <button
                onClick={() => navigate('/creator/dashboard')}
                className="p-3 rounded-2xl bg-[#160f33] hover:bg-[#1f1545] border border-white/10 flex flex-col items-center text-center gap-1.5 transition active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  Creator Studio
                </span>
                <span className="text-[9px] text-gray-400">Analytics</span>
              </button>

              <button
                onClick={() => navigate('/wallet')}
                className="p-3 rounded-2xl bg-[#160f33] hover:bg-[#1f1545] border border-white/10 flex flex-col items-center text-center gap-1.5 transition active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  My Wallet
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold">
                  ₹{(currentUser.walletBalance || 125430).toLocaleString()}
                </span>
              </button>
            </div>

            {/* Creator Metrics & Admin Wallet Rewards Box */}
            <div className="p-4 rounded-3xl bg-[#130d29] border border-white/10 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div>
                  <span className="text-xs font-bold text-white font-heading block">
                    Influencer Performance & Rewards
                  </span>
                  <p className="text-[10px] text-gray-400">
                    High engagement posts earn monetary rewards sent by Admin
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300">
                  Tier 1 Reach
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-0.5">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <TrendingUp className="w-3 h-3 text-pink-400" />
                    <span>Total Video Views</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-heading block">
                    {currentUser.creatorMetrics?.totalViews || '84.5K'}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-semibold">+18% this week</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-0.5">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Admin Rewards Paid</span>
                  </div>
                  <span className="text-base font-extrabold text-emerald-400 font-heading block">
                    {currentUser.creatorMetrics?.performanceEarnings || '₹14,500'}
                  </span>
                  <span className="text-[9px] text-gray-400">Credited to wallet</span>
                </div>
              </div>

              {/* Wallet Summary */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-[#191238] border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Available In Wallet</span>
                  <span className="text-sm font-extrabold text-white font-heading">
                    ₹{(currentUser.walletBalance || 125430).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/wallet')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Live Submissions & Admin Central Verification Tracker */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-bold text-white font-heading">
                    My Submissions & Admin Approvals ({userSubmissions?.length || 0})
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/upload-video')}
                  className="text-[11px] font-bold text-pink-400 hover:text-pink-300"
                >
                  + Submit Reel
                </button>
              </div>

              {/* Workflow notice */}
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-2.5 text-xs text-gray-300">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  <strong className="text-white">Admin Approval Rule:</strong> When you post a video, central admin verifies it for community guidelines. Once approved, it appears live on the FunFlick feed and you become eligible for view-based wallet payouts.
                </p>
              </div>

              {/* Submissions List */}
              <div className="space-y-2.5">
                {userSubmissions && userSubmissions.length > 0 ? (
                  userSubmissions.map(item => (
                    <div 
                      key={item.id} 
                      className="p-3.5 rounded-2xl bg-[#130d29] border border-white/5 space-y-2.5 hover:border-pink-500/30 transition shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-pink-300 block mt-0.5">
                              {item.category} · {item.date}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Views: <strong className="text-white">{item.views}</strong> · Likes: {item.likes}
                            </span>
                          </div>
                        </div>

                        {/* Delete / Withdraw Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.title}"? This will permanently remove it from your profile and platform feed.`)) {
                              deleteUserSubmission(item.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/5 transition shrink-0"
                          title="Delete submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Admin Status Badge */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                        <span className="text-gray-400">Central Admin Verification:</span>
                        {item.status.includes('Pending') ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>In Admin Review</span>
                          </span>
                        ) : item.status.includes('Approved') ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Approved & Live</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {item.status}
                          </span>
                        )}
                      </div>

                      {/* Performance Reward from Admin if granted */}
                      {item.rewardGranted && (
                        <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                          <span className="text-gray-300">
                            🎉 High Reach Bonus Awarded:
                          </span>
                          <span className="font-extrabold text-emerald-300 font-heading">
                            +₹{item.rewardGranted.toLocaleString()} in Wallet
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400 bg-[#130d29] rounded-2xl border border-white/5">
                    <p>No video submissions yet. Upload your first reel above!</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: VIEWER PROFILE (Standard Viewer Experience)       */}
        {/* ======================================================== */}
        {activeProfileMode === 'viewer' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Viewer Menu List */}
            <div className="space-y-1 bg-[#130d29] rounded-3xl p-2 border border-white/5 shadow-inner">
              {viewerMenuItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    onClick={() => {
                      if (item.action === 'settings') {
                        setIsSettingsModalOpen(true);
                      } else if (item.action === 'help') {
                        setIsHelpModalOpen(true);
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-white/10 text-gray-300'}`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}

              {/* Logout Button */}
              <div
                onClick={handleLogout}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-rose-500/10 cursor-pointer transition group text-rose-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Logout</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* OFFICIAL FUNFLICK COMPANY FOOTER & BRANDING              */}
        {/* ======================================================== */}
        <div className="pt-6 pb-6 border-t border-white/5 flex flex-col items-center text-center space-y-2.5 select-none opacity-90">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <img 
              src="/brand/funflick-logo.png" 
              alt="FunFlick" 
              className="w-8 h-8 rounded-xl object-contain shadow-lg shadow-pink-500/25" 
            />
            <div className="text-left">
              <span className="font-extrabold text-lg text-white font-heading block leading-none">
                fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
              </span>
              <span className="text-[9px] text-gray-400 font-medium tracking-tight">
                Comedy. Entertainment. Always On!
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
            FunFlick Media & Entertainment Technologies Pvt. Ltd.<br />
            Connecting Viewers, Comedy Creators & Viral Entertainment 🇮🇳
          </p>

          <div className="flex items-center gap-2.5 text-[10px] text-pink-400 font-medium pt-0.5">
            <span onClick={() => showToast('FunFlick Entertainment Platform', 'info')} className="hover:underline cursor-pointer">About FunFlick</span>
            <span className="text-gray-600">•</span>
            <span onClick={() => showToast('Creator Community Guidelines', 'info')} className="hover:underline cursor-pointer">Guidelines</span>
            <span className="text-gray-600">•</span>
            <span onClick={() => showToast('Privacy Policy', 'info')} className="hover:underline cursor-pointer">Privacy</span>
            <span className="text-gray-600">•</span>
            <span onClick={() => showToast('Terms of Service', 'info')} className="hover:underline cursor-pointer">Terms</span>
          </div>

          <span className="text-[9px] text-gray-500 font-mono">
            FunFlick Platform v2.4.0 · Always On Entertainment
          </span>
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <SubscriptionGateModal />
      <CreateChooserModal />
    </div>
  );
};
