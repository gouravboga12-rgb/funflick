import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    conversations,
    setSubscriptionGateModalOpen,
    setCreateModalOpen
  } = useApp();

  const currentPath = location.pathname;
  const unreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleCreateClick = () => {
    // Check FunFlick Publishing Monetization Requirement!
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
    } else {
      setCreateModalOpen(true);
    }
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Discover', icon: Compass, path: '/discover' },
    { label: 'Create', isCreate: true },
    { label: 'Inbox', icon: MessageSquare, path: '/messages', badge: unreadMessages },
    { label: 'Profile', icon: User, path: '/profile', isAvatar: true }
  ];

  return (
    <nav className="sticky bottom-0 z-30 w-full bg-[#0a0616]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 transition-all">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          if (item.isCreate) {
            return (
              <button
                key="create_btn"
                onClick={handleCreateClick}
                className="relative -top-2 flex flex-col items-center group focus:outline-none"
                aria-label="Create Post, Video or Story"
              >
                <div className="w-12 h-10 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] p-[1.5px] shadow-lg shadow-pink-500/25 group-hover:scale-105 active:scale-95 transition-transform flex items-center justify-center">
                  <div className="w-full h-full bg-[#0c081a]/40 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                    <Plus className="w-6 h-6 text-white stroke-[2.5]" />
                  </div>
                </div>
              </button>
            );
          }

          const isActive = currentPath === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-1 relative text-xs group"
            >
              <div className="relative">
                {item.isAvatar ? (
                  <div className={`w-6 h-6 rounded-full p-[1.5px] transition ${
                    isActive 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-sm shadow-pink-500/30' 
                      : 'border border-gray-600'
                  }`}>
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  </div>
                ) : (
                  <Icon 
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive 
                        ? 'text-[#ff007a] stroke-[2.5]' 
                        : 'text-gray-400 group-hover:text-gray-200 stroke-[1.8]'
                    }`} 
                  />
                )}

                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-[#ff007a] text-[10px] font-bold text-white rounded-full min-w-4 text-center">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 transition-colors ${
                isActive ? 'text-white font-bold' : 'text-gray-400 group-hover:text-gray-200'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
