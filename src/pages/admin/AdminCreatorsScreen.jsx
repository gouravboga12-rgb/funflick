import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { PayoutModal } from '../../components/admin/PayoutModal';
import { 
  Search, 
  ShieldCheck, 
  Video, 
  Crown, 
  Eye, 
  Heart, 
  Loader2, 
  DollarSign, 
  Building2, 
  Smartphone, 
  History, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const AdminCreatorsScreen = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'influencer' | 'has_details'
  const [creators, setCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreatorForPayout, setSelectedCreatorForPayout] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const fetchCreators = async () => {
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
      console.error('Failed to fetch admin creators:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const filtered = creators.filter(c => {
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) || 
      (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));
    
    if (!matchesSearch) return false;
    if (filterType === 'influencer') return c.isInfluencer;
    if (filterType === 'has_details') return c.hasPayoutDetails;
    return true;
  });

  return (
    <AdminLayout title="Creator & Influencer Hub">
      <div className="flex flex-col gap-4">
        {/* Top Header & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by creator name, @username, or phone..."
              className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              All Creators ({creators.length})
            </button>
            <button
              onClick={() => setFilterType('influencer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                filterType === 'influencer'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white/5 text-amber-300 hover:text-amber-200 border border-white/5'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Influencers Pro</span>
            </button>
            <button
              onClick={() => setFilterType('has_details')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                filterType === 'has_details'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-purple-300 hover:text-purple-200 border border-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>With Bank / UPI</span>
            </button>
          </div>
        </div>

        {/* Creator List Grid */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400 bg-[#120c27] rounded-3xl border border-white/10">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
            <span className="text-xs">Loading creators & payout profiles from AWS MySQL...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-xs bg-[#130d29] rounded-3xl border border-white/10">
            <p className="font-semibold text-gray-300 mb-1">No creators matching your filter</p>
            <p className="text-gray-500">Registered creators who upload videos or subscribe will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map(c => {
              const details = c.payoutDetails || {};
              const isExpanded = expandedHistoryId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-3xl bg-[#130d29] border border-white/10 hover:border-pink-500/30 transition shadow-xl space-y-4 flex flex-col justify-between"
                >
                  {/* Top: Avatar, Name, Subscription Status, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={c.avatar || '/brand/default-avatar.svg'}
                        alt={c.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-pink-500/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-sm font-bold text-white font-heading truncate">{c.name}</h4>
                          <span className="text-[#0070f3] text-xs shrink-0">✓</span>
                        </div>
                        <span className="text-xs text-pink-300 block truncate">@{c.username}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{c.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        c.isInfluencer
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-white/10 text-gray-300'
                      }`}>
                        {c.isInfluencer ? <Crown className="w-3 h-3 text-amber-400" /> : <Sparkles className="w-3 h-3" />}
                        <span>{c.subscriptionPlan}</span>
                      </span>

                      <button
                        onClick={() => setSelectedCreatorForPayout(c)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Payout</span>
                      </button>
                    </div>
                  </div>

                  {/* Creator Stats */}
                  <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-white/5 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Uploads</span>
                      <strong className="text-white font-bold">{c.postsCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Total Views</span>
                      <strong className="text-cyan-300 font-bold">{c.totalViews.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Total Likes</span>
                      <strong className="text-pink-300 font-bold">{c.totalLikes.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Total Paid</span>
                      <strong className="text-emerald-400 font-bold font-mono">₹{c.totalPaidAmount.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Bank / UPI / Contact Details Box */}
                  <div className="p-3 bg-black/30 border border-white/5 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 font-semibold flex items-center gap-1">
                        {details.payout_type === 'upi' ? <Smartphone className="w-3 h-3 text-purple-400" /> : <Building2 className="w-3 h-3 text-blue-400" />}
                        <span>Payout Target:</span>
                      </span>

                      {c.hasPayoutDetails ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Bank/UPI on file</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold text-[10px]">
                          Registered phone on file
                        </span>
                      )}
                    </div>

                    {details.payout_type === 'upi' && details.upi_id ? (
                      <div className="font-mono text-purple-300 text-xs">
                        UPI: {details.upi_id}
                      </div>
                    ) : details.account_number ? (
                      <div className="font-mono text-gray-200 text-[11px] space-y-0.5">
                        <div>Bank: {details.bank_name || 'Bank Account'}</div>
                        <div>A/C: ••••{details.account_number.slice(-4)} | IFSC: {details.ifsc_code}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-[11px]">
                        Contact: {c.phone || details.contact_phone || 'Phone on profile'} | {c.email}
                      </div>
                    )}
                  </div>

                  {/* Payout History Toggle */}
                  {c.payoutHistory && c.payoutHistory.length > 0 && (
                    <div className="pt-1 border-t border-white/5">
                      <button
                        onClick={() => setExpandedHistoryId(isExpanded ? null : c.id)}
                        className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-white transition"
                      >
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3 text-pink-400" />
                          <span>Payout History ({c.payoutHistory.length} transactions)</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          {c.payoutHistory.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] pb-1 border-b border-white/5 last:border-none">
                              <div>
                                <span className="font-mono font-bold text-emerald-400">₹{Number(p.amount).toLocaleString()}</span>
                                <span className="text-gray-400 ml-2">via {p.method}</span>
                              </div>
                              <div className="text-right text-[10px] text-gray-400">
                                <span>{p.date}</span>
                                {p.reference && <span className="block font-mono text-[9px] text-gray-500">{p.reference}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {selectedCreatorForPayout && (
        <PayoutModal
          creator={selectedCreatorForPayout}
          isOpen={!!selectedCreatorForPayout}
          onClose={() => setSelectedCreatorForPayout(null)}
          onPaidSuccess={() => {
            fetchCreators();
            setSelectedCreatorForPayout(null);
          }}
        />
      )}
    </AdminLayout>
  );
};
