import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  CheckCircle2, 
  Megaphone,
  Maximize2
} from 'lucide-react';
import { motion } from 'framer-motion';

// Safely extract a display hostname; never throw during render on malformed URLs
const getDisplayHost = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return 'funflick.in';
  const trimmed = rawUrl.trim();
  if (!trimmed) return 'funflick.in';
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).hostname || 'funflick.in';
  } catch {
    return 'funflick.in';
  }
};

export const SponsoredAdCard = ({ ad }) => {
  const { 
    recordAdImpression, 
    recordAdClick, 
    showMobileAd, 
    theme, 
    activePopupAd, 
    currentUser, 
    activePlayingVideoId, 
    setActivePlayingVideoId 
  } = useApp();
  const isLight = theme === 'light';

  const isPaidInfluencer = Boolean(
    currentUser?.isInfluencer ||
    currentUser?.role === 'influencer' ||
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
  );

  const videoRef = useRef(null);
  const isAdActive = activePlayingVideoId === `ad_${ad?.id}`;
  const [isAdPaused, setIsAdPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const hasRecordedImpression = useRef(false);

  const isVideo = Boolean(ad) && (
    ad.type === 'video' ||
    /\.(mp4|webm|mov|m4v)($|\?)/i.test(ad.mediaUrl || '') ||
    (typeof ad.mediaUrl === 'string' && ad.mediaUrl.startsWith('data:video/'))
  );

  const shouldPlay = Boolean(isVideo && isAdActive && !isAdPaused && !activePopupAd);

  // Play/pause control based on active single-source audio state
  useEffect(() => {
    if (!videoRef.current) return;
    if (shouldPlay) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [shouldPlay]);

  // Clean pause on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {}
      }
    };
  }, []);

  // Record impression once when ad card appears in feed
  useEffect(() => {
    if (!hasRecordedImpression.current && ad?.id && !isPaidInfluencer) {
      hasRecordedImpression.current = true;
      if (recordAdImpression) recordAdImpression(ad.id);
    }
  }, [ad?.id, recordAdImpression, isPaidInfluencer]);

  // Early return must come AFTER all hooks (Rules of Hooks)
  if (!ad || isPaidInfluencer) return null;

  const handleTogglePlay = (e) => {
    e?.stopPropagation?.();
    if (shouldPlay) {
      setIsAdPaused(true);
    } else {
      setIsAdPaused(false);
      setActivePlayingVideoId?.(`ad_${ad.id}`);
    }
  };

  const handleToggleMute = (e) => {
    e?.stopPropagation?.();
    setIsMuted(prev => !prev);
  };

  const handleCtaClick = (e) => {
    e.stopPropagation();
    if (recordAdClick) recordAdClick(ad.id);
    if (ad.actionUrl) {
      window.open(ad.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenAdOverlay = () => {
    if (showMobileAd) showMobileAd(ad.id);
  };

  return (
    <div className={`mx-0 sm:mx-2 rounded-3xl overflow-hidden ${
      isLight ? 'bg-white border-slate-200/80 shadow-md' : 'bg-[#120a24] border-white/10 shadow-xl'
    } border transition-all mb-4`}>
      {/* Sponsor Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-[#ff007a] to-purple-600 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-[#180e30] flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-[#120a24]">
              ✓
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>
                {ad.title}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Ad
              </span>
            </div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>Sponsored</span>
              <span>•</span>
              <span className="text-pink-300 truncate">{getDisplayHost(ad.actionUrl)}</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenAdOverlay}
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          title="Open interactive ad overlay"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Media Display Area */}
      <div 
        onClick={isVideo ? handleTogglePlay : handleOpenAdOverlay}
        className="relative w-full aspect-[9/16] max-h-[calc(100dvh-180px)] bg-black overflow-hidden flex items-center justify-center cursor-pointer group"
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={ad.mediaUrl}
              poster={ad.thumbnailUrl}
              playsInline
              loop
              muted={isMuted}
              className="w-full h-full object-cover"
            />

            {!shouldPlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-10">
                <div className="w-12 h-12 rounded-full bg-black/70 border border-white/30 flex items-center justify-center pl-0.5 shadow-lg">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
              </div>
            )}

            {/* Video overlay controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
              <button
                onClick={handleTogglePlay}
                className="p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 backdrop-blur-sm transition hover:scale-105 active:scale-95"
                title={shouldPlay ? "Pause Ad" : "Play Ad"}
              >
                {shouldPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 backdrop-blur-sm transition hover:scale-105 active:scale-95"
                title={isMuted ? "Unmute Ad" : "Mute Ad"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400" />}
              </button>
            </div>
          </>
        ) : (
          <img
            src={ad.mediaUrl || ad.thumbnailUrl}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        )}

        {/* Floating Sponsored Tag */}
        <div className="absolute top-3 left-3 z-20">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/70 text-pink-300 border border-pink-500/30 backdrop-blur-md flex items-center gap-1 shadow-lg">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Featured Sponsor</span>
          </span>
        </div>
      </div>

      {/* CTA Banner & Details */}
      <div className={`p-4 ${isLight ? 'bg-slate-50' : 'bg-[#150c2a]'} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>
              {ad.title}
            </h4>
            <p className="text-[11px] text-gray-400 line-clamp-1">
              Official promotion on FunFlick
            </p>
          </div>

          <button
            onClick={handleCtaClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-[#ff007a] to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
          >
            <span>{ad.actionText || 'Learn More'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
