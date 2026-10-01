import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Search, ShieldAlert, ShieldCheck, MoreVertical, Ban, CheckCircle2 } from 'lucide-react';

export const AdminUsersScreen = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  
  const [users, setUsers] = useState([
    { id: 'u1', name: 'Srilatha Reddy', username: 'srilatha_16', email: 'srilatha@funflick.com', subscription: 'Monthly (₹199)', wallet: '₹1,25,430', joined: '12 Jan 2026', status: 'Active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
    { id: 'u2', name: 'Rahul Sharma', username: 'rahul_vibe', email: 'rahul@gmail.com', subscription: 'None', wallet: '₹450', joined: '04 Feb 2026', status: 'Active', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' },
    { id: 'u3', name: 'Sneha Patel', username: 'sneha_laughs', email: 'sneha@yahoo.com', subscription: 'Yearly (₹699)', wallet: '₹3,800', joined: '18 Dec 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
    { id: 'u4', name: 'Kiran Kumar', username: 'kiran_k', email: 'kiran.k@rediff.com', subscription: 'None', wallet: '₹0', joined: '22 Mar 2026', status: 'Suspended', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80' }
  ]);

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        showToast(`User @${u.username} marked as ${nextStatus}`, 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="User Management">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>
        <span className="text-xs text-gray-400 font-semibold">
          Total Registered Users: 12,540
        </span>
      </div>

      <div className="bg-[#120c27] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181135] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Publishing Plan</th>
                <th className="py-3.5 px-4">Wallet</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-[10px] text-pink-300">@{u.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.subscription.includes('None') ? 'bg-white/5 text-gray-400' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    }`}>
                      {u.subscription}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white font-heading">{u.wallet}</td>
                  <td className="py-3.5 px-4 text-gray-400">{u.joined}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        u.status === 'Active'
                          ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {u.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
