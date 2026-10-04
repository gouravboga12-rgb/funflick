import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
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
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminInfluencerMediaScreen = () => {
  const { influencerMedia, sendInfluencerReward, showToast, theme } = useApp();
  const isLight = theme === 'light';

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
      if (!matchName && !matchUser && !matchTitle) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortFilter === 'views') {
      return (b.viewsCount || 0) - (a.viewsCount || 0);
    }
    if (sortFilter === 'likes') {
      return (b.likesCount || 0) - (a.likesCount || 0);
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
  const totalPaidSum = (influencerMedia || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 9300);

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
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Top Views Tracked</span>
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`text-2xl font-black font-heading mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              615.8K
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 block">+28% viral surge this week</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  userFilter === 'all'
                    ? 'bg-white/10 text-white border border-white/10'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setUserFilter('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
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
                placeholder="Search influencer or title..."
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
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
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
                  } border focus:outline-none`}
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
                  } border focus:outline-none`}
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
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} mt-1`}>
                Try adjusting your filters or search query to see influencer content.
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const currentInputAmount = rewardAmounts[item.id] !== undefined
                ? rewardAmounts[item.id]
                : (item.currentEarning ? item.currentEarning.replace(/[^0-9]/g, '') : '2500');

              const isPaid = item.paymentStatus === 'Paid';
              const isSubmitting = submittingId === item.id;

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
                    <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-black/40 shrink-0 border border-white/10 group">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-black/70 text-white backdrop-blur-sm">
                        {item.contentType}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Influencer Profile Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={item.avatar}
                            alt={item.influencerName}
                            className="w-6 h-6 rounded-full object-cover border border-pink-500"
                          />
                          <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.influencerName}
                          </span>
                          <span className="text-[11px] text-gray-400">@{item.username}</span>
                        </div>

                        {item.isInfluencer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-pink-500 text-[#090514] shadow-sm">
                            <Crown className="w-3 h-3" />
                            <span>{item.subscriptionPlan || 'Influencer Pro'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/20 text-gray-400">
                            Regular User
                          </span>
                        )}

                        <span className="text-[10px] text-gray-500">· {item.date}</span>
                      </div>

                      {/* Content Title */}
                      <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'} leading-snug`}>
                        {item.title}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/10 text-pink-300">
                        #{item.category}
                      </span>

                      {/* Metrics Bar */}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <div className="flex items-center gap-1 text-blue-400 font-semibold">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.views}</span>
                        </div>
                        <div className="flex items-center gap-1 text-pink-400 font-semibold">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{item.likes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-400 font-semibold">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{item.comments}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{item.shares}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{item.engagementRate} Engagement</span>
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
    </AdminLayout>
  );
};
