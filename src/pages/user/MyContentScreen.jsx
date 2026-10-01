import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Film, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const MyContentScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Posts';

  const { posts, creatorVideos, deleteUserPost, showToast } = useApp();
  const [activeTab, setActiveTab] = useState(
    initialTab === 'liked' ? 'Liked' : initialTab === 'saved' ? 'Saved' : 'Posts'
  );

  const tabs = ['Posts', 'Videos', 'Stories', 'Drafts', 'Liked', 'Saved'];

  const handleDelete = (id) => {
    if (window.confirm('Delete this post permanently from FunFlick?')) {
      deleteUserPost(id);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          My Content Library
        </span>
        <button
          onClick={() => navigate('/create/post')}
          className="p-1.5 text-xs text-pink-400 font-bold hover:text-pink-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === t
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content List / Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {activeTab === 'Posts' && (
          posts.map(post => (
            <div
              key={post.id}
              className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between gap-3 hover:border-pink-500/30 transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={post.posterUrl || post.mediaUrl}
                  alt={post.title}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                    {post.title || post.caption.slice(0, 30)}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-pink-400" /> {post.viewsCount || '1.2M'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" /> {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-blue-400" /> {post.commentsCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => showToast('Editing post details...', 'info')}
                  className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {activeTab === 'Videos' && (
          creatorVideos.map(video => (
            <div
              key={video.id}
              className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      video.status === 'Published' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : video.status === 'Pending Approval'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {video.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{video.duration}</span>
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-pink-400 font-heading">
                {video.earnings}
              </span>
            </div>
          ))
        )}

        {(activeTab === 'Stories' || activeTab === 'Drafts' || activeTab === 'Liked' || activeTab === 'Saved') && (
          <div className="p-8 text-center text-xs text-gray-400 space-y-2">
            <Film className="w-8 h-8 text-pink-400 mx-auto opacity-60" />
            <p className="font-semibold text-white">No {activeTab.toLowerCase()} in your collection</p>
            <p className="text-[11px] text-gray-500">Create new comedy content to see them listed here.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
