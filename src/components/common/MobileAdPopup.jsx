import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Check, 
  Play, 
  Pause 
} from 'lucide-react';

export const MobileAdPopup = () => {
  const { activePopupAd, dismissMobileAd, showToast, isReelsMuted, setIsReelsMuted } = useApp();
  const videoRef = useRef(null);

  // Synchronize audio volume with app's Reels volume preference
  const [muted, setMuted] = useState(isReelsMuted !== undefined ? isReelsMuted : false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (isReelsMuted !== undefined) {
      setMuted(isReelsMuted);
    }
  }, [isReelsMuted]);

  const handleToggleMute = (e) => {
    e?.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (setIsReelsMuted) setIsReelsMuted(nextMuted);
  };

  const adId = activePopupAd?.id;

  useEffect(() => {
    if (!adId || !activePopupAd) {
      setCanClose(false);
      setSecondsRemaining(0);
      return;
    }

    // Determine countdown seconds before close option can be shown for this video or image
    const rawCloseAfter = Number(activePopupAd.allowCloseAfter);
    const rawDuration = Number(activePopupAd.duration);
    const closeAfter = rawCloseAfter > 0 ? rawCloseAfter : (rawDuration > 0 ? rawDuration : 5);

    setSecondsRemaining(closeAfter);
    setCanClose(false);

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [adId]);

  if (!activePopupAd) return null;

  const isVideo = (
    activePopupAd.type === 'video' ||
    /\.(mp4|webm|mov|m4v)($|\?)/i.test(activePopupAd.mediaUrl || '') ||
    (typeof activePopupAd.mediaUrl === 'string' && activePopupAd.mediaUrl.startsWith('data:video/'))
  );

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleClose = () => {
    if (!canClose) {
      showToast(`⏳ Please watch ${secondsRemaining}s before closing this sponsor ad`, 'info');
      return;
    }
    dismissMobileAd();
  };

  const handleAction = () => {
    showToast(`Redirecting to sponsor: ${activePopupAd.actionText || 'Visit'}`, 'success');
    if (activePopupAd.actionUrl) {
      window.open(activePopupAd.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) dismissMobileAd();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm rounded-[32px] overflow-hidden bg-[#120a24] border border-white/15 shadow-2xl flex flex-col"
        style={{ maxHeight: '88%' }}
      >
        {/* Top Floating Controls Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Ad Badge */}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/75 text-pink-300 border border-pink-500/30 backdrop-blur-md shadow pointer-events-auto flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Sponsored</span>
          </span>

          {/* Close button / Countdown indicator */}
          <div className="pointer-events-auto">
            {canClose ? (
              <button
                onClick={handleClose}
                className="px-3 py-1.5 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold border border-white/20 shadow-xl transition flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Close</span>
                <X className="w-4 h-4 text-pink-400 stroke-[2.5]" />
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-black/80 text-amber-300 text-xs font-extrabold border border-amber-500/30 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Close in {secondsRemaining}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Media Container */}
        <div className="relative w-full aspect-[4/5] bg-black overflow-hidden flex items-center justify-center">
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={activePopupAd.mediaUrl}
                poster={activePopupAd.thumbnailUrl}
                autoPlay
                playsInline
                loop
                muted={muted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={handleTogglePlay}
                className="w-full h-full object-cover cursor-pointer"
              />
              
              {/* Video control overlays */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                <button
                  onClick={handleToggleMute}
                  className="p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 backdrop-blur-sm transition cursor-pointer"
                  title={muted ? "Unmute Video" : "Mute Video"}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </>
          ) : (
            <img
              src={activePopupAd.mediaUrl}
              alt={activePopupAd.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradient shadow overlay */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#120a24] via-[#120a24]/80 to-transparent pointer-events-none" />
        </div>

        {/* Ad Details & Action Area */}
        <div className="p-4 bg-[#120a24] space-y-3 z-20 -mt-2">
          <div>
            <h3 className="text-sm font-extrabold text-white font-heading leading-tight line-clamp-1">
              {activePopupAd.title}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
              Special offer for FunFlick community · Verified Partner
            </p>
          </div>

          {/* Action CTA Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAction}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-[#ff007a] to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{activePopupAd.actionText || 'Visit Sponsor'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {canClose && (
              <button
                onClick={handleClose}
                className="py-3 px-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                title="Dismiss Ad"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
