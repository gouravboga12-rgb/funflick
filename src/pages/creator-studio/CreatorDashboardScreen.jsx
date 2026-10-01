import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CreatorNav } from '../../components/creator/CreatorNav';
import { 
  Eye, 
  Heart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight,
  Sparkles,
  Play
} from 'lucide-react';

export const CreatorDashboardScreen = () => {
  const navigate = useNavigate();
  const { creators, creatorVideos } = useApp();
  const creator = creators[0]; // Pavani Official

  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const metrics = [
    {
      title: 'Total Views',
      value: '12.5M',
      growth: '+12%',
      icon: Eye,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Total Likes',
      value: '856K',
      growth: '+8%',
      icon: Heart,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Subscribers',
      value: '24.3K',
      growth: '+15%',
      icon: Users,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Estimated Earnings',
      value: '₹45,320',
      growth: '+10%',
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header matching Screen 9 */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-pink-500"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white font-heading">
                {creator.username}
              </h2>
              <span className="w-3.5 h-3.5 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-[9px] font-bold">
                ✓
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              Verified Creator
            </span>
          </div>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
            <span>{timeRange}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Content (Screen 9) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
        
        {/* Metric Cards 2x2 Grid (Screen 9) */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(m => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className={`p-4 rounded-3xl border ${m.bgColor} space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">{m.title}</span>
                  <Icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>

                <div className="font-extrabold text-xl text-white font-heading">
                  {m.value}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{m.growth}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Performing Videos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Latest Video Performance
            </h3>
            <button 
              onClick={() => navigate('/creator/videos')}
              className="text-xs font-bold text-pink-400 hover:text-pink-300"
            >
              See All &gt;
            </button>
          </div>

          <div className="space-y-2.5">
            {creatorVideos.slice(0, 3).map(video => (
              <div
                key={video.id}
                className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between hover:border-pink-500/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-900 shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current text-white/80" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                      {video.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">{video.date}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {video.views} views
                      </span>
                      <span className="text-[10px] text-pink-400 font-bold">
                        {video.likes} likes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-white font-heading block">
                    {video.earnings}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mt-1 ${
                    video.status === 'Published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {video.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Upload CTA */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white font-heading">
              Ready with a new sketch?
            </h4>
            <p className="text-[10px] text-gray-300 mt-0.5">
              Upload directly to your FunFlick audience
            </p>
          </div>
          <button
            onClick={() => navigate('/create/video')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md"
          >
            Upload Video
          </button>
        </div>

      </div>

      {/* Creator Studio Navigation */}
      <CreatorNav />
    </div>
  );
};
