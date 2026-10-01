import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { ChevronLeft, Share2 } from 'lucide-react';

export const VideoDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts, showToast } = useApp();

  const post = posts.find(p => p.id === id) || posts[0];

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
