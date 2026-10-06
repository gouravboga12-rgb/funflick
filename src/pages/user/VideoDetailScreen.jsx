import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { ChevronLeft, Share2 } from 'lucide-react';

export const VideoDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts, myMedia, currentUser, showToast } = useApp();

  let post = posts.find(p => String(p.id) === String(id));
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
  if (!post) post = posts[0];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Watch Video
        </span>
        <button onClick={() => showToast('Video link copied!', 'info')} className="p-1.5 text-gray-300">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        <VideoPostCard post={post} />
      </div>

      <BottomNavigation />
    </div>
  );
};
