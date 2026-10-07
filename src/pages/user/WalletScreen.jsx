import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  Calendar,
  TrendingUp,
  Receipt,
  Printer,
  Copy,
  Check,
  Search,
  Video,
  Eye,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WalletScreen = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast } = useApp();

  // Data states
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [registeredDetails, setRegisteredDetails] = useState(null);
  const [walletBalance, setWalletBalance] = useState(currentUser?.walletBalance ?? currentUser?.wallet_balance ?? 0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [customRangeModalOpen, setCustomRangeModalOpen] = useState(false);

  // Filter states
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL' | 'TODAY' | '7D' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'
  const [methodFilter, setMethodFilter] = useState('ALL'); // 'ALL' | 'UPI' | 'BANK'
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [copiedId, setCopiedId] = useState(null);

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
        if (d.walletBalance !== undefined) {
          setWalletBalance(d.walletBalance);
          if (setCurrentUser) {
            setCurrentUser(prev => prev ? ({ ...prev, walletBalance: d.walletBalance, wallet_balance: d.walletBalance }) : prev);
          }
        }
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

  const latestPaid = useMemo(() => payoutHistory.find(p => p.status === 'Paid'), [payoutHistory]);

  // Date filtering logic
  const filteredPayouts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    return payoutHistory.filter(p => {
      const pDate = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());

      // Time Filter
      if (timeFilter === 'TODAY' && pDate < startOfToday) return false;
      if (timeFilter === '7D' && pDate < sevenDaysAgo) return false;
      if (timeFilter === 'THIS_MONTH' && pDate < startOfThisMonth) return false;
      if (timeFilter === 'LAST_MONTH' && (pDate < startOfLastMonth || pDate > endOfLastMonth)) return false;
      if (timeFilter === 'THIS_YEAR' && pDate < startOfThisYear) return false;
      if (timeFilter === 'CUSTOM') {
        if (customStartDate && pDate < new Date(`${customStartDate}T00:00:00`)) return false;
        if (customEndDate && pDate > new Date(`${customEndDate}T23:59:59`)) return false;
      }

      // Method Filter
      if (methodFilter === 'UPI') {
        const m = (p.payment_method || p.method || '').toLowerCase();
        if (!m.includes('upi')) return false;
      }
      if (methodFilter === 'BANK') {
        const m = (p.payment_method || p.method || '').toLowerCase();
        if (!m.includes('bank')) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ref = (p.payment_reference || p.reference || p.admin_reference || '').toLowerCase();
        const title = (p.videoTitle || p.video_title || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        if (!ref.includes(q) && !title.includes(q) && !notes.includes(q)) return false;
      }

      return true;
    });
  }, [payoutHistory, timeFilter, methodFilter, searchQuery, customStartDate, customEndDate]);

  // Aggregate stats for filtered period
  const periodStats = useMemo(() => {
    const paidList = filteredPayouts.filter(p => p.status === 'Paid');
    const totalAmount = paidList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalSettledViews = paidList.reduce((acc, curr) => acc + Number(curr.settledViews || 0), 0);
    const avgAmount = paidList.length > 0 ? Math.round(totalAmount / paidList.length) : 0;
    return {
      totalAmount,
      count: paidList.length,
      totalSettledViews,
      avgAmount
    };
  }, [filteredPayouts]);

  // Month-wise grouping for the accordion ledger
  const monthGroups = useMemo(() => {
    const groups = {};
    filteredPayouts.forEach(p => {
      const d = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());
      const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) {
        groups[key] = {
          monthKey: key,
          dateObj: d,
          payouts: [],
          totalAmount: 0
        };
      }
      groups[key].payouts.push(p);
      if (p.status === 'Paid') {
        groups[key].totalAmount += Number(p.amount || 0);
      }
    });

    return Object.values(groups).sort((a, b) => b.dateObj - a.dateObj);
  }, [filteredPayouts]);

  // Visual trend bar data (Last 6 months or 7 days)
  const barChartData = useMemo(() => {
    if (timeFilter === '7D') {
      // 7 days breakdown
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = d.toISOString().slice(0, 10);
        const sum = payoutHistory
          .filter(p => p.status === 'Paid')
          .filter(p => {
            const pd = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());
            return pd.toISOString().slice(0, 10) === dateStr;
          })
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        days.push({ label: dayLabel, amount: sum, dateStr });
      }
      return days;
    } else {
      // 6 Months trend
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const sum = payoutHistory
          .filter(p => p.status === 'Paid')
          .filter(p => {
            const pd = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());
            const pYM = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
            return pYM === yearMonth;
          })
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        months.push({ label, amount: sum, yearMonth });
      }
      return months;
    }
  }, [payoutHistory, timeFilter]);

  const maxChartAmount = useMemo(() => {
    const max = Math.max(...barChartData.map(b => b.amount), 50);
    return max > 0 ? max : 50;
  }, [barChartData]);

  // Toggle month collapse
  const toggleMonth = (key) => {
    setCollapsedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy Reference / UTR
  const handleCopyRef = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    if (showToast) showToast(`UTR Reference copied: ${text}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print voucher slip
  const handlePrintVoucher = (voucher) => {
    const w = window.open('', '_blank', 'width=640,height=760');
    if (!w) return;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const dest = registeredDetails 
      ? (registeredDetails.payout_method === 'bank' 
          ? `${registeredDetails.bank_name} • ${registeredDetails.account_number} • ${registeredDetails.ifsc_code}`
          : registeredDetails.upi_id)
      : 'Registered account on file';
    const rows = [
      ['Voucher ID', `#${voucher.id}`],
      ['Disbursal Date', voucher.date || new Date(voucher.paidAt || voucher.payment_date || Date.now()).toLocaleDateString('en-IN')],
      ['Beneficiary', `${currentUser?.name || 'Creator'} (@${currentUser?.username || 'user'})`],
      ['Disbursed Amount', `₹${Number(voucher.amount).toLocaleString('en-IN')}`],
      ['Payment Method', voucher.payment_method || voucher.method || 'Bank Transfer'],
      ['UTR / Reference ID', voucher.payment_reference || voucher.reference || voucher.admin_reference || 'ADMIN_DISBURSED'],
      ...(voucher.videoTitle ? [
        ['Associated Reel', voucher.videoTitle],
        ['Views Settled', voucher.settledViews ? `${Number(voucher.settledViews).toLocaleString('en-IN')} views` : 'Milestone settlement']
      ] : []),
      ['Credit Destination', dest],
      ['Audit Note', voucher.notes || 'Official FunFlick Creator Milestone Reward']
    ];
    w.document.write(`<!doctype html><html><head><title>FunFlick Payout Voucher #${esc(voucher.id)}</title>
      <style>
        body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:36px;color:#111;background:#fff}
        .header{border-bottom:2px solid #ff007a;padding-bottom:12px;margin-bottom:24px}
        h1{font-size:22px;margin:0 0 4px;color:#090514}
        .badge{display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:bold;padding:3px 8px;border-radius:999px;margin-bottom:8px}
        p{color:#666;font-size:12px;margin:0 0 16px}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}
        td{padding:10px;border-bottom:1px solid #f0f0f0}
        td:first-child{color:#666;width:38%;font-weight:600}
        .footer{margin-top:32px;font-size:11px;color:#888;border-top:1px dashed #ddd;padding-top:12px;display:flex;justify-content:space-between}
      </style></head><body>
      <div class="header">
        <span class="badge">PAID &amp; SETTLED</span>
        <h1>FunFlick — Creator Payout Voucher</h1>
        <p>Official Platform Financial Settlement Receipt. Funds disbursed directly to beneficiary account.</p>
      </div>
      <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
      <div class="footer">
        <span>Generated: ${esc(new Date().toLocaleString('en-IN'))}</span>
        <span>FunFlick Entertainment Platform Pvt Ltd</span>
      </div>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none text-white">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-pink-500" />
          <span>FunFlick Wallet &amp; Payouts</span>
        </span>
        <button 
          onClick={() => setPayoutModalOpen(true)}
          className="p-1.5 text-xs text-pink-400 font-bold hover:text-pink-300 flex items-center gap-1 transition"
        >
          <Building2 className="w-4 h-4" />
          <span>Bank/UPI</span>
        </button>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4">
        
        {/* Latest Paid Alert Notification Banner */}
        {latestPaid && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-purple-950/70 to-pink-950/60 border border-emerald-500/40 text-emerald-200 text-xs shadow-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-xs block">
                  Payout Disbursed by Admin
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Paid
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-200">
                <strong>₹{Number(latestPaid.amount).toLocaleString()}</strong> has been marked as paid to your registered payout account. Please check your bank account or UPI account using the payment details you submitted.
              </p>
              <div className="text-[10px] text-emerald-300 flex items-center gap-2 pt-0.5 flex-wrap">
                <span>Method: <strong>{latestPaid.payment_method || latestPaid.method || 'Bank Transfer'}</strong></span>
                <span>•</span>
                <span>Ref: <strong className="font-mono">{latestPaid.payment_reference || latestPaid.reference || latestPaid.admin_reference || 'ADMIN_DISBURSED'}</strong></span>
                <span>•</span>
                <span>Date: <strong>{latestPaid.date || (latestPaid.paidAt ? new Date(latestPaid.paidAt).toLocaleDateString('en-IN') : 'Recent')}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Top Balance Card */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white shadow-2xl shadow-pink-500/25 overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Creator Earnings &amp; Wallet</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/30 backdrop-blur-md border border-white/15">
              INR (₹)
            </span>
          </div>

          <div className="mt-2 mb-4">
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              ₹{Number(walletBalance ?? currentUser?.walletBalance ?? 0).toLocaleString()}
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
            className="w-full mt-4 py-2.5 rounded-2xl bg-white text-gray-900 font-extrabold text-xs shadow-lg hover:bg-gray-100 active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="text-[11px] text-pink-400 font-bold hover:underline cursor-pointer"
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
              No custom bank/UPI registered yet. In case of payouts, admins will reach out to your registered phone ({currentUser?.phone || 'on file'}) &amp; email ({currentUser?.email || 'on file'}).
            </p>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* NEW: FINANCIAL TIME INTELLIGENCE & FILTER SUITE                */}
        {/* ------------------------------------------------------------- */}

        {/* Time Filters Pills */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-pink-400" />
              <span>Time-Wise Earnings Analysis</span>
            </span>
            {timeFilter === 'CUSTOM' && (customStartDate || customEndDate) && (
              <span className="text-[10px] text-pink-400 font-mono">
                {customStartDate || 'Start'} → {customEndDate || 'End'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7D', label: 'Last 7 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_MONTH', label: 'Last Month' },
              { id: 'THIS_YEAR', label: 'This Year' },
              { id: 'CUSTOM', label: 'Custom 📅' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setTimeFilter(tab.id);
                  if (tab.id === 'CUSTOM') setCustomRangeModalOpen(true);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                  timeFilter === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                    : 'bg-[#140e2b] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Financial KPI Summary Cards for Selected Period */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1b1236] to-[#120a26] border border-pink-500/20">
            <span className="text-[10px] text-gray-400 block">Filtered Income</span>
            <div className="text-base sm:text-lg font-extrabold text-emerald-400 font-heading mt-0.5">
              ₹{periodStats.totalAmount.toLocaleString()}
            </div>
            <span className="text-[9px] text-gray-500 block mt-0.5">
              {timeFilter === 'ALL' ? 'Lifetime earnings' : `In ${timeFilter.toLowerCase().replace('_', ' ')}`}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1b1236] to-[#120a26] border border-purple-500/20">
            <span className="text-[10px] text-gray-400 block">Disbursals</span>
            <div className="text-base sm:text-lg font-extrabold text-white font-heading mt-0.5">
              {periodStats.count}
            </div>
            <span className="text-[9px] text-gray-500 block mt-0.5">Completed transfers</span>
          </div>

          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1b1236] to-[#120a26] border border-blue-500/20">
            <span className="text-[10px] text-gray-400 block">Views Settled</span>
            <div className="text-base sm:text-lg font-extrabold text-cyan-300 font-heading mt-0.5">
              {periodStats.totalSettledViews.toLocaleString()}
            </div>
            <span className="text-[9px] text-gray-500 block mt-0.5">Milestone views</span>
          </div>

          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1b1236] to-[#120a26] border border-amber-500/20">
            <span className="text-[10px] text-gray-400 block">Avg. Per Payout</span>
            <div className="text-base sm:text-lg font-extrabold text-amber-300 font-heading mt-0.5">
              ₹{periodStats.avgAmount.toLocaleString()}
            </div>
            <span className="text-[9px] text-gray-500 block mt-0.5">Reward average</span>
          </div>
        </div>

        {/* Visual Trend Micro-Bar Chart */}
        <div className="p-4 rounded-2xl bg-[#140e2b] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-xs font-bold text-white">
                {timeFilter === '7D' ? 'Last 7 Days Earnings Pulse' : 'Monthly Earnings Pulse'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              Peak: ₹{maxChartAmount.toLocaleString()}
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="flex items-end justify-between gap-2 h-24 pt-4 border-b border-white/5 pb-2">
            {barChartData.map((bar, idx) => {
              const heightPercent = Math.max((bar.amount / maxChartAmount) * 100, 6);
              const hasEarnings = bar.amount > 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover/active */}
                  <div className="opacity-0 group-hover:opacity-100 transition absolute -top-7 px-2 py-0.5 rounded-md bg-black/90 border border-white/10 text-[9px] text-emerald-300 font-bold whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    ₹{bar.amount.toLocaleString()}
                  </div>

                  <div className="w-full flex justify-center items-end h-16">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                        hasEarnings
                          ? 'bg-gradient-to-t from-emerald-500 to-pink-500 shadow-md shadow-pink-500/20'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] font-mono ${hasEarnings ? 'text-white font-bold' : 'text-gray-500'}`}>
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>✨ Tap bars to view dates</span>
            <span>Total Shown: ₹{barChartData.reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Search & Method Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by UTR reference, reel title..."
              className="w-full bg-[#140e2b] text-white text-xs pl-9 pr-8 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 placeholder-gray-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#140e2b] p-1 rounded-xl border border-white/10 text-xs self-start sm:self-auto">
            {['ALL', 'UPI', 'BANK'].map(m => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  methodFilter === m
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'ALL' ? 'All Methods' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Payout & Settlement History with Month-wise Grouped Ledger */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-pink-400" />
              <span>Payout Disbursals Ledger</span>
            </h3>
            <span className="text-[11px] text-gray-400">
              {filteredPayouts.length} record{filteredPayouts.length === 1 ? '' : 's'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto mb-2" />
              <span className="text-xs">Loading payout history...</span>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#140e2b] rounded-2xl border border-white/5 space-y-2">
              <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-1" />
              <p className="font-semibold text-gray-300">No payouts found for this filter</p>
              <p className="text-[11px] text-gray-500">
                {timeFilter !== 'ALL' || searchQuery || methodFilter !== 'ALL' 
                  ? 'Try selecting "All Time" or resetting your search filter.' 
                  : 'When admins process your views & likes performance reward, it will appear here.'}
              </p>
              {(timeFilter !== 'ALL' || searchQuery || methodFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setTimeFilter('ALL');
                    setMethodFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 text-xs font-bold hover:bg-pink-500/30 transition cursor-pointer mt-2"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {monthGroups.map(group => {
                const isCollapsed = Boolean(collapsedMonths[group.monthKey]);
                return (
                  <div key={group.monthKey} className="rounded-2xl bg-[#140e2b] border border-white/10 overflow-hidden shadow-lg">
                    {/* Month Section Header */}
                    <button
                      onClick={() => toggleMonth(group.monthKey)}
                      className="w-full px-4 py-3 bg-[#170f33] hover:bg-[#1a113a] flex items-center justify-between text-left transition cursor-pointer border-b border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-pink-400" />
                        <span className="text-xs font-bold text-white">
                          {group.monthKey}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                          {group.payouts.length} payout{group.payouts.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-400 font-heading">
                          ₹{group.totalAmount.toLocaleString()}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Transaction List under this Month */}
                    {!isCollapsed && (
                      <div className="p-3 space-y-2 divide-y divide-white/5">
                        {group.payouts.map(p => {
                          const isUPI = (p.payment_method || p.method || '').toLowerCase().includes('upi');
                          const refId = p.payment_reference || p.reference || p.admin_reference || 'ADMIN_DISBURSED';
                          const isCopied = copiedId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.02] transition"
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  isUPI 
                                    ? 'bg-purple-500/20 text-purple-300' 
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {isUPI ? <Smartphone className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold text-white">
                                      {p.videoTitle ? `🎬 ${p.videoTitle}` : 'Creator Milestone Disbursal'}
                                    </h4>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-medium">
                                      {p.payment_method || p.method || 'Transfer'}
                                    </span>
                                  </div>

                                  {/* Settled views milestone badge */}
                                  {p.settledViews > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-medium">
                                      <Eye className="w-3 h-3" />
                                      <span>Milestone: {Number(p.settledViews).toLocaleString()} views settled</span>
                                    </div>
                                  )}

                                  {/* UTR Reference + Copy button */}
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-wrap">
                                    <span>UTR:</span>
                                    <span className="font-mono text-gray-300 font-bold">{refId}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyRef(refId, p.id)}
                                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                                      title="Copy UTR Reference"
                                    >
                                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>

                                  {p.notes && (
                                    <p className="text-[10px] text-gray-400 italic">
                                      Note: {p.notes}
                                    </p>
                                  )}

                                  <span className="text-[10px] text-gray-500 block">
                                    {new Date(p.payment_date || p.paidAt || p.created_at || Date.now()).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Amount & Actions */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                <span className="text-sm font-extrabold text-emerald-400 font-heading block">
                                  +₹{Number(p.amount).toLocaleString()}
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVoucher(p)}
                                    className="px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 font-bold text-[10px] border border-pink-500/30 transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                                  >
                                    <Receipt className="w-3 h-3 text-pink-400" />
                                    <span>Receipt</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handlePrintVoucher(p)}
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer"
                                    title="Print Voucher"
                                  >
                                    <Printer className="w-3 h-3 text-pink-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* Custom Date Range Picker Modal */}
      <AnimatePresence>
        {customRangeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-[#140e2b] border border-pink-500/30 p-5 space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <h3 className="text-sm font-bold font-heading">Custom Date Filter</h3>
                </div>
                <button onClick={() => setCustomRangeModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">From Date:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full bg-[#1b1236] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">To Date:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full bg-[#1b1236] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setTimeFilter('ALL');
                    setCustomRangeModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-gray-300 hover:text-white text-xs font-semibold"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setCustomRangeModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-pink-500/20"
                >
                  Apply Range
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payout Voucher Receipt Modal */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c123b] to-[#120a26] border border-pink-500/30 p-5 space-y-4 shadow-2xl text-white relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-pink-400" />
                  <div>
                    <h3 className="text-sm font-bold font-heading">FunFlick Disbursal Voucher</h3>
                    <span className="text-[10px] text-gray-400 font-mono">Voucher #{selectedVoucher.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#1b1236] to-pink-950/60 border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                  Amount Disbursed &amp; Settled
                </span>
                <div className="text-3xl font-extrabold text-emerald-400 font-heading">
                  ₹{Number(selectedVoucher.amount).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-gray-300 block">
                  Via {selectedVoucher.payment_method || selectedVoucher.method || 'Bank Transfer'}
                </span>
              </div>

              {/* Metadata Table */}
              <div className="divide-y divide-white/5 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="font-semibold text-white">
                    {selectedVoucher.date || new Date(selectedVoucher.paidAt || selectedVoucher.payment_date || Date.now()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-400">Beneficiary</span>
                  <span className="font-semibold text-white">
                    {currentUser?.name || 'Creator'} (@{currentUser?.username || 'user'})
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-400">UTR / Reference</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-pink-300 font-bold">
                      {selectedVoucher.payment_reference || selectedVoucher.reference || selectedVoucher.admin_reference || 'ADMIN_DISBURSED'}
                    </span>
                    <button
                      onClick={() => handleCopyRef(selectedVoucher.payment_reference || selectedVoucher.reference || selectedVoucher.admin_reference, 'modal')}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {selectedVoucher.videoTitle && (
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-gray-400">Associated Reel</span>
                    <span className="font-semibold text-cyan-300 text-right max-w-[200px] truncate">
                      {selectedVoucher.videoTitle}
                    </span>
                  </div>
                )}

                {selectedVoucher.settledViews > 0 && (
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-gray-400">Settled Milestone</span>
                    <span className="font-semibold text-white">
                      {Number(selectedVoucher.settledViews).toLocaleString()} views
                    </span>
                  </div>
                )}

                {selectedVoucher.notes && (
                  <div className="py-2 flex items-start justify-between">
                    <span className="text-gray-400">Audit Notes</span>
                    <span className="text-gray-300 italic text-right max-w-[200px]">
                      {selectedVoucher.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handlePrintVoucher(selectedVoucher)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoucher(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
