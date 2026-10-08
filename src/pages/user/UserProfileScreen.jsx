import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { EditProfileModal } from './EditProfileModal';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { HelpSupportModal } from './HelpSupportModal';
import { FollowListModal } from '../../components/user/FollowListModal';
import { SubmitAdRequestModal } from '../../components/user/SubmitAdRequestModal';
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
  Trash2,
  Lock,
  User,
  Megaphone,
  Phone,
  MessageCircle,
  Mail
} from 'lucide-react';

export const UserProfileScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'influencer' ? 'influencer' : 'viewer';
  
  const { 
    currentUser, 
    myMedia,
    fetchMyMedia,
    userSubmissions, 
    deleteUserSubmission,
    deleteUserPost,
    setSubscriptionGateModalOpen, 
    setCreateModalOpen,
    showToast,
    logoutUser,
    posts,
    followingList,
    followersList,
    followRequests,
    transactions,
    subscriptionStatus,
    fetchUserSubscriptionStatus,
    adContactSettings
  } = useApp();

  const [isAdRequestModalOpen, setIsAdRequestModalOpen] = useState(false);

  // Dynamic live follower counts from backend
  const [liveFollowCounts, setLiveFollowCounts] = useState({
    followers: followersList?.length || 0,
    following: followingList?.length || 0
  });

  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');

  const fetchLiveFollowCounts = async () => {
    if (!currentUser?.username) return;
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [f1, f2] = await Promise.all([
        fetch(`/api/follows/${currentUser.username}/followers`, { headers }),
        fetch(`/api/follows/${currentUser.username}/following`, { headers })
      ]);
      if (f1.ok && f2.ok) {
        const d1 = await f1.json();
        const d2 = await f2.json();
        setLiveFollowCounts({
          followers: d1.count !== undefined ? d1.count : (d1.followers?.length || 0),
          following: d2.count !== undefined ? d2.count : (d2.following?.length || 0)
        });
      }
    } catch (e) {
      console.warn('Could not fetch live follow counts:', e);
    }
  };

  React.useEffect(() => {
    fetchLiveFollowCounts();
    if (fetchMyMedia) fetchMyMedia();
    if (fetchUserSubscriptionStatus) fetchUserSubscriptionStatus();
  }, [currentUser?.username]);

  // Compute real dynamic stats from database
  const realPostCount = (myMedia && myMedia.length > 0) ? myMedia.length : posts.filter(p => p.creator?.username === currentUser.username).length;
  const realFollowing = liveFollowCounts.following;
  const realFollowers = liveFollowCounts.followers;
  const realWallet = currentUser.walletBalance || 0;
  const realViews = currentUser.creatorMetrics?.totalViews || '0';
  const realEarnings = currentUser.creatorMetrics?.performanceEarnings || '₹0';
  const realLikedCount = posts.filter(p => p.isLiked).length;
  const realSavedCount = posts.filter(p => p.isSaved).length;

  // Subscription validity resolution from MySQL / context
  const isUserSubscribed = Boolean(
    currentUser?.isInfluencer || 
    subscriptionStatus?.isActive || 
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
  );
  const userPlanExpiresAt = subscriptionStatus?.expiresAt || currentUser?.subscriptionExpiresAt;
  const userPlanStartDate = subscriptionStatus?.startDate || currentUser?.subscriptionStart;
  const userPlanName = subscriptionStatus?.planName || currentUser?.subscriptionPlan || 'Monthly Influencer Pro';
  const userDaysRemaining = subscriptionStatus?.daysRemaining !== undefined 
    ? Number(subscriptionStatus.daysRemaining) 
    : (userPlanExpiresAt ? Math.max(0, Math.ceil((new Date(userPlanExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))) : 0);

  const [activeProfileMode, setActiveProfileMode] = useState(initialTab); // 'viewer' | 'influencer'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const viewerMenuItems = [
    {
      icon: User,
      color: 'text-pink-400',
      label: 'My Profile',
      badge: 'Feed & Videos',
      badgeColor: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold',
      path: `/creator/${currentUser?.username}`
    },
    {
      icon: Heart,
      color: 'text-pink-400',
      label: 'Liked Videos',
      badge: realLikedCount > 0 ? String(realLikedCount) : null,
      path: '/my-content?tab=liked'
    },
    {
      icon: Bookmark,
      color: 'text-amber-400',
      label: 'Saved Videos',
      badge: realSavedCount > 0 ? String(realSavedCount) : null,
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
      color: 'text-amber-400',
      label: 'Influencer Membership Plans',
      badge: isUserSubscribed 
        ? `⭐ Active (${userDaysRemaining}d left)` 
        : 'Upgrade to Influencer',
      badgeColor: isUserSubscribed 
        ? 'bg-amber-500/20 text-amber-300' 
        : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold animate-pulse',
      path: '/subscription'
    },
    {
      icon: Wallet,
      color: 'text-emerald-400',
      label: 'Wallet & Payouts',
      badge: `₹${realWallet.toLocaleString()}`,  
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      path: '/wallet'
    },
    {
      icon: Video,
      color: 'text-rose-400',
      label: 'My Content Library',
      badge: `${realPostCount} posts`,
      path: '/my-content'
    },
    {
      icon: Megaphone,
      color: 'text-pink-400',
      label: 'Advertise with FunFlick',
      badge: 'Promote',
      badgeColor: 'bg-pink-500/20 text-pink-300 font-bold',
      action: 'advertise'
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
    logoutUser();
    showToast('Logged out of FunFlick session', 'info');
    navigate('/splash');
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
          <div 
            className="relative cursor-pointer group"
            onClick={() => navigate(`/creator/${currentUser?.username}`)}
            title="Click to view My Profile"
          >
            {/* Same profile icon style for both Users and Influencers */}
            <img
              src={currentUser.avatar || currentUser.avatar_url || '/brand/default-avatar.svg'}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/brand/default-avatar.svg'; }}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-xl bg-gray-900 group-hover:scale-105 transition-transform"
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
              {currentUser.isPrivate && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-purple-500/20 text-purple-300 border-purple-500/30 flex items-center gap-1 shadow-sm">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Private</span>
                </span>
              )}
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
                {realPostCount}
              </span>
              <span className="text-[11px] text-gray-400">Posts</span>
            </div>
            <div 
              className="text-center cursor-pointer hover:opacity-80 transition active:scale-95" 
              onClick={() => { setFollowModalTab('following'); setIsFollowModalOpen(true); }}
            >
              <span className="font-extrabold text-base text-white block font-heading">
                {realFollowing}
              </span>
              <span className="text-[11px] text-gray-400">Following</span>
            </div>
            <div 
              className="text-center cursor-pointer hover:opacity-80 transition active:scale-95" 
              onClick={() => { setFollowModalTab('followers'); setIsFollowModalOpen(true); }}
            >
              <span className="font-extrabold text-base text-white block font-heading">
                {realFollowers}
              </span>
              <span className="text-[11px] text-gray-400">Followers</span>
            </div>
          </div>

          {/* Prominent My Profile Button */}
          <div className="w-full pt-1">
            <button
              onClick={() => navigate(`/creator/${currentUser?.username}`)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] hover:opacity-95 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-pink-500/25 flex items-center justify-between transition active:scale-95 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold leading-tight">My Profile</span>
                  <span className="block text-[10px] text-white/80 font-normal">View your uploaded videos, reels & likes</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-white/90 group-hover:translate-x-0.5 transition-transform">
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Profile CTA Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-wide border border-white/10 transition"
            >
              Edit Profile
            </button>

            {!currentUser.isInfluencer ? (
              <button
                onClick={() => navigate('/subscription')}
                className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-pink-500/25 flex items-center justify-center gap-1.5 transition active:scale-95 animate-pulse"
              >
                <span>⭐</span>
                <span>Get Influencer Pass</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/subscription')}
                className="py-2 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition"
              >
                <span>⭐</span>
                <span>Influencer Active</span>
              </button>
            )}
          </div>

          {/* Prominent Active Subscription Validity Banner (Always Visible on Profile) */}
          {isUserSubscribed && (
            <div 
              onClick={() => navigate('/subscription')}
              className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-purple-950/40 to-[#120d29] border border-emerald-500/40 shadow-lg cursor-pointer hover:border-emerald-400 transition space-y-2 select-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                    👑
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{userPlanName}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-black">ACTIVE</span>
                    </h4>
                    <span className="text-[10px] text-emerald-300">Influencer Monetization & Reach Enabled</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-amber-300 font-mono block">
                    {userDaysRemaining}
                  </span>
                  <span className="text-[9px] text-gray-300 -mt-1 block font-medium">days left</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-300">
                <span>Valid until <strong className="text-emerald-300">{userPlanExpiresAt ? new Date(userPlanExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}</strong></span>
                {subscriptionStatus?.hasStackedPacks && (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <span>⭐</span>
                    <span>Future Pack Stacked</span>
                  </span>
                )}
              </div>
            </div>
          )}
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
                  isUserSubscribed 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-gradient-to-tr from-pink-500 to-amber-500 shadow'
                }`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-heading">
                      {isUserSubscribed
                        ? `Influencer Plan: ${userPlanName}`
                        : 'Upgrade to Influencer Status'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      isUserSubscribed
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {isUserSubscribed ? 'ACTIVE & VALID' : 'BOOST REACH'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {isUserSubscribed
                      ? (
                        <span>
                          {userPlanStartDate && <span className="text-gray-400 mr-1.5">Started: {new Date(userPlanStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·</span>}
                          Valid until <strong className="text-emerald-300">{userPlanExpiresAt ? new Date(userPlanExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}</strong>
                          {userDaysRemaining > 0 && <span className="text-amber-300 font-semibold ml-1.5">({userDaysRemaining} days left)</span>}
                        </span>
                      )
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
                    {realViews}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-semibold">+18% this week</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-0.5">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Admin Rewards Paid</span>
                  </div>
                  <span className="text-base font-extrabold text-emerald-400 font-heading block">
                    {realEarnings}
                  </span>
                  <span className="text-[9px] text-gray-400">Credited to wallet</span>
                </div>
              </div>

              {/* Wallet Summary */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-[#191238] border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Available In Wallet</span>
                  <span className="text-sm font-extrabold text-white font-heading">
                    ₹{realWallet.toLocaleString()}
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
            {/* Live Submissions & Admin Central Verification Tracker */}
            {(() => {
              const displaySubmissions = (myMedia && myMedia.length > 0) ? myMedia : (userSubmissions || []);
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white font-heading">
                        My Submissions & Admin Approvals ({displaySubmissions.length})
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
                    {displaySubmissions.length > 0 ? (
                      displaySubmissions.map(item => (
                        <div 
                          key={item.id} 
                          className="p-3.5 rounded-2xl bg-[#130d29] border border-white/5 space-y-2.5 hover:border-pink-500/30 transition shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <img 
                                src={item.thumbnail || item.posterUrl || item.mediaUrl} 
                                alt={item.title} 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                                }}
                                className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" 
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                                  {item.title || item.caption || 'My Video'}
                                </h4>
                                <span className="text-[10px] text-pink-300 block mt-0.5">
                                  {item.category || 'Reel'} · {item.date || 'Recently'}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">
                                  Views: <strong className="text-white">{item.views || 0}</strong> · Likes: {item.likes || 0}
                                </span>
                              </div>
                            </div>

                            {/* Delete / Withdraw Button */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${item.title || 'this media'}"? This will permanently remove it from your profile and platform feed.`)) {
                                  deleteUserPost(item.id);
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
                            {item.status === 'Approved' ? (
                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Approved & Live</span>
                              </span>
                            ) : item.status === 'Rejected' ? (
                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ❌ Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>In Admin Review (Pending)</span>
                              </span>
                            )}
                          </div>

                          {/* Performance Reward from Admin if granted */}
                          {item.rewardGranted && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-400">🎉 Bonus: ₹{item.rewardGranted}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-gray-400 bg-white/5 rounded-2xl border border-white/5">
                        No submissions yet. Post your first reel to send it for admin approval!
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

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
                      } else if (item.action === 'advertise') {
                        setIsAdRequestModalOpen(true);
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
        {/* 📢 ADVERTISE & PROMOTE WITH FUNFLICK (SPONSOR & BRAND HUB)*/}
        {/* ======================================================== */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1c0b38] via-[#120a24] to-[#1a0e33] border border-pink-500/25 shadow-xl space-y-3.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white font-heading block">
                  Advertise with FunFlick
                </span>
                <span className="text-[10px] text-pink-300 font-semibold">
                  Promote your brand or business to thousands
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAdRequestModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-[#ff007a] to-purple-600 hover:opacity-95 text-white font-extrabold text-[10px] shadow-md shadow-pink-500/20 flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <span>Submit Ad</span>
              <Sparkles className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[11px] text-gray-300 leading-relaxed">
            Run video ads in full-screen reels, home feeds, and popup placements. Upload your creative to AWS S3 and our advertising team will get in touch with you.
          </p>

          {/* Dynamic Admin Contact Details */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Official Advertising Support
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{adContactSettings?.adContactTimings || 'Mon - Sat, 9am - 7pm'}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              <a
                href={`https://wa.me/${(adContactSettings?.adContactWhatsapp || '+91 98765 43210').replace(/[^0-9]/g, '')}?text=Hi%20FunFlick%20Advertising%20Team%2C%20I%20want%20to%20advertise%20my%20brand`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex flex-col items-center text-center gap-1 transition text-emerald-300"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold leading-tight">WhatsApp</span>
                <span className="text-[8px] text-gray-400 truncate max-w-full">
                  {adContactSettings?.adContactWhatsapp || '+91 98765 43210'}
                </span>
              </a>

              <a
                href={`tel:${(adContactSettings?.adContactPhone || '+91 98765 43210').replace(/\s+/g, '')}`}
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex flex-col items-center text-center gap-1 transition text-blue-300"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-bold leading-tight">Call Direct</span>
                <span className="text-[8px] text-gray-400 truncate max-w-full">
                  {adContactSettings?.adContactPhone || '+91 98765 43210'}
                </span>
              </a>

              <a
                href={`mailto:${adContactSettings?.adContactEmail || 'ads@funflick.in'}`}
                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex flex-col items-center text-center gap-1 transition text-purple-300"
              >
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold leading-tight">Email Desk</span>
                <span className="text-[8px] text-gray-400 truncate max-w-full">
                  {adContactSettings?.adContactEmail || 'ads@funflick.in'}
                </span>
              </a>
            </div>
          </div>
        </div>

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

      {/* Real Database Followers & Following Modal */}
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        targetUsername={currentUser.username}
        initialTab={followModalTab}
        currentUsername={currentUser.username}
        onRelationshipChanged={fetchLiveFollowCounts}
      />

      {/* Interactive Ad Campaign Submission & Tracking Modal */}
      <SubmitAdRequestModal
        isOpen={isAdRequestModalOpen}
        onClose={() => setIsAdRequestModalOpen(false)}
      />
    </div>
  );
};
