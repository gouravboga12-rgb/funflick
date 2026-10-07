import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Film, 
  Image as ImageIcon,
  Loader2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Universal media download handler:
 * 1. Tries blob fetch & URL.createObjectURL for direct native download
 * 2. Falls back to backend proxy /api/media/download with attachment header
 * 3. Falls back to direct anchor download
 */
export async function downloadMediaFile(mediaUrl, fileName, onStatus = () => {}) {
  if (!mediaUrl) return;

  const cleanName = fileName || (mediaUrl.includes('.mp4') ? 'chat-video.mp4' : 'chat-image.jpg');
  onStatus('downloading');

  try {
    // Attempt 1: Fetch as blob (instant if CORS allowed)
    const res = await fetch(mediaUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = objectUrl;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2000);
      onStatus('success');
      return;
    }
  } catch (err) {
    console.warn('Direct blob fetch failed, falling back to proxy:', err);
  }

  try {
    // Attempt 2: Use EC2 backend download proxy with Content-Disposition: attachment
    const proxyUrl = `/api/media/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(cleanName)}`;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = proxyUrl;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onStatus('success');
    return;
  } catch (err) {
    console.warn('Backend proxy download failed, falling back to direct link:', err);
  }

  // Attempt 3: Direct link trigger
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = mediaUrl;
  a.download = cleanName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  onStatus('success');
}

export const ChatMediaViewerModal = ({ media, onClose }) => {
  if (!media) return null;

  const isVideo = media.type === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(media.url || '');
  const mediaName = media.name || (isVideo ? 'Chat Video' : 'Chat Photo');

  // Video Player States
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Image Viewer States (Zoom & Pan)
  const [zoomScale, setZoomScale] = useState(1);

  // Download state
  const [downloadStatus, setDownloadStatus] = useState('idle'); // 'idle' | 'downloading' | 'success'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.8);
      videoRef.current.volume = 0.8;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleDownload = () => {
    downloadMediaFile(media.url, media.name, (status) => {
      setDownloadStatus(status);
      if (status === 'success') {
        setTimeout(() => setDownloadStatus('idle'), 2500);
      }
    });
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.35, 3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.35, 0.7));
  const handleResetZoom = () => setZoomScale(1);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="z-30 w-full px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        {/* Media info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0">
            {isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md font-heading">
              {mediaName}
            </h3>
            <p className="text-[10px] text-gray-400">
              {media.size ? `${media.size} MB · ` : ''}{isVideo ? 'High-definition Video' : 'Original Photo'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Download + Close */}
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloadStatus === 'downloading'}
            title="Download original uploaded file"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-lg active:scale-95 ${
              downloadStatus === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white hover:brightness-110'
            }`}
          >
            {downloadStatus === 'downloading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : downloadStatus === 'success' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </>
            )}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            aria-label="Close media viewer"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-default"
        onClick={(e) => {
          // If clicked background outside content, close
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {isVideo ? (
          /* Video Expanded Player */
          <div className="relative max-w-4xl max-h-[75vh] w-full flex items-center justify-center rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
            <video
              ref={videoRef}
              src={media.url}
              autoPlay
              playsInline
              className="max-h-[75vh] w-auto max-w-full object-contain mx-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />

            {/* Buffering Indicator */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
              </div>
            )}

            {/* Large Center Play Icon when paused */}
            {!isPlaying && !isBuffering && (
              <button
                onClick={togglePlay}
                aria-label="Play video"
                className="absolute w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            )}
          </div>
        ) : (
          /* Image Fullscreen Viewer */
          <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center overflow-auto no-scrollbar">
            <img
              src={media.url}
              alt={mediaName}
              style={{ transform: `scale(${zoomScale})` }}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
              onClick={() => setZoomScale(prev => (prev === 1 ? 1.6 : 1))}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="z-30 w-full px-4 py-3 bg-black/70 backdrop-blur-md border-t border-white/10">
        {isVideo ? (
          /* Video Controls: Play/Pause, Seek Slider, Volume, Fullscreen */
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Seek Bar */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-gray-300 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff007a] hover:h-2 transition-all"
              />
              <span className="text-[11px] font-mono text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom Row Controls */}
            <div className="flex items-center justify-between pt-1">
              {/* Play / Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500 hidden sm:block"
                  />
                </div>
              </div>

              {/* Right: Fullscreen & Download */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  title="Download video"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  title="Toggle fullscreen"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Image Zoom Controls Bar */
          <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-gray-300">
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              disabled={zoomScale <= 0.7}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-gray-200">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom in"
              disabled={zoomScale >= 3}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
