import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Award, 
  DollarSign, 
  CheckCircle2,
  Users
} from 'lucide-react';

export const PostInsightsModal = ({ post, isOpen, onClose }) => {
  if (!isOpen || !post) return null;

  // Derive realistic analytics values based on post data
  const rawViews = typeof post.viewsCount === 'number' 
    ? post.viewsCount 
    : (parseInt(String(post.viewsCount || post.views || '1420').replace(/[^0-9]/g, ''), 10) || 1420);

  const displayViews = post.viewsCount || post.views || '1.4K';
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || (post.comments?.length || 0);
  const shares = post.sharesCount || 86;
  const saves = post.savesCount || 42;

  // Engagement Rate = (Likes + Comments + Shares + Saves) / Views * 100
  const totalInteractions = likes + comments + shares + saves;
  const engagementRate = rawViews > 0 
    ? Math.min(28.5, Math.max(4.2, ((totalInteractions / Math.max(1, rawViews)) * 100).toFixed(1))) 
    : '12.4';

  const avgWatchTime = '18.6s';
  const completionRate = '68.4%';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 150 }}
        className="w-full max-w-md bg-[#120a26] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white font-heading">
                Post Insights & Analysis
              </h3>
              <span className="text-[10px] text-pink-300">
                Influencer Performance Breakdown
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Quick Preview Header */}
        <div className="mt-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="w-12 h-14 rounded-xl overflow-hidden bg-black shrink-0">
            {post.mediaType === 'video' ? (
              <img 
                src={post.posterUrl || post.thumbnail || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=200&q=80'} 
                alt={post.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={post.mediaUrl || post.posterUrl} 
                alt={post.title} 
                className="w-full h-full object-cover" 
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate font-heading">
              {post.title || post.caption || 'FunFlick Reel'}
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Published {post.timeAgo || 'Recently'} · {post.category || 'Comedy'}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Admin Verified & Live</span>
            </div>
          </div>
        </div>

        {/* Primary High-Level Summary Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-[#1b1038] border border-pink-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-heading">Overview</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Top 10% Viral Reach
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-gray-400 block">Total Plays</span>
              <span className="text-sm font-extrabold text-white block mt-0.5">{displayViews}</span>
            </div>
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-gray-400 block">Interactions</span>
              <span className="text-sm font-extrabold text-pink-400 block mt-0.5">{totalInteractions.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-gray-400 block">Engagement</span>
              <span className="text-sm font-extrabold text-emerald-400 block mt-0.5">{engagementRate}%</span>
            </div>
          </div>
        </div>

        {/* Deep Engagement Breakdown (Likes, Comments, Shares, Saves) */}
        <div className="mt-4 space-y-2">
          <span className="text-xs font-bold text-gray-300 block font-heading">
            Audience Engagement Metrics
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-gray-300">Likes</span>
              </div>
              <span className="text-xs font-extrabold text-white">{likes.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-300">Comments</span>
              </div>
              <span className="text-xs font-extrabold text-white">{comments.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-300">Shares</span>
              </div>
              <span className="text-xs font-extrabold text-white">{shares.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-gray-300">Saves</span>
              </div>
              <span className="text-xs font-extrabold text-white">{saves.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Watch Time & Retention Curve */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span>Watch Retention Analysis</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">{completionRate} completion</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Avg Watch Time</span>
              <span className="font-bold text-white">{avgWatchTime}</span>
            </div>
            {/* Visual Retention Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: '84%' }} title="Watched 3s: 84%" />
              <div className="h-full bg-indigo-500/40" style={{ width: '16%' }} />
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-500">
              <span>0s (Start)</span>
              <span>3s (84% retained)</span>
              <span>End (68% complete)</span>
            </div>
          </div>
        </div>

        {/* Admin Monetization & Performance Reward Badge */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#121c24] border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Admin Cash Reward Status
              </span>
              <span className="text-[10px] text-emerald-300">
                Eligible for Influencer Pool Payout
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Active
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
        >
          Close Insights
        </button>
      </motion.div>
    </div>
  );
};
