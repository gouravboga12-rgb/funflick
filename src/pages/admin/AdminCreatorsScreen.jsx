import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Search, ShieldCheck, Video, Users, Check, Ban } from 'lucide-react';

export const AdminCreatorsScreen = () => {
  const { creators, showToast } = useApp();
  const [search, setSearch] = useState('');

  const filtered = creators.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Creator Directory & Approvals">
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
        <span className="text-xs text-gray-400 font-semibold">
          1,830 Total Registered Creators
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => (
          <div
            key={c.id}
            className="p-4 rounded-3xl bg-[#130d29] border border-white/10 flex items-start justify-between gap-3 hover:border-pink-500/30 transition"
          >
            <div className="flex items-start gap-3">
              <img
                src={c.avatar}
                alt={c.name}
                className="w-12 h-12 rounded-2xl object-cover border border-white/10"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white font-heading">{c.name}</h4>
                  {c.isVerified && <span className="text-[#0070f3] text-xs">✓</span>}
                </div>
                <span className="text-[11px] text-pink-300">@{c.username}</span>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2">
                  <span><strong>{c.stats?.followers}</strong> Followers</span>
                  <span><strong>{c.stats?.subscribers}</strong> Subs</span>
                  <span><strong>{c.stats?.videos}</strong> Clips</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified
              </span>
              <button
                onClick={() => showToast(`Creator settings updated for @${c.username}`, 'info')}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};
