import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  X, 
  CheckCircle2, 
  Crown, 
  ArrowRight, 
  Building, 
  Eye, 
  Heart, 
  TrendingUp, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PayoutModal = ({ payout, isOpen, onClose }) => {
  const { processCustomAdminPayout, showToast } = useApp();
  const [payAmount, setPayAmount] = useState(payout?.remainingAmount || 2500);
  const [settleScope, setSettleScope] = useState('live'); // 'live' | 'snapshot'
  const [adminNote, setAdminNote] = useState(payout?.customRateNote || '');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !payout) return null;

  const requestedViews = payout.requestedViews || 80000;
  const requestedLikes = payout.requestedLikes || 9500;
  const currentLiveViews = payout.currentLiveViews || Math.round(requestedViews * 1.15);
  const currentLiveLikes = payout.currentLiveLikes || Math.round(requestedLikes * 1.12);
  const viewGrowth = Math.max(0, currentLiveViews - requestedViews);

  const handleConfirm = (e) => {
    e.preventDefault();
    const num = parseInt(payAmount, 10);
    if (!num || num <= 0) {
      showToast('Please enter a valid payout amount', 'error');
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      processCustomAdminPayout(payout.id, {
        amount: num,
        settleScope,
        note: adminNote
      });
      setProcessing(false);
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#110b24] border border-pink-500/30 rounded-3xl p-6 shadow-2xl space-y-4 my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white shadow-md shadow-pink-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-heading">
                Evaluate & Disburse Payout
              </h3>
              <p className="text-[11px] text-pink-300">Admin Custom Evaluation & Settled Views Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Info & VIP Badge */}
        <div className="p-3 rounded-2xl bg-[#181033] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={payout.creatorAvatar} 
              alt={payout.creator} 
              className="w-10 h-10 rounded-full object-cover border-2 border-pink-500/50" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">{payout.creator}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>VIP Influencer</span>
                </span>
              </div>
              <span className="text-[11px] text-pink-300 block font-medium">
                {payout.postTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Requested Snapshot vs Live Performance Comparison */}
        <div className="p-3.5 rounded-2xl bg-[#160f2e] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Performance Metrics Comparison
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{viewGrowth.toLocaleString()} Views Growth!</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Snapshot */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-400 block font-medium">📌 Requested Snapshot</span>
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center gap-1 text-[11px]">
                  <Eye className="w-3 h-3 text-purple-400" />
                  {requestedViews.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-pink-300">
                  <Heart className="w-3 h-3 text-pink-400" />
                  {requestedLikes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Live Count */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] text-emerald-300 block font-medium">🚀 Current Live Count</span>
              <div className="flex items-center justify-between text-white font-extrabold">
                <span className="flex items-center gap-1 text-[11px] text-emerald-200">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  {currentLiveViews.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-pink-300">
                  <Heart className="w-3 h-3 text-pink-400" />
                  {currentLiveLikes.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Scope Radios */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-300 block">Settlement Scope:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label 
                className={`p-2 rounded-xl border text-[11px] cursor-pointer transition flex items-center gap-2 ${
                  settleScope === 'live' 
                    ? 'bg-pink-500/20 border-pink-500 text-white font-bold' 
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="settleScope" 
                  checked={settleScope === 'live'} 
                  onChange={() => setSettleScope('live')}
                  className="accent-pink-500"
                />
                <span>Settle All Live ({currentLiveViews.toLocaleString()})</span>
              </label>

              <label 
                className={`p-2 rounded-xl border text-[11px] cursor-pointer transition flex items-center gap-2 ${
                  settleScope === 'snapshot' 
                    ? 'bg-pink-500/20 border-pink-500 text-white font-bold' 
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="settleScope" 
                  checked={settleScope === 'snapshot'} 
                  onChange={() => setSettleScope('snapshot')}
                  className="accent-pink-500"
                />
                <span>Settle Requested ({requestedViews.toLocaleString()})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bank & Payout Summary */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Direct Creator Wallet / Bank</span>
              <span className="text-[10px] text-gray-400">Account verified · Instant Settlement</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">Total Paid So Far</span>
            <span className="text-xs font-bold text-emerald-400">₹{(payout.paidAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleConfirm} className="space-y-3.5">
          {/* Custom Editable Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-200">
                Custom Payout Amount (₹)
              </label>
              <div className="flex items-center gap-1">
                {[1000, 2000, 3000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPayAmount(val)}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-pink-300 border border-white/10"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">₹</span>
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="Enter custom rate..."
                className="w-full bg-[#181033] text-white text-base font-extrabold pl-8 pr-4 py-2.5 rounded-2xl border border-white/15 focus:outline-none focus:border-pink-500 shadow-inner"
              />
            </div>
          </div>

          {/* Admin Note / Rate Justification */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              Admin Evaluation Note (Visible to Creator)
            </label>
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="e.g. ₹500 base rate + ₹150 viral engagement bonus applied!"
                className="w-full bg-[#181033] text-white text-xs pl-9 pr-3 py-2 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 disabled:opacity-50 shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Disburse ₹{parseInt(payAmount || 0, 10).toLocaleString()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
