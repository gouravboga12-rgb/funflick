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
  MessageSquare,
  Building2,
  Smartphone,
  Copy,
  ShieldCheck,
  Check,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PayoutModal = ({ creator, isOpen, onClose, onPaidSuccess }) => {
  const { showToast } = useApp();
  const [payAmount, setPayAmount] = useState(2500);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [adminReference, setAdminReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !creator) return null;

  const payoutDetails = creator.payoutDetails;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName}: ${text}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    const num = parseInt(payAmount, 10);
    if (!num || num <= 0) {
      showToast('Please enter a valid payout amount', 'error');
      return;
    }

    setProcessing(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');

    try {
      const res = await fetch('/api/payouts/admin/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          creator_id: creator.id,
          amount: num,
          payment_method: paymentMethod,
          admin_reference: adminReference.trim() || `UTR_${Date.now()}`,
          notes: adminNote.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark payout as paid');
      }

      showToast(`✅ ₹${num.toLocaleString()} marked as paid to @${creator.username}! Notification sent.`, 'success');
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (onPaidSuccess) onPaidSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Payment mark failed', 'error');
    } finally {
      setProcessing(false);
    }
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
                Creator Payout Disbursal
              </h3>
              <p className="text-[11px] text-pink-300">Manual Outside Transfer & Mark as Paid</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Info */}
        <div className="p-3.5 rounded-2xl bg-[#181033] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={creator.avatar || '/brand/default-avatar.svg'} 
              alt={creator.name} 
              className="w-11 h-11 rounded-2xl object-cover border-2 border-pink-500/50" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">{creator.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>{creator.planName || 'VIP Creator'}</span>
                </span>
              </div>
              <span className="text-[11px] text-pink-300">@{creator.username}</span>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                <span>Views: <strong className="text-white">{creator.metrics?.totalViews || 0}</strong></span>
                <span>Likes: <strong className="text-white">{creator.metrics?.totalLikes || 0}</strong></span>
                <span>Videos: <strong className="text-white">{creator.metrics?.videosCount || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">Wallet Balance</span>
            <span className="text-sm font-extrabold text-emerald-400 font-heading">
              ₹{(creator.walletBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Submitted Payout Destination Details (For Admin to Transfer) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-pink-950/30 border border-pink-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Destination Account Details for Manual Transfer:</span>
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-pink-300">
              {payoutDetails ? (payoutDetails.payout_method || 'Bank') : 'Fallback: Registered Contact'}
            </span>
          </div>

          {payoutDetails ? (
            <div className="space-y-1.5 text-xs text-gray-300 bg-black/40 p-3 rounded-xl border border-white/5">
              {payoutDetails.payout_method === 'bank' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Bank Name: <strong className="text-white">{payoutDetails.bank_name}</strong></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Account No: <strong className="text-white font-mono">{payoutDetails.account_number}</strong></span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payoutDetails.account_number, 'Account Number')}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-pink-300 flex items-center gap-1"
                    >
                      {copiedField === 'Account Number' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IFSC Code: <strong className="text-white font-mono">{payoutDetails.ifsc_code}</strong></span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payoutDetails.ifsc_code, 'IFSC Code')}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-pink-300 flex items-center gap-1"
                    >
                      {copiedField === 'IFSC Code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span>UPI ID: <strong className="text-white font-mono">{payoutDetails.upi_id}</strong></span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(payoutDetails.upi_id, 'UPI ID')}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-pink-300 flex items-center gap-1"
                  >
                    {copiedField === 'UPI ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
              )}
              <div className="text-[10px] text-gray-400 pt-1 border-t border-white/5">
                Phone: {payoutDetails.phone || creator.phone} • Email: {payoutDetails.email || creator.email}
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-200 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 space-y-1">
              <p>Creator closed without submitting bank/UPI. Use their registered registration details:</p>
              <p>Phone: <strong className="text-white font-mono">{creator.phone || 'Not provided'}</strong></p>
              <p>Email: <strong className="text-white">{creator.email}</strong></p>
            </div>
          )}
        </div>

        {/* Form Inputs for Mark as Paid */}
        <form onSubmit={handleMarkAsPaid} className="space-y-3.5">
          {/* Payout Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-200">
                Payout Amount to Disburse (₹)
              </label>
              <div className="flex items-center gap-1">
                {[500, 1000, 2000, 5000].map(val => (
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
                required
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full bg-[#181033] text-white text-base font-extrabold pl-8 pr-4 py-2.5 rounded-2xl border border-white/15 focus:outline-none focus:border-pink-500 shadow-inner"
              />
            </div>
          </div>

          {/* Payment Method Used */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Payment Method Used
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
              >
                <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                <option value="UPI Transfer">UPI Transfer (GPay/PhonePe)</option>
                <option value="Direct Cash">Direct Cash</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                UTR / Reference No.
              </label>
              <input
                type="text"
                value={adminReference}
                onChange={e => setAdminReference(e.target.value)}
                placeholder="e.g. UTR12345678 or Txn ID"
                className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>
          </div>

          {/* Admin Note */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              Admin Note / Milestone Details
            </label>
            <input
              type="text"
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="e.g. Payout for reaching 10,000 views & 10,000 likes milestone"
              className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
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
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Paid (₹{parseInt(payAmount || 0, 10).toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
