import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ExternalLink, Volume2, VolumeX, Play, Pause } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isVideoExt = (url) => typeof url === 'string' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);

export const SponsoredAdCard = ({ ad, isActive = false, onPlayPress }) => {
  const isFocused = useIsFocused();
  const { isReelsMuted, toggleMute, recordAdMetric, isPaidInfluencer, activePopupAd } = useApp();
  const [isAdPaused, setIsAdPaused] = useState(false);
  const hasRecordedImpression = useRef(false);
  const webVideoRef = useRef(null);

  if (!ad || isPaidInfluencer) return null;

  const isVideo = Boolean(
    ad && (
      ad.type === 'video' ||
      /\.(mp4|webm|mov|m4v)($|\?)/i.test(ad.mediaUrl || '')
    )
  );

  const shouldPlay = Boolean(isVideo && isActive && isFocused && !isAdPaused && !activePopupAd);

  const validPoster = (!isVideoExt(ad?.thumbnailUrl) && ad?.thumbnailUrl)
    ? ad.thumbnailUrl
    : (!isVideoExt(ad?.posterUrl) && ad?.posterUrl ? ad.posterUrl : null);

  const player = useVideoPlayer(isVideo && Platform.OS !== 'web' ? ad?.mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    if (shouldPlay) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = isReelsMuted;
      if (shouldPlay) {
        webVideoRef.current.play().catch(() => {});
      } else {
        webVideoRef.current.pause();
      }
    }
  }, [shouldPlay, isReelsMuted]);

  useEffect(() => {
    if (!player) return;
    try {
      if (shouldPlay) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {}
  }, [shouldPlay, player]);

  // Clean pause on unmount
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
      if (webVideoRef.current) {
        try {
          webVideoRef.current.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  useEffect(() => {
    if (player) {
      try {
        player.muted = isReelsMuted;
      } catch (e) {}
    }
  }, [isReelsMuted, player]);

  // Record impression once when in viewport
  useEffect(() => {
    if (!hasRecordedImpression.current && ad?.id) {
      hasRecordedImpression.current = true;
      recordAdMetric(ad.id, 'impression');
    }
  }, [ad?.id, recordAdMetric]);

  const handleAction = () => {
    if (ad?.id) {
      recordAdMetric(ad.id, 'click');
    }
    if (ad?.actionUrl) {
      Linking.openURL(ad.actionUrl).catch(() => {});
    }
  };

  const handleTogglePlayPause = () => {
    if (isAdPaused || !shouldPlay) {
      setIsAdPaused(false);
      onPlayPress?.();
    } else {
      setIsAdPaused(true);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Sparkles size={13} color="#fbbf24" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>Sponsored</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{ad.title || 'Featured Brand'}</Text>
        </View>

        <TouchableOpacity onPress={handleAction} style={styles.learnMoreBtn}>
          <Text style={styles.learnMoreText}>Visit</Text>
          <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>

      {/* Media Display */}
      <View style={styles.mediaWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={isVideo ? handleTogglePlayPause : handleAction}
          style={StyleSheet.absoluteFillObject}
        >
          {isVideo ? (
            Platform.OS === 'web' ? (
              <video
                ref={webVideoRef}
                src={ad.mediaUrl}
                playsInline
                loop
                muted={isReelsMuted}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#000000',
                }}
              />
            ) : player ? (
              <VideoView
                player={player}
                style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
                contentFit="cover"
                surfaceType="textureView"
                useExoShutter={false}
                nativeControls={false}
              />
            ) : null
          ) : (
            <Image
              source={{ uri: validPoster || ad.mediaUrl }}
              style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
              resizeMode="cover"
            />
          )}

          {/* Centered Play Pill when Video Ad is paused */}
          {isVideo && (isAdPaused || !shouldPlay) && (
            <View style={styles.centerPlayOverlay} pointerEvents="none">
              <View style={styles.centerPlayPill}>
                <Play size={24} color="#ffffff" />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Audio Mute & Play/Pause Controls for Video Ads */}
        {isVideo && (
          <View style={styles.topRightControls}>
            <TouchableOpacity
              style={styles.iconCtrlBtn}
              onPress={handleTogglePlayPause}
              activeOpacity={0.8}
            >
              {isAdPaused || !shouldPlay ? (
                <Play size={14} color="#ffffff" />
              ) : (
                <Pause size={14} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCtrlBtn}
              onPress={toggleMute}
              activeOpacity={0.8}
            >
              {isReelsMuted ? (
                <VolumeX size={14} color="#ffffff" />
              ) : (
                <Volume2 size={14} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(7,4,13,0.8)']}
          style={styles.bottomGradient}
        />

        {/* Bottom CTA Bar */}
        {Boolean(ad.actionText || ad.actionUrl) && (
          <TouchableOpacity
            style={styles.bottomCta}
            onPress={handleAction}
            activeOpacity={0.9}
          >
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaPrompt}>Special Offer</Text>
              <Text style={styles.ctaTitle} numberOfLines={1}>
                {ad.title || 'Tap to learn more'}
              </Text>
            </View>

            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>{ad.actionText || 'Install / View'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0f0a1f',
    borderRadius: 20,
    marginVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#130c24',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  badgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  learnMoreText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  topRightControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  iconCtrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  centerPlayPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15,10,31,0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctaTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  ctaPrompt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  ctaButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
