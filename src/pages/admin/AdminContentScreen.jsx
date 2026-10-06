import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  Check, 
  X, 
  Trash2, 
  Eye, 
  ShieldAlert, 
  DollarSign, 
  Award, 
  CheckCircle2, 
  Video, 
  Image, 
  Sparkles, 
  MapPin, 
  Users, 
  Music2, 
  ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminContentScreen = () => {
  const { posts, pendingApprovals, handlePendingApproval, sendPerformanceReward, showToast, fetchAdminPendingContent } = useApp();
  const [tab, setTab] = useState('Pending');
  const [rewardModalPost, setRewardModalPost] = useState(null);
  const [bonusAmount, setBonusAmount] = useState(2500);

  // Preview modal for pending review item
  const [previewItem, setPreviewItem] = useState(null);

  React.useEffect(() => {
    if (fetchAdminPendingContent) {
      fetchAdminPendingContent();
    }
  }, [tab]);

  const handleGrantReward = (e) => {
    e.preventDefault();
    if (!rewardModalPost) return;
    const amt = parseInt(bonusAmount, 10);
    if (!amt || amt <= 0) return;

    sendPerformanceReward(
      rewardModalPost.creator?.username || 'creator',
      rewardModalPost.title || rewardModalPost.caption?.slice(0, 30) || 'Reel',
      amt
    );
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {}
    setRewardModalPost(null);
  };

  return (
    <AdminLayout title="Content Moderation & Approvals">
      {/* Policy banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-[#1b1236] border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-white font-heading">
            Central Approval & Content Moderation Desk
          </h2>
          <p className="text-xs text-gray-300 mt-0.5">
            Admin verifies all user & creator submissions (Reels, Posts, and Stories) before they go live on the platform feed.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{pendingApprovals.length} Awaiting Verification</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {['Pending', 'Published', 'Reported'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              tab === t
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {t} {t === 'Pending' && `(${pendingApprovals.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Pending Submissions */}
      {tab === 'Pending' && (
        <div className="space-y-3">
          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white mb-1">Queue is clear!</p>
              <p>All submitted user and influencer content has been verified & approved.</p>
            </div>
          ) : (
            pendingApprovals.map(item => {
              const isVideo = item.contentType === 'video' || (!item.contentType && item.thumbnail && item.thumbnail.includes('mixkit'));
              const isStory = item.contentType === 'story';
              return (
                <div key={item.id} className="p-4 rounded-3xl bg-[#120c27] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/15 transition">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Thumbnail & Format Badge */}
                    <div className="relative shrink-0">
                      <img 
                        src={item.thumbnail || item.mediaUrl} 
                        alt={item.title} 
                        className="w-20 h-20 rounded-2xl object-cover border border-white/10" 
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-black/80 text-white flex items-center gap-0.5">
                        {isStory ? (
                          <><span>✨</span> Story</>
                        ) : isVideo ? (
                          <><span>🎬</span> Reel</>
                        ) : (
                          <><span>📸</span> Post</>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white font-heading">{item.title}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="text-pink-300 font-medium">by @{item.creator}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{item.category || 'Comedy'}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">Submitted {item.date}</span>
                      </div>

                      {item.caption && (
                        <p className="text-xs text-gray-300 line-clamp-1 max-w-md">
                          "{item.caption}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block font-semibold">
                          ⏳ Central Admin Verification Pending
                        </span>

                        {item.location && (
                          <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{item.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Inspect content before approving"
                    >
                      <Eye className="w-3.5 h-3.5 text-pink-400" />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => handlePendingApproval(item.id, 'approve')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-emerald-500/20 active:scale-95 transition"
                    >
                      ✓ Approve & Publish
                    </button>

                    <button
                      onClick={() => handlePendingApproval(item.id, 'reject')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-600/20 text-gray-300 hover:text-rose-400 font-bold text-xs transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Published Posts */}
      {tab === 'Published' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {posts.map(p => (
            <div key={p.id} className="p-3.5 rounded-2xl bg-[#120c27] border border-white/5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <img src={p.posterUrl || p.mediaUrl} alt={p.title} className="w-full h-36 rounded-xl object-cover" />
                <div>
                  <h5 className="text-xs font-bold text-white line-clamp-1">{p.title || p.caption.slice(0, 30)}</h5>
                  <span className="text-[10px] text-gray-400">@{p.creator?.username} · {p.likesCount} likes · {p.viewsCount || '1.2M'} views</span>
                </div>
              </div>

              {/* Admin Actions: Send Reward or Moderation */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <button
                  onClick={() => setRewardModalPost(p)}
                  className="w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Send Wallet Bonus</span>
                </button>
                <button
                  onClick={() => showToast('Content flagged for review', 'info')}
                  className="w-full py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 text-[11px] font-semibold transition"
                >
                  Flag / Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Reported Content */}
      {tab === 'Reported' && (
        <div className="p-8 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5">
          <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p>2 active community reports under review in Reports section.</p>
        </div>
      )}

      {/* Content Preview & Inspection Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#130d29] border border-pink-500/30 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h4 className="font-extrabold text-white text-sm font-heading">
                  Content Inspection
                </h4>
                <span className="text-[10px] text-pink-300">Review before public broadcast</span>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media player / view */}
            <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10">
              {previewItem.contentType === 'video' || (previewItem.mediaUrl && previewItem.mediaUrl.endsWith('.mp4')) ? (
                <video src={previewItem.mediaUrl} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <img src={previewItem.mediaUrl || previewItem.thumbnail} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>

            {/* Metadata info */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Title:</span>
                <span className="font-bold text-white text-right">{previewItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Creator:</span>
                <span className="text-pink-300 font-semibold">@{previewItem.creator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-gray-200">{previewItem.category}</span>
              </div>
              {previewItem.caption && (
                <div className="pt-1 border-t border-white/5">
                  <span className="text-gray-400 block mb-0.5">Caption:</span>
                  <p className="text-gray-200">{previewItem.caption}</p>
                </div>
              )}
            </div>

            {/* Approve / Reject buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  handlePendingApproval(previewItem.id, 'reject');
                  setPreviewItem(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-rose-600/20 text-gray-300 hover:text-rose-300 font-bold text-xs transition"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  handlePendingApproval(previewItem.id, 'approve');
                  setPreviewItem(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md"
              >
                ✓ Approve & Broadcast Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Wallet Bonus Modal */}
      {rewardModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#130d29] border border-pink-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm font-heading">
                    Disburse Performance Reward
                  </h4>
                  <span className="text-[10px] text-gray-400">Direct Wallet Credit</span>
                </div>
              </div>
              <button onClick={() => setRewardModalPost(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#191136] border border-white/10 text-xs space-y-1">
              <span className="text-gray-400 block">Creator:</span>
              <span className="font-bold text-white block">@{rewardModalPost.creator?.username}</span>
              <span className="text-gray-400 block mt-1">High-Level Post:</span>
              <span className="text-pink-300 font-semibold line-clamp-1">{rewardModalPost.title || rewardModalPost.caption}</span>
            </div>

            <form onSubmit={handleGrantReward} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Bonus Amount to Send (₹)
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[500, 1500, 2500].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setBonusAmount(amt)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                        bonusAmount === amt
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={e => setBonusAmount(e.target.value)}
                  className="w-full bg-[#191136] text-white text-base font-bold px-3.5 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRewardModalPost(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md"
                >
                  Send to Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
