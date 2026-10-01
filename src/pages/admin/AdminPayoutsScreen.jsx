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
  AlertCircle 
} from 'lucide-react';

export const AdminPayoutsScreen = () => {
  const { adminPayouts } = useApp();
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [historyPayout, setHistoryPayout] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredPayouts = adminPayouts.filter(p => {
    const matchesSearch = p.creator.toLowerCase().includes(search.toLowerCase()) || p.postTitle.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Paid') return matchesSearch && p.status === 'Paid';
    if (filter === 'Pending') return matchesSearch && p.status === 'Partially Paid';
    return matchesSearch;
  });

  return (
    <AdminLayout title="Creator Payouts Management">
      {/* Intro banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white font-heading">
            Creator Earnings & Video Performance Payouts
          </h2>
          <p className="text-xs text-gray-300 mt-0.5">
            Admin reviews top-performing creator reels and disburses view-based performance bonuses directly to creator wallets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Total Pending: ₹6,000
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creator or video..."
            className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#140e2b] p-1 rounded-2xl border border-white/10 text-xs">
          {['All', 'Pending', 'Paid'].map(f => (
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
                <th className="py-3.5 px-4">Creator</th>
                <th className="py-3.5 px-4">Post / Video</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Approved</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Remaining</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {filteredPayouts.map(payout => (
                <tr key={payout.id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={payout.creatorAvatar}
                        alt={payout.creator}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <span className="font-bold text-white">{payout.creator}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-pink-300">{payout.postTitle}</span>
                    <span className="text-[10px] text-gray-400 block">{payout.postDate}</span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-gray-300">
                    {payout.views}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-white font-heading">
                    ₹{payout.approvedAmount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-emerald-400 font-heading">
                    ₹{payout.paidAmount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-amber-300 font-heading">
                    ₹{payout.remainingAmount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                      payout.status === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {payout.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payout.remainingAmount > 0 ? (
                        <button
                          onClick={() => setSelectedPayout(payout)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Payment</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Fully Paid</span>
                        </span>
                      )}

                      {payout.paymentHistory?.length > 0 && (
                        <button
                          onClick={() => setHistoryPayout(payout)}
                          title="View Disbursed History"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Payment Modal (Section 36) */}
      <PayoutModal
        payout={selectedPayout}
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />

      {/* Payment History View Modal */}
      {historyPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#130d29] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-white text-sm font-heading">
              Disbursement Log: {historyPayout.postTitle}
            </h3>
            <div className="space-y-2">
              {historyPayout.paymentHistory.map(ph => (
                <div key={ph.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-400 block">+₹{ph.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400">{ph.method} · {ph.ref}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{ph.date}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setHistoryPayout(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
