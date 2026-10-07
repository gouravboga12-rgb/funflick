import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { 
  Flag, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ShieldAlert, 
  Loader2, 
  UserX, 
  Eye, 
  AlertTriangle, 
  ExternalLink,
  Film,
  Image,
  X,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminReportsScreen = () => {
  const { showToast } = useApp();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [previewMedia, setPreviewMedia] = useState(null);
  const [confirmSuspendReport, setConfirmSuspendReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleResolve = async (id, action, suspendReason = '') => {
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, suspendReason })
      });
      const data = await res.json();
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (action === 'dismiss') {
          showToast('Report dismissed. Content kept online.', 'info');
        } else if (action === 'suspend_user') {
          showToast('Content deleted & creator account permanently suspended! 🛡️', 'success');
        } else {
          showToast('Violating content deleted & report resolved! 🗑️', 'success');
        }
      } else {
        showToast(data.error || 'Action failed', 'error');
      }
    } catch (err) {
      console.error('Resolve report error:', err);
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setConfirmSuspendReport(null);
    }
  };

  const filteredReports = reports.filter(r => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'COPYRIGHT') return (r.reason || '').toLowerCase().includes('copyright') || (r.reason || '').toLowerCase().includes('intellectual');
    if (activeFilter === 'INAPPROPRIATE') return (r.reason || '').toLowerCase().includes('inappropriate') || (r.reason || '').toLowerCase().includes('vulgar');
    if (activeFilter === 'HARASSMENT') return (r.reason || '').toLowerCase().includes('harassment') || (r.reason || '').toLowerCase().includes('dangerous');
    return true;
  });

  return (
    <AdminLayout title="Content Reports & Moderation Queue">
      {/* Intro Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-[#1b1236] border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-heading">
              Live Content Moderation & Abuse Reports
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {reports.length} Pending
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Review user-flagged reels, photos, and copyright complaints. Review media side-by-side, decide whether to keep or delete content, or permanently suspend repeat offender creator accounts.
          </p>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#140e2b] p-1 rounded-2xl border border-white/10 text-xs self-stretch sm:self-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: `All (${reports.length})` },
            { id: 'COPYRIGHT', label: 'Copyright' },
            { id: 'INAPPROPRIATE', label: 'Vulgar / NSFW' },
            { id: 'HARASSMENT', label: 'Harassment' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
            <span className="text-xs">Loading moderation queue from database...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
            <h4 className="font-bold text-sm text-gray-200">All reported items have been reviewed!</h4>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto">
              {activeFilter !== 'ALL' 
                ? 'No pending reports in this category. Select "All" to view any other queued reports.' 
                : 'Zero pending reports in MySQL database. Platform community guidelines are clean.'}
            </p>
          </div>
        ) : (
          filteredReports.map(rep => (
            <div
              key={rep.id}
              className="p-4 sm:p-5 rounded-3xl bg-[#130d29] border border-rose-500/20 hover:border-rose-500/40 transition shadow-xl space-y-4"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                
                {/* Left: Media Thumbnail + Title + Reason */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Thumbnail */}
                  <div 
                    onClick={() => rep.mediaUrl && setPreviewMedia(rep)}
                    className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-black/50 shrink-0 border border-white/10 group cursor-pointer"
                    title="Click to preview content"
                  >
                    {rep.thumbnailUrl ? (
                      <img
                        src={rep.thumbnailUrl}
                        alt={rep.targetTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Play className="w-6 h-6 fill-white" />
                    </div>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-rose-300">
                      {rep.type}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Report #{rep.id}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white font-heading truncate">
                        {rep.targetTitle}
                      </h4>
                    </div>

                    {/* Reason Highlight */}
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                        Reported Reason
                      </span>
                      <p className="text-white font-semibold mt-0.5">
                        {rep.reason}
                      </p>
                      {rep.details && (
                        <p className="text-[11px] text-gray-300 mt-1 italic">
                          "{rep.details}"
                        </p>
                      )}
                    </div>

                    {/* Reporter & Offending Creator Info */}
                    <div className="flex items-center gap-4 text-[11px] text-gray-400 flex-wrap pt-1">
                      <div>
                        Reported by: <strong className="text-gray-200">@{rep.reporter}</strong>
                      </div>
                      <span>•</span>
                      <div>
                        Creator: <strong className="text-pink-300">@{rep.creatorUsername}</strong>
                        {rep.creatorStatus === 'Suspended' && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 text-[9px] font-bold">
                            Account Suspended
                          </span>
                        )}
                      </div>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{rep.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Decision Actions */}
                <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                  {/* Keep Content / Dismiss */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleResolve(rep.id, 'dismiss')}
                    className="flex-1 lg:flex-none lg:w-48 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    title="Dismiss report as non-violating"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Keep Content (Dismiss)</span>
                  </button>

                  {/* Delete Content */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleResolve(rep.id, 'remove')}
                    className="flex-1 lg:flex-none lg:w-48 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    title="Permanently remove violating video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Content</span>
                  </button>

                  {/* Delete Content & Suspend Account */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setConfirmSuspendReport(rep)}
                    className="w-full lg:w-48 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-950 via-rose-950 to-red-900 hover:from-red-900 hover:to-rose-800 border border-rose-500/40 text-rose-200 hover:text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    title="Delete content and permanently suspend creator account"
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete &amp; Suspend User</span>
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Media Inspection Lightbox Modal */}
      <AnimatePresence>
        {previewMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#140e2b] border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-heading">{previewMedia.targetTitle}</h3>
                  <p className="text-[10px] text-gray-400">By @{previewMedia.creatorUsername}</p>
                </div>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1 rounded-full bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Media viewer */}
              <div className="w-full max-h-[60vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {previewMedia.mediaUrl?.match(/\.(mp4|webm|mov)($|\?)/i) || previewMedia.targetType === 'Video' ? (
                  <video
                    src={previewMedia.mediaUrl}
                    controls
                    autoPlay
                    className="max-h-[55vh] w-auto max-w-full rounded-xl"
                  />
                ) : (
                  <img
                    src={previewMedia.mediaUrl || previewMedia.thumbnailUrl}
                    alt={previewMedia.targetTitle}
                    className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl"
                  />
                )}
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs">
                <span className="text-rose-400 font-bold block text-[10px]">REPORTED REASON:</span>
                <span className="text-white font-medium">{previewMedia.reason}</span>
                {previewMedia.details && <p className="text-gray-300 text-[11px] mt-0.5">{previewMedia.details}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal: Delete Content & Suspend Creator Account */}
      <AnimatePresence>
        {confirmSuspendReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#160a22] border border-rose-500/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
                <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">Suspend Creator &amp; Delete Content</h3>
                  <span className="text-[10px] text-rose-300">Action cannot be undone automatically</span>
                </div>
              </div>

              <p className="text-xs text-gray-200 leading-relaxed">
                You are about to permanently delete the content <strong className="text-white">"{confirmSuspendReport.targetTitle}"</strong> and suspend the account of creator <strong className="text-pink-400">@{confirmSuspendReport.creatorUsername}</strong>.
              </p>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
                <div className="text-[10px] text-gray-400">Violation Reason:</div>
                <div className="font-semibold text-rose-300">{confirmSuspendReport.reason}</div>
                {confirmSuspendReport.details && (
                  <div className="text-[11px] text-gray-300 italic">{confirmSuspendReport.details}</div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setConfirmSuspendReport(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleResolve(confirmSuspendReport.id, 'suspend_user')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                  <span>Confirm Delete &amp; Suspend</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
