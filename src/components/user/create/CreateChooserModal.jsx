import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, Sparkles, X, ChevronRight, Crown, DollarSign, Heart, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

export const CreateChooserModal = () => {
  const { createModalOpen, setCreateModalOpen, currentUser } = useApp();
  const navigate = useNavigate();
  const [showMonetizationExplainer, setShowMonetizationExplainer] = useState(false);

  if (!createModalOpen) return null;

  const options = [
    {
      title: 'Create Post',
      desc: 'Share a photo or comedy clip to your feed',
      icon: Image,
      color: 'from-pink-500 to-rose-600',
      path: '/create/post'
    },
    {
      title: 'Upload Video / Reel',
      desc: 'Publish vertical short video or sketch to FunFlick Reels',
      icon: Video,
      color: 'from-purple-600 to-indigo-600',
      path: '/create/video'
    },
    {
      title: 'Create Story',
      desc: 'Share a 24-hour moment with music & stickers',
      icon: Sparkles,
      color: 'from-amber-500 to-pink-500',
      path: '/create/story'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 120 }}
        className="w-full max-w-md bg-[#120c26] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl relative overflow-hidden"
      >
        {!showMonetizationExplainer ? (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white font-heading">Create on FunFlick</h2>
                <p className="text-xs text-pink-300">Choose format or unlock creator rewards</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {options.map(opt => {
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.title}
                    onClick={() => {
                      setCreateModalOpen(false);
                      navigate(opt.path);
                    }}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${opt.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-heading group-hover:text-pink-300 transition-colors">
                          {opt.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                );
              })}
            </div>

            {/* 4th High-Impact Item: Creator Monetization & Payouts */}
            <div 
              onClick={() => setShowMonetizationExplainer(true)}
              className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/40 hover:border-amber-400 transition cursor-pointer group shadow-lg shadow-pink-500/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <Crown className="w-5 h-5 text-amber-200" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-white font-heading group-hover:text-amber-300 transition-colors truncate">
                        Creator Monetization & Payouts
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow-sm shrink-0">
                        EARN CASH
                      </span>
                    </div>
                    <p className="text-xs text-pink-200/90 mt-0.5 line-clamp-1">
                      Top-liked content gets direct cash payouts from the Creator Fund! Tap to see how.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-300 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            </div>
          </>
        ) : (
          /* Explainer Modal inside bottom sheet */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white shadow">
                  <Crown className="w-4 h-4 text-amber-100" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white font-heading">
                    Turn Your Likes Into Cash! 💰
                  </h3>
                  <p className="text-[10px] text-amber-300 font-medium">FunFlick Creator Fund Payout Program</p>
                </div>
              </div>
              <button
                onClick={() => setShowMonetizationExplainer(false)}
                className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* How It Works Steps */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Post Viral Reels & Posts</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Upload comedy clips, sketches, and entertaining content directly to FunFlick.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Top Likes = Direct Monetary Rewards</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Content with the highest likes and engagement qualifies for weekly Creator Fund payouts!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Withdraw to Bank or UPI</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Influencer members unlock wallet payouts, deep 8-factor analytics, and zero ads.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setShowMonetizationExplainer(false);
                  navigate('/subscription');
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>{currentUser?.isInfluencer ? 'View Influencer Plans' : '👑 Activate Influencer Pass & Payouts'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowMonetizationExplainer(false)}
                className="w-full py-2 text-center text-xs text-gray-400 hover:text-white transition"
              >
                ← Back to Upload Options
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
