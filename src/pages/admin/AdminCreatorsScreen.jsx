import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Search, ShieldCheck, Video, Users, Check, Ban, Crown, Eye, Heart, Loader2 } from 'lucide-react';

export const AdminCreatorsScreen = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'paid' | 'active_uploaders'
  const [creators, setCreators] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreators = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch('/api/admin/creators', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        setTotalCount(data.totalCount || 0);
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
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterType === 'paid') return c.isPaidSubscriber;
    if (filterType === 'active_uploaders') return c.stats?.videos > 0;
    return true;
  });

  return (
    <AdminLayout title="Creator Directory & Statistics">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search creators..."
              className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              All Creators ({totalCount})
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'paid'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-amber-300 hover:text-amber-200 border border-white/5'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Paid Subscribers</span>
            </button>
            <button
              onClick={() => setFilterType('active_uploaders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'active_uploaders'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              With Uploads
            </button>
          </div>
        </div>

        <span className="text-xs text-gray-400 font-semibold">
          Database Total: {totalCount} Registered Creators & Influencers
        </span>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
          <span className="text-xs">Loading creators directory from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center text-gray-400 text-xs bg-[#130d29] rounded-3xl border border-white/10">
          <p className="font-semibold text-gray-300 mb-1">No creators matching your criteria</p>
          <p className="text-gray-500">Registered users who subscribe or upload content will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="p-4 rounded-3xl bg-[#130d29] border border-white/10 flex items-start justify-between gap-3 hover:border-pink-500/30 transition shadow-lg"
            >
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={c.avatar || '/brand/default-avatar.svg'}
                  alt={c.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <h4 className="text-xs font-bold text-white font-heading truncate">{c.name}</h4>
                    {c.isVerified && <span className="text-[#0070f3] text-xs shrink-0">✓</span>}
                  </div>
                  <span className="text-[11px] text-pink-300 block truncate">@{c.username}</span>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-2">
                    <span className="bg-white/5 px-2 py-0.5 rounded-md">
                      <strong className="text-white">{c.stats?.followers || 0}</strong> Followers
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-md">
                      <strong className="text-white">{c.stats?.videos || 0}</strong> Media
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <strong className="text-white">{c.stats?.totalViews || 0}</strong>
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-400" />
                      <strong className="text-white">{c.stats?.totalLikes || 0}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {c.isPaidSubscriber ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>{c.planName || 'Paid'}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Creator
                  </span>
                )}
                <span className="text-[9px] text-gray-500">Joined {c.joined}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
