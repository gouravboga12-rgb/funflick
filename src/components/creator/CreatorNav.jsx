import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Video, BarChart3, DollarSign, MoreHorizontal } from 'lucide-react';

export const CreatorNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/creator/dashboard' },
    { label: 'Videos', icon: Video, path: '/creator/videos' },
    { label: 'Analytics', icon: BarChart3, path: '/creator/analytics' },
    { label: 'Earnings', icon: DollarSign, path: '/creator/earnings' },
    { label: 'User App', icon: MoreHorizontal, path: '/' },
  ];

  return (
    <nav className="sticky bottom-0 z-30 w-full bg-[#0d081f]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 group py-1"
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                isActive ? 'text-[#ff007a] stroke-[2.5]' : 'text-gray-400 group-hover:text-white'
              }`} />
              <span className={`text-[10px] transition-colors ${
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
