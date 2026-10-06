import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { AdminVideoPlayer } from '../../components/admin/AdminVideoPlayer';
import { 
  Sparkles, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  RotateCcw, 
  ExternalLink, 
  Eye, 
  AlertTriangle,
  CheckCircle2, 
  Loader2, 
  Music, 
  X,
  UserX,
  UserCheck
} from 'lucide-react';
import { SuspendAccountModal } from '../../components/admin/SuspendAccountModal';

export const AdminStoryScreen = () => {
  const { showToast, fetchAdminStats, fetchLiveStories } = useApp();
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePreview, setActivePreview] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);

  const fetchActiveStories = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/admin/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch (err) {
      console.warn('Failed to load active stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStories();
    const interval = setInterval(fetchActiveStories, 15000); // Polling active stories
    return () => clearInterval(interval);
  }, []);

  // Delete violating story immediately
  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story immediately? It will be removed from all user feeds.')) {
      return;
    }

    setIsDeletingId(storyId);
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showToast('🗑️ Story deleted immediately from FunFlick!', 'success');
        setStories(prev => prev.filter(s => s.id !== storyId));
        if (activePreview?.id === storyId) setActivePreview(null);
        if (fetchLiveStories) fetchLiveStories();
        if (fetchAdminStats) fetchAdminStats();
      } else {
        showToast('Failed to delete story', 'error');
      }
    } catch (err) {
      console.error('Delete story error:', err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Reactivate user directly
  const handleReactivateUser = async (userId, username) => {
    if (!window.confirm(`Reactivate account @${username}? The user will be restored immediately.`)) return;
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
      const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`✅ Account @${username} reactivated!`, 'success');
        setStories(prev => prev.map(s => s.userId === userId ? { ...s, userStatus: 'Active' } : s));
        if (activePreview?.userId === userId) {
          setActivePreview(prev => ({ ...prev, userStatus: 'Active' }));
        }
      } else {
        showToast('Failed to reactivate user', 'error');
      }
    } catch (e) {
      showToast('Error reactivating user', 'error');
    }
  };

  return (
    <AdminLayout title="Story Moderation Desk">
      {/* Header Info Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/70 via-indigo-950/40 to-[#140e2b] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Real-time Ephemeral Stream
            </span>
            <span className="text-xs text-gray-400">24-Hour Expiry Engine</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-white font-heading">
            Live User Stories Moderation & Monitoring
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
            Stories publish <strong className="text-white">immediately without waiting for admin approval</strong> and expire automatically after 24 hours. Central Admin monitors active stories, removes community violations immediately, and suspends offending accounts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>{stories.length} Active Stories</span>
          </span>

          <button
            onClick={fetchActiveStories}
            disabled={isLoading}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-200 transition"
            title="Refresh active stories"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Stories Grid */}
      {isLoading && stories.length === 0 ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5 space-y-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <p className="font-semibold text-gray-300">Fetching live active stories from AWS S3 & MySQL...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-[#120c27] rounded-3xl border border-white/5 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">No active stories at the moment</h4>
          <p className="text-gray-400">
            When users or influencers post stories, they appear here in real-time until their 24h timer expires.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stories.map(story => {
            const isVideo = story.mediaType === 'video';
            const isDeleting = isDeletingId === story.id;
            const isSuspending = isSuspendingUserId === story.userId;
            const isSuspended = story.userStatus === 'Suspended';

            return (
              <div
                key={story.id}
                className="p-3.5 rounded-3xl bg-[#120c27] border border-white/10 hover:border-purple-500/30 transition shadow-lg flex flex-col justify-between space-y-3"
              >
                {/* Media Preview Box (Vertical 9:16 aspect ratio preferred for stories) */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/14] flex items-center justify-center border border-white/5">
                  {isVideo ? (
                    <AdminVideoPlayer
                      src={story.mediaUrl}
                      compact={true}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={story.mediaUrl}
                      alt="Story"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                      onClick={() => setActivePreview(story)}
                    />
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-purple-600/90 text-white uppercase backdrop-blur-md">
                      {isVideo ? '🎬 Video Story' : '📸 Photo Story'}
                    </span>
                    {story.sticker && (
                      <span className="px-1.5 py-0.5 rounded-lg text-xs bg-black/60 backdrop-blur-md">
                        {story.sticker}
                      </span>
                    )}
                  </div>

                  {/* Countdown Expiry Badge */}
                  <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/90 text-black backdrop-blur-md flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{story.timeRemainingText} left</span>
                    </span>
                  </div>

                  {/* Play / Expand overlay button */}
                  <button
                    onClick={() => setActivePreview(story)}
                    className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                    title="Inspect Full Size"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Creator Details & Metadata */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={story.avatar}
                        alt={story.username}
                        className="w-7 h-7 rounded-full object-cover border border-purple-500/40"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white leading-none">
                            {story.name || story.username}
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-300">
                          @{story.username}
                        </span>
                      </div>
                    </div>

                    {/* Account Status Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      isSuspended ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>

                  {/* Caption & Music */}
                  {story.caption && (
                    <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed">
                      "{story.caption}"
                    </p>
                  )}

                  {story.music && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                      <Music className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{story.music}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    <span>Uploaded: {story.formattedUpload}</span>
                    <a
                      href={story.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                    >
                      <span>AWS S3</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* Action Buttons: Delete Story / Suspend User */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    disabled={isDeleting}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    title="Remove story immediately from user feeds"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Story</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isSuspended) {
                        handleReactivateUser(story.userId, story.username);
                      } else {
                        setSuspendingUser({ id: story.userId, name: story.name || story.username, username: story.username });
                      }
                    }}
                    className={`p-2 rounded-xl border transition ${
                      isSuspended
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                    }`}
                    title={isSuspended ? 'Reactivate Account' : 'Suspend Account with Duration'}
                  >
                    {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Story Full Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#130d29] border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img
                  src={activePreview.avatar}
                  alt={activePreview.username}
                  className="w-8 h-8 rounded-full object-cover border border-purple-400"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{activePreview.name}</h4>
                  <span className="text-[10px] text-purple-300">@{activePreview.username}</span>
                </div>
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black aspect-[9/16] flex items-center justify-center border border-white/10">
              {activePreview.mediaType === 'video' ? (
                <AdminVideoPlayer
                  src={activePreview.mediaUrl}
                  autoPlay={true}
                  className="w-full h-full"
                />
              ) : (
                <img
                  src={activePreview.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Info details */}
            <div className="p-3 rounded-2xl bg-white/5 text-xs space-y-1.5 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Expires in:</span>
                <span className="text-amber-300 font-bold">{activePreview.timeRemainingText}</span>
              </div>
              {activePreview.caption && (
                <div>
                  <span className="text-gray-400 block">Caption:</span>
                  <p className="text-white mt-0.5">"{activePreview.caption}"</p>
                </div>
              )}
            </div>

            {/* Actions CTA */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteStory(activePreview.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Story</span>
              </button>

              <button
                onClick={() => {
                  if (activePreview.userStatus === 'Suspended') {
                    handleReactivateUser(activePreview.userId, activePreview.username);
                  } else {
                    setSuspendingUser({ id: activePreview.userId, name: activePreview.name || activePreview.username, username: activePreview.username });
                  }
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                  activePreview.userStatus === 'Suspended'
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20'
                }`}
                title={activePreview.userStatus === 'Suspended' ? 'Reactivate User' : 'Suspend User'}
              >
                {activePreview.userStatus === 'Suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                <span>{activePreview.userStatus === 'Suspended' ? 'Reactivate' : 'Suspend'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Account Modal */}
      {suspendingUser && (
        <SuspendAccountModal
          isOpen={!!suspendingUser}
          onClose={() => setSuspendingUser(null)}
          user={suspendingUser}
          onSuccess={() => {
            showToast(`User @${suspendingUser.username} suspended`, 'success');
            setStories(prev => prev.map(s => s.userId === suspendingUser.id ? { ...s, userStatus: 'Suspended' } : s));
            if (activePreview?.userId === suspendingUser.id) {
              setActivePreview(prev => ({ ...prev, userStatus: 'Suspended' }));
            }
            setSuspendingUser(null);
          }}
        />
      )}
    </AdminLayout>
  );
};
