import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { AdminVideoPlayer } from '../../components/admin/AdminVideoPlayer';
import { 
  Sparkles, 
  Crown, 
  Video, 
  Image as ImageIcon, 
  Flame, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  ArrowUpDown, 
  Check, 
  AlertCircle,
  ExternalLink,
  Award,
  RefreshCw,
  Play,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Reliable Creator Avatar with image fallback & initials badge
const InfluencerAvatar = ({ item }) => {
  const [avatarErr, setAvatarErr] = useState(false);
  const avatarSrc = item?.avatar || item?.influencerAvatar || item?.avatarUrl;
  const name = item?.influencerName || item?.username || 'Creator';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'C';

  if (!avatarSrc || avatarErr) {
    return (
      <div 
        className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-extrabold text-white border border-pink-400/50 shadow-sm shrink-0 select-none"
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarSrc}
      alt={name}
      onError={() => setAvatarErr(true)}
      className="w-7 h-7 rounded-full object-cover border border-pink-500 bg-purple-950/40 shrink-0"
    />
  );
};

// Robust Media Thumbnail supporting video previews (#t=0.5), static images & fallback graphics
const InfluencerMediaThumbnail = ({ item, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const mediaUrl = item?.mediaUrl || item?.videoUrl || '';
  const thumbnailUrl = item?.thumbnail || item?.thumbnailUrl || '';

  const isVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|mov|webm|m4v|ogg)($|\?)/i.test(url) || url.includes('/video/') || url.includes('video');
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) || url.startsWith('data:image/');
  };

  const hasStaticImage = thumbnailUrl && isImageFile(thumbnailUrl) && !imgError;
  const isVideo = item?.contentType === 'video' || isVideoFile(mediaUrl) || isVideoFile(thumbnailUrl);
  const videoSrc = (isVideoFile(thumbnailUrl) ? thumbnailUrl : mediaUrl) || mediaUrl;

  return (
    <div 
      onClick={onClick}
      className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-white/10 group cursor-pointer shadow-md hover:border-pink-500/60 transition-all select-none"
      title="Click to preview & watch media"
    >
      {hasStaticImage ? (
        <img
          src={thumbnailUrl}
          alt={item?.title || 'Creator Media'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : isVideo && videoSrc && !videoError ? (
        <video
          src={`${videoSrc}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-purple-950 via-pink-950/80 to-[#120b24] flex flex-col items-center justify-center p-2 text-center">
          {isVideo ? (
            <Video className="w-6 h-6 text-pink-400 mb-1" />
          ) : (
            <ImageIcon className="w-6 h-6 text-purple-400 mb-1" />
          )}
          <span className="text-[9px] font-bold text-gray-300 line-clamp-1">
            {item?.category || item?.contentType || 'Media'}
          </span>
        </div>
      )}

      {/* Play/Preview hover overlay */}
      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
          {isVideo ? <Play className="w-3.5 h-3.5 fill-white ml-0.5" /> : <Eye className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Format Badge */}
      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-black/80 text-white backdrop-blur-sm border border-white/10 flex items-center gap-1 shadow">
        {isVideo ? <Video className="w-2.5 h-2.5 text-pink-400" /> : <ImageIcon className="w-2.5 h-2.5 text-blue-400" />}
        <span>{item?.contentType || (isVideo ? 'video' : 'post')}</span>
      </span>
    </div>
  );
};

export const AdminInfluencerMediaScreen = () => {
  const { influencerMedia, sendInfluencerReward, showToast, theme, fetchInfluencerMedia } = useApp();
  const isLight = theme === 'light';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  React.useEffect(() => {
    if (fetchInfluencerMedia) fetchInfluencerMedia();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchInfluencerMedia) await fetchInfluencerMedia();
    setIsRefreshing(false);
    showToast('✅ Influencer media refreshed from database!', 'success');
  };

  // Filters state (Default filter: Influencers / Subscription Members first!)
  const [userFilter, setUserFilter] = useState('influencers'); // 'all' | 'influencers' | 'users'
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all' | 'video' | 'post' | 'story'
  const [sortFilter, setSortFilter] = useState('views'); // 'views' | 'likes' | 'engagement'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'pending' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');

  // Reward inputs state keyed by mediaId
  const [rewardAmounts, setRewardAmounts] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const handleAmountChange = (mediaId, value) => {
    setRewardAmounts(prev => ({
      ...prev,
      [mediaId]: value.replace(/[^0-9]/g, '')
    }));
  };

  const handleSendPayment = (item) => {
    const amount = rewardAmounts[item.id] || (item.currentEarning ? item.currentEarning.replace(/[^0-9]/g, '') : '2500');
    if (!amount || Number(amount) <= 0) {
      showToast('⚠️ Please enter a reward amount in ₹', 'error');
      return;
    }

    setSubmittingId(item.id);
    setTimeout(() => {
      sendInfluencerReward(item.id, Number(amount));
      setSubmittingId(null);
      if (previewItem && previewItem.id === item.id) {
        setPreviewItem(prev => ({
          ...prev,
          paymentStatus: 'Paid',
          paidAmount: Number(amount),
          paidDate: 'Just now'
        }));
      }
    }, 600);
  };

  // Filter and sort items
  const filteredItems = (influencerMedia || []).filter(item => {
    // 1. User type filter
    if (userFilter === 'influencers' && !item.isInfluencer) return false;
    if (userFilter === 'users' && item.isInfluencer) return false;

    // 2. Media type filter
    if (mediaTypeFilter !== 'all' && item.contentType !== mediaTypeFilter) return false;

    // 3. Payment status filter
    if (paymentFilter === 'pending' && item.paymentStatus !== 'Pending Reward') return false;
    if (paymentFilter === 'paid' && item.paymentStatus !== 'Paid') return false;

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.influencerName?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchTitle && !matchCat) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortFilter === 'views') {
      const viewsA = typeof a.viewsCount === 'number' ? a.viewsCount : parseInt(a.viewsCount) || parseInt(a.views) || 0;
      const viewsB = typeof b.viewsCount === 'number' ? b.viewsCount : parseInt(b.viewsCount) || parseInt(b.views) || 0;
      return viewsB - viewsA;
    }
    if (sortFilter === 'likes') {
      const likesA = typeof a.likesCount === 'number' ? a.likesCount : parseInt(a.likesCount) || parseInt(a.likes) || 0;
      const likesB = typeof b.likesCount === 'number' ? b.likesCount : parseInt(b.likesCount) || parseInt(b.likes) || 0;
      return likesB - likesA;
    }
    if (sortFilter === 'engagement') {
      const engA = parseFloat(a.engagementRate) || 0;
      const engB = parseFloat(b.engagementRate) || 0;
      return engB - engA;
    }
    return 0;
  });

  // Calculate high-level summary metrics
  const totalInfluencerPosts = (influencerMedia || []).filter(m => m.isInfluencer).length;
  const pendingRewardsCount = (influencerMedia || []).filter(m => m.paymentStatus === 'Pending Reward').length;
  const totalPaidSum = (influencerMedia || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalViewsCount = (influencerMedia || []).reduce((acc, curr) => acc + (typeof curr.viewsCount === 'number' ? curr.viewsCount : parseInt(curr.viewsCount) || parseInt(curr.views) || 0), 0);

  return (
    <AdminLayout title="Influencer Media & Content Rewards">
      <div className="space-y-6">

        {/* Top Header & Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Influencer Media & Performance Rewards
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Admin Control
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} mt-1`}>
              Review uploaded media, identify high-engagement content, and reward subscription influencers with custom payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Media'}</span>
            </button>
            <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'} font-medium`}>
              Showing <strong>{filteredItems.length}</strong> items
            </span>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Influencer Content</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className={`text-2xl font-black font-heading mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {totalInfluencerPosts}
            </div>
            <span className="text-[10px] text-pink-400 font-semibold mt-1 block">Active subscription creators</span>
          </div>

          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Total Views Tracked</span>
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`text-2xl font-black font-heading mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {totalViewsCount >= 1000 ? (totalViewsCount / 1000).toFixed(1) + 'K' : totalViewsCount}
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 block">Live verified views</span>
          </div>

          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Pending Rewards</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-heading mt-2 text-amber-400">
              {pendingRewardsCount}
            </div>
            <span className="text-[10px] text-amber-300 font-semibold mt-1 block">Awaiting admin compensation</span>
          </div>

          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Total Paid Rewards</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-heading mt-2 text-emerald-400">
              ₹{totalPaidSum.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Transferred to creator wallets</span>
          </div>
        </div>

        {/* Filter Toolbar (Main Default: Influencers First) */}
        <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border space-y-3 shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Primary Filter: User Status (Influencers First) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
              <button
                onClick={() => setUserFilter('influencers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  userFilter === 'influencers'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Influencers / Subscription Members (Default)</span>
              </button>
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  userFilter === 'all'
                    ? 'bg-white/10 text-white border border-white/10'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setUserFilter('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  userFilter === 'users'
                    ? 'bg-white/10 text-white border border-white/10'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                Regular Users
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search influencer, title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs ${
                  isLight 
                    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:bg-white' 
                    : 'bg-white/5 border-white/10 text-white focus:bg-white/10'
                } border focus:outline-none focus:border-pink-500 transition`}
              />
            </div>
          </div>

          {/* Sub Filters: Media Format, Sorting, Payment Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Type:</span>
              {[
                { id: 'all', label: 'All Content' },
                { id: 'video', label: 'Reels / Videos', icon: Video },
                { id: 'post', label: 'Posts (Images)', icon: ImageIcon },
                { id: 'story', label: 'Stories', icon: Sparkles }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setMediaTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    mediaTypeFilter === t.id
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sort filter */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Sort:</span>
                <select
                  value={sortFilter}
                  onChange={(e) => setSortFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#1a1236] text-white border-white/10'
                  } border focus:outline-none cursor-pointer`}
                >
                  <option value="views">Highest Views</option>
                  <option value="likes">Highest Likes</option>
                  <option value="engagement">Highest Engagement %</option>
                </select>
              </div>

              {/* Payment Status filter */}
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Reward:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#1a1236] text-white border-white/10'
                  } border focus:outline-none cursor-pointer`}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Reward</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content List & Reward Dispatch Cards */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border`}>
              <Filter className="w-10 h-10 text-gray-500 mx-auto mb-2 opacity-50" />
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>No matching media items found</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} mt-1 max-w-sm mx-auto`}>
                {userFilter === 'influencers' 
                  ? 'No subscribed influencer content found under this filter. View all uploaded creator videos to review and reward creators.'
                  : 'Try adjusting your filters or search query to see media items.'}
              </p>
              {userFilter === 'influencers' && (influencerMedia || []).length > 0 && (
                <button
                  onClick={() => setUserFilter('all')}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:opacity-95 transition cursor-pointer"
                >
                  Show All Creator Media ({(influencerMedia || []).length} items)
                </button>
              )}
            </div>
          ) : (
            filteredItems.map(item => {
              const currentInputAmount = rewardAmounts[item.id] !== undefined
                ? rewardAmounts[item.id]
                : (item.currentEarning ? item.currentEarning.replace(/[^0-9]/g, '') : '2500');

              const isPaid = item.paymentStatus === 'Paid';
              const isSubmitting = submittingId === item.id;
              const displayViews = item.views !== undefined ? item.views : (item.viewsCount >= 1000 ? (item.viewsCount / 1000).toFixed(1) + 'K' : (item.viewsCount || 0));
              const displayLikes = item.likes !== undefined ? item.likes : (item.likesCount >= 1000 ? (item.likesCount / 1000).toFixed(1) + 'K' : (item.likesCount || 0));
              const displayComments = item.comments !== undefined ? item.comments : (item.commentsCount || 0);
              const displayShares = item.shares !== undefined ? item.shares : (item.sharesCount || 0);
              const displayCategory = item.category || (item.contentType === 'video' ? 'Reel' : 'Post');
              const displayDate = item.date || item.publishedDate || 'Recent';

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl ${
                    isLight 
                      ? 'bg-white border-slate-200 shadow-sm hover:shadow-md' 
                      : 'bg-[#120b24] border-white/10 hover:border-pink-500/30'
                  } border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5`}
                >
                  {/* Left: Thumbnail & Creator info */}
                  <div className="flex items-start gap-4 flex-1">
                    <InfluencerMediaThumbnail 
                      item={item} 
                      onClick={() => setPreviewItem(item)} 
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Influencer Profile Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <InfluencerAvatar item={item} />
                          <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.influencerName || 'Creator'}
                          </span>
                          <span className="text-[11px] text-gray-400">@{item.username || 'user'}</span>
                        </div>

                        {item.isInfluencer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-pink-500 text-[#090514] shadow-sm">
                            <Crown className="w-3 h-3" />
                            <span>{item.subscriptionPlan || 'Weekly Influencer'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/20 text-gray-400">
                            Free User
                          </span>
                        )}

                        <span className="text-[10px] text-gray-500">· {displayDate}</span>
                      </div>

                      {/* Content Title */}
                      <h3 
                        onClick={() => setPreviewItem(item)}
                        className={`text-sm font-bold ${isLight ? 'text-slate-900 hover:text-pink-600' : 'text-white hover:text-pink-400'} leading-snug cursor-pointer transition`}
                      >
                        {item.title}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/10 text-pink-300">
                        #{displayCategory}
                      </span>

                      {/* Metrics Bar */}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <div className="flex items-center gap-1 text-blue-400 font-semibold" title="Total Views">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{displayViews}</span>
                        </div>
                        <div className="flex items-center gap-1 text-pink-400 font-semibold" title="Likes">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{displayLikes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-400 font-semibold" title="Comments">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{displayComments}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 font-semibold" title="Shares">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{displayShares}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{item.engagementRate || '4.5%'} Engagement</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Status & Reward Dispatcher */}
                  <div className={`w-full lg:w-72 p-3.5 rounded-2xl ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#181030] border-white/5'
                  } border space-y-3 shrink-0`}>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        Payment Status:
                      </span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid ₹{(item.paidAmount || 2500).toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Reward</span>
                        </span>
                      )}
                    </div>

                    {/* Custom Reward Amount Field */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'} block`}>
                        Reward Amount:
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
                          ₹
                        </span>
                        <input
                          type="text"
                          disabled={isPaid}
                          value={currentInputAmount}
                          onChange={(e) => handleAmountChange(item.id, e.target.value)}
                          placeholder="Enter reward ₹"
                          className={`w-full pl-7 pr-3 py-2 rounded-xl text-sm font-bold ${
                            isPaid
                              ? 'bg-black/20 text-gray-400 cursor-not-allowed border-transparent'
                              : isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-pink-500'
                                : 'bg-[#0f0921] border-white/10 text-white focus:border-pink-500'
                          } border focus:outline-none transition`}
                        />
                      </div>
                    </div>

                    {/* Send Payment Button */}
                    <button
                      onClick={() => handleSendPayment(item)}
                      disabled={isPaid || isSubmitting}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition flex items-center justify-center gap-1.5 ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isPaid ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                          <span>Reward Dispatched ({item.paidDate || 'Paid'})</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          <span>Send Payment</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Media Preview & Playback Modal */}
      <AnimatePresence>
        {previewItem && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-2xl rounded-3xl overflow-hidden border ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/10'
              } shadow-2xl flex flex-col max-h-[90vh]`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <InfluencerAvatar item={previewItem} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {previewItem.influencerName || 'Creator'}
                      </span>
                      <span className="text-xs text-gray-400">@{previewItem.username || 'user'}</span>
                      {previewItem.isInfluencer && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-black flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" />
                          <span>{previewItem.subscriptionPlan || 'Influencer Pro'}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">· {previewItem.date || previewItem.publishedDate || 'Recent'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Player / Image Viewer */}
              <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[480px] overflow-hidden">
                {previewItem.contentType === 'video' || (previewItem.mediaUrl && /\.(mp4|mov|webm|m4v)($|\?)/i.test(previewItem.mediaUrl)) ? (
                  <AdminVideoPlayer
                    src={previewItem.mediaUrl || previewItem.videoUrl}
                    poster={previewItem.thumbnailUrl || previewItem.thumbnail}
                    autoPlay={true}
                    className="w-full h-full max-h-[480px]"
                  />
                ) : (
                  <img
                    src={previewItem.mediaUrl || previewItem.thumbnailUrl || previewItem.thumbnail}
                    alt={previewItem.title}
                    className="max-h-[480px] w-auto object-contain"
                  />
                )}
              </div>

              {/* Modal Footer info & Quick Reward button */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {previewItem.title}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/10 text-pink-300">
                      #{previewItem.category || (previewItem.contentType === 'video' ? 'Reel' : 'Post')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      previewItem.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {previewItem.paymentStatus === 'Paid' ? `Paid ₹${(previewItem.paidAmount || 2500).toLocaleString()}` : 'Pending Reward'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1 text-blue-400 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{previewItem.views || previewItem.viewsCount || 0} Views</span>
                  </div>
                  <div className="flex items-center gap-1 text-pink-400 font-semibold">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{previewItem.likes || previewItem.likesCount || 0} Likes</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400 font-semibold">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{previewItem.comments || previewItem.commentsCount || 0} Comments</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{previewItem.shares || previewItem.sharesCount || 0} Shares</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{previewItem.engagementRate || '4.5%'} Engagement</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
