import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Film } from 'lucide-react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

// In-memory cache for extracted thumbnails so we only extract once per video URL
const thumbnailCache = new Map();

export const VideoThumbnail = ({
  thumbnailUrl,
  videoUrl,
  posterUrl,
  style,
  resizeMode = 'cover',
  fallbackTitle,
}) => {
  const [displayUri, setDisplayUri] = useState(null);
  const [hasFailed, setHasFailed] = useState(false);

  const rawCandidate = thumbnailUrl || posterUrl;
  const isVideoFile = (url) => Boolean(url && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url));

  useEffect(() => {
    let isCancelled = false;

    // 1. If we have a valid image candidate that is NOT an MP4
    if (rawCandidate && !isVideoFile(rawCandidate)) {
      setDisplayUri(rawCandidate);
      setHasFailed(false);
      return;
    }

    // 2. We need to extract a thumbnail from video
    const sourceVideo = (isVideoFile(rawCandidate) ? rawCandidate : null) || videoUrl;
    if (!sourceVideo) {
      setHasFailed(true);
      return;
    }

    if (thumbnailCache.has(sourceVideo)) {
      setDisplayUri(thumbnailCache.get(sourceVideo));
      setHasFailed(false);
      return;
    }

    // Extract frame
    VideoThumbnails.getThumbnailAsync(sourceVideo, { time: 500 })
      .then((result) => {
        if (!isCancelled && result?.uri) {
          thumbnailCache.set(sourceVideo, result.uri);
          setDisplayUri(result.uri);
          setHasFailed(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasFailed(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [rawCandidate, videoUrl]);

  if (displayUri && !hasFailed) {
    return (
      <Image
        source={{ uri: displayUri }}
        style={style}
        resizeMode={resizeMode}
        onError={() => setHasFailed(true)}
      />
    );
  }

  // Graceful, polished fallback banner (never a blank void)
  return (
    <LinearGradient
      colors={['#1e1035', '#2d124d', '#110724']}
      style={[style, styles.fallbackContainer]}
    >
      <View style={styles.fallbackIconWrap}>
        <Film size={22} color="#f472b6" />
      </View>
      {Boolean(fallbackTitle) && (
        <Text style={styles.fallbackText} numberOfLines={2}>
          {fallbackTitle}
        </Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  fallbackIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 122, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fallbackText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
