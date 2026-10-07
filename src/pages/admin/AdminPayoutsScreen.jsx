import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
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
  Loader2,
  Receipt,
  Printer,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const AdminPayoutsScreen = () => {
  const { showToast } = useApp();
  const [creators, setCreators] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('VIP Paid Creators');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCreatorId, setExpandedCreatorId] = useState(null);

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

  const handlePrintHistoricalVoucher = (creator, voucher) => {
    const w = window.open('', '_blank', 'width=640,height=760');
    if (!w) return;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const d = creator.payoutDetails;
    const dest = d ? (d.account_number ? `${d.bank_name} • ${d.account_number} • ${d.ifsc_code}` : d.upi_id) : 'Registered contact';
    const rows = [
      ['Voucher ID', `#${voucher.id}`],
      ['Date', voucher.date],
      ['Creator', `${creator.name} (@${creator.username})`],
      ['Disbursed Amount', `₹${Number(voucher.amount).toLocaleString('en-IN')}`],
      ['Method', voucher.method],
      ['UTR / Reference', voucher.reference],
      ...(voucher.videoTitle ? [
        ['Associated Video', voucher.videoTitle],
        ['Milestone Settled', voucher.settledViews ? `${Number(voucher.settledViews).toLocaleString('en-IN')} views` : 'General']
      ] : []),
      ['Account Destination', dest],
      ['Audit Note', voucher.notes || '—']
    ];
    w.document.write(`<!doctype html><html><head><title>FunFlick Voucher #${esc(voucher.id)}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin:0 0 4px}
      p{color:#666;font-size:12px;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:13px}
      td{padding:10px;border-bottom:1px solid #eee}td:first-child{color:#666;width:38%}
      .f{margin-top:28px;font-size:11px;color:#888}</style></head><body>
      <h1>FunFlick — Official Payout Voucher</h1><p>Platform Accounting Record. Funds disbursed externally.</p>
      <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
      <div class="f">Generated: ${esc(new Date().toLocaleString('en-IN'))}</div>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
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
    <AdminLayout title="Creator Disbursal Ledger & Audit Trail">
      {/* Intro banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-[#1b1236] border border-pink-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-heading">
              Creator Disbursal Ledger & Audit History
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-pink-400" />
              <span>Official Accounting Ledger</span>
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            Read-only financial audit trail of all disbursed platform funds, UTR bank references, and creator accounts. To disburse rewards for specific videos, go to <a href="/admin/influencer-media" className="text-pink-300 font-bold underline hover:text-pink-200">Influencer Media & Rewards</a>.
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
                <th className="py-3.5 px-4 text-right">Audit Slips</th>
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
                    <React.Fragment key={creator.id}>
                    <tr className="hover:bg-white/5 transition">
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
                        {creator.payoutHistory && creator.payoutHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedCreatorId(expandedCreatorId === creator.id ? null : creator.id)}
                            className="mt-1 text-[10px] text-pink-300 hover:text-pink-200 font-bold underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{creator.payoutHistory.length} voucher{creator.payoutHistory.length === 1 ? '' : 's'}</span>
                            <span>{expandedCreatorId === creator.id ? '▴' : '▾'}</span>
                          </button>
                        )}
                      </td>

                      {/* Audit Slips Action */}
                      <td className="py-3.5 px-4 text-right">
                        {creator.payoutHistory && creator.payoutHistory.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedCreatorId(expandedCreatorId === creator.id ? null : creator.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 font-bold text-xs border border-pink-500/30 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <Receipt className="w-3.5 h-3.5 text-pink-400" />
                            <span>{expandedCreatorId === creator.id ? 'Hide Vouchers ▴' : `View Vouchers (${creator.payoutHistory.length}) ▾`}</span>
                          </button>
                        ) : (
                          <a
                            href="/admin/influencer-media"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-pink-300 text-xs font-semibold border border-white/10 transition cursor-pointer"
                            title="Reward this creator's videos on the Influencer Media page"
                          >
                            <span>Reward Videos</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                    {expandedCreatorId === creator.id && creator.payoutHistory && creator.payoutHistory.length > 0 && (
                      <tr key={`history-${creator.id}`} className="bg-black/40 border-b border-white/10">
                        <td colSpan={5} className="p-4">
                          <div className="bg-[#0f0921] rounded-2xl p-3 border border-pink-500/20 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-pink-300">
                              <span>Historical Disbursal Audit Trail (@{creator.username})</span>
                              <span className="text-gray-400 font-normal text-[11px]">{creator.payoutHistory.length} record(s)</span>
                            </div>
                            <div className="divide-y divide-white/5 text-[11px]">
                              {creator.payoutHistory.map(h => (
                                <div key={h.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-emerald-400 font-heading">₹{Number(h.amount).toLocaleString()}</span>
                                      <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-gray-300">{h.method}</span>
                                      <span className="font-mono text-gray-400 text-[10px]">Ref: {h.reference}</span>
                                    </div>
                                    {h.videoTitle && (
                                      <div className="text-[10px] text-cyan-300">
                                        Video: "{h.videoTitle}" {h.settledViews ? `· Settled ${Number(h.settledViews).toLocaleString()} views` : ''}
                                      </div>
                                    )}
                                    {h.notes && <div className="text-[10px] text-gray-400 italic">Note: {h.notes}</div>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 font-mono">{h.date}</span>
                                    <button
                                      type="button"
                                      onClick={() => handlePrintHistoricalVoucher(creator, h)}
                                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                      title="Print voucher slip"
                                    >
                                      <Printer className="w-3 h-3 text-pink-400" />
                                      <span>Print Slip</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
