import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Trash2, 
  Copy, 
  AlertTriangle, 
  EyeOff, 
  BarChart3,
  MapPin,
  Tag,
  Check,
  Send,
  Lock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentSheet } from './CommentSheet';
import { ShareSheet } from './ShareSheet';
import { ReportModal } from './ReportModal';
import { PostInsightsModal } from './PostInsightsModal';

export const StandardPostCard = ({ post }) => {
  const navigate = useNavigate();
  const { 
    toggleLikePost, 
    recordPostView, 
    toggleSavePost, 
    toggleFollowCreator, 
    deleteUserPost, 
    addComment,
    currentUser, 
    showToast 
  } = useApp();

  const isOwner = post.creator?.username === currentUser?.username;
  const isPrivateAccount = !!post.creator?.isPrivate;
  const hasAccess = isOwner || post.isFollowing || post.isSubscribed;
  const isLocked = isPrivateAccount && !hasAccess;

  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [quickCommentText, setQuickCommentText] = useState('');

  const lastTapRef = useRef(0);
  const hasRecordedViewRef = useRef(false);

  // Record view after 2 seconds
  useEffect(() => {
    if (!hasRecordedViewRef.current) {
      const timer = setTimeout(() => {
        hasRecordedViewRef.current = true;
        recordPostView(post.id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [post.id, recordPostView]);

  // Double tap to like on photo
  const handlePhotoDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!post.isLiked) {
        toggleLikePost(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleQuickComment = (e) => {
    e.preventDefault();
    if (!quickCommentText.trim()) return;
    addComment(post.id, quickCommentText.trim());
    setQuickCommentText('');
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (typeof num === 'string' && (num.includes('K') || num.includes('M'))) return num;
    const n = Number(num);
    if (isNaN(n)) return String(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  const renderCaption = (text) => {
    if (!text) return null;
    const words = text.split(' ');
    return words.map((w, idx) => {
      if (w.startsWith('#') || w.startsWith('@')) {
        return (
          <span key={idx} className="text-pink-400 font-semibold hover:underline cursor-pointer">
            {w}{' '}
          </span>
        );
      }
      return w + ' ';
    });
  };

  return (
    <article className="relative w-full bg-[#130b26] border border-white/10 rounded-3xl overflow-hidden select-none mb-4 shadow-xl text-left">
      {/* 1. Header (Instagram/Twitter Post Card Header) */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-[#170e2f]/50">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            onClick={() => navigate(`/creator/${post.creator?.username || 'creator'}`)}
            className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 cursor-pointer shrink-0"
          >
            <img
              src={post.creator?.avatar || currentUser?.avatar}
              alt={post.creator?.name || 'Creator'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
              }}
              className="w-full h-full rounded-full object-cover bg-black"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                onClick={() => navigate(`/creator/${post.creator?.username || 'creator'}`)}
                className="font-extrabold text-xs text-white hover:underline cursor-pointer truncate"
              >
                {post.creator?.name || 'FunFlick Creator'}
              </span>
              {post.creator?.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                  ✓
                </span>
              )}
              {isPrivateAccount && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-semibold">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span 
                onClick={() => navigate(`/creator/${post.creator?.username || 'creator'}`)}
                className="hover:text-pink-300 cursor-pointer"
              >
                @{post.creator?.username || 'user'}
              </span>
              {post.location && (
                <span className="flex items-center gap-0.5 text-gray-400">
                  <span>•</span>
                  <MapPin className="w-2.5 h-2.5 text-pink-400" />
                  <span className="truncate max-w-[120px]">{post.location}</span>
                </span>
              )}
              {post.timeAgo && (
                <span className="text-gray-500">
                  <span>•</span> {post.timeAgo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Follow button (if not owner) & Options Menu */}
        <div className="flex items-center gap-2">
          {!isOwner && (
            <button
              onClick={() => toggleFollowCreator(post.creator?.username)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition shadow-sm ${
                post.isFollowing
                  ? 'bg-white/10 text-gray-300 hover:text-white'
                  : 'bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white hover:opacity-90 active:scale-95'
              }`}
            >
              {post.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          <button
            onClick={() => setShowOptionsMenu(true)}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Media Area (Photo / Image with Natural Aspect Ratio - NO Voice Mute button!) */}
      <div 
        className="relative w-full aspect-square max-h-[500px] bg-black/60 overflow-hidden flex items-center justify-center cursor-pointer select-none"
        onClick={handlePhotoDoubleTap}
      >
        {isLocked ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black/80">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-pink-500 mb-3 shadow-xl shadow-pink-500/10">
              <Lock className="w-7 h-7 text-pink-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Private Post
            </h4>
            <p className="text-xs text-gray-400 max-w-[220px] mb-4">
              Follow @{post.creator?.username} to view their photos and content.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFollowCreator(post.creator?.username);
              }}
              className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white shadow-md active:scale-95 transition"
            >
              Follow to View
            </button>
          </div>
        ) : (
          <img
            src={post.posterUrl || post.mediaUrl}
            alt={post.title || post.caption}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80';
            }}
            className="w-full h-full object-cover transition-transform duration-300"
          />
        )}

        {/* Category Pill Badge on Top Right of Image */}
        {post.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-pink-300 border border-white/10 shadow-md">
            {post.category}
          </span>
        )}

        {/* Double Tap Heart Burst Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute z-20 pointer-events-none text-rose-500 drop-shadow-[0_0_20px_rgba(255,0,122,0.9)]"
            >
              <Heart className="w-24 h-24 fill-current stroke-white stroke-[1.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Action Bar (Instagram-style: Left [Like, Comment, Share], Right [Save]) */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Like Heart Button */}
          <button
            onClick={() => toggleLikePost(post.id)}
            className="flex items-center gap-1.5 group transition active:scale-125"
          >
            <Heart 
              className={`w-6 h-6 transition-colors duration-200 ${
                post.isLiked 
                  ? 'fill-[#ff007a] text-[#ff007a] drop-shadow-[0_0_8px_rgba(255,0,122,0.6)]' 
                  : 'text-white hover:text-rose-400'
              }`} 
            />
          </button>

          {/* Comment Bubble Button */}
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-white hover:text-blue-400 transition active:scale-110"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShare(true)}
            className="text-white hover:text-purple-400 transition active:scale-110"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bookmark / Save Button */}
        <button
          onClick={() => toggleSavePost(post.id)}
          className="text-white hover:text-amber-400 transition active:scale-125"
        >
          <Bookmark 
            className={`w-5 h-5 transition-colors duration-200 ${
              post.isSaved 
                ? 'fill-amber-400 text-amber-400' 
                : 'text-white'
            }`} 
          />
        </button>
      </div>

      {/* 4. Engagement & Text Info (Likes Count, Caption, Hashtags, Comments) */}
      <div className="px-4 pb-4 space-y-1.5">
        {/* Likes Count */}
        <div className="pt-1">
          <span className="text-xs font-bold text-white">
            {formatNumber(post.likesCount)} {post.likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        {/* Caption */}
        <div className="text-xs text-gray-200 leading-relaxed">
          <span 
            onClick={() => navigate(`/creator/${post.creator?.username || 'creator'}`)}
            className="font-extrabold text-white mr-1.5 hover:underline cursor-pointer"
          >
            @{post.creator?.username || 'creator'}
          </span>
          <span className={captionExpanded ? '' : 'line-clamp-2'}>
            {renderCaption(post.caption)}
          </span>
          {post.caption?.length > 80 && (
            <button
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="text-gray-400 font-bold hover:text-white ml-1 inline-block text-[11px]"
            >
              {captionExpanded ? 'less' : '...more'}
            </button>
          )}
        </div>

        {/* View all comments shortcut */}
        {(post.commentsCount > 0 || (post.comments && post.comments.length > 0)) && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-400 text-[11px] font-medium hover:text-gray-300 block pt-0.5"
          >
            View all {post.commentsCount || post.comments?.length || 0} comments
          </button>
        )}

        {/* Quick inline comment row */}
        <form onSubmit={handleQuickComment} className="pt-2 flex items-center gap-2 border-t border-white/5">
          <img
            src={currentUser?.avatar}
            alt="my avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
            }}
            className="w-6 h-6 rounded-full object-cover shrink-0"
          />
          <input
            type="text"
            value={quickCommentText}
            onChange={(e) => setQuickCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
          {quickCommentText.trim() && (
            <button
              type="submit"
              className="text-xs font-bold text-pink-400 hover:text-pink-300 transition"
            >
              Post
            </button>
          )}
        </form>
      </div>

      {/* 5. Modals & Overlays */}
      <CommentSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        commentsCount={post.commentsCount}
        comments={post.comments}
      />

      <ShareSheet
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        post={post}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        post={post}
      />

      <PostInsightsModal
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        post={post}
      />

      {/* Options Menu Bottom Sheet */}
      <AnimatePresence>
        {showOptionsMenu && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#160f30] border-t border-white/10 rounded-t-3xl p-5 space-y-2 shadow-2xl"
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />

              {isOwner ? (
                <>
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowInsights(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2.5 transition"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>View post insights</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      navigate('/my-content?tab=Posts');
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2.5 transition"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Edit in My Content Library</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-2.5 transition"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete post</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowReport(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-amber-400 font-bold text-xs flex items-center gap-2.5 transition"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Report post</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowShare(true);
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2.5 transition"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Share to...</span>
              </button>

              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  try {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast('Link copied to clipboard! 📋');
                  } catch (e) {}
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2.5 transition"
              >
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Copy link</span>
              </button>

              <button
                onClick={() => setShowOptionsMenu(false)}
                className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-400 hover:text-white font-bold text-xs text-center transition mt-2"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#160f30] border border-rose-500/40 rounded-3xl p-5 text-center space-y-3 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-extrabold text-white text-base font-heading">
                  Delete Post?
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  Are you sure you want to delete this post? This cannot be undone.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    deleteUserPost(post.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition"
                >
                  Delete
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </article>
  );
};
