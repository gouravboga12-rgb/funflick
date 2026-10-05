import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Heart, MessageCircle, ChevronLeft, Search } from 'lucide-react';

export const AppHeader = ({ 
  title, 
  showBack = false, 
  rightAction = null,
  showLogo = true,
  searchIcon = false,
  tabs = null,
  activeTab = null,
  onTabChange = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, conversations, theme } = useApp();

  const isLight = theme === 'light';
  const unreadNotifs = notifications.filter(n => n.unread).length;
  const unreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <header className={`sticky top-0 z-30 ${
      isLight 
        ? 'bg-white/95 border-b border-slate-200/80 shadow-sm' 
        : 'bg-[#090614]/95 border-b border-white/5'
    } backdrop-blur-md transition-all`}>
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* If tabs are present (like Screen 3 Home Feed) */}
        {tabs ? (
          <div className="flex items-center gap-3 select-none min-w-0">
            {/* Prominent FunFlick Company Brand & Logo */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 cursor-pointer shrink-0 hover:scale-105 active:scale-95 transition-transform"
              title="FunFlick: Comedy. Entertainment. Always On!"
            >
              <img 
                src="/brand/funflick-logo.png" 
                alt="FunFlick" 
                className="w-7 h-7 rounded-xl object-contain shadow-md drop-shadow"
              />
              <span className={`font-extrabold text-lg tracking-tight ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
                fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
              </span>
            </div>

            {/* Vertical separator */}
            <span className={`h-4 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-white/10'} shrink-0`} />

            {/* Navigation Tabs (Screen 3: For You, Trending, Latest) */}
            <div className="flex items-center gap-3.5 text-xs font-semibold overflow-x-auto no-scrollbar py-1">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => onTabChange && onTabChange(tab)}
                  className={`relative py-1 whitespace-nowrap transition ${
                    activeTab === tab 
                      ? (isLight ? 'text-slate-900 font-extrabold text-sm' : 'text-white font-extrabold text-sm')
                      : (isLight ? 'text-slate-500 hover:text-slate-900 font-medium' : 'text-gray-400 hover:text-gray-200 font-medium')
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] rounded-full shadow-sm shadow-pink-500/50" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Header: Back button or Full Brand Logo / Page Title */
          <div className="flex items-center gap-2 min-w-0">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className={`p-1.5 -ml-1 rounded-full ${
                  isLight 
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                } transition`}
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {showLogo ? (
              <div 
                className="flex items-center gap-2 cursor-pointer select-none" 
                onClick={() => navigate('/')}
              >
                <img 
                  src="/brand/funflick-logo.png" 
                  alt="FunFlick" 
                  className="w-7 h-7 rounded-lg object-contain shadow-sm"
                />
                <span className={`font-extrabold text-xl tracking-tight ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
                  fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
                </span>
              </div>
            ) : title ? (
              <h1 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight font-heading truncate`}>
                {title}
              </h1>
            ) : null}
          </div>
        )}

          {/* Right Section Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {searchIcon && (
            <button
              onClick={() => navigate('/discover')}
              className={`p-1.5 rounded-full ${
                isLight 
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              } transition`}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {rightAction ? (
            rightAction
          ) : (
            <div className="flex items-center gap-0.5">
              {/* Activity / Notifications Heart Icon (Instagram Style) */}
              <button
                onClick={() => navigate('/notifications')}
                className={`relative p-1.5 rounded-full ${
                  isLight 
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                } transition`}
                aria-label="Activity & Notifications"
              >
                <Heart className={`w-5 h-5 ${unreadNotifs > 0 ? 'text-pink-400' : ''}`} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ff007a] text-[9px] font-bold text-white flex items-center justify-center leading-none">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>

              {/* Messages Icon with Badge */}
              <button
                onClick={() => navigate('/messages')}
                className={`relative p-1.5 rounded-full ${
                  isLight 
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                } transition`}
                aria-label="Messages"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#ff007a] text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
