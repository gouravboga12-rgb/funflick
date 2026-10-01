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
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CreatorEarningsScreen = () => {
  const navigate = useNavigate();
  const { adminPayouts, currentUser, setCurrentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('25000');

  const tabs = ['Overview', 'Video Earnings', 'Subscriptions'];

  const handleWithdraw = (e) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (!num || num > currentUser.availableBalance) {
      showToast('Invalid withdrawal amount', 'error');
      return;
    }
    setWithdrawModal(false);
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: prev.walletBalance - num,
      availableBalance: prev.availableBalance - num
    }));
    showToast(`Withdrawal of ₹${num.toLocaleString()} processed!`, 'success');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header (Screen 11) */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate('/creator/dashboard')} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Earnings
        </span>
        <button
          onClick={() => setWithdrawModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md"
        >
          Withdraw
        </button>
      </div>

      {/* Tabs (Screen 11) */}
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

      {/* Main Content (Screen 11) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
        
        {/* Top Gradient Total Earnings Card (Screen 11) */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-2xl shadow-pink-500/25 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Total Earnings</span>
            <BarChart2 className="w-5 h-5 text-white/80" />
          </div>

          <div className="my-3">
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              ₹1,25,430
            </h2>
          </div>

          {/* Sub-balances: Pending & Paid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
            <div className="p-2 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="text-[10px] text-white/70 block">Pending Earnings</span>
              <span className="text-sm font-bold font-heading text-amber-200">
                ₹25,000
              </span>
            </div>

            <div className="p-2 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="text-[10px] text-white/70 block">Paid Earnings</span>
              <span className="text-sm font-bold font-heading text-emerald-300">
                ₹1,00,430
              </span>
            </div>
          </div>
        </div>

        {/* Recent Earnings List (Screen 11) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Recent Earnings
            </h3>
            <span className="text-xs font-bold text-pink-400">See All &gt;</span>
          </div>

          <div className="space-y-2.5">
            {adminPayouts.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between hover:border-pink-500/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-heading">
                      {item.postTitle}
                    </h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {item.postDate}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-white font-heading block">
                    ₹{item.approvedAmount.toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mt-1 ${
                    item.status === 'Paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Payout Notice */}
        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/10 text-xs text-gray-300 space-y-1">
          <p className="font-bold text-white">Direct Admin Payout Processing</p>
          <p className="text-[11px] text-gray-400">
            Post and video bonuses are reviewed and disbursed bi-weekly by FunFlick platform administrators. Check Admin Panel to simulate sending payments!
          </p>
        </div>

      </div>

      {/* Creator Studio Navigation */}
      <CreatorNav />

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#130d29] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base font-heading">Creator Payout Request</h3>
              <button onClick={() => setWithdrawModal(false)} className="p-1 rounded-full bg-white/10 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Payout Amount (₹)
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
