import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/common/AppHeader';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { StoryBar } from '../../components/feed/StoryBar';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { StoryViewerModal } from '../../components/feed/StoryViewerModal';
import { Sparkles, TrendingUp, Flame } from 'lucide-react';

export const HomeScreen = () => {
  const { posts, blockedUsers } = useApp();
  const [activeTab, setActiveTab] = useState('For You');

  const filteredPosts = posts.filter(post => {
    // Exclude blocked users
    if (blockedUsers?.includes(post.creator?.username)) return false;

    if (activeTab === 'Trending') return (post.likesCount || 0) > 30000;
    if (activeTab === 'Latest') return post.timeAgo?.includes('hour') || post.timeAgo?.includes('Just');
    return true; // For You shows all
  });

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full">
      {/* Top Header with Tab Switcher & Search (Screen 3) */}
      <AppHeader
        showLogo={true}
        searchIcon={true}
        tabs={['For You', 'Trending', 'Latest']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Video Feed containing StoryBar and Posts */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
        {/* Horizontal Stories Bar (Screen 3 & 4) */}
        <StoryBar />

        {/* Video Posts Feed */}
        <div className="px-0 sm:px-2 space-y-4">
          {filteredPosts.map(post => (
            <VideoPostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Feed End Celebration */}
        <div className="py-8 px-4 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-300">You're all caught up with top comedy!</p>
          <p className="text-[11px] text-gray-500">More viral reels are being processed by creators.</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals & Overlays */}
      <SubscriptionGateModal />
      <CreateChooserModal />
      <StoryViewerModal />
    </div>
  );
};
