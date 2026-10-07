import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  Users, 
  Video, 
  Crown, 
  DollarSign, 
  Clock, 
  Flag, 
  TrendingUp, 
  Check, 
  X, 
  ArrowUpRight,
  Play,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AdminDashboardScreen = () => {
  const navigate = useNavigate();
  const { 
    posts, 
    creators, 
    pendingApprovals, 
    subscriptionTransactions, 
    adminPayouts, 
    copyrightReports, 
    handlePendingApproval, 
    fetchAdminPendingContent,
    adminStats,
    fetchAdminStats,
    currentUser,
    showToast, 
    theme 
  } = useApp();
  const isLight = theme === 'light';

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAdminPendingContent ? fetchAdminPendingContent() : Promise.resolve(),
        fetchAdminStats ? fetchAdminStats() : Promise.resolve()
      ]);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();

    // Auto-poll every 20 seconds so newly uploaded user reels appear in real-time from AWS
    const interval = setInterval(() => {
      loadData(true);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    await loadData(false);
    showToast('Platform metrics and approval queue synchronized from AWS! 🔄', 'info');
  };

  const totalRevenueNum = Number(adminStats?.totalRevenue || 0);
  const totalPayoutsNum = Number(adminStats?.creatorPayments || 0);

  // Metrics reflect exclusively live data from the AWS MySQL database
  const kpis = [
    { title: 'Users', value: adminStats ? Number(adminStats.totalUsers || 0) : '...', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/25', path: '/admin/users' },
    { title: 'Creators', value: adminStats ? Number(adminStats.totalCreators || 0) : '...', icon: Video, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/25', path: '/admin/creators' },
    { title: 'Videos', value: adminStats ? Number(adminStats.totalVideos || 0) : '...', icon: Play, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/25', path: '/admin/content' },
    { title: 'Subscriptions', value: adminStats ? Number(adminStats.activeSubscriptions || 0) : '...', icon: Crown, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/25', path: '/admin/subscriptions' },
    { title: 'Total Revenue', value: adminStats ? `₹${totalRevenueNum.toLocaleString()}` : '...', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/25', path: '/admin/revenue' },
    { title: 'Creator Payments', value: adminStats ? `₹${totalPayoutsNum.toLocaleString()}` : '...', icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25', path: '/admin/payouts' },
    { title: 'Pending Approvals', value: (pendingApprovals || []).length, icon: Clock, color: 'text-amber-500', bg: 'bg-yellow-500/10 border-yellow-500/25', path: '/admin/content' },
    { title: 'Reported Content', value: adminStats ? Number(adminStats.reportedContent || 0) : '...', icon: Flag, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', path: '/admin/reports' },
  ];

  return (
    <AdminLayout title="Admin Control Center">
      {/* 8 Platform KPI Cards Grid (Screen 12) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'} uppercase tracking-wider`}>
            Platform Overview Metrics
          </h2>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`px-3 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition ${
              isLight 
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-pink-400' : 'text-gray-400'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.title}
                onClick={() => navigate(kpi.path)}
                className={`p-4 rounded-3xl border ${kpi.bg} cursor-pointer hover:scale-[1.02] transition-transform space-y-1.5 ${
                  isLight ? 'shadow-sm' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isLight ? 'text-slate-700 font-bold' : 'text-gray-400 font-medium'}`}>{kpi.title}</span>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className={`text-lg md:text-xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
                  {kpi.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen 12: "Recent Videos for Approval" Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-heading">
              Recent Videos for Approval
            </h2>
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {pendingApprovals.length} Awaiting Review
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              title="Refresh queue"
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
            </button>
            <button 
              onClick={() => navigate('/admin/content')}
              className="text-xs font-bold text-pink-400 hover:text-pink-300"
            >
              See All &gt;
            </button>
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#140e2b] border border-white/5 text-center text-xs text-gray-400">
            <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p>All submitted videos have been reviewed and approved!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingApprovals.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-pink-500/20 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-900 shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-5 h-5 fill-current text-white/80" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white font-heading">
                      {item.title}
                    </h4>
                    <p className="text-xs text-pink-300 font-medium mt-0.5">
                      by @{item.creator} ({item.creatorName})
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{item.category}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                {/* Approve & Reject Action Buttons (Screen 12) */}
                <div className="flex items-center gap-2 sm:self-center self-end">
                  <button
                    onClick={() => handlePendingApproval(item.id, 'approve')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handlePendingApproval(item.id, 'reject')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access to Important Features: Payouts & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Creator Payout Simulation Card */}
        <div 
          onClick={() => navigate('/admin/payouts')}
          className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-[#1b1236] border border-amber-500/30 cursor-pointer hover:border-amber-500/60 transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PRIORITY SIMULATION
            </span>
            <ChevronRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white font-heading">
              Creator Payouts & Rewards
            </h3>
            <p className="text-xs text-gray-300 mt-1">
              Disburse direct monetary rewards to creators and subscribed influencers based on real video views and engagement.
            </p>
          </div>
        </div>

        {/* Subscription Revenue Breakdown Card */}
        <div 
          onClick={() => navigate('/admin/revenue')}
          className="p-5 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 cursor-pointer hover:border-pink-500/60 transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              FINANCIALS
            </span>
            <ChevronRight className="w-4 h-4 text-pink-300 group-hover:translate-x-1 transition-transform" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white font-heading">
              Platform Revenue Engine
            </h3>
            <p className="text-xs text-gray-300 mt-1">
              Track live Razorpay user subscription intake, filter by date ranges, and monitor creator disbursement margins.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
