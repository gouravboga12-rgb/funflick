import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  UserX, 
  Clock, 
  Calendar, 
  Eye, 
  Heart, 
  AlertTriangle,
  Play,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  Ban,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminCopyrightScreen = () => {
  const { copyrightReports, resolveCopyrightReport, showToast } = useApp();
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('Pending');
  const [search, setSearch] = useState('');

  // Action form state
  const [deleteVideo, setDeleteVideo] = useState(true);
  const [forfeitEarnings, setForfeitEarnings] = useState(true);
  const [suspensionTier, setSuspensionTier] = useState('3'); // '0' | '3' | '7' | 'perm'
  const [resolutionNote, setResolutionNote] = useState('');

  const filteredReports = copyrightReports.filter(rep => {
    const matchesSearch = 
      rep.reporter.toLowerCase().includes(search.toLowerCase()) ||
      rep.accused.toLowerCase().includes(search.toLowerCase()) ||
      rep.originalTitle.toLowerCase().includes(search.toLowerCase()) ||
      rep.accusedTitle.toLowerCase().includes(search.toLowerCase());

    if (filter === 'Pending') return matchesSearch && rep.status === 'Pending';
    if (filter === 'Resolved') return matchesSearch && rep.status !== 'Pending';
    return matchesSearch;
  });

  const handleOpenAction = (report) => {
    setSelectedReport(report);
    setDeleteVideo(true);
    setForfeitEarnings(true);
    setSuspensionTier('3');
    setResolutionNote('Confirmed content plagiarism without attribution. Stolen post removed and 3-day account strike applied.');
  };

  const handleApprove = () => {
    if (!selectedReport) return;
    resolveCopyrightReport(selectedReport.id, {
      action: 'approve',
      suspensionDays: parseInt(suspensionTier, 10) || 0,
      note: resolutionNote
    });
    setSelectedReport(null);
  };

  const handleReject = () => {
    if (!selectedReport) return;
    resolveCopyrightReport(selectedReport.id, {
      action: 'reject',
      note: resolutionNote || 'Dismissed: Content deemed fair use or independent creation.'
    });
    setSelectedReport(null);
  };

  const pendingCount = copyrightReports.filter(r => r.status === 'Pending').length;

  return (
    <AdminLayout title="Copyright & Anti-Plagiarism Moderation">
      {/* Intro Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-[#1b1236] border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-heading">
              Content Theft & Plagiarism Dispute Resolution
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Protect smaller and original creators. Compare original vs. accused reposts side-by-side with verified upload timestamps, enforce content takedowns, and strike copier accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-2xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Pending Claims</span>
            <strong className="font-heading">{pendingCount} Active</strong>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
            <span className="text-[10px] text-gray-400 block">Resolved Cases</span>
            <strong className="font-heading">{copyrightReports.filter(r => r.status !== 'Pending').length} Handled</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators, handles, or videos..."
            className="w-full bg-[#140e2b] text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#140e2b] p-1 rounded-2xl border border-white/10 text-xs">
          {['Pending', 'Resolved', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
                filter === f
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-white text-sm">No Pending Copyright Disputes!</p>
            <p>Platform original content integrity is 100% verified.</p>
          </div>
        ) : (
          filteredReports.map(rep => {
            const isResolved = rep.status !== 'Pending';

            return (
              <div 
                key={rep.id}
                className={`p-5 rounded-3xl bg-[#120c27] border transition shadow-xl space-y-4 ${
                  rep.status === 'Approved'
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : rep.status === 'Rejected'
                    ? 'border-white/10 opacity-70'
                    : 'border-rose-500/30'
                }`}
              >
                {/* Header status bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-300 font-mono">
                      #{rep.id}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Reported by <span className="text-pink-300">@{rep.reporterUsername}</span> against <span className="text-rose-400">@{rep.accusedUsername}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rep.date}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      rep.status === 'Pending'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : rep.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-white/10'
                    }`}>
                      {rep.status === 'Approved' ? `Approved (${rep.adminAction})` : rep.status}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Comparison Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Card: Original Content */}
                  <div className="p-4 rounded-2xl bg-[#170f33] border-2 border-emerald-500/30 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>1. Original Creator Content</span>
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono font-semibold">
                        {rep.originalUploadedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img 
                        src={rep.reporterAvatar} 
                        alt={rep.reporter} 
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                      />
                      <div>
                        <span className="font-bold text-white text-xs block">{rep.reporter}</span>
                        <span className="text-[10px] text-gray-400">@{rep.reporterUsername}</span>
                      </div>
                    </div>

                    {/* Media Preview Box */}
                    <div className="relative aspect-video rounded-xl bg-black/40 overflow-hidden border border-white/10 group">
                      <img 
                        src={rep.originalThumbnail} 
                        alt={rep.originalTitle} 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-xs font-semibold text-white truncate">{rep.originalTitle}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white flex items-center gap-2">
                        <span>{rep.originalViews} views</span>
                        <span>·</span>
                        <span>{rep.originalLikes} likes</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Card: Accused Copied Content */}
                  <div className="p-4 rounded-2xl bg-[#170f33] border-2 border-rose-500/30 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>2. Accused Stolen Repost</span>
                      </span>
                      <span className="text-[10px] text-rose-300 font-mono font-semibold">
                        {rep.accusedUploadedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img 
                        src={rep.accusedAvatar} 
                        alt={rep.accused} 
                        className="w-10 h-10 rounded-full object-cover border border-rose-500/40"
                      />
                      <div>
                        <span className="font-bold text-white text-xs block">{rep.accused}</span>
                        <span className="text-[10px] text-rose-300 font-medium">@{rep.accusedUsername}</span>
                      </div>
                    </div>

                    {/* Media Preview Box */}
                    <div className="relative aspect-video rounded-xl bg-black/40 overflow-hidden border border-white/10 group">
                      <img 
                        src={rep.accusedThumbnail} 
                        alt={rep.accusedTitle} 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-xs font-semibold text-white truncate">{rep.accusedTitle}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-rose-600/80 text-[10px] text-white font-bold flex items-center gap-2">
                        <span>{rep.accusedViews} views</span>
                        <span>·</span>
                        <span>{rep.accusedLikes} likes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chronological Evidence Strip */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-200">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">
                    ⚡ <strong>Chronological Proof:</strong> {rep.timeDifference}
                  </span>
                </div>

                {/* Complainant Explanation */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Complainant Statement:
                  </span>
                  <p className="text-gray-200 italic leading-relaxed">
                    "{rep.description}"
                  </p>
                </div>

                {/* Admin Actions */}
                {!isResolved ? (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleOpenAction(rep)}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Take Admin Action</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReport(rep);
                        handleReject();
                      }}
                      className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition"
                    >
                      Dismiss Report
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/5 text-xs text-gray-400 flex items-center justify-between">
                    <span>Resolved on {rep.resolvedAt || 'Recently'} · Action: <strong className="text-white">{rep.adminAction}</strong></span>
                    {rep.adminResolutionNote && (
                      <span className="text-pink-300 italic">"{rep.adminResolutionNote}"</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Admin Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-scrollbar">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#110b24] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4 my-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">
                    Enforce Copyright Penalties
                  </h3>
                  <p className="text-[10px] text-rose-300">Case #{selectedReport.id} · Against @{selectedReport.accusedUsername}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-full bg-white/10 text-gray-300 hover:text-white">
                ✕
              </button>
            </div>

            {/* Checklist of Actions */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-200 block">Select Enforcement Actions:</span>

              {/* Takedown Video */}
              <label className="p-3 rounded-2xl bg-[#170f33] border border-white/10 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">Takedown Stolen Content</span>
                    <span className="text-[10px] text-gray-400">Permanently delete accused post from FunFlick feed</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={deleteVideo} 
                  onChange={e => setDeleteVideo(e.target.checked)}
                  className="w-4 h-4 accent-rose-500"
                />
              </label>

              {/* Forfeit Monetization */}
              <label className="p-3 rounded-2xl bg-[#170f33] border border-white/10 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Ban className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">Forfeit Monetization & Views</span>
                    <span className="text-[10px] text-gray-400">Cancel any payout claim generated by the stolen video</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={forfeitEarnings} 
                  onChange={e => setForfeitEarnings(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>

              {/* Strike / Account Penalty */}
              <div className="p-3.5 rounded-2xl bg-[#170f33] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white block">Account Penalty Level:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSuspensionTier('0')}
                    className={`p-2 rounded-xl border text-left text-[11px] transition ${
                      suspensionTier === '0'
                        ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <span>⚠️ Warning Strike</span>
                    <span className="text-[9px] text-gray-400 block">No account lock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuspensionTier('3')}
                    className={`p-2 rounded-xl border text-left text-[11px] transition ${
                      suspensionTier === '3'
                        ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <span>🚫 3-Day Suspension</span>
                    <span className="text-[9px] text-gray-400 block">1st Strike upload ban</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuspensionTier('7')}
                    className={`p-2 rounded-xl border text-left text-[11px] transition ${
                      suspensionTier === '7'
                        ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <span>⛔ 7-Day Account Lock</span>
                    <span className="text-[9px] text-gray-400 block">Repeat offender</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuspensionTier('perm')}
                    className={`p-2 rounded-xl border text-left text-[11px] transition ${
                      suspensionTier === 'perm'
                        ? 'bg-red-700/30 border-red-500 text-red-200 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <span>💀 Permanent Ban</span>
                    <span className="text-[9px] text-gray-400 block">Deactivate account</span>
                  </button>
                </div>
              </div>

              {/* Resolution Note */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Admin Verdict & Resolution Note:
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  rows={2}
                  className="w-full bg-[#170f33] text-white text-xs p-3 rounded-2xl border border-white/10 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-bold text-xs hover:opacity-95 shadow-xl shadow-rose-500/25 transition"
              >
                Enforce Penalties
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};
