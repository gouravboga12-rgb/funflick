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
  Bell
} from 'lucide-react';

export const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { notifications, showToast } = useApp();
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Likes', 'Comments', 'Followers', 'Subscriptions'];

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'Likes') return n.type === 'like';
    if (filter === 'Comments') return n.type === 'comment';
    if (filter === 'Followers') return n.type === 'follow';
    if (filter === 'Subscriptions') return n.type === 'subscription' || n.type === 'payout';
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />;
      case 'follow': return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      case 'comment': return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'subscription': return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'payout': return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Bell className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Notifications
        </span>
        <button
          onClick={() => showToast('All notifications marked as read! ✔️', 'info')}
          className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Read All</span>
        </button>
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
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs">
            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No notifications in this category.</p>
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                notif.unread
                  ? 'bg-pink-950/20 border-pink-500/30'
                  : 'bg-[#140e2b] border-white/5'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={notif.avatar}
                  alt={notif.user}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1b1434] border border-white/10 flex items-center justify-center">
                  {getNotifIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 text-xs">
                <p className="text-gray-300 leading-snug">
                  <strong className="text-white">@{notif.user}</strong> {notif.text}
                </p>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {notif.time}
                </span>
              </div>

              {notif.unread && (
                <div className="w-2 h-2 rounded-full bg-[#ff007a] shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
