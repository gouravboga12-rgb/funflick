import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CreatorNav } from '../../components/creator/CreatorNav';
import { 
  ChevronLeft, 
  DollarSign, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  BarChart2,
  Calendar,
  X,
  Building,
  Crown,
  Sparkles,
  Film,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CreatorEarningsScreen = () => {
  const navigate = useNavigate();
  const { adminPayouts, currentUser, setCurrentUser, userSubmissions, requestCreatorPayout, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [requestPayoutModal, setRequestPayoutModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [customVideoTitle, setCustomVideoTitle] = useState('');
  const [claimViews, setClaimViews] = useState('15000');
  const [amount, setAmount] = useState('25000');

  const tabs = ['Overview', 'Video Earnings', 'Subscriptions'];

  const handleWithdraw = (e) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (!num || num > (currentUser.availableBalance || 50000)) {
      showToast('Invalid withdrawal amount', 'error');
      return;
    }
    setWithdrawModal(false);
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: (prev.walletBalance || 125430) - num,
      availableBalance: (prev.availableBalance || 50000) - num
    }));
    showToast(`Withdrawal of ₹${num.toLocaleString()} processed!`, 'success');
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    const viewsNum = parseInt(claimViews, 10) || 10000;
    const title = selectedVideo ? selectedVideo.title : (customVideoTitle || 'Comedy Viral Reel');

    requestCreatorPayout({
      videoTitle: title,
      views: viewsNum,
      likes: Math.round(viewsNum * 0.12)
    });

    setRequestPayoutModal(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate('/creator/dashboard')} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white font-heading">
            Creator Earnings & Payouts
          </span>
          <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-300" title="Subscribed VIP Creator">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </span>
        </div>
        <button
          onClick={() => setWithdrawModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md"
        >
          Withdraw
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === t
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
        
        {/* Top Gradient Total Earnings Card */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-2xl shadow-pink-500/25 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Total Monetization Earnings</span>
            <BarChart2 className="w-5 h-5 text-white/80" />
          </div>

          <div className="my-3">
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              ₹{(currentUser.walletBalance || 125430).toLocaleString()}
            </h2>
          </div>

          {/* Sub-balances */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
            <div className="p-2 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="text-[10px] text-white/70 block">Available Balance</span>
              <span className="text-sm font-bold font-heading text-emerald-200">
                ₹{(currentUser.availableBalance || 50000).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="text-[10px] text-white/70 block">VIP Status</span>
              <span className="text-xs font-bold font-heading text-amber-200 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                Active Influencer
              </span>
            </div>
          </div>
        </div>

        {/* Claim Views Monetization Payout Action Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h4 className="text-xs font-bold text-white font-heading">Got High Views on a Reel?</h4>
            </div>
            <p className="text-[11px] text-gray-300">
              Subscribed influencers can claim custom performance payouts for 10K+ view milestones!
            </p>
          </div>
          <button
            onClick={() => setRequestPayoutModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-500/25 shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Claim Payout</span>
          </button>
        </div>

        {/* Recent Payouts List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Your Video Payout History & Claims
            </h3>
            <span className="text-xs font-bold text-pink-400">Live Status</span>
          </div>

          <div className="space-y-2.5">
            {adminPayouts.slice(0, 4).map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between hover:border-pink-500/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-heading truncate max-w-[160px]">
                      {item.postTitle}
                    </h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {item.views} · {item.postDate}
                    </span>
                    {item.customRateNote && (
                      <span className="text-[9px] text-pink-300 block italic mt-0.5">
                        "{item.customRateNote}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-white font-heading block">
                    ₹{item.paidAmount > 0 ? item.paidAmount.toLocaleString() : item.approvedAmount.toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mt-1 ${
                    item.status === 'Paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.status === 'Paid' ? 'PAID (Settled)' : 'PENDING EVALUATION'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Creator Studio Navigation */}
      <CreatorNav />

      {/* Claim Payout Request Modal */}
      {requestPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#130d29] border border-pink-500/30 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white text-base font-heading">
                  Request Video Monetization
                </h3>
              </div>
              <button onClick={() => setRequestPayoutModal(false)} className="p-1 rounded-full bg-white/10 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">
                  Select your viral video:
                </label>
                {userSubmissions && userSubmissions.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {userSubmissions.map(sub => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedVideo(sub);
                          setCustomVideoTitle('');
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                          selectedVideo?.id === sub.id
                            ? 'bg-pink-500/20 border-pink-500 text-white font-bold'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Film className="w-4 h-4 text-pink-400 shrink-0" />
                        <span className="truncate flex-1">{sub.title}</span>
                        {selectedVideo?.id === sub.id && (
                          <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customVideoTitle}
                    onChange={e => {
                      setCustomVideoTitle(e.target.value);
                      setSelectedVideo(null);
                    }}
                    placeholder="Enter video title or link..."
                    className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">
                  Current Views Milestone:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['10000', '25000', '50000', '100000', '250000', '500000'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setClaimViews(v)}
                      className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                        claimViews === v
                          ? 'bg-pink-500/20 border-pink-500 text-white shadow'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {parseInt(v) >= 1000 ? `${(parseInt(v)/1000)}K` : v} Views
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                ⭐ As a subscribed VIP influencer, your claim will be reviewed directly by the FunFlick Admin. The admin will inspect your live metrics and disburse your custom performance payment!
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestPayoutModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:opacity-95 shadow-xl shadow-pink-500/25"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#130d29] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base font-heading">Withdraw to Bank / UPI</h3>
              <button onClick={() => setWithdrawModal(false)} className="p-1 rounded-full bg-white/10 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#18122f] text-white text-lg font-bold px-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Building className="w-5 h-5 text-emerald-400" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Verified Creator Bank A/C</span>
                  <span className="text-gray-400">HDFC Bank · Pavani Official (**** 4921)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-xl"
              >
                Confirm Instant Transfer
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
