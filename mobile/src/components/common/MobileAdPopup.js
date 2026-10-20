import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
  AppState,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Volume2, VolumeX, ExternalLink, Sparkles, Clock, Play, Pause } from 'lucide-react-native';
import { navigationRef } from '../../navigation/navigationService';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isVideoExt = (url) => typeof url === 'string' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);

// Web-specific video player element to bypass browser autoplay restrictions cleanly
function WebAdVideoPlayer({ mediaUrl, muted, setMuted, isPaused, setIsLoading }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading?.(true);
    video.muted = muted;

    if (!isPaused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading?.(false);
          })
          .catch((err) => {
            console.warn('Web ad autoplay with audio blocked, falling back to muted autoplay:', err);
            video.muted = true;
            setMuted?.(true);
            video.play()
              .then(() => setIsLoading?.(false))
              .catch(() => setIsLoading?.(false));
          });
      }
    } else {
      video.pause();
      setIsLoading?.(false);
    }

    return () => {
      try {
        video.pause();
        video.src = '';
      } catch (e) {}
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.src = '';
        } catch (e) {}
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={mediaUrl}
      playsInline
      loop
      muted={muted}
      onWaiting={() => setIsLoading?.(true)}
      onPlaying={() => setIsLoading?.(false)}
      onError={() => setIsLoading?.(false)}
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
  );
}

// Dedicated Video Player subcomponent to safely invoke useVideoPlayer only when video is active
function NativeAdVideoPlayer({ mediaUrl, muted, isPaused, setIsLoading }) {
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  const shouldPlay = !isPaused && isAppActive;

  const player = useVideoPlayer(mediaUrl, p => {
    if (!p) return;
    p.loop = true;
    p.muted = muted;
    try {
      p.staysActiveInBackground = false;
    } catch (e) {}
    if (shouldPlay) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (player) {
      try {
        try {
          player.staysActiveInBackground = false;
        } catch (e) {}
        player.muted = muted;
        if (shouldPlay) {
          player.play();
        } else {
          player.pause();
        }
      } catch (e) {}
    }
  }, [muted, shouldPlay, player]);

  // Clean pause on unmount to prevent audio leaking into background reels
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener ? player.addListener('statusChange', (status) => {
      if (status?.status === 'readyToPlay' || status?.isPlaying) {
        setIsLoading?.(false);
      }
    }) : null;
    return () => {
      sub?.remove?.();
    };
  }, [player, setIsLoading]);

  if (!player) return null;

  return (
    <VideoView
      player={player}
      style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
      contentFit="cover"
      surfaceType="surfaceView"
      nativeControls={false}
    />
  );
}

function AdVideoPlayer({ mediaUrl, muted, setMuted, isPaused, setIsLoading }) {
  if (Platform.OS === 'web') {
    return (
      <WebAdVideoPlayer
        mediaUrl={mediaUrl}
        muted={muted}
        setMuted={setMuted}
        isPaused={isPaused}
        setIsLoading={setIsLoading}
      />
    );
  }
  return (
    <NativeAdVideoPlayer
      mediaUrl={mediaUrl}
      muted={muted}
      isPaused={isPaused}
      setIsLoading={setIsLoading}
    />
  );
}

