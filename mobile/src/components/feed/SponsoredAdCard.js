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
  AppState,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ExternalLink, Volume2, VolumeX, Play, Pause } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Match VideoPostCard / Reels dimensions exactly
const REEL_CARD_HEIGHT = Math.min(
  Math.floor(SCREEN_HEIGHT - 120),
  Math.floor(SCREEN_WIDTH * (16 / 9))
);

const IMAGE_CARD_HEIGHT = Math.min(
  Math.floor(SCREEN_HEIGHT - 220),
  Math.floor(SCREEN_WIDTH * 1.25)
);

const isVideoExt = (url) => typeof url === 'string' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);

export const SponsoredAdCard = ({ ad, isActive = false, onPlayPress }) => {
  const isFocused = useIsFocused();
  const { isReelsMuted, toggleMute, recordAdMetric, isPaidInfluencer, activePopupAd } = useApp();
  const [isAdPaused, setIsAdPaused] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasRecordedImpression = useRef(false);
  const webVideoRef = useRef(null);

  if (!ad || isPaidInfluencer) return null;

  const isVideo = Boolean(
    ad && (
      ad.type === 'video' ||
      isVideoExt(ad.mediaUrl || '')
    )
  );

  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  const shouldPlay = Boolean(isVideo && isActive && isFocused && isAppActive && !isAdPaused && !activePopupAd);

  // Safe poster image URI that is NOT an mp4 video URL
  const validPoster = (() => {
    const candidates = [ad?.thumbnailUrl, ad?.posterUrl, ad?.thumbnail, ad?.poster];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim() && !isVideoExt(c)) {
        return c.trim();
      }
    }
    return !isVideo && typeof ad?.mediaUrl === 'string' ? ad.mediaUrl : null;
  })();

  const player = useVideoPlayer(isVideo && Platform.OS !== 'web' ? ad?.mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    try {
      p.staysActiveInBackground = false;
    } catch (e) {}
    if (shouldPlay) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Track video readiness to prevent black screen flash
  useEffect(() => {
    if (!player) {
      setIsVideoReady(false);
      return;
    }
    if (player.status === 'readyToPlay') {
      setIsVideoReady(true);
    }
    const statusSub = player.addListener ? player.addListener('statusChange', (payload) => {
      if (payload?.status === 'readyToPlay') setIsVideoReady(true);
    }) : null;
    const playSub = player.addListener ? player.addListener('playingChange', (payload) => {
      if (payload?.isPlaying) setIsVideoReady(true);
    }) : null;
    const timeSub = player.addListener ? player.addListener('timeUpdate', () => {
      setIsVideoReady(true);
    }) : null;

    return () => {
      statusSub?.remove?.();
      playSub?.remove?.();
      timeSub?.remove?.();
    };
  }, [player]);

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
      try {
        player.staysActiveInBackground = false;
      } catch (e) {}
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
    const rawId = ad.rawAdId || ad.id;
    if (!hasRecordedImpression.current && rawId) {
      hasRecordedImpression.current = true;
      recordAdMetric?.(rawId, 'impression');
    }
  }, [ad.rawAdId, ad.id, recordAdMetric]);

  const handleAction = () => {
    const rawId = ad.rawAdId || ad.id;
    if (rawId) {
      recordAdMetric?.(rawId, 'click');
    }
    const targetUrl = ad.actionUrl || 'https://funflick.in';
    if (targetUrl) {
      Linking.openURL(targetUrl).catch(e => console.warn('Could not open ad URL:', e));
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

  // ==========================================
  // 1. VIDEO AD: Render like Reels / VideoPostCard
  // ==========================================
  if (isVideo) {
    return (
      <View style={[styles.reelAdContainer, { height: REEL_CARD_HEIGHT }]}>
        {/* Layer 1: Ambient Blurred Backdrop */}
        {validPoster ? (
          <Image
            source={{ uri: validPoster }}
            style={StyleSheet.absoluteFillObject}
            blurRadius={32}
            opacity={0.32}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#090514' }]} />
        )}

        {/* Layer 2: True Aspect-Ratio VideoView */}
        {player && (
          Platform.OS === 'web' ? (
            <video
              ref={webVideoRef}
              src={ad.mediaUrl}
              autoPlay
              playsInline
              loop
              muted={isReelsMuted}
              onLoadedData={() => setIsVideoReady(true)}
              onPlaying={() => setIsVideoReady(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: 'transparent',
              }}
            />
          ) : (
            <VideoView
              player={player}
              style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
              contentFit="contain"
              surfaceType="textureView"
              useExoShutter={false}
              nativeControls={false}
            />
          )
        )}

        {/* Persistent Poster Image until first video frame is decoded & ready to play */}
        {(!isVideoReady || !player) && validPoster && (
          <Image
            source={{ uri: validPoster }}
            style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
            resizeMode="contain"
          />
        )}

        {/* Dedicated Tap Layer Covering Entire Screen */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTogglePlayPause}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top Floating Vignette */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topVignette}
          pointerEvents="none"
        />

        {/* Top Header Floating Controls */}
        <View style={styles.floatingTopBar} pointerEvents="box-none">
          <View style={styles.floatingHeaderLeft}>
            <View style={styles.badge}>
              <Sparkles size={13} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>Sponsored</Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>{ad.title || 'Featured Brand'}</Text>
          </View>

          <TouchableOpacity onPress={handleAction} style={styles.learnMoreBtn} activeOpacity={0.85}>
            <Text style={styles.learnMoreText}>Visit</Text>
            <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Top Right Controls: Mute & Play/Pause */}
        <View style={styles.topRightControls} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.iconCtrlBtn}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isReelsMuted ? (
              <VolumeX size={16} color="#ffffff" />
            ) : (
              <Volume2 size={16} color="#fbbf24" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCtrlBtn}
            onPress={handleTogglePlayPause}
            activeOpacity={0.8}
          >
            {isAdPaused || !shouldPlay ? (
              <Play size={16} color="#ff007a" fill="#ff007a" style={{ marginLeft: 2 }} />
            ) : (
              <Pause size={16} color="#ffffff" fill="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Centered Play Indicator when Video Ad is paused */}
        {(isAdPaused || !shouldPlay) && (
          <View style={styles.centerPlayOverlay} pointerEvents="box-none">
            <TouchableOpacity style={styles.centerPlayPill} onPress={handleTogglePlayPause} activeOpacity={0.85}>
              <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Vignette Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(7,4,13,0.92)']}
          style={styles.bottomVignette}
          pointerEvents="none"
        />

        {/* Bottom CTA Bar */}
        <View style={styles.bottomCtaWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.bottomCta}
            onPress={handleAction}
            activeOpacity={0.9}
          >
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaPrompt}>Sponsored Promotion</Text>
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
              <Text style={styles.ctaButtonText}>{ad.actionText || 'Visit Now'}</Text>
              <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================
  // 2. IMAGE AD: Render like StandardPostCard
  // ==========================================
  return (
    <View style={styles.imageCardContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.brandAvatar}>
            <Sparkles size={16} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.postTitle} numberOfLines={1}>{ad.title || 'Sponsored'}</Text>
              <View style={styles.badgeSmall}>
                <Text style={styles.badgeSmallText}>Ad</Text>
              </View>
            </View>
            <Text style={styles.postSub}>Sponsored Brand Promotion</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleAction} style={styles.learnMoreBtn} activeOpacity={0.85}>
          <Text style={styles.learnMoreText}>Visit</Text>
          <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Image Media Container */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleAction}
        style={[styles.imageMediaWrapper, { height: IMAGE_CARD_HEIGHT }]}
      >
        <Image
          source={{ uri: validPoster || ad.mediaUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.bottomVignette}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {/* Bottom Action Bar */}
      <View style={styles.postFooter}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.footerTitle} numberOfLines={1}>{ad.title || 'Special Offer'}</Text>
          <Text style={styles.footerPrompt}>Tap below to check out this offer</Text>
        </View>

        <TouchableOpacity onPress={handleAction} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>{ad.actionText || 'Visit Now'}</Text>
            <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 4 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Video Reel-style Container
  reelAdContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  floatingTopBar: {
    position: 'absolute',
    top: 16,
    left: 14,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  badgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  learnMoreText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  topRightControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 15,
  },
  iconCtrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  centerPlayPill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomCtaWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    zIndex: 10,
  },
  bottomCta: {
    backgroundColor: 'rgba(15,10,31,0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctaTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  ctaPrompt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Image Post-style Container
  imageCardContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#0c0717',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#100a20',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeSmall: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  badgeSmallText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800',
  },
  postSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  imageMediaWrapper: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#100a20',
  },
  footerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  footerPrompt: {
    color: '#94a3b8',
    fontSize: 11,
  },
});
