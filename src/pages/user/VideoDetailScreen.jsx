import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { StandardPostCard } from '../../components/feed/StandardPostCard';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { ChevronLeft, Share2, Loader2, AlertCircle, Home, RefreshCw } from 'lucide-react';

export const VideoDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts, myMedia, currentUser, showToast, setActivePlayingVideoId } = useApp();
  const [fetchedPost, setFetchedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Check if post already exists in memory from posts or myMedia
  let post = posts?.find(p => String(p.id) === String(id));
  if (!post && myMedia && Array.isArray(myMedia)) {
    const raw = myMedia.find(m => String(m.id) === String(id));
    if (raw) {
      post = {
        id: raw.id,
        title: raw.title || 'FunFlick Post',
        caption: raw.caption || raw.title || '',
        category: raw.category || 'Comedy',
        mediaType: raw.mediaType || 'video',
        mediaUrl: raw.mediaUrl,
        posterUrl: raw.posterUrl || raw.thumbnail,
        likesCount: Number(raw.likes) || 0,
        viewsCount: String(raw.views || '0'),
        commentsCount: Number(raw.commentsCount) || 0,
        creator: {
          id: currentUser?.id,
          name: currentUser?.name || 'You',
          username: currentUser?.username || 'you',
          avatar: currentUser?.avatar || currentUser?.avatar_url || '/brand/default-avatar.svg',
          isVerified: true,
          isPrivate: false
        },
        timeAgo: raw.date || 'Recently',
        isLiked: Boolean(raw.user_liked),
        isFollowing: false,
        isSaved: false,
        comments: []
      };
    }
  }
  if (!post && fetchedPost) {
    post = fetchedPost;
  }

  const fetchVideo = () => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    // If already in feed in-memory, no network call needed
    if (posts?.some(p => String(p.id) === String(id))) {
      setLoading(false);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    const token = localStorage.getItem('funflick_token') || localStorage.getItem('funflick_admin_token');
    fetch(`/api/videos/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Video not found');
        return res.json();
      })
      .then((data) => {
        if (data && data.video) {
          setFetchedPost(data.video);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVideo();
  }, [id, posts?.length]);

  // Activate playing video state when video is available
  useEffect(() => {
    if (post?.id && setActivePlayingVideoId) {
      setActivePlayingVideoId(post.id);
    }
  }, [post?.id, setActivePlayingVideoId]);

  const handleShare = () => {
    try {
      const shareUrl = `${window.location.origin}/video/${id}`;
      navigator.clipboard?.writeText(shareUrl);
      showToast('Video link copied to clipboard! 📋', 'success');
    } catch (e) {
      showToast('Failed to copy link', 'error');
    }
  };

  // 1. Loading state
  if (loading && !post) {
    return (
      <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-screen select-none">
        <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-bold text-white font-heading">
            Loading Video
          </span>
          <div className="w-6" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <Loader2 className="w-9 h-9 animate-spin text-pink-500" />
          <p className="text-sm font-semibold text-gray-300">Loading video #{id}...</p>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  // 2. Not found / Error state
  if (!post || notFound) {
    return (
      <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-screen select-none">
        <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-bold text-white font-heading">
            Post Unavailable
          </span>
          <div className="w-6" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Video Not Available</h2>
            <p className="text-xs text-gray-400 max-w-xs">
              This video or post may have been removed, made private, or the link is incorrect.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={fetchVideo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => navigate('/feed')}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 hover:opacity-90 active:scale-95 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to Feed</span>
            </button>
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(post.mediaUrl || '');

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading truncate max-w-[200px]">
          {post.title || 'Watch Video'}
        </span>
        <button onClick={handleShare} className="p-1.5 text-gray-300 hover:text-white" title="Copy share link">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {isVideo ? (
          <VideoPostCard post={post} isReel={false} />
        ) : (
          <StandardPostCard post={post} />
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};
