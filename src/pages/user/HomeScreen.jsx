import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/common/AppHeader';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { StoryBar } from '../../components/feed/StoryBar';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { StandardPostCard } from '../../components/feed/StandardPostCard';
import { SponsoredAdCard } from '../../components/feed/SponsoredAdCard';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { StoryViewerModal } from '../../components/feed/StoryViewerModal';
import { Sparkles, TrendingUp, Flame, Video, Plus } from 'lucide-react';

export const HomeScreen = () => {
  const navigate = useNavigate();
  const { posts, blockedUsers, activePlayingVideoId, setActivePlayingVideoId, adsList, isAuthenticated, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('For You');

  const isPaidInfluencer = Boolean(
    currentUser?.isInfluencer ||
    currentUser?.role === 'influencer' ||
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
  );

  const filteredPosts = posts.filter(post => {
    // Exclude blocked users
    if (blockedUsers?.includes(post.creator?.username)) return false;

    if (activeTab === 'Trending') return (post.likesCount || 0) > 30000;
    if (activeTab === 'Latest') return post.timeAgo?.includes('hour') || post.timeAgo?.includes('Just');
    return true; // For You shows all
  });

  // Activate the first video on the Home feed automatically if none active
  useEffect(() => {
    if (!activePlayingVideoId && filteredPosts.length > 0) {
      const firstVideo = filteredPosts.find(p => p.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(p.mediaUrl || ''));
      if (firstVideo && setActivePlayingVideoId) {
        setActivePlayingVideoId(firstVideo.id);
      }
    }
  }, [filteredPosts, activePlayingVideoId, setActivePlayingVideoId]);

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
          {filteredPosts.length === 0 ? (
            <div className="mx-4 my-6 p-8 rounded-3xl bg-[#130b26] border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 text-pink-400 flex items-center justify-center mx-auto border border-pink-500/30">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white font-heading">
                  No Posts or Reels Yet
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Be the first creator on FunFlick! Upload a video or photo, and once approved by Admin, it will appear globally right here.
                </p>
              </div>
              <button
                onClick={() => navigate('/create')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Upload First Reel / Post</span>
              </button>
            </div>
          ) : (
            (() => {
              const activeAds = (adsList || []).filter(a => a.active && a.frequency === 'After 5 Reels');
              return filteredPosts.map((post, idx) => {
                const url = post.mediaUrl || '';
                const isImage = post.mediaType === 'image' ||
                                /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(url) ||
                                url.startsWith('data:image/');
                const isVideo = !isImage && (post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(url));
                
                // Controlled Sequential Ad Placement:
                // 1st ad strictly after 5 reels/posts (idx === 4)
                // 2nd ad strictly after 10 reels/posts (idx === 9)
                // Strictly 1 time per ad, never repeating the same ad
                const adSlotIdx = idx === 4 ? 0 : idx === 9 ? 1 : idx === 14 ? 2 : -1;
                const isUserAuth = isAuthenticated || sessionStorage.getItem('funflick_authenticated') === 'true';
                const targetAd = isUserAuth && !isPaidInfluencer && adSlotIdx !== -1 && activeAds[adSlotIdx] ? activeAds[adSlotIdx] : null;
                const shouldShowAd = Boolean(targetAd) && !isPaidInfluencer;

                return (
                  <React.Fragment key={post.id}>
                    {isVideo ? (
                      <VideoPostCard post={post} isReel={true} />
                    ) : (
                      <StandardPostCard post={post} />
                    )}
                    {shouldShowAd && targetAd && (
                      <SponsoredAdCard ad={targetAd} />
                    )}
                  </React.Fragment>
                );
              });
            })()
          )}
        </div>

        {/* Feed End Celebration */}
        {filteredPosts.length > 0 && (
          <div className="py-8 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-300">You're all caught up!</p>
            <p className="text-[11px] text-gray-500">More viral reels are being processed by creators.</p>
          </div>
        )}
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
