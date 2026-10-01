import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReelsScreen = () => {
  const { posts } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);

  const currentPost = posts[currentIdx] || posts[0];

  const handleNext = () => {
    if (currentIdx < posts.length - 1) {
      setCurrentIdx(prev => prev + 1);
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
          disabled={currentIdx === posts.length - 1}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 disabled:opacity-30 transition"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Single Reel Container */}
      <div className="flex-1 relative flex items-center justify-center">
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
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals */}
      <SubscriptionGateModal />
      <CreateChooserModal />
    </div>
  );
};
