import React, { useState } from 'react';
import { Film } from 'lucide-react';

const isVideoFile = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);
};

export const VideoThumbnail = ({
  posterUrl,
  thumbnailUrl,
  videoUrl,
  alt = 'Video preview',
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // 1. Identify valid image candidate (must NOT be an .mp4/.webm video file)
  const candidateImage = (!isVideoFile(posterUrl) && posterUrl)
    ? posterUrl
    : (!isVideoFile(thumbnailUrl) && thumbnailUrl)
      ? thumbnailUrl
      : null;

  // 2. Identify video source for HTML5 frame extraction (#t=0.001)
  const sourceVideo = (isVideoFile(posterUrl) ? posterUrl : null) ||
                      (isVideoFile(thumbnailUrl) ? thumbnailUrl : null) ||
                      videoUrl;

  // Render image if valid candidate available and hasn't errored
  if (candidateImage && !imgError) {
    return (
      <img
        src={candidateImage}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  // Render HTML5 video snapshot if video source is available
  if (sourceVideo && !videoError) {
    return (
      <video
        src={`${sourceVideo}#t=0.001`}
        preload="metadata"
        muted
        playsInline
        className={`${className} pointer-events-none object-cover`}
        onError={() => setVideoError(true)}
      />
    );
  }

  // Polished fallback gradient (never a broken icon)
  return (
    <div className={`bg-gradient-to-br from-[#1e1035] via-[#2d124d] to-[#110724] flex flex-col items-center justify-center p-3 text-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-1">
        <Film className="w-5 h-5" />
      </div>
      {fallbackTitle && (
        <span className="text-[10px] text-gray-300 font-medium truncate max-w-[90%]">
          {fallbackTitle}
        </span>
      )}
    </div>
  );
};
