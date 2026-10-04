import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CreatorNav } from '../../components/creator/CreatorNav';
import { 
  ChevronLeft, 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Zap, 
  DollarSign, 
  Award, 
  Crown,
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react';

export const CreatorAnalyticsScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [period, setPeriod] = useState('Last 30 Days');

  // The 8 Influencer Metrics specified by requirements
  const influencerMetrics = [
    {
      key: 'views',
      title: 'Views',
      value: '1.84M',
      growth: '+24.8%',
      subtitle: 'Total video & reel impressions',
      icon: Eye,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      key: 'likes',
      title: 'Likes',
      value: '142.6K',
      growth: '+18.2%',
      subtitle: 'Audience appreciations',
      icon: Heart,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      key: 'comments',
      title: 'Comments',
      value: '38.4K',
      growth: '+12.5%',
      subtitle: 'Active community chatter',
      icon: MessageCircle,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      key: 'shares',
      title: 'Shares',
      value: '52.1K',
      growth: '+31.4%',
      subtitle: 'Viral WhatsApp & IG shares',
      icon: Share2,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      key: 'saves',
      title: 'Saves',
      value: '29.8K',
      growth: '+15.7%',
      subtitle: 'Bookmarked for re-watching',
      icon: Bookmark,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      key: 'engagement',
      title: 'Engagement',
      value: '14.8%',
      growth: '+3.2%',
      subtitle: 'High viral engagement rate',
      icon: Zap,
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      key: 'performance',
      title: 'Performance',
      value: 'Top 5%',
      growth: 'Score 98/100',
      subtitle: 'High Admin reward eligibility',
      icon: Award,
      iconColor: 'text-pink-400',
      bgColor: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      key: 'earnings',
      title: 'Earnings',
      value: '₹28,500',
      growth: '+₹6,500 this mo',
      subtitle: 'Admin bonuses & rewards paid',
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

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
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-white font-heading block">
            Influencer Analytics
          </span>
          <span className="text-[10px] text-pink-400 font-medium">
            {currentUser.isInfluencer ? '⭐ Influencer Pro Suite' : 'Basic Creator Overview'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
          <span>{period}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        
        {/* Status Banner */}
        {currentUser.isInfluencer ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-[#181035] border border-pink-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-white font-heading block">
                  Influencer Plan Active: {currentUser.subscriptionPlan || 'Pro Pass'}
                </span>
                <p className="text-[10px] text-gray-300">
                  Full 8-factor analytics unlocked & eligible for Admin monetary payouts.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              Active ⭐
            </span>
          </div>
        ) : (
          <div 
            onClick={() => navigate('/subscription')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/70 via-purple-950/60 to-amber-950/40 border border-pink-500/50 flex items-center justify-between gap-3 cursor-pointer shadow-lg hover:border-pink-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-heading block">
                  Upgrade to Influencer Status
                </span>
                <p className="text-[10px] text-gray-300">
                  Free upload enabled! Subscribe to unlock full analytics & earn Admin rewards.
                </p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shrink-0 shadow">
              Upgrade
            </button>
          </div>
        )}

        {/* Weekly Viewership Trend Graph */}
        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400">Total Audience Reach</span>
              <h3 className="text-xl font-extrabold text-white font-heading mt-0.5">1.84M Views</h3>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+24.8%</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-36 flex items-end justify-between gap-2 pt-4 pb-2 px-2 border-b border-white/10">
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

        {/* Section Header: 8 Required Influencer Metrics */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold text-white font-heading">
              Influencer Content Metrics (8-Factor Analytics)
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">Real-time</span>
        </div>

        {/* 8 Influencer Metrics Grid (2 columns x 4 rows) */}
        <div className="grid grid-cols-2 gap-2.5">
          {influencerMetrics.map(m => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className={`p-3.5 rounded-2xl border ${m.bgColor} space-y-1 relative overflow-hidden transition hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">{m.title}</span>
                  <Icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>

                <div className="font-extrabold text-lg text-white font-heading pt-0.5">
                  {m.value}
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold">{m.growth}</span>
                  <span className="text-gray-400 truncate max-w-[90px]">{m.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Payouts & Performance Summary */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#151030] border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-heading block">
                  Admin Performance Rewards
                </span>
                <span className="text-[10px] text-gray-300">
                  Manual rewards distributed for top-performing viral content
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              My Wallet
            </button>
          </div>
        </div>

      </div>

      {/* Creator Studio Navigation */}
      <CreatorNav />
    </div>
  );
};

