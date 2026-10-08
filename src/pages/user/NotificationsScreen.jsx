import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { 
  ChevronLeft, 
  Heart, 
  UserPlus, 
  MessageSquare, 
  Sparkles, 
  CreditCard, 
  CheckCheck,
  Bell,
  UserCheck,
  X,
  Users,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    showToast,
    followRequests,
    acceptFollowRequest,
    declineFollowRequest,
    markAllNotificationsAsRead,
    clearAllNotifications,
    fetchLiveNotifications,
    toggleFollowCreator,
    followingList
  } = useApp();
  const [filter, setFilter] = useState('All');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  React.useEffect(() => {
    if (fetchLiveNotifications) fetchLiveNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      showToast('No notifications to clear', 'info');
      return;
    }
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    await clearAllNotifications();
    setShowClearConfirm(false);
  };

  const categories = ['All', 'Requests', 'Likes', 'Comments', 'Follows', 'System'];

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'Likes') return n.type === 'like';
    if (filter === 'Comments') return n.type === 'comment';
    if (filter === 'Follows') return n.type === 'follow';
    if (filter === 'Requests') return false; // shown separately above
    if (filter === 'System') return n.type === 'system' || n.type === 'subscription' || n.type === 'payout' || n.type === 'wallet';
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />;
      case 'follow': return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      case 'comment': return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'subscription': return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'payout': case 'wallet': return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Bell className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const showRequests = filter === 'All' || filter === 'Requests';

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Activity
        </span>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleMarkAllRead}
            disabled={notifications.every(n => !n.unread)}
            className={`text-xs font-semibold flex items-center gap-1 transition ${
              notifications.some(n => n.unread)
                ? 'text-pink-400 hover:text-pink-300'
                : 'text-gray-500'
            }`}
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Read All</span>
          </button>

          <span className="text-white/20">|</span>

          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className={`text-xs font-semibold flex items-center gap-1 transition ${
              notifications.length > 0
                ? 'text-red-400 hover:text-red-300'
                : 'text-gray-500'
            }`}
            title="Clear all notifications to optimize storage"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              filter === cat
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {cat === 'Requests' && followRequests.length > 0 ? (
              <span className="flex items-center gap-1">
                Requests
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold">
                  {followRequests.length}
                </span>
              </span>
            ) : cat}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── Follow Requests Section (Instagram style) ── */}
        <AnimatePresence>
          {showRequests && followRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-3 border-b border-white/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">
                    Follow Requests
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                      {followRequests.length}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[11px] text-pink-400 font-semibold"
                >
                  See All
                </button>
              </div>

              {followRequests.map(req => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#140e2b] border border-blue-500/20"
                >
                  <img
                    src={req.avatar}
                    alt={req.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40"
                    onError={e => { e.currentTarget.src = '/brand/default-avatar.svg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">@{req.username}</p>
                    <p className="text-[10px] text-gray-400 truncate">{req.name}</p>
                    <p className="text-[10px] text-gray-500">{req.time}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => acceptFollowRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white text-[10px] font-bold shadow-md active:scale-95 transition"
                    >
                      <UserCheck className="w-3 h-3" />
                      Confirm
                    </button>
                    <button
                      onClick={() => declineFollowRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-gray-300 text-[10px] font-bold active:scale-95 transition"
                    >
                      <X className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Activity Notifications List ── */}
        <div className="p-4 space-y-3">
          {filter === 'Requests' && followRequests.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-xs">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p>No pending follow requests.</p>
            </div>
          )}

          {filter !== 'Requests' && filteredNotifs.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-xs">
              <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p>No notifications in this category.</p>
            </div>
          )}

          {filter !== 'Requests' && filteredNotifs.map(notif => {
            const rawUser = notif.actorUsername || notif.user || 'FunFlick';
            const cleanUser = rawUser.replace(/^@+/, '');
            const isFollowingActor = followingList?.some(u => u.username?.toLowerCase() === cleanUser.toLowerCase());

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                  notif.unread
                    ? 'bg-pink-950/20 border-pink-500/30'
                    : 'bg-[#140e2b] border-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={notif.avatar}
                    alt={cleanUser}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    onError={e => { e.currentTarget.src = '/brand/default-avatar.svg'; }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1b1434] border border-white/10 flex items-center justify-center">
                    {getNotifIcon(notif.type)}
                  </div>
                </div>

                <div className="flex-1 text-xs">
                  <p className="text-gray-300 leading-snug">
                    <strong className="text-white">@{cleanUser}</strong> {notif.text}
                  </p>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {notif.time}
                  </span>
                  {notif.type === 'follow' && (
                    <button
                      onClick={() => toggleFollowCreator(cleanUser)}
                      className={`mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition cursor-pointer ${
                        isFollowingActor
                          ? 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                          : 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white hover:opacity-95'
                      }`}
                    >
                      {isFollowingActor ? 'Following' : 'Follow Back'}
                    </button>
                  )}
                </div>

                {notif.unread && (
                  <div className="w-2 h-2 rounded-full bg-[#ff007a] shrink-0 mt-1.5" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#140e2b] border border-white/10 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Clear All Notifications?</h3>
              <p className="text-xs text-gray-400 mt-1">This will permanently delete all activity notifications from your account.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-600/30"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
