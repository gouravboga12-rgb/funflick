import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export const AdminPayoutsScreen = () => {
  const { adminPayouts } = useApp();
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [historyPayout, setHistoryPayout] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Subscribed Only');

  const filteredPayouts = adminPayouts.filter(p => {
    const matchesSearch = 
      p.creator.toLowerCase().includes(search.toLowerCase()) || 
      p.postTitle.toLowerCase().includes(search.toLowerCase()) ||
      (p.creatorUsername && p.creatorUsername.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'Subscribed Only') return matchesSearch && (p.isSubscribed || p.subscriptionPlan);
    if (filter === 'Paid') return matchesSearch && p.status === 'Paid';
    if (filter === 'Pending') return matchesSearch && p.status === 'Partially Paid';
    return matchesSearch;
  });

  const totalPaid = adminPayouts.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalPending = adminPayouts.reduce((acc, p) => acc + (p.remainingAmount || 0), 0);
  const totalSubscribed = adminPayouts.filter(p => p.isSubscribed || p.subscriptionPlan).length;

  return (
    <AdminLayout title="Creator Payouts Management">
      {/* Intro banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-heading">
              Subscribed Influencer Performance & Payouts Engine
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>VIP Influencers Only</span>
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Evaluate high-view & high-like viral reels from subscribed creators. Compare snapshot vs. live metrics, set custom rates, and track settled milestones.
          </p>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Total Disbursed</span>
            <strong className="font-heading">₹{totalPaid.toLocaleString()}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Pending Evaluation</span>
            <strong className="font-heading">₹{totalPending.toLocaleString()}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">VIP Influencers</span>
            <strong className="font-heading">{totalSubscribed} Creators</strong>
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
            placeholder="Search creator, handle, or video..."
            className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#140e2b] p-1 rounded-2xl border border-white/10 text-xs">
          {['Subscribed Only', 'All', 'Pending', 'Paid'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filter === f
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-[#120c27] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181135] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Influencer / Creator</th>
                <th className="py-3.5 px-4">Post & Milestone</th>
                <th className="py-3.5 px-4">Views & Likes (Req. vs Live)</th>
                <th className="py-3.5 px-4">Paid / Settled</th>
                <th className="py-3.5 px-4">Status & Note</th>
                <th className="py-3.5 px-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {filteredPayouts.map(payout => {
                const reqViews = payout.requestedViews || 80000;
                const liveViews = payout.currentLiveViews || Math.round(reqViews * 1.15);
                const growth = liveViews - reqViews;

                return (
                  <tr key={payout.id} className="hover:bg-white/5 transition">
                    {/* Creator with VIP badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={payout.creatorAvatar}
                          alt={payout.creator}
                          className="w-9 h-9 rounded-full object-cover border-2 border-pink-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{payout.creator}</span>
                            <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-300" title="Subscribed VIP Influencer">
                              <Crown className="w-3 h-3 text-amber-400" />
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {payout.subscriptionPlan || 'Monthly Influencer Pro'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Post Title & Date */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-pink-300 block max-w-xs truncate">{payout.postTitle}</span>
                      <span className="text-[10px] text-gray-400">{payout.postDate}</span>
                    </td>

                    {/* Views & Likes Comparison */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <span className="text-gray-400 text-[11px]">{reqViews >= 1000000 ? `${(reqViews/1000000).toFixed(1)}M` : `${(reqViews/1000).toFixed(0)}K`} req.</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-emerald-300 font-bold">{liveViews >= 1000000 ? `${(liveViews/1000000).toFixed(1)}M` : `${(liveViews/1000).toFixed(0)}K`} live</span>
                        </div>
                        {growth > 0 && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{growth >= 1000000 ? `${(growth/1000000).toFixed(1)}M` : `${(growth/1000).toFixed(0)}K`} growth since request
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-emerald-400 font-heading text-sm">
                          ₹{payout.paidAmount.toLocaleString()}
                        </span>
                        {payout.paidUpToViews > 0 && (
                          <span className="text-[10px] text-gray-400 block">
                            Settled to {payout.paidUpToViews >= 1000000 ? `${(payout.paidUpToViews/1000000).toFixed(1)}M` : `${(payout.paidUpToViews/1000).toFixed(0)}K`} views
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status with Milestone Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                          payout.status === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {payout.status === 'Paid' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PAID (Settled)</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>PENDING EVALUATION</span>
                            </>
                          )}
                        </span>
                        {payout.customRateNote && (
                          <span className="text-[10px] text-gray-400 block italic max-w-xs truncate" title={payout.customRateNote}>
                            "{payout.customRateNote}"
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status !== 'Paid' ? (
                          <button
                            onClick={() => setSelectedPayout(payout)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Evaluate & Pay</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPayout(payout)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                            <span>Top-up Milestone</span>
                          </button>
                        )}

                        {payout.paymentHistory?.length > 0 && (
                          <button
                            onClick={() => setHistoryPayout(payout)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                            title="Audit Log"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursal Modal */}
      <PayoutModal
        payout={selectedPayout}
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />

      {/* Payment History Audit Modal */}
      {historyPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#130d29] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white text-base font-heading">
                  Payout History & Settled Milestones
                </h3>
              </div>
              <button onClick={() => setHistoryPayout(null)} className="text-gray-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
              <span className="font-bold text-white block">{historyPayout.creator}</span>
              <span className="text-[11px] text-pink-300">{historyPayout.postTitle}</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {historyPayout.paymentHistory?.map(tx => (
                <div key={tx.id} className="p-3 rounded-2xl bg-[#191136] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">₹{tx.amount.toLocaleString()} Disbursed</span>
                    <span className="text-[10px] text-gray-400">{tx.date} · {tx.method}</span>
                    {tx.note && (
                      <span className="text-[10px] text-pink-300 block italic mt-0.5">"{tx.note}"</span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Ref: {tx.ref}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setHistoryPayout(null)}
              className="w-full py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
