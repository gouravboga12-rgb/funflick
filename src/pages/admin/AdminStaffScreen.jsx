import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  X, 
  Key, 
  Mail, 
  User, 
  Search,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const AdminStaffScreen = () => {
  const { showToast, theme } = useApp();
  const isLight = theme === 'light';

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'moderator'
  });

  const fetchStaff = async () => {
    setLoading(true);
    const token = localStorage.getItem('funflick_admin_token');
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.staff) {
        setStaffList(data.staff);
      } else {
        showToast(data.error || 'Failed to load staff accounts', 'error');
      }
    } catch (e) {
      showToast('Error connecting to staff API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('funflick_admin_token');
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Moderator @${formData.username} created successfully!`, 'success');
        setIsAddModalOpen(false);
        setFormData({ name: '', username: '', email: '', password: '', role: 'moderator' });
        fetchStaff();
      } else {
        showToast(data.error || 'Failed to create staff account', 'error');
      }
    } catch (e) {
      showToast('Network error creating staff member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id, username) => {
    if (!window.confirm(`Permanently remove moderator @${username}? This action cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('funflick_admin_token');
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Staff member @${username} removed`, 'info');
        setStaffList(prev => prev.filter(s => s.id !== id));
      } else {
        showToast(data.error || 'Failed to delete staff member', 'error');
      }
    } catch (e) {
      showToast('Error deleting staff member', 'error');
    }
  };

  const handleToggleActive = async (id, username) => {
    const token = localStorage.getItem('funflick_admin_token');
    try {
      const res = await fetch(`/api/admin/staff/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Status updated for @${username}`, 'success');
        setStaffList(prev => prev.map(s => s.id === id ? { ...s, active: data.active } : s));
      } else {
        showToast(data.error || 'Failed to toggle status', 'error');
      }
    } catch (e) {
      showToast('Error toggling status', 'error');
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Staff & Moderator Management">
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-[#120a24] border border-pink-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold text-white font-heading">
                Moderator & Staff Accounts
              </h2>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-xl">
              Create and manage content review staff. Staff with the <strong>moderator</strong> role can only access: 
              <span className="text-pink-400 font-semibold"> Ads Requests, Active Ads, Content Moderation, Story Moderation, and Reports</span>. All financial and configuration settings are restricted.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Moderator</span>
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, handle, or email..."
              className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#120a24] border-white/10 text-white'
              } focus:outline-none focus:border-pink-500`}
            />
          </div>

          <div className="text-xs font-semibold text-gray-400">
            Total Staff: <strong className="text-white">{staffList.length}</strong>
          </div>
        </div>

        {/* Staff Table */}
        <div className={`rounded-3xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0f091f] border-white/10'
        }`}>
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Loading staff accounts...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-xs font-bold text-white">No moderator accounts found</p>
              <p className="text-[11px] text-gray-400">Click "Create Moderator" above to add your first staff member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`text-[10px] uppercase font-bold tracking-wider border-b ${
                  isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-white/5 text-gray-400 border-white/10'
                }`}>
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Allowed Sections</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                  {filteredStaff.map(staff => (
                    <tr key={staff.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                            {(staff.name || staff.username || 'M').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{staff.name || 'Moderator'}</span>
                            <span className="text-[11px] text-pink-400 font-semibold">@{staff.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {staff.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-gray-400">
                        Ads Requests, Active Ads, Content, Stories, Reports
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(staff.id, staff.username)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition ${
                            staff.active !== false
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                          }`}
                        >
                          {staff.active !== false ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteStaff(staff.id, staff.username)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Moderator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#120a24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">Create Moderator Account</h3>
                  <p className="text-[10px] text-gray-400">Staff members log in via /admin/login</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl bg-[#181033] border border-white/10 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Username (Login Handle)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    placeholder="moderator1"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl bg-[#181033] border border-white/10 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="staff@funflick.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl bg-[#181033] border border-white/10 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl bg-[#181033] border border-white/10 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-gray-300 space-y-1">
                <span className="font-bold text-pink-400 block">Assigned Permissions:</span>
                <p>• Ads Requests Review</p>
                <p>• Active Ads List</p>
                <p>• Video / Reel Content Moderation</p>
                <p>• Story Moderation</p>
                <p>• User Reports Desk</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating Staff Member...' : 'Create Moderator Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
