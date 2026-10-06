import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { AdminVideoPlayer } from '../../components/admin/AdminVideoPlayer';
import { 
  Play, 
  Check, 
  X, 
  RotateCcw,
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  MapPin, 
  Users, 
  Music2, 
  ExternalLink,
  Clock,
  Filter,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const AdminContentScreen = () => {
  const { showToast, fetchAdminStats } = useApp();
  const [tab, setTab] = useState('Pending'); // 'Pending' | 'Approved' | 'Rejected' | 'All'
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Reel' | 'Video' | 'Photo' | 'Post'
  
  // Inspection / Preview Modal
  const [previewItem, setPreviewItem] = useState(null);
  const [isProcessingId, setIsProcessingId] = useState(null);

  // Fetch real content from backend based on selected tab
  const fetchContent = async (selectedTab = tab) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const statusParam = selectedTab === 'All' ? 'all' : selectedTab;
      const res = await fetch(`/api/admin/content?status=${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content && Array.isArray(data.content)) {
          setContentList(data.content);
        }
      } else {
        // Fallback for pending
        if (selectedTab === 'Pending') {
          const fallbackRes = await fetch('/api/admin/content/pending', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            setContentList(fbData.pending || []);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching content for moderation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(tab);
  }, [tab]);

  // Handle Approve, Reject, or Reopen
  const handleModerate = async (itemId, action) => {
    setIsProcessingId(itemId);
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch(`/api/admin/content/${itemId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, itemType: 'video' })
      });

      if (res.ok) {
        const data = await res.json();
        const actionLabel = action === 'approve' 
          ? 'Approved & Published Live' 
          : action === 'reject' 
            ? 'Rejected' 
            : 'Reopened for Review';
        showToast(`✅ Content status updated: ${actionLabel}!`, 'success');

        // Update local list immediately
        setContentList(prev => prev.map(item => {
          if (item.id === itemId) {
            const nextStatus = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Pending';
            return { ...item, status: nextStatus };
          }
          return item;
        }));

        if (previewItem && previewItem.id === itemId) {
          const nextStatus = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Pending';
          setPreviewItem(prev => ({ ...prev, status: nextStatus }));
        }

        // Refresh stats & list
        if (fetchAdminStats) fetchAdminStats();
        setTimeout(() => fetchContent(tab), 500);
      } else {
        showToast('Failed to update content status', 'error');
      }
    } catch (err) {
      console.error('Moderation error:', err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Filter list by display type if selected
  const displayedContent = contentList.filter(item => {
    if (typeFilter === 'All') return true;
    return item.displayType?.toLowerCase() === typeFilter.toLowerCase();
  });

  const pendingCount = contentList.filter(c => c.status === 'Pending').length;

  return (
    <AdminLayout title="Content Moderation Desk">
      {/* Policy & Status Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/70 via-pink-950/40 to-[#170e30] border border-pink-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-wider">
              Verification Engine
            </span>
            <span className="text-xs text-gray-400">AWS S3 Media Inspection</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-white font-heading">
            Permanent Media Quality & Moderation Desk
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
            Review uploaded videos, reels, photos, and posts prior to public broadcasting. Verify the actual AWS S3 source file, inspect metadata, approve for publishing, or reject violating content. Reopen any record at any time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchContent(tab)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-pink-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Type Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Status Tabs: Pending -> Approved / Published -> Rejected -> All */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'Pending', label: 'Pending Verification' },
            { id: 'Approved', label: 'Approved / Published' },
            { id: 'Rejected', label: 'Rejected' },
            { id: 'All', label: 'All Records' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{t.label}</span>
              {t.id === 'Pending' && pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-extrabold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Type Filter */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] text-gray-400">Type:</span>
          {['All', 'Reel', 'Video', 'Photo', 'Post'].map(ft => (
            <button
              key={ft}
              onClick={() => setTypeFilter(ft)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
                typeFilter === ft
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Content Stream */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5 space-y-3">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto" />
          <p className="font-semibold text-gray-300">Loading media records from AWS MySQL database...</p>
        </div>
      ) : displayedContent.length === 0 ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">No content in "{tab}" queue</h4>
          <p className="text-gray-400">
            {tab === 'Pending'
              ? 'All submitted videos, reels, photos, and posts have been moderated!'
              : `No items currently marked with status "${tab}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedContent.map(item => {
            const isVideo = item.contentType === 'video' || item.displayType === 'Reel' || item.displayType === 'Video';
            const isPending = item.status === 'Pending';
            const isApproved = item.status === 'Approved';
            const isRejected = item.status === 'Rejected';
            const isProcessing = isProcessingId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-[#120c27] border border-white/10 hover:border-pink-500/30 transition shadow-lg flex flex-col justify-between space-y-3"
              >
                {/* Media Preview Box */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/5">
                  {isVideo ? (
                    <AdminVideoPlayer
                      src={item.mediaUrl}
                      poster={item.thumbnail}
                      compact={true}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl || item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition"
                      onClick={() => setPreviewItem(item)}
                    />
                  )}

                  {/* Format Badge (Video / Reel / Photo / Post) */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md shadow flex items-center gap-1 ${
                      item.displayType === 'Reel'
                        ? 'bg-purple-600/90 text-white'
                        : item.displayType === 'Video'
                          ? 'bg-blue-600/90 text-white'
                          : item.displayType === 'Photo'
                            ? 'bg-pink-600/90 text-white'
                            : 'bg-emerald-600/90 text-white'
                    }`}>
                      {item.displayType === 'Reel' && '🎬 Reel'}
                      {item.displayType === 'Video' && '📹 Video'}
                      {item.displayType === 'Photo' && '📸 Photo'}
                      {item.displayType === 'Post' && '📝 Post'}
                    </span>

                    {item.duration > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-black/80 text-gray-200">
                        {Math.floor(item.duration)}s
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md flex items-center gap-1 ${
                      isPending
                        ? 'bg-amber-500/90 text-black font-extrabold'
                        : isApproved
                          ? 'bg-emerald-600/90 text-white font-extrabold'
                          : 'bg-rose-600/90 text-white font-extrabold'
                    }`}>
                      {isPending && '⏳ Pending Review'}
                      {isApproved && '✓ Approved & Live'}
                      {isRejected && '✕ Rejected'}
                    </span>
                  </div>
                </div>

                {/* Creator Details & Metadata */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.avatar || '/brand/default-avatar.svg'}
                        alt={item.creator}
                        className="w-7 h-7 rounded-full object-cover border border-pink-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white leading-none">
                            {item.creatorName || item.creator}
                          </span>
                          <span className="text-[10px] text-pink-300">
                            @{item.creator}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {item.date}
                        </span>
                      </div>
                    </div>

                    {/* S3 Media Direct Link */}
                    {item.mediaUrl && (
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-pink-300 text-[10px] font-semibold flex items-center gap-1 transition"
                        title="Inspect original AWS S3 media"
                      >
                        <span>AWS S3</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Title & Caption */}
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {item.title}
                    </h4>
                    {item.caption && (
                      <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">
                        "{item.caption}"
                      </p>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-gray-300">
                      🏷️ {item.category || 'General'}
                    </span>
                    {item.location && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-gray-300 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-pink-400" />
                        <span>{item.location}</span>
                      </span>
                    )}
                    {item.audioTitle && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-gray-300 flex items-center gap-1">
                        <Music2 className="w-2.5 h-2.5 text-purple-400" />
                        <span className="truncate max-w-[120px]">{item.audioTitle}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderation Actions Bar */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                    title="Inspect content full screen"
                  >
                    <Eye className="w-4 h-4 text-pink-400" />
                  </button>

                  {/* Actions based on current status */}
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleModerate(item.id, 'approve')}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Publish</span>
                      </button>

                      <button
                        onClick={() => handleModerate(item.id, 'reject')}
                        disabled={isProcessing}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 font-bold text-xs transition"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <>
                      <div className="flex-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Live on FunFlick</span>
                      </div>

                      <button
                        onClick={() => handleModerate(item.id, 'reopen')}
                        disabled={isProcessing}
                        className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition"
                        title="Reopen review"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </button>

                      <button
                        onClick={() => handleModerate(item.id, 'reject')}
                        disabled={isProcessing}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition"
                        title="Revoke / Reject"
                      >
                        Revoke
                      </button>
                    </>
                  )}

                  {isRejected && (
                    <>
                      <div className="flex-1 text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </div>

                      <button
                        onClick={() => handleModerate(item.id, 'reopen')}
                        disabled={isProcessing}
                        className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </button>

                      <button
                        onClick={() => handleModerate(item.id, 'approve')}
                        disabled={isProcessing}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Content Inspection Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#130d29] border border-pink-500/30 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white text-base font-heading">
                    Media Inspection & Review
                  </h4>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                    previewItem.displayType === 'Reel' ? 'bg-purple-600 text-white' : 'bg-pink-600 text-white'
                  }`}>
                    {previewItem.displayType}
                  </span>
                </div>
                <span className="text-[11px] text-pink-300">
                  Inspect high-fidelity source before public broadcasting
                </span>
              </div>
              <button 
                onClick={() => setPreviewItem(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player or Image Display */}
            <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10 shadow-2xl">
              {previewItem.contentType === 'video' || previewItem.displayType === 'Reel' || previewItem.displayType === 'Video' ? (
                <AdminVideoPlayer
                  src={previewItem.mediaUrl}
                  poster={previewItem.thumbnail}
                  autoPlay={true}
                  className="w-full h-full"
                />
              ) : (
                <img
                  src={previewItem.mediaUrl || previewItem.thumbnail}
                  alt={previewItem.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Complete Metadata Breakdown */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Content Title:</span>
                <span className="font-bold text-white text-right">{previewItem.title}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Creator Details:</span>
                <span className="text-pink-300 font-semibold flex items-center gap-1.5">
                  <img src={previewItem.avatar || '/brand/default-avatar.svg'} className="w-4 h-4 rounded-full object-cover" />
                  <span>{previewItem.creatorName} (@{previewItem.creator})</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-gray-200">{previewItem.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Submitted Timestamp:</span>
                <span className="text-gray-200">{previewItem.date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Moderation Status:</span>
                <span className={`font-bold ${
                  previewItem.status === 'Approved' ? 'text-emerald-400' : previewItem.status === 'Rejected' ? 'text-rose-400' : 'text-amber-300'
                }`}>
                  {previewItem.status === 'Approved' ? 'Approved & Published' : previewItem.status}
                </span>
              </div>

              {previewItem.caption && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-gray-400 block mb-0.5">Caption:</span>
                  <p className="text-gray-200 bg-black/30 p-2.5 rounded-xl leading-relaxed">{previewItem.caption}</p>
                </div>
              )}

              {/* AWS S3 Permanent Source URL */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-gray-400">AWS S3 Media URL:</span>
                <a
                  href={previewItem.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 font-mono text-[11px] truncate max-w-xs flex items-center gap-1"
                >
                  <span className="truncate">{previewItem.mediaUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>

            {/* Moderation Action Buttons in Modal */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleModerate(previewItem.id, 'reject');
                }}
                disabled={isProcessingId === previewItem.id}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-rose-600/20 text-gray-300 hover:text-rose-300 font-bold text-xs transition"
              >
                Reject
              </button>

              <button
                onClick={() => {
                  handleModerate(previewItem.id, 'reopen');
                }}
                disabled={isProcessingId === previewItem.id}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs transition"
                title="Reopen for Review"
              >
                ↺ Reopen
              </button>

              <button
                onClick={() => {
                  handleModerate(previewItem.id, 'approve');
                }}
                disabled={isProcessingId === previewItem.id}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                ✓ Approve & Publish Live
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
