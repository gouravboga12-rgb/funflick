import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CreatorNav } from '../../components/creator/CreatorNav';
import { 
  ChevronLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Share2, 
  Heart,
  ChevronDown
} from 'lucide-react';

export const CreatorAnalyticsScreen = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('Last 30 Days');

  const chartBars = [
    { day: 'Mon', val: 65 },
    { day: 'Tue', val: 80 },
    { day: 'Wed', val: 45 },
    { day: 'Thu', val: 95 },
    { day: 'Fri', val: 120 },
    { day: 'Sat', val: 160 },
    { day: 'Sun', val: 140 }
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate('/creator/dashboard')} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Creator Analytics
        </span>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
          <span>{period}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
        
        {/* Weekly Viewership Trend Graph */}
        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400">Total Audience Reach</span>
              <h3 className="text-xl font-extrabold text-white font-heading mt-0.5">12.5M Views</h3>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4%</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-40 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-white/10">
            {chartBars.map(bar => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div 
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-[#ff007a] group-hover:brightness-125 transition-all"
                  style={{ height: `${(bar.val / 160) * 100}%` }}
                />
                <span className="text-[10px] text-gray-400">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 space-y-1">
            <span className="text-xs text-gray-400">Avg. Watch Time</span>
            <div className="text-base font-bold text-white font-heading">0:48 sec</div>
            <span className="text-[10px] text-emerald-400 font-semibold">+14% vs last week</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 space-y-1">
            <span className="text-xs text-gray-400">Engagement Rate</span>
            <div className="text-base font-bold text-white font-heading">9.4%</div>
            <span className="text-[10px] text-pink-400 font-semibold">High creator score</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 space-y-1">
            <span className="text-xs text-gray-400">Total Shares</span>
            <div className="text-base font-bold text-white font-heading">482K</div>
            <span className="text-[10px] text-blue-400 font-semibold">+22% viral boost</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 space-y-1">
            <span className="text-xs text-gray-400">Subscriber Growth</span>
            <div className="text-base font-bold text-white font-heading">+3,420</div>
            <span className="text-[10px] text-purple-400 font-semibold">24.3K Total</span>
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-3">
          <h4 className="text-xs font-bold text-white font-heading">Top Viewer Regions</h4>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Hyderabad & Telangana</span>
                <span className="font-bold text-white">48%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#ff007a] rounded-full w-[48%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Bengaluru & Karnataka</span>
                <span className="font-bold text-white">26%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[26%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Mumbai & Maharashtra</span>
                <span className="font-bold text-white">16%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[16%]" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Creator Studio Navigation */}
      <CreatorNav />
    </div>
  );
};
