import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Search, ShieldAlert, ShieldCheck, MoreVertical, Ban, CheckCircle2, Loader2 } from 'lucide-react';

export const AdminUsersScreen = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (userId) => {
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: data.status } : u));
        showToast(data.message || 'Status updated', 'success');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const filtered = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
    (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
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
          Total Registered Users: {totalCount}
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto mb-2" />
                    <span>Loading registered users from database...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <span>No registered users found</span>
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