export const MobileAdPopup = () => {
  const { activePopupAd, dismissMobileAd, recordAdMetric, currentUser, isPaidInfluencer: ctxIsPaidInfluencer } = useApp();

  const isPaidInfluencer = Boolean(
    ctxIsPaidInfluencer ||
    currentUser?.isAdFreeSubscriber === true ||
    (
      currentUser?.subscription_plan &&
      !['Free Member', 'Free User', 'free', 'Free Creator'].includes(currentUser.subscription_plan) &&
      currentUser?.subscription_expires_at &&
      new Date(currentUser.subscription_expires_at) > new Date()
    ) ||
    (
      currentUser?.subscriptionPlan &&
      !['Free Member', 'Free User', 'free', 'Free Creator'].includes(currentUser.subscriptionPlan) &&
      currentUser?.subscriptionExpiresAt &&
      new Date(currentUser.subscriptionExpiresAt) > new Date()
    )
  );

  const [muted, setMuted] = useState(false);
  const [isAdPaused, setIsAdPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [canClose, setCanClose] = useState(false);

  const ad = activePopupAd;
  const isVideo = Boolean(
    ad && (
      ad.type === 'video' ||
      /\.(mp4|webm|mov|m4v)($|\?)/i.test(ad.mediaUrl || '')
    )
  );

  const validPoster = (!isVideoExt(ad?.thumbnailUrl) && ad?.thumbnailUrl)
    ? ad.thumbnailUrl
    : (!isVideoExt(ad?.posterUrl) && ad?.posterUrl ? ad.posterUrl : null);

  // Countdown timer before close is permitted
  useEffect(() => {
    setIsAdPaused(false);
    if (!ad) {
      setCanClose(false);
      setSecondsRemaining(0);
      return;
    }

    const rawCloseAfter = Number(ad.allowCloseAfter);
    const rawDuration = Number(ad.duration);
    const closeAfter = rawCloseAfter > 0 ? rawCloseAfter : (rawDuration > 0 ? Math.min(rawDuration, 8) : 5);

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
  }, [ad?.id]);

  const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : null;
  const isVideosOrReelsScreen = currentRoute === 'Videos' || currentRoute === 'VideoDetail';

  if (!ad || !currentUser || isPaidInfluencer || isVideosOrReelsScreen) {
    return null;
  }

  const handleActionPress = () => {
    if (ad?.id) {
      recordAdMetric(ad.id, 'click');
    }
    if (ad?.actionUrl) {
      Linking.openURL(ad.actionUrl).catch(() => {});
    }
  };

  const handleClose = () => {
    if (!canClose) return;
    dismissMobileAd();
  };

  return (
    <Modal
      visible={Boolean(activePopupAd && currentUser && !isPaidInfluencer && !isVideosOrReelsScreen)}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Bar: Sponsored Badge & Timer / Close */}
          <View style={styles.topBar}>
            <View style={styles.sponsoredBadge}>
              <Sparkles size={12} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={styles.sponsoredText}>Sponsored Ad</Text>
            </View>

            <View style={styles.topRightActions}>
              {isVideo && (
                <>
                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => setIsAdPaused(p => !p)}
                    activeOpacity={0.8}
                  >
                    {isAdPaused ? (
                      <Play size={16} color="#ffffff" />
                    ) : (
                      <Pause size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => setMuted(m => !m)}
                    activeOpacity={0.8}
                  >
                    {muted ? (
                      <VolumeX size={16} color="#ffffff" />
                    ) : (
                      <Volume2 size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </>
              )}

              {canClose ? (
                <TouchableOpacity
                  style={[styles.closeBtn, styles.closeBtnActive]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <X size={16} color="#ffffff" />
                  <Text style={styles.closeBtnText}>Skip Ad</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.timerBadge}>
                  <Clock size={12} color="#94a3b8" style={{ marginRight: 4 }} />
                  <Text style={styles.timerText}>Skip in {secondsRemaining}s</Text>
                </View>
              )}
            </View>
          </View>

          {/* Ad Media Display */}
          <View style={styles.mediaContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={isVideo ? () => setIsAdPaused(p => !p) : handleActionPress}
              style={StyleSheet.absoluteFillObject}
            >
              {isVideo ? (
                <>
                  {Boolean(validPoster) && (
                    <Image
                      source={{ uri: validPoster }}
                      style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
                      resizeMode="cover"
                    />
                  )}
                  <AdVideoPlayer
                    key={ad.id}
                    mediaUrl={ad.mediaUrl}
                    muted={muted}
                    setMuted={setMuted}
                    isPaused={isAdPaused}
                    setIsLoading={setIsLoading}
                  />
                  {isLoading && (
                    <View style={styles.loadingOverlay} pointerEvents="none">
                      <ActivityIndicator size="large" color={colors.primary || '#ec4899'} />
                    </View>
                  )}
                  {isAdPaused && (
                    <View style={styles.centerPlayOverlay} pointerEvents="none">
                      <View style={styles.centerPlayPill}>
                        <Play size={28} color="#ffffff" />
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Image
                  source={{ uri: validPoster || ad.mediaUrl }}
                  style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>

            <LinearGradient
              colors={['transparent', 'rgba(7,4,13,0.85)', '#07040d']}
              style={styles.bottomGradient}
            />

            {/* Bottom Overlay Information & CTA */}
            <View style={styles.bottomContent}>
              <Text style={styles.adTitle} numberOfLines={2}>
                {ad.title || 'Sponsored Advertisement'}
              </Text>

              {Boolean(ad.actionText || ad.actionUrl) && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleActionPress}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.actionBtnText}>
                      {ad.actionText || 'Visit Sponsor'}
                    </Text>
                    <ExternalLink size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: Math.min(SCREEN_WIDTH - 32, 420),
    height: Math.min(SCREEN_HEIGHT * 0.75, 600),
    backgroundColor: '#0f0a1f',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  sponsoredText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timerText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  closeBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.9)',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    zIndex: 10,
  },
  adTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 22,
  },
  actionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  centerPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 6,
  },
  centerPlayPill: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
});
