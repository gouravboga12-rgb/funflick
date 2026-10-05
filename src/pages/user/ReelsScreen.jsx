import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { ChevronUp, ChevronDown, Sparkles, Film, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReelsScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const { posts, blockedUsers, showMobileAd, adsList } = useApp();

  const visiblePosts = posts.filter(p => !blockedUsers?.includes(p.creator?.username));

  const [currentIdx, setCurrentIdx] = useState(() => {
    if (targetId) {
      const idx = visiblePosts.findIndex(p => p.id === targetId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  useEffect(() => {
    if (targetId) {
      const idx = visiblePosts.findIndex(p => p.id === targetId);
      if (idx !== -1) setCurrentIdx(idx);
    }
  }, [targetId, visiblePosts]);

  const currentPost = visiblePosts[currentIdx] || visiblePosts[0] || posts[0];

  const handleNext = () => {
    if (currentIdx < visiblePosts.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      // Automatically trigger Admin In-App Advertisement every 3 reels!
      if (nextIdx > 0 && nextIdx % 3 === 0 && adsList?.some(a => a.active)) {
        showMobileAd();
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col bg-black min-h-screen sm:min-h-full overflow-hidden select-none">
      {/* Top Header Floating Title */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-2 pointer-events-none">
        <span className="font-extrabold text-base text-white drop-shadow font-heading">
          Reels
        </span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#ff007a] text-white">
          LIVE
        </span>
      </div>

      {/* Vertical Navigation Arrow Controls (for desktop/touch convenience) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-2">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 disabled:opacity-30 transition"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIdx === visiblePosts.length - 1}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 disabled:opacity-30 transition"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Single Reel Container */}
      <div className="flex-1 relative flex items-center justify-center">
        {!currentPost ? (
          <div className="text-center p-6 space-y-4 max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 text-pink-400 flex items-center justify-center mx-auto border border-pink-500/30">
              <Film className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white font-heading">
                No Reels Available Yet
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Be the first creator to upload a reel! Once approved by Admin, your reel will loop here for everyone.
              </p>
            </div>
            <button
              onClick={() => navigate('/create/video')}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Upload a Reel</span>
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPost.id}
              initial={{ opacity: 0.8, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.8, y: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full flex items-center justify-center"
            >
              <VideoPostCard post={currentPost} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals */}
      <SubscriptionGateModal />
      <CreateChooserModal />
    </div>
  );
};
