import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { 
  X, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Play, 
  Loader2 
} from 'lucide-react';

export const MobileAdPopup = () => {
  const { activePopupAd, dismissMobileAd, showToast, isReelsMuted, setIsReelsMuted, isAuthenticated } = useApp();
  const videoRef = useRef(null);

  // Synchronize audio volume with app's Reels volume preference
  const [muted, setMuted] = useState(isReelsMuted !== undefined ? isReelsMuted : false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (isReelsMuted !== undefined) {
      setMuted(isReelsMuted);
      if (videoRef.current) {
        videoRef.current.muted = isReelsMuted;
      }
    }
  }, [isReelsMuted]);

  // Guarantee background media silence: pause all other videos on the page whenever a popup ad is open
  useEffect(() => {
    if (!activePopupAd) return;

    const pauseBackgroundMedia = () => {
      document.querySelectorAll('video, audio').forEach((el) => {
        if (el !== videoRef.current && !el.paused) {
          try {
            el.pause();
          } catch (e) {}
        }
      });
    };

    pauseBackgroundMedia();
    const interval = setInterval(pauseBackgroundMedia, 300);

    return () => clearInterval(interval);
  }, [activePopupAd]);

  const adId = activePopupAd?.id;

  const isVideo = Boolean(
    activePopupAd && (
      activePopupAd.type === 'video' ||
      /\.(mp4|webm|mov|m4v)($|\?)/i.test(activePopupAd.mediaUrl || '') ||
      (typeof activePopupAd.mediaUrl === 'string' && activePopupAd.mediaUrl.startsWith('data:video/'))
    )
  );

  const isVideoExt = (url) => typeof url === 'string' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);
  const validPoster = (!isVideoExt(activePopupAd?.thumbnailUrl) && activePopupAd?.thumbnailUrl) 
    ? activePopupAd.thumbnailUrl 
    : undefined;

  // Countdown timer before close button is allowed
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
      setSecondsRemaining((prev) => {
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

  // Video autoplay with sound & resilient fallback to muted autoplay if browser blocks audio
  useEffect(() => {
    if (!activePopupAd || !isVideo) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setAutoplayBlocked(false);

    const video = videoRef.current;
    if (!video) return;

    try {
      video.currentTime = 0;
    } catch (e) {}

    const attemptPlayback = () => {
      if (!video) return;
      video.muted = muted;
      video.volume = 1.0;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Autoplay with audio blocked by browser policy; retrying with muted autoplay:', err);
            // Browser blocked unmuted autoplay. Mute video and play immediately so user never sees black screen!
            video.muted = true;
            setMuted(true);
            setAutoplayBlocked(true);
            video.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch((e) => {
                console.error('Muted autoplay also failed:', e);
                setIsPlaying(false);
                setIsLoading(false);
              });
          });
      }
    };

    video.load();
    if (video.readyState >= 2) {
      attemptPlayback();
    } else {
      video.addEventListener('canplay', attemptPlayback, { once: true });
    }

    return () => {
      if (video) {
        video.removeEventListener('canplay', attemptPlayback);
      }
    };
  }, [adId, isVideo]);

  const handleToggleMute = (e) => {
    e?.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    setAutoplayBlocked(false);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = 1.0;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
    if (setIsReelsMuted) setIsReelsMuted(nextMuted);
  };

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    // If browser previously blocked audio autoplay, user clicking video unmutes immediately!
    if (autoplayBlocked || muted) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      setMuted(false);
      setAutoplayBlocked(false);
      if (setIsReelsMuted) setIsReelsMuted(false);
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const isUserAuth = isAuthenticated || sessionStorage.getItem('funflick_authenticated') === 'true';
  const isAdminAuth = Boolean(localStorage.getItem('funflick_admin_token')) || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (!activePopupAd || (!isUserAuth && !isAdminAuth)) return null;

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
                key={activePopupAd.id}
                ref={videoRef}
                src={activePopupAd.mediaUrl}
                poster={validPoster}
                preload="auto"
                autoPlay
                playsInline
                loop
                muted={muted}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onPlaying={() => {
                  setIsPlaying(true);
                  setIsLoading(false);
                }}
                onPause={() => setIsPlaying(false)}
                onError={() => setIsLoading(false)}
                onClick={handleVideoClick}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Loading Spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs z-15 pointer-events-none">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                  <span className="text-xs text-white/90 font-medium">Loading sponsor ad...</span>
                </div>
              )}

              {/* Tap to Unmute Banner if Browser blocked unmuted autoplay */}
              {autoplayBlocked && isPlaying && (
                <button
                  onClick={handleToggleMute}
                  className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-bold shadow-xl border border-white/20 flex items-center gap-1.5 z-30 cursor-pointer animate-pulse hover:scale-105 transition"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Tap to Unmute Audio 🔊</span>
                </button>
              )}

              {/* Play Pause Button Overlay if paused */}
              {!isPlaying && !isLoading && (
                <div 
                  onClick={handleVideoClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-black/75 border border-white/25 flex items-center justify-center shadow-xl hover:scale-110 transition">
                    <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                  </div>
                </div>
              )}
              
              {/* Video sound toggle overlay */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                <button
                  onClick={handleToggleMute}
                  className="p-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md shadow-lg transition cursor-pointer hover:scale-110 active:scale-95"
                  title={muted ? "Unmute Ad Video" : "Mute Ad Video"}
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-pink-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <img
              key={activePopupAd.id}
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
