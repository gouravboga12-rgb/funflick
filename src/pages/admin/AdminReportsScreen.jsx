import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Flag, CheckCircle2, XCircle, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

export const AdminReportsScreen = () => {
  const { showToast } = useApp();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch('/api/admin/reports', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (id, action) => {
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        showToast(action === 'dismiss' ? 'Report dismissed.' : 'Content removed and report resolved! 🛡️', 'success');
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  return (
    <AdminLayout title="Content Reports & Moderation Queue">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-semibold">
          Pending Reports from Database: {reports.length}
        </span>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
            <span className="text-xs">Loading moderation queue from database...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-gray-300">All reported items have been reviewed!</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Platform community guidelines are clean.</p>
          </div>
        ) : (
          reports.map(rep => (
            <div
              key={rep.id}
              className="p-4 rounded-3xl bg-[#130d29] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-2 sm:space-y-0 shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {rep.target_type || rep.type || 'Media'}
                  </span>
                  <h4 className="text-xs font-bold text-white font-heading">{rep.targetTitle || `Target ID: ${rep.target_id}`}</h4>
                </div>
                <p className="text-xs text-rose-200/90 font-medium">
                  Reason: {rep.reason}
                </p>
                <div className="text-[10px] text-gray-400">
                  Reported by <strong className="text-gray-300">@{rep.reporter_username || rep.reporter}</strong> on {rep.date || 'Recently'}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleResolve(rep.id, 'remove')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Content</span>
                </button>
                <button
                  onClick={() => handleResolve(rep.id, 'dismiss')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition active:scale-95"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};
