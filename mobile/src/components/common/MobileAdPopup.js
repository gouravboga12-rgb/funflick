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
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Volume2, VolumeX, ExternalLink, Sparkles, Clock, Play } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MobileAdPopup = () => {
  const { activePopupAd, dismissMobileAd, recordAdMetric, currentUser } = useApp();

  const isPaidInfluencer = Boolean(
    currentUser?.isInfluencer ||
    currentUser?.role === 'influencer' ||
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
  );

  const [muted, setMuted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [canClose, setCanClose] = useState(false);

  const ad = activePopupAd;
  const isVideo = Boolean(
    ad && (
      ad.type === 'video' ||
      /\.(mp4|webm|mov|m4v)($|\?)/i.test(ad.mediaUrl || '')
    )
  );

  // Set up expo-video player for video ads
  const player = useVideoPlayer(isVideo ? ad?.mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = muted;
    p.play();
  });

  useEffect(() => {
    if (player) {
      try {
        player.muted = muted;
      } catch (e) {}
    }
  }, [muted, player]);

  // Countdown timer before close is permitted
  useEffect(() => {
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

  if (!ad || isPaidInfluencer) {
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
    if (player) {
      try {
        player.pause();
      } catch (e) {}
    }
    dismissMobileAd();
  };

  return (
    <Modal
      visible={Boolean(activePopupAd)}
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
            {isVideo && player ? (
              <VideoView
                player={player}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                nativeControls={false}
              />
            ) : (
              <Image
                source={{ uri: ad.mediaUrl || ad.thumbnailUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            )}

            <LinearGradient
              colors={['transparent', 'rgba(7,4,13,0.85)', '#07040d']}
              style={styles.bottomGradient}
            />

            {/* Bottom Overlay Information & CTA */}
            <View style={styles.bottomContent}>
              <Text style={styles.adTitle} numberOfLines={2}>
                {ad.title || 'Sponsored Advertisement'}
              </Text>

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
});
