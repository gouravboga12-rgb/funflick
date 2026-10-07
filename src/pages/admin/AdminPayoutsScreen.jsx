import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PayoutModal } from '../../components/admin/PayoutModal';
import { 
  DollarSign, 
  Send, 
  CheckCircle2, 
  Clock, 
  History, 
  Search, 
  Filter, 
  Building, 
  AlertCircle,
  Crown,
  Eye,
  Heart,
  TrendingUp,
  Sparkles,
  Building2,
  Smartphone,
  Loader2
} from 'lucide-react';

export const AdminPayoutsScreen = () => {
  const { showToast } = useApp();
  const [creators, setCreators] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('VIP Paid Creators');
  const [isLoading, setIsLoading] = useState(true);

  const fetchEligibleCreators = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch('/api/payouts/admin/creators', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Failed to fetch creators for payouts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleCreators();
  }, []);

  const filteredCreators = creators.filter(c => {
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) || 
      (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'VIP Paid Creators') return Boolean(c.isInfluencer);
    if (filter === 'Paid') return (Number(c.totalPaidAmount ?? c.totalPaid) || 0) > 0;
    if (filter === 'With Details') return Boolean(c.hasPayoutDetails || (c.payoutDetails && (c.payoutDetails.account_number || c.payoutDetails.upi_id)));
    return true; // 'All Creators'
  });

  const totalPaidGlobal = creators.reduce((acc, c) => acc + (Number(c.totalPaidAmount ?? c.totalPaid) || 0), 0);
  const creatorsWithDetailsCount = creators.filter(c => Boolean(c.hasPayoutDetails || (c.payoutDetails && (c.payoutDetails.account_number || c.payoutDetails.upi_id)))).length;
  const eligibleVipCount = creators.filter(c => Boolean(c.isInfluencer)).length;

  return (
    <AdminLayout title="Influencer Payouts & Disbursal Engine">
      {/* Intro banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-heading">
              Influencer View & Like Milestone Payouts
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>VIP Paid Creators</span>
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            Review creator views & likes performance. Transfer payouts outside FunFlick using the creator's submitted Bank or UPI details, then click <strong>Mark as Paid</strong> to record the audit trail and send notification.
          </p>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Total Disbursed</span>
            <strong className="font-heading">₹{totalPaidGlobal.toLocaleString()}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Eligible VIP Creators</span>
            <strong className="font-heading">{eligibleVipCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-pink-500/10 text-pink-300 border border-pink-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Bank/UPI Submitted</span>
            <strong className="font-heading">{creatorsWithDetailsCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creator by name or username..."
            className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#140e2b] p-1 rounded-2xl border border-white/10 text-xs">
          {['VIP Paid Creators', 'All Creators', 'With Details', 'Paid'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                filter === f
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Table */}
      <div className="bg-[#120c27] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181135] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Creator</th>
                <th className="py-3.5 px-4">Performance (Views / Likes)</th>
                <th className="py-3.5 px-4">Payout Account Details</th>
                <th className="py-3.5 px-4">Total Disbursed</th>
                <th className="py-3.5 px-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto mb-2" />
                    <span>Loading eligible creators from database...</span>
                  </td>
                </tr>
              ) : filteredCreators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <span>No creators found for selected filter</span>
                  </td>
                </tr>
              ) : (
                filteredCreators.map(creator => {
                  const d = creator.payoutDetails;
                  const views = Number(creator.totalViews ?? creator.metrics?.totalViews ?? 0);
                  const likes = Number(creator.totalLikes ?? creator.metrics?.totalLikes ?? 0);
                  const posts = Number(creator.postsCount ?? creator.videosCount ?? creator.metrics?.videosCount ?? 0);
                  const totalPaid = Number(creator.totalPaidAmount ?? creator.totalPaid ?? 0);
                  const isInfluencer = Boolean(creator.isInfluencer);
                  const planText = isInfluencer 
                    ? (creator.subscriptionPlan || creator.planName || 'Weekly Influencer') 
                    : 'Free User';

                  return (
                    <tr key={creator.id} className="hover:bg-white/5 transition">
                      {/* Creator info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={creator.avatar || '/brand/default-avatar.svg'}
                            alt={creator.name}
                            className={`w-10 h-10 rounded-full object-cover border-2 ${isInfluencer ? 'border-pink-500/60 ring-2 ring-amber-400/30' : 'border-white/10'}`}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{creator.name}</span>
                              {isInfluencer ? (
                                <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-300" title="VIP Influencer">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-gray-500/20 text-gray-400">
                                  Free User
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-pink-300">@{creator.username}</span>
                            <span className="text-[10px] text-gray-400 block">
                              Plan: {planText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Views & Likes */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-white font-bold">{views.toLocaleString()} Views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                            <span className="text-gray-300">{likes.toLocaleString()} Likes</span>
                          </div>
                          <span className="text-[10px] text-gray-500 block">
                            {posts} media uploaded
                          </span>
                        </div>
                      </td>

                      {/* Payout Details */}
                      <td className="py-3.5 px-4">
                        {d ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase inline-block">
                              {d.payout_method === 'bank' || d.payout_type === 'bank' ? '🏦 Bank Account' : '📱 UPI ID'}
                            </span>
                            {d.payout_method === 'bank' || d.payout_type === 'bank' ? (
                              <p className="text-[11px] text-gray-300 font-mono mt-1">
                                {d.bank_name || 'Bank'} • {d.account_number} • {d.ifsc_code}
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-300 font-mono mt-1">
                                {d.upi_id}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400">
                              Tel: {d.contact_phone || d.phone || creator.phone}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-300/90 space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-block">
                              Registration Contact
                            </span>
                            <p className="text-gray-300 font-mono mt-1">{creator.phone || 'Phone not provided'}</p>
                            <p className="text-gray-400">{creator.email}</p>
                          </div>
                        )}
                      </td>

                      {/* Total Disbursed */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-400 font-heading text-sm block">
                          ₹{totalPaid.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          Wallet: ₹{(creator.walletBalance || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCreator(creator)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-pink-500/20 active:scale-95 transition"
                        >
                          Review & Mark as Paid
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark As Paid Modal */}
      {selectedCreator && (
        <PayoutModal
          creator={selectedCreator}
          isOpen={Boolean(selectedCreator)}
          onClose={() => setSelectedCreator(null)}
          onPaidSuccess={fetchEligibleCreators}
        />
      )}
    </AdminLayout>
  );
};
