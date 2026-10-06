import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { CreatorPayoutDetailsModal } from '../../components/user/CreatorPayoutDetailsModal';
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
  Plus,
  Building2,
  Smartphone,
  ShieldCheck,
  Loader2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WalletScreen = () => {
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();

  const [activeFilter, setActiveFilter] = useState('All');
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [registeredDetails, setRegisteredDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [histRes, detRes] = await Promise.all([
        fetch('/api/payouts/my-history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/payouts/details', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (histRes.ok) {
        const d = await histRes.json();
        setPayoutHistory(d.payouts || []);
      }
      if (detRes.ok) {
        const d = await detRes.json();
        setRegisteredDetails(d.payoutDetails);
      }
    } catch (err) {
      console.warn('Failed to load wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestPaid = payoutHistory.find(p => p.status === 'Paid');

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          FunFlick Wallet & Payouts
        </span>
        <button 
          onClick={() => setPayoutModalOpen(true)}
          className="p-1.5 text-xs text-pink-400 font-bold hover:text-pink-300 flex items-center gap-1"
        >
          <Building2 className="w-4 h-4" />
          <span>Bank/UPI</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        
        {/* Latest Paid Alert Notification Banner */}
        {latestPaid && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-purple-950/70 to-pink-950/60 border border-emerald-500/40 text-emerald-200 text-xs shadow-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-white text-xs block">
                Payout Disbursed by Admin
              </span>
              <p className="text-[11px] leading-relaxed text-gray-200">
                <strong>₹{Number(latestPaid.amount).toLocaleString()}</strong> has been marked as paid to your registered payout account. Please check your bank account or UPI account using the payment details you submitted.
              </p>
              <div className="text-[10px] text-emerald-300 flex items-center gap-2 pt-0.5">
                <span>Method: <strong>{latestPaid.payment_method}</strong></span>
                <span>•</span>
                <span>Ref: <strong>{latestPaid.admin_reference || 'ADMIN_DISBURSED'}</strong></span>
                <span>•</span>
                <span>Date: {new Date(latestPaid.payment_date || latestPaid.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Balance Card */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-2xl shadow-pink-500/25 overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80">Creator Earnings & Wallet</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/30 backdrop-blur-md border border-white/15">
              INR (₹)
            </span>
          </div>

          <div className="mt-2 mb-4">
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              ₹{(currentUser.walletBalance || 0).toLocaleString()}
            </h2>
          </div>

          {/* Sub-balances: Available */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
            <div>
              <span className="text-[10px] text-white/70 block">Total Payouts Received</span>
              <span className="text-sm font-bold font-heading">
                ₹{payoutHistory.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/70 block">Registered Mode</span>
              <span className="text-sm font-bold font-heading text-amber-200 uppercase">
                {registeredDetails?.payout_method || 'Bank / UPI'}
              </span>
            </div>
          </div>

          {/* Bank / UPI Update CTA */}
          <button
            onClick={() => setPayoutModalOpen(true)}
            className="w-full mt-4 py-2.5 rounded-2xl bg-white text-gray-900 font-extrabold text-xs shadow-lg hover:bg-gray-100 active:scale-[0.99] transition flex items-center justify-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-pink-600" />
            <span>{registeredDetails ? 'Update Bank / UPI Payout Details' : 'Add Bank / UPI Payout Details'}</span>
          </button>
        </div>

        {/* Registered Payout Info Card */}
        <div className="p-4 rounded-2xl bg-[#140e2b] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Registered Payout Destination</span>
            </span>
            <button
              onClick={() => setPayoutModalOpen(true)}
              className="text-[11px] text-pink-400 font-bold hover:underline"
            >
              Edit
            </button>
          </div>

          {registeredDetails ? (
            <div className="text-xs text-gray-300 space-y-1">
              {registeredDetails.payout_method === 'bank' ? (
                <>
                  <p>Bank: <strong className="text-white">{registeredDetails.bank_name}</strong></p>
                  <p>Account: <strong className="text-white font-mono">{registeredDetails.account_number}</strong></p>
                  <p>IFSC: <strong className="text-white font-mono">{registeredDetails.ifsc_code}</strong></p>
                </>
              ) : (
                <p>UPI ID: <strong className="text-white font-mono">{registeredDetails.upi_id}</strong></p>
              )}
              <p className="text-[10px] text-gray-400">Alert Phone: {registeredDetails.phone} • Email: {registeredDetails.email}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No custom bank/UPI registered yet. In case of payouts, admins will reach out to your registered phone ({currentUser?.phone || 'on file'}) & email ({currentUser?.email || 'on file'}).
            </p>
          )}
        </div>

        {/* Payout & Settlement History */}
        <div className="space-y-2 pt-1">
          <h3 className="text-sm font-bold text-white font-heading">
            Payout History & Disbursals
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto mb-2" />
              <span className="text-xs">Loading payout history...</span>
            </div>
          ) : payoutHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#140e2b] rounded-2xl border border-white/5">
              <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-300 mb-1">No payout records yet</p>
              <p className="text-[11px] text-gray-500">
                When admins review your views & likes performance and process a payout, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {payoutHistory.map(p => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Creator Payout Disbursed
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Via {p.payment_method} • Ref: {p.admin_reference || 'ADMIN_TRANSFER'}
                      </p>
                      <span className="text-[10px] text-gray-500 block">
                        {new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400 font-heading block">
                      +₹{Number(p.amount).toLocaleString()}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mt-1">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Creator Bank / UPI Details Modal */}
      <CreatorPayoutDetailsModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
