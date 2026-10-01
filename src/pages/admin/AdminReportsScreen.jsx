import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ADMIN_REPORTS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { Flag, CheckCircle2, XCircle, Trash2, ShieldAlert } from 'lucide-react';

export const AdminReportsScreen = () => {
  const { showToast } = useApp();
  const [reports, setReports] = useState(ADMIN_REPORTS);

  const handleResolve = (id, action) => {
    setReports(prev => prev.filter(r => r.id !== id));
    showToast(action === 'dismiss' ? 'Report dismissed.' : 'Content removed and report resolved! 🛡️', 'success');
  };

  return (
    <AdminLayout title="Content Reports & Moderation Queue">
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p>All reported items have been reviewed! Platform community guidelines are clean.</p>
          </div>
        ) : (
          reports.map(rep => (
            <div
              key={rep.id}
              className="p-4 rounded-3xl bg-[#130d29] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-2 sm:space-y-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {rep.type}
                  </span>
                  <h4 className="text-xs font-bold text-white font-heading">{rep.targetTitle}</h4>
                </div>
                <p className="text-xs text-rose-200/90 font-medium">
                  Reason: {rep.reason}
                </p>
                <div className="text-[10px] text-gray-400">
                  Reported by <strong className="text-gray-300">@{rep.reporter}</strong> on {rep.date}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleResolve(rep.id, 'remove')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Content</span>
                </button>
                <button
                  onClick={() => handleResolve(rep.id, 'dismiss')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition"
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
