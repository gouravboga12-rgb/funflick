import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Search, ShieldAlert, ShieldCheck, UserX, UserCheck, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { SuspendAccountModal } from '../../components/admin/SuspendAccountModal';

export const AdminUsersScreen = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Suspended'
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [suspendingUser, setSuspendingUser] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set('search', search.trim());
      if (statusFilter !== 'all') q.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${q.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalCount(data.totalCount || 0);
        setActiveCount(data.activeCount || 0);
        setSuspendedCount(data.suspendedCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  // Handle Search submit / debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reactivate user
  const handleReactivate = async (userId, username) => {
    if (!window.confirm(`Reactivate account @${username}? The user will regain immediate access to FunFlick.`)) return;
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        showToast(`✅ Account @${username} reactivated!`, 'success');
        fetchUsers();
      } else {
        showToast('Failed to reactivate user', 'error');
      }
    } catch (e) {
      showToast('Error reactivating user', 'error');
    }
  };

  return (
    <AdminLayout title="Registered User Accounts">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, @username, email, or phone..."
            className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'Active', label: `Active (${activeCount})` },
            { id: 'Suspended', label: `Suspended (${suspendedCount})` }
          ].map(sf => (
            <button
              key={sf.id}
              onClick={() => setStatusFilter(sf.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === sf.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#120c27] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181135] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Plan & Validity</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <span>No registered users found</span>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isSuspended = u.status === 'Suspended';
                  const untilDate = u.suspendedUntil ? new Date(u.suspendedUntil) : null;
                  const isPermanent = isSuspended && !u.suspendedUntil;

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-pink-500/20" />
                          <div>
                            <span className="font-bold text-white block">{u.name}</span>
                            <span className="text-[10px] text-pink-300">@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="text-gray-300 block">{u.email}</span>
                          <span className="text-[10px] text-gray-400">{u.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            u.isSubscriptionActive
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-white/5 text-gray-400'
                          }`}>
                            {u.subscription}
                          </span>
                          {u.subscriptionExpiresAt && (
                            <span className="text-[10px] text-gray-400 block">
                              Exp: {new Date(u.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white font-heading">{u.wallet}</td>
                      <td className="py-3.5 px-4 text-gray-400">{u.joined}</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isSuspended ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {isSuspended ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                          </span>

                          {isSuspended && (
                            <span className="text-[10px] text-rose-400 block">
                              {isPermanent ? 'Permanent' : `Until ${untilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuspended ? (
                          <button
                            onClick={() => handleReactivate(u.id, u.username)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition inline-flex items-center gap-1"
                            title="Reactivate user immediately"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendingUser({ id: u.id, name: u.name, username: u.username })}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition inline-flex items-center gap-1"
                            title="Suspend user with duration"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Account Modal */}
      {suspendingUser && (
        <SuspendAccountModal
          isOpen={!!suspendingUser}
          onClose={() => setSuspendingUser(null)}
          user={suspendingUser}
          onSuccess={() => {
            showToast(`User @${suspendingUser.username} suspended successfully`, 'success');
            setSuspendingUser(null);
            fetchUsers();
          }}
        />
      )}
    </AdminLayout>
  );
};
