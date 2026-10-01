import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CreatorNav } from '../../components/creator/CreatorNav';
import { 
  ChevronLeft, 
  Plus, 
  Play, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Eye, 
  Heart, 
  MessageSquare,
  Clock
} from 'lucide-react';

export const CreatorVideosScreen = () => {
  const navigate = useNavigate();
  const { creatorVideos, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('All');

  const tabs = [
    { label: 'All', count: 32 },
    { label: 'Draft', count: 5 },
    { label: 'Pending', count: 3 },
    { label: 'Published', count: 24 }
  ];

  const filteredVideos = creatorVideos.filter(v => {
    if (activeTab === 'Draft') return v.status === 'Draft';
    if (activeTab === 'Pending') return v.status === 'Pending Approval';
    if (activeTab === 'Published') return v.status === 'Published';
    return true; // All
  });

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header (Screen 10) */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate('/creator/dashboard')} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          My Videos
        </span>
        <button
          onClick={() => navigate('/create/video')}
          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
      </div>

      {/* Tabs (Screen 10) */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {tabs.map(t => (
          <button
            key={t.label}
            onClick={() => setActiveTab(t.label)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === t.label
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <span>{t.label}</span>
            <span className="opacity-75 text-[10px]">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Video List (Screen 10) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {filteredVideos.map(video => (
          <div
            key={video.id}
            className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 hover:border-pink-500/20 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-900 shrink-0">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-5 h-5 fill-current text-white/80" />
                </div>
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-bold text-white">
                  {video.duration}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                  {video.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                  <span>{video.date}</span>
                  <span>·</span>
                  <span className="text-pink-400 font-semibold">{video.views} views</span>
                </div>
                
                {/* Status Badge */}
                <div className="mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block ${
                    video.status === 'Published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : video.status === 'Pending Approval'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {video.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-xs font-extrabold text-white font-heading">
                {video.earnings}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => showToast('Editing video metadata...', 'info')}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => showToast('Video deleted from creator library', 'info')}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Creator Studio Navigation */}
      <CreatorNav />
    </div>
  );
};
