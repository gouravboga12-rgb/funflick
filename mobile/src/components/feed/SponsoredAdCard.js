import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ExternalLink, Volume2, VolumeX } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = Math.min(Math.round(SCREEN_WIDTH * 1.25), Math.round(SCREEN_HEIGHT * 0.65));

export const SponsoredAdCard = ({ ad, isActive = false }) => {
  const isFocused = useIsFocused();
  const { isReelsMuted, toggleMute, recordAdMetric, isPaidInfluencer } = useApp();
  const hasRecordedImpression = useRef(false);

  if (!ad || isPaidInfluencer) return null;

  const isVideo = Boolean(
    ad && (
      ad.type === 'video' ||
      /\.(mp4|webm|mov|m4v)($|\?)/i.test(ad.mediaUrl || '')
    )
  );

  const player = useVideoPlayer(isVideo ? ad?.mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    if (isFocused) {
      p.play();
    }
  });

  useEffect(() => {
    if (!player) return;
    try {
      if (isFocused) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {}
  }, [isFocused, player]);

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

        {/* Audio Mute Button for Video Ads */}
        {isVideo && (
          <TouchableOpacity
            style={styles.muteBtn}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isReelsMuted ? (
              <VolumeX size={16} color="#ffffff" />
            ) : (
              <Volume2 size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(7,4,13,0.8)']}
          style={styles.bottomGradient}
        />

        {/* Bottom CTA Bar */}
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
  mediaWrapper: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative',
  },
  muteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
