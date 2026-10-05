import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreVertical, 
  Check, 
  Plus, 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Trash2, 
  Pin, 
  MessageSquareOff, 
  Copy, 
  AlertTriangle, 
  EyeOff, 
  Eye, 
  Ban,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentSheet } from './CommentSheet';
import { ShareSheet } from './ShareSheet';
import { ReportModal } from './ReportModal';
import { PostInsightsModal } from './PostInsightsModal';

export const VideoPostCard = ({ post }) => {
  const navigate = useNavigate();
  const { toggleLikePost, recordPostView, toggleSavePost, toggleFollowCreator, deleteUserPost, blockUser, currentUser, showToast } = useApp();

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const videoRef = useRef(null);
  const lastTapRef = useRef(0);
  const hasRecordedViewRef = useRef(false);

  // Record view after 2.5s of continuous watch
  const handleTimeUpdate = () => {
    if (!hasRecordedViewRef.current && videoRef.current) {
      if (videoRef.current.currentTime >= 2.5) {
        hasRecordedViewRef.current = true;
        recordPostView(post.id);
      }
    }
  };

  // For image posts: record view after 2.5s of visibility
  useEffect(() => {
    if (post.mediaType !== 'video' && !hasRecordedViewRef.current) {
      const timer = setTimeout(() => {
        hasRecordedViewRef.current = true;
        recordPostView(post.id);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [post.id, post.mediaType]);

  const handleVideoClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap Like!
      if (!post.isLiked) {
        toggleLikePost(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    } else {
      // Single tap: toggle play / pause
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(!isPlaying);
      }
    }
    lastTapRef.current = now;
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

  return (
    <article className="relative w-full aspect-[9/16] max-h-[720px] bg-black overflow-hidden select-none border-b border-white/10 sm:rounded-3xl sm:mb-4 sm:border sm:border-white/10 shadow-2xl">
      {/* Video / Media Player */}
      <div 
        className="absolute inset-0 z-0 cursor-pointer flex items-center justify-center bg-black"
        onClick={handleVideoClick}
      >
        {post.mediaType === 'video' && post.mediaUrl ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            poster={post.posterUrl}
            className="w-full h-full object-cover"
            playsInline
            loop
            autoPlay
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <img
            src={post.posterUrl || post.mediaUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Dark Vignette Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

        {/* Center Pause/Play overlay indicator when paused */}
        {!isPlaying && (
          <div className="absolute z-10 w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/20 pointer-events-none">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        )}

        {/* Double Tap Heart Burst Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute z-20 pointer-events-none text-pink-500 drop-shadow-[0_0_25px_rgba(255,0,122,0.8)]"
            >
              <Heart className="w-24 h-24 fill-current stroke-white stroke-[1.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top Controls Overlay (Mute toggle) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {post.mediaType === 'video' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
              if (videoRef.current) videoRef.current.muted = !isMuted;
            }}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
          </button>
        )}
      </div>

      {/* Bottom Content Info (Creator, Caption, Audio) */}
      <div className="absolute bottom-4 left-3 right-16 z-20 text-left pointer-events-auto space-y-2">
        {/* Creator Handle, Badge & Follow Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/creator/${post.creator.username}`)}
            className="flex items-center gap-1.5 group"
          >
            <span className="font-extrabold text-sm text-white drop-shadow-md group-hover:underline">
              @{post.creator.username}
            </span>
            {post.creator.isVerified && (
              <span className="w-4 h-4 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-[10px] font-bold">
                ✓
              </span>
            )}
          </button>

          <button
            onClick={() => toggleFollowCreator(post.creator.username)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
              post.isFollowing
                ? 'bg-white/20 backdrop-blur-md text-white border border-white/20'
                : 'bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white hover:opacity-90 active:scale-95'
            }`}
          >
            {post.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Caption */}
        <div className="text-xs text-white/95 leading-snug drop-shadow-sm">
          <p className={captionExpanded ? '' : 'line-clamp-2'}>
            {post.caption}
          </p>
          {post.caption.length > 70 && (
            <button
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="text-gray-300 font-bold hover:text-white mt-0.5 inline-block text-[11px]"
            >
              {captionExpanded ? 'less' : '...more'}
            </button>
          )}
        </div>

        {/* Audio Track Badge */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 max-w-[240px]">
            <Music className="w-3 h-3 text-pink-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[11px] text-gray-200 font-medium truncate">
              {post.audioTitle || 'Original Audio'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side Vertical Floating Action Bar (Like Screen 3) */}
      <div className="absolute bottom-6 right-2 z-20 flex flex-col items-center gap-4 text-white pointer-events-auto">
        {/* Creator Avatar with Follow Plus Badge */}
        <div className="relative mb-1">
          <div 
            onClick={() => navigate(`/creator/${post.creator.username}`)}
            className="w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 to-purple-600 cursor-pointer shadow-lg"
          >
            <img
              src={post.creator.avatar}
              alt={post.creator.name}
              className="w-full h-full rounded-full object-cover border border-black"
            />
          </div>
          {!post.isFollowing && (
            <button
              onClick={() => toggleFollowCreator(post.creator.username)}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={() => toggleLikePost(post.id)}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
        >
          <div className={`p-2 rounded-full transition ${
            post.isLiked ? 'text-[#ff007a]' : 'text-white drop-shadow-md group-hover:text-pink-300'
          }`}>
            <Heart className={`w-7 h-7 transition-all ${post.isLiked ? 'fill-current scale-110 drop-shadow-[0_0_10px_rgba(255,0,122,0.6)]' : 'stroke-[2]'}`} />
          </div>
          <span className="text-[11px] font-bold drop-shadow">
            {formatNumber(post.likesCount)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
        >
          <div className="p-2 rounded-full text-white drop-shadow-md group-hover:text-pink-300">
            <MessageCircle className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold drop-shadow">
            {formatNumber(post.commentsCount)}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => setShowShare(true)}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
        >
          <div className="p-2 rounded-full text-white drop-shadow-md group-hover:text-pink-300">
            <Share2 className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold drop-shadow">
            {formatNumber(post.sharesCount)}
          </span>
        </button>

        {/* Bookmark Save Button */}
        <button
          onClick={() => toggleSavePost(post.id)}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
        >
          <div className={`p-2 rounded-full transition ${
            post.isSaved ? 'text-amber-400' : 'text-white drop-shadow-md group-hover:text-amber-300'
          }`}>
            <Bookmark className={`w-6 h-6 ${post.isSaved ? 'fill-current' : 'stroke-[2]'}`} />
          </div>
          <span className="text-[11px] font-bold drop-shadow">
            {formatNumber(post.savesCount)}
          </span>
        </button>

        {/* Real-time View Count Indicator */}
        <div className="flex flex-col items-center gap-0.5 pointer-events-none opacity-95" title="Live Video Views">
          <div className="p-1.5 rounded-full text-white drop-shadow-md">
            <Eye className="w-5 h-5 stroke-[2] text-pink-300" />
          </div>
          <span className="text-[10px] font-extrabold drop-shadow text-pink-200">
            {formatNumber(post.viewsCount || post.views || 0)}
          </span>
        </div>

        {/* More Actions / Video Actions (Screen 8) */}
        <button
          onClick={() => setShowOptionsMenu(true)}
          className="p-1.5 rounded-full text-white/80 hover:text-white transition active:scale-90"
          title="Post Options"
        >
          <MoreVertical className="w-5 h-5 drop-shadow" />
        </button>
      </div>

      {/* Sheets & Modals */}
      <CommentSheet
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      <ShareSheet
        post={post}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        onOpenReport={() => setShowReport(true)}
      />

      <ReportModal
        post={post}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />

      <PostInsightsModal
        post={post}
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
      />

      {/* Instagram-Style Post Options Action Sheet */}
      <AnimatePresence>
        {showOptionsMenu && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowOptionsMenu(false)}
          >
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#160f30] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-4 space-y-2 shadow-2xl text-left"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

              {/* If Author or Admin: Delete Post / Reel */}
              {(post.creator?.username === currentUser.username || currentUser.role === 'admin') && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-2.5 transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Post / Reel {currentUser.role === 'admin' && post.creator?.username !== currentUser.username ? '(Admin)' : ''}</span>
                </button>
              )}

              {/* Author-specific tools */}
              {post.creator?.username === currentUser.username && (
                <>
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowInsights(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-indigo-900/40 hover:brightness-125 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center gap-2.5 transition shadow"
                  >
                    <BarChart3 className="w-4 h-4 text-pink-400" />
                    <span>View Post Insights & Analytics 📊</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      showToast('Post pinned to your profile! 📌');
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2.5 transition"
                  >
                    <Pin className="w-4 h-4 text-pink-400" />
                    <span>Pin to your profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      showToast('Commenting turned off for this post');
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2.5 transition"
                  >
                    <MessageSquareOff className="w-4 h-4 text-gray-400" />
                    <span>Turn off commenting</span>
                  </button>
                </>
              )}

              {/* Other users' content tools: Block & Report */}
              {post.creator?.username !== currentUser.username && (
                <>
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      blockUser(post.creator?.username);
                    }}
                    className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-2.5 transition"
                  >
                    <Ban className="w-4 h-4 text-rose-400" />
                    <span>Block @{post.creator?.username}</span>
                  </button>

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

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      showToast('We will show fewer posts like this', 'info');
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs flex items-center gap-2.5 transition"
                  >
                    <EyeOff className="w-4 h-4 text-gray-400" />
                    <span>Not interested</span>
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

      {/* Delete Confirmation Modal (Instagram Style) */}
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
