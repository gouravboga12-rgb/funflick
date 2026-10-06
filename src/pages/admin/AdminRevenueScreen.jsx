import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  BarChart3, 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Crown, 
  Users, 
  RefreshCw, 
  Eye, 
  X,
  FileText
} from 'lucide-react';

export const AdminRevenueScreen = () => {
  const { subscriptionTransactions, theme, showToast, recordSubscriptionPayment, publishingPlans, fetchAdminTransactions } = useApp();
  const isLight = theme === 'light';
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real subscription transactions from MySQL on mount
  useEffect(() => {
    const load = async () => {
      setIsRefreshing(true);
      if (fetchAdminTransactions) await fetchAdminTransactions();
      setIsRefreshing(false);
    };
    load();
  }, []);

  const handleRefreshTransactions = async () => {
    setIsRefreshing(true);
    if (fetchAdminTransactions) await fetchAdminTransactions();
    setIsRefreshing(false);
    showToast('✅ Revenue data refreshed from database!', 'success');
  };

  // Filters State
  const [dateFilter, setDateFilter] = useState('All Time'); // 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Last Month' | 'Fiscal Q3' | 'Custom' | 'All Time'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Quick Date Filter Options
  const dateOptions = [
    { label: 'Today', key: 'Today' },
    { label: 'Yesterday', key: 'Yesterday' },
    { label: 'This Week', key: 'This Week' },
    { label: 'This Month', key: 'This Month' },
    { label: 'Last Month', key: 'Last Month' },
    { label: 'Fiscal Q3 (2026)', key: 'Fiscal Q3' },
    { label: 'All Time', key: 'All Time' },
    { label: 'Custom Range', key: 'Custom' }
  ];

  // Base date for prototype (October 5, 2026)
  const referenceDate = new Date('2026-10-05T12:00:00.000Z');

  // Filtered Transactions Calculation
  const filteredTransactions = useMemo(() => {
    let list = subscriptionTransactions || [];

    // Filter by Date
    if (dateFilter !== 'All Time') {
      list = list.filter(item => {
        if (!item.date) return false;
        const txDate = new Date(item.date);

        if (dateFilter === 'Today') {
          // Same calendar day as reference date (2026-10-05)
          return (
            txDate.getUTCFullYear() === referenceDate.getUTCFullYear() &&
            txDate.getUTCMonth() === referenceDate.getUTCMonth() &&
            txDate.getUTCDate() === referenceDate.getUTCDate()
          );
        }

        if (dateFilter === 'Yesterday') {
          const yesterday = new Date(referenceDate);
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          return (
            txDate.getUTCFullYear() === yesterday.getUTCFullYear() &&
            txDate.getUTCMonth() === yesterday.getUTCMonth() &&
            txDate.getUTCDate() === yesterday.getUTCDate()
          );
        }

        if (dateFilter === 'This Week') {
          const sevenDaysAgo = new Date(referenceDate);
          sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
          return txDate >= sevenDaysAgo && txDate <= referenceDate;
        }

        if (dateFilter === 'This Month') {
          return (
            txDate.getUTCFullYear() === referenceDate.getUTCFullYear() &&
            txDate.getUTCMonth() === referenceDate.getUTCMonth()
          );
        }

        if (dateFilter === 'Last Month') {
          const lastMonthIndex = referenceDate.getUTCMonth() === 0 ? 11 : referenceDate.getUTCMonth() - 1;
          const lastMonthYear = referenceDate.getUTCMonth() === 0 ? referenceDate.getUTCFullYear() - 1 : referenceDate.getUTCFullYear();
          return txDate.getUTCFullYear() === lastMonthYear && txDate.getUTCMonth() === lastMonthIndex;
        }

        if (dateFilter === 'Fiscal Q3') {
          // Fiscal Q3 (August, September, October 2026)
          const m = txDate.getUTCMonth();
          return txDate.getUTCFullYear() === 2026 && (m === 7 || m === 8 || m === 9);
        }

        if (dateFilter === 'Custom') {
          if (!customStartDate && !customEndDate) return true;
          const start = customStartDate ? new Date(customStartDate) : new Date('2020-01-01');
          const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date('2099-12-31');
          return txDate >= start && txDate <= end;
        }

        return true;
      });
    }

    // Filter by Plan
    if (selectedPlanFilter !== 'ALL') {
      list = list.filter(item => {
        const pId = (item.planId || '').toLowerCase();
        const pName = (item.planName || '').toLowerCase();
        if (selectedPlanFilter === 'monthly') return pId.includes('month') || pName.includes('month');
        if (selectedPlanFilter === 'quarterly') return pId.includes('quarter') || pName.includes('quarter');
        if (selectedPlanFilter === 'annual') return pId.includes('annual') || pId.includes('year') || pName.includes('annual') || pName.includes('year');
        return true;
      });
    }

    // Filter by Search Query (Name, Username, Payment ID, Email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.userName && item.userName.toLowerCase().includes(q)) ||
        (item.user && item.user.toLowerCase().includes(q)) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
        (item.razorpayPaymentId && item.razorpayPaymentId.toLowerCase().includes(q)) ||
        (item.planName && item.planName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [subscriptionTransactions, dateFilter, customStartDate, customEndDate, selectedPlanFilter, searchQuery]);

  // Aggregate Metrics
  const grossRevenue = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredTransactions]);

  const totalSubscriptionsCount = filteredTransactions.length;
  const averageOrderValue = totalSubscriptionsCount > 0 ? Math.round(grossRevenue / totalSubscriptionsCount) : 0;
  
  // Razorpay Gateway Fee estimation (2.0% + 18% GST on fee = 2.36%)
  const gatewayProcessingFees = Math.round(grossRevenue * 0.0236);
  const netSettledRevenue = grossRevenue - gatewayProcessingFees;

  // Breakdown by Tier
  const tierBreakdown = useMemo(() => {
    const counts = {
      monthly: { count: 0, revenue: 0, label: 'Monthly Influencer Pro (₹199)' },
      quarterly: { count: 0, revenue: 0, label: 'Quarterly Influencer Star (₹499)' },
      annual: { count: 0, revenue: 0, label: 'Annual Influencer VIP (₹1,499)' }
    };

    filteredTransactions.forEach(item => {
      const pId = (item.planId || '').toLowerCase();
      const pName = (item.planName || '').toLowerCase();
      const amt = Number(item.amount) || 0;

      if (pId.includes('month') || pName.includes('month')) {
        counts.monthly.count += 1;
        counts.monthly.revenue += amt;
      } else if (pId.includes('quarter') || pName.includes('quarter')) {
        counts.quarterly.count += 1;
        counts.quarterly.revenue += amt;
      } else {
        counts.annual.count += 1;
        counts.annual.revenue += amt;
      }
    });

    const total = grossRevenue || 1;
    return [
      { 
        name: counts.monthly.label, 
        count: counts.monthly.count, 
        revenue: counts.monthly.revenue, 
        percentage: Math.round((counts.monthly.revenue / total) * 100) || 0,
        color: 'from-pink-500 to-rose-500'
      },
      { 
        name: counts.quarterly.label, 
        count: counts.quarterly.count, 
        revenue: counts.quarterly.revenue, 
        percentage: Math.round((counts.quarterly.revenue / total) * 100) || 0,
        color: 'from-purple-500 to-indigo-500'
      },
      { 
        name: counts.annual.label, 
        count: counts.annual.count, 
        revenue: counts.annual.revenue, 
        percentage: Math.round((counts.annual.revenue / total) * 100) || 0,
        color: 'from-amber-400 to-orange-500'
      }
    ];
  }, [filteredTransactions, grossRevenue]);

  // Copy to clipboard helper
  const handleCopy = (text, id) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(`Copied Payment ID: ${text}`, 'info');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      showToast(`ID: ${text}`, 'info');
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export for the selected filter!', 'error');
      return;
    }

    const headers = ['Razorpay Payment ID', 'Customer Name', 'Username', 'Email', 'Plan Name', 'Duration', 'Amount (INR)', 'Gateway', 'Status', 'Date & Time'];
    const rows = filteredTransactions.map(tx => [
      `"${tx.razorpayPaymentId || tx.id}"`,
      `"${tx.userName || ''}"`,
      `"@${tx.user || ''}"`,
      `"${tx.userEmail || ''}"`,
      `"${tx.planName || ''}"`,
      `"${tx.planDuration || '30 Days'}"`,
      tx.amount,
      `"${tx.paymentGateway || 'Razorpay Test'}"`,
      `"${tx.status || 'Captured'}"`,
      `"${tx.formattedDate || tx.date}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FunFlick_Revenue_Report_${dateFilter.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Revenue CSV Report downloaded successfully!', 'success');
  };

  // Quick Simulation Helper for testing from admin panel
  const handleSimulateNewPayment = () => {
    const plans = [
      { id: 'monthly', name: 'Monthly Influencer Pro', price: 199, duration: '30 Days' },
      { id: 'quarterly', name: 'Quarterly Influencer Star', price: 499, duration: '90 Days' },
      { id: 'annual', name: 'Annual Influencer VIP', price: 1499, duration: '365 Days' }
    ];
    const pickedPlan = plans[Math.floor(Math.random() * plans.length)];
    const mockRzpId = `pay_test_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    recordSubscriptionPayment({
      plan: pickedPlan,
      paymentId: mockRzpId,
      paymentMethod: 'Razorpay Test (Direct Simulated)'
    });
    showToast(`⚡ Test payment of ₹${pickedPlan.price} recorded with ID ${mockRzpId}!`, 'success');
  };

  return (
    <AdminLayout title="User Registration & Subscription Revenue">
      {/* Top Banner & Quick Actions */}
      <div className={`p-5 rounded-3xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gradient-to-r from-[#140b2a] via-[#100720] to-[#170a2f] border-white/10'
      } border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Razorpay Test Gateway Connected (`rzp_test_...5VmT8`)</span>
            </span>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>• Live Sync</span>
          </div>
          <h2 className={`text-lg md:text-xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
            Registration & Influencer Fee Ledger
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'} max-w-xl`}>
            Track all revenues generated from user-side influencer registrations and subscription plans. Filter transactions by any date range, inspect Razorpay payment IDs, and analyze net margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            onClick={handleRefreshTransactions}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60"
            title="Refresh revenue from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleSimulateNewPayment}
            className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5"
            title="Inject a test transaction into the ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate Payment</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white text-xs font-bold shadow-md shadow-pink-500/25 hover:opacity-95 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date-Based Filters Bar */}
      <div className={`p-4 rounded-3xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#120a26] border-white/10'
      } border space-y-3 transition-colors`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'} flex items-center gap-1 mr-1 shrink-0`}>
              <Calendar className="w-3.5 h-3.5 text-pink-400" />
              <span>Date Filter:</span>
            </span>
            {dateOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setDateFilter(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  dateFilter === opt.key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                    : isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Active Period Label */}
          <div className="flex items-center gap-2 text-xs font-bold text-pink-400 self-end lg:self-center">
            <span>Showing: {dateFilter} ({filteredTransactions.length} orders)</span>
          </div>
        </div>

        {/* Custom Date Range Pickers (shown when Custom is selected) */}
        {dateFilter === 'Custom' && (
          <div className={`p-3 rounded-2xl ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#180e33] border-white/10'
          } border flex flex-wrap items-center gap-4 animate-in fade-in`}>
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d071d] border-white/20 text-white'
                } focus:outline-none focus:border-pink-500`}
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d071d] border-white/20 text-white'
                } focus:outline-none focus:border-pink-500`}
              />
            </div>

            {(customStartDate || customEndDate) && (
              <button
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
              >
                Clear Range
              </button>
            )}
          </div>
        )}

        {/* Secondary Search & Plan Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user, @handle, Razorpay ID..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#160d2e] border-white/10 text-white'
              } placeholder-gray-500 focus:outline-none focus:border-pink-500 transition`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Plan Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'} font-semibold flex items-center gap-1`}>
              <Filter className="w-3.5 h-3.5" />
              <span>Plan Tier:</span>
            </span>
            <select
              value={selectedPlanFilter}
              onChange={e => setSelectedPlanFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#160d2e] border-white/10 text-white'
              } focus:outline-none focus:border-pink-500`}
            >
              <option value="ALL">All Influencer Plans</option>
              <option value="monthly">Monthly Pro (₹199)</option>
              <option value="quarterly">Quarterly Star (₹499)</option>
              <option value="annual">Annual VIP (₹1,499)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Gross Revenue */}
        <div className={`p-4 rounded-3xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#130b26] border-emerald-500/25'
        } border space-y-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Total Gross Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
            ₹{grossRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>100% Captured via Razorpay</span>
          </span>
        </div>

        {/* Total Subscriptions Sold */}
        <div className={`p-4 rounded-3xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#130b26] border-purple-500/25'
        } border space-y-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Subscriptions Sold</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
            {totalSubscriptionsCount}
          </div>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} font-semibold`}>
            Active Influencer passes
          </span>
        </div>

        {/* Average Order Value */}
        <div className={`p-4 rounded-3xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#130b26] border-blue-500/25'
        } border space-y-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Avg Order Value (AOV)</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
            ₹{averageOrderValue.toLocaleString()}
          </div>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} font-semibold`}>
            Per registration transaction
          </span>
        </div>

        {/* Razorpay Gateway Fees */}
        <div className={`p-4 rounded-3xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#130b26] border-amber-500/25'
        } border space-y-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Razorpay Processing</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-amber-400'} font-heading`}>
            ₹{gatewayProcessingFees.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-500/80 font-semibold">
            2% + 18% GST (Standard Rate)
          </span>
        </div>

        {/* Net Settled Amount */}
        <div className={`p-4 rounded-3xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#130b26] border-pink-500/25'
        } border space-y-1 col-span-2 lg:col-span-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Net Platform Settled</span>
            <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-[#ff007a] font-heading">
            ₹{netSettledRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-pink-400 font-bold">
            97.6% Net Realization
          </span>
        </div>
      </div>

      {/* Plan Breakdown Progress Cards */}
      <div className={`p-5 rounded-3xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#120a26] border-white/10'
      } border space-y-4 transition-colors`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
              Revenue Inflow by Subscription Tier
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Distribution across Monthly (₹199), Quarterly (₹499), and Annual (₹1,499) tiers
            </p>
          </div>
          <span className="text-xs font-bold text-pink-400">
            Total: ₹{grossRevenue.toLocaleString()}
          </span>
        </div>

        <div className="space-y-3">
          {tierBreakdown.map(item => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  {item.name} ({item.count} subscribers)
                </span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ₹{item.revenue.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}>
                <div 
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(item.percentage, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Transactions Table */}
      <div className={`rounded-3xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#120a26] border-white/10'
      } border overflow-hidden transition-colors`}>
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-white/10">
          <div>
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
              Subscription Payment Ledger
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Detailed audit trail of all customer registration fees with Razorpay payment references
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-300">
            {filteredTransactions.length} Records
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-gray-500 mx-auto" />
            <h4 className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
              No transactions match this date or filter
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Try selecting "All Time" or clearing your search query. You can also click "Simulate Payment" above to test.
            </p>
            <button
              onClick={() => { setDateFilter('All Time'); setSearchQuery(''); setSelectedPlanFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-pink-500/20 text-pink-300 text-xs font-bold hover:bg-pink-500/30 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`${
                isLight ? 'bg-slate-50 text-slate-600 border-b border-slate-200' : 'bg-[#160c30] text-gray-400 border-b border-white/10'
              } font-bold uppercase text-[10px] tracking-wider`}>
                <tr>
                  <th className="py-3 px-4">Razorpay Payment ID</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Plan & Validity</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Gateway & Method</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                {filteredTransactions.map((tx) => {
                  const paymentRef = tx.razorpayPaymentId || tx.id;
                  const isCopied = copiedId === paymentRef;

                  return (
                    <tr 
                      key={paymentRef} 
                      className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'} transition-colors`}
                    >
                      {/* Razorpay Payment ID */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-pink-300'}`}>
                            {paymentRef}
                          </span>
                          <button
                            onClick={() => handleCopy(paymentRef, paymentRef)}
                            className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition"
                            title="Copy Payment ID"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-500 block">Razorpay Test</span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={tx.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={tx.userName}
                            className="w-8 h-8 rounded-full object-cover border border-pink-500/40"
                          />
                          <div>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'} block`}>
                              {tx.userName || 'Customer'}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              @{tx.user} {tx.userEmail ? `• ${tx.userEmail}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plan & Validity */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                          {tx.planName}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Validity: {tx.planDuration || '30 Days'}
                        </span>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-extrabold text-emerald-400 font-heading">
                          ₹{Number(tx.amount).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-500 block">INR</span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                          <span>{tx.paymentGateway || 'Razorpay Test'}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'} block`}>
                          {tx.formattedDate || new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          Settlement: Instant
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Captured</span>
                        </span>
                      </td>

                      {/* Action: View Receipt Modal */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-pink-400" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt / Invoice Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#130b26] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="/brand/funflick-logo.png" alt="FunFlick" className="w-7 h-7 rounded-xl object-contain" />
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    FunFlick Payment Receipt
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold">Payment Status: CAPTURED</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#1b1037] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Payment ID:</span>
                <span className="font-mono text-pink-300 font-bold">{selectedReceipt.razorpayPaymentId || selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer Name:</span>
                <span className="text-white font-bold">{selectedReceipt.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Handle:</span>
                <span className="text-pink-400 font-bold">@{selectedReceipt.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-300">{selectedReceipt.userEmail || 'srilatha@funflick.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-bold">{selectedReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-gray-300">{selectedReceipt.planDuration || '30 Days'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date:</span>
                <span className="text-gray-300">{selectedReceipt.formattedDate || selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gateway:</span>
                <span className="text-purple-300">{selectedReceipt.paymentGateway || 'Razorpay Test'}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-extrabold">
                <span className="text-white">Total Amount Paid:</span>
                <span className="text-emerald-400 font-heading text-base">₹{Number(selectedReceipt.amount).toLocaleString()} INR</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
