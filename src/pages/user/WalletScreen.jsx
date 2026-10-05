import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { 
  ChevronLeft, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Building, 
  X,
  CreditCard,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WalletScreen = () => {
  const navigate = useNavigate();
  const { transactions, currentUser, setCurrentUser, showToast } = useApp();

  const [activeFilter, setActiveFilter] = useState('All');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('10000');
  const [bankAccount, setBankAccount] = useState('HDFC Bank - 501004928174');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const filteredTransactions = transactions.filter(t => {
    if (activeFilter === 'Credits') return t.type === 'credit';
    if (activeFilter === 'Debits') return t.type === 'debit';
    return true;
  });

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount, 10);
    if (!amountNum || amountNum <= 0) return;
    if (amountNum > currentUser.availableBalance) {
      showToast('Amount exceeds available balance', 'error');
      return;
    }

    setSubmittingWithdraw(true);
    setTimeout(() => {
      setSubmittingWithdraw(false);
      setWithdrawModalOpen(false);
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: prev.walletBalance - amountNum,
        availableBalance: prev.availableBalance - amountNum
      }));
      showToast(`Withdrawal of ₹${amountNum.toLocaleString()} initiated to ${bankAccount.split('-')[0]}!`, 'success');
    }, 800);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          FunFlick Wallet
        </span>
        <button 
          onClick={() => showToast('Simulated ₹5,000 creator bonus credited to wallet!', 'success')}
          className="p-1.5 text-xs text-pink-400 font-bold hover:text-pink-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>Top Up</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
        
        {/* Top Gradient Card (Inspired by Screen 11) */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-2xl shadow-pink-500/25 overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80">Total Wallet Balance</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/30 backdrop-blur-md border border-white/15">
              INR (₹)
            </span>
          </div>

          <div className="mt-2 mb-4">
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              ₹{(currentUser.walletBalance || 0).toLocaleString()}
            </h2>
          </div>

          {/* Sub-balances: Pending & Available */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
            <div>
              <span className="text-[10px] text-white/70 block">Available to Withdraw</span>
              <span className="text-sm font-bold font-heading">
                ₹{(currentUser.availableBalance || currentUser.walletBalance || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/70 block">Pending Clearance</span>
              <span className="text-sm font-bold font-heading text-amber-200">
                ₹{(currentUser.pendingBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Withdraw CTA Button */}
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="w-full mt-4 py-2.5 rounded-2xl bg-white text-gray-900 font-extrabold text-xs shadow-lg hover:bg-gray-100 active:scale-[0.99] transition flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw to Bank Account</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="text-sm font-bold text-white font-heading">
            Transaction History
          </h3>

          <div className="flex items-center gap-1 bg-[#18122f] p-1 rounded-xl border border-white/10 text-[11px]">
            {['All', 'Credits', 'Debits'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  activeFilter === f
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5">
          {filteredTransactions.map(tx => {
            const isCredit = tx.type === 'credit';
            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 hover:border-white/10 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-heading line-clamp-1">
                      {tx.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{tx.desc}</p>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">{tx.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-extrabold font-heading ${
                    isCredit ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {tx.formattedAmount}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 block mt-1">
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Withdrawal Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#130d29] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base font-heading">Withdraw Funds</h3>
              <button onClick={() => setWithdrawModalOpen(false)} className="p-1 rounded-full bg-white/10 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  max={currentUser.availableBalance}
                  className="w-full bg-[#18122f] text-white text-lg font-bold px-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Available: ₹{currentUser.availableBalance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Select Payout Destination
                </label>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <Building className="w-5 h-5 text-pink-400" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">HDFC Bank Limited</span>
                    <span className="text-gray-400">A/C: **** **** 4921 · IFSC: HDFC000189</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-xl hover:opacity-95"
              >
                {submittingWithdraw ? 'Processing Transfer...' : 'Confirm Withdrawal'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
