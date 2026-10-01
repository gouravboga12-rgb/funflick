import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { DollarSign, X, CheckCircle2, ShieldCheck, ArrowRight, Building } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PayoutModal = ({ payout, isOpen, onClose }) => {
  const { processAdminPayout, showToast } = useApp();
  const [payAmount, setPayAmount] = useState(payout?.remainingAmount || 2000);
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !payout) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    const num = parseInt(payAmount, 10);
    if (!num || num <= 0) return;

    setProcessing(true);
    setTimeout(() => {
      processAdminPayout(payout.id, num);
      setProcessing(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#130d29] border border-pink-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-heading">
                Disburse Creator Payout
              </h3>
              <p className="text-[10px] text-pink-300">Admin Payout Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/10 text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creator & Post Summary (Section 36) */}
        <div className="p-3.5 rounded-2xl bg-[#191136] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Creator</span>
            <span className="text-xs font-bold text-white">{payout.creator}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Post / Content</span>
            <span className="text-xs font-semibold text-pink-300">{payout.postTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Approved Earning</span>
            <span className="text-xs font-bold text-white">₹{payout.approvedAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Amount Already Paid</span>
            <span className="text-xs font-semibold text-emerald-400">₹{payout.paidAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="text-xs font-bold text-gray-300">Remaining Due</span>
            <span className="text-sm font-extrabold text-amber-300 font-heading">
              ₹{payout.remainingAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bank Account Info */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <Building className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">Recipient Account: HDFC Bank</span>
            <span className="text-gray-400">IFSC: HDFC000189 · A/C: **** 4921</span>
          </div>
        </div>

        {/* Input amount */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              Payment Amount to Send (₹)
            </label>
            <input
              type="number"
              value={payAmount}
              max={payout.remainingAmount || 5000}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full bg-[#191136] text-white text-lg font-bold px-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:opacity-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {processing ? 'Sending...' : 'Confirm & Disburse'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
