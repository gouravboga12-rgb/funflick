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

export const SponsoredAdCard = ({ ad }) => {
  const { recordAdImpression, recordAdClick, showMobileAd, theme, activePopupAd, currentUser } = useApp();
  const isLight = theme === 'light';

  const isPaidInfluencer = Boolean(
    currentUser?.isInfluencer ||
    currentUser?.role === 'influencer' ||
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
  );

  if (!ad || isPaidInfluencer) return null;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const hasRecordedImpression = useRef(false);

  const isVideo = (
    ad.type === 'video' ||
    /\.(mp4|webm|mov|m4v)($|\?)/i.test(ad.mediaUrl || '') ||
    (typeof ad.mediaUrl === 'string' && ad.mediaUrl.startsWith('data:video/'))
  );

  // Pause feed sponsored card video if pop-up ad is active
  useEffect(() => {
    if (activePopupAd && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [activePopupAd]);

  // Record impression once when ad card appears in feed
  useEffect(() => {
    if (!hasRecordedImpression.current && ad.id) {
      hasRecordedImpression.current = true;
      if (recordAdImpression) recordAdImpression(ad.id);
    }
  }, [ad.id, recordAdImpression]);

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
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
              <span className="text-pink-300 truncate">{ad.actionUrl ? new URL(ad.actionUrl.startsWith('http') ? ad.actionUrl : `https://${ad.actionUrl}`).hostname : 'funflick.in'}</span>
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
        onClick={handleOpenAdOverlay}
        className="relative w-full aspect-[4/5] sm:aspect-square bg-black overflow-hidden flex items-center justify-center cursor-pointer group"
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={ad.mediaUrl}
              poster={ad.thumbnailUrl}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover"
            />

            {/* Video overlay controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
              <button
                onClick={handleTogglePlay}
                className="p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 backdrop-blur-sm transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 backdrop-blur-sm transition"
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
