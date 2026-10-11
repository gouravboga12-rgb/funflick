import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, Dimensions, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, Music, Plus, Eye, Check } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { CommentsModal } from './CommentsModal';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');



function formatCount(num) {
  if (!num) return '0';
  if (typeof num === 'string' && (num.includes('K') || num.includes('M'))) return num;
  const n = Number(num);
  if (isNaN(n)) return String(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export const VideoPostCard = ({ post, isActive = false, navigation }) => {
  const isFocused = useIsFocused();
  const { toggleLikePost, recordPostView, toggleFollowCreator, isReelsMuted, toggleMute, currentUser } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(Number(post.commentsCount) || 0);
  const [lastTap, setLastTap] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const hasRecordedViewRef = useRef(false);

  const isOwner = post.creator?.username === currentUser?.username;
  const isVideo = post.mediaType === 'video' && Boolean(post.mediaUrl);

  const player = useVideoPlayer(isVideo ? post.mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    if (isActive && isFocused && !isUserPaused) {
      p.play();
      setIsPlaying(true);
    }
  });

  // Reset user manual pause state when scrolling away to another reel
  useEffect(() => {
    if (!isActive) {
      setIsUserPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    hasRecordedViewRef.current = false;
  }, [post.id]);

  // Play/pause based on active viewport state, screen focus, and user pause toggle
  useEffect(() => {
    if (!player) return;
    let viewTimer = null;
    try {
      if (isActive && isFocused && !isUserPaused) {
        player.play();
        setIsPlaying(true);
        // Only count view after 5 seconds of continuous playback
        if (!hasRecordedViewRef.current && recordPostView) {
          viewTimer = setTimeout(() => {
            if (!hasRecordedViewRef.current) {
              hasRecordedViewRef.current = true;
              recordPostView(post.id);
            }
          }, 5000);
        }
      } else {
        player.pause();
        setIsPlaying(false);
      }
    } catch {}

    return () => {
      if (viewTimer) clearTimeout(viewTimer);
    };
  }, [isActive, isFocused, isUserPaused, player, post.id, recordPostView]);

  // Sync mute state
  useEffect(() => {
    if (player) {
      try {
        player.muted = isReelsMuted;
      } catch {}
    }
  }, [isReelsMuted, player]);

  const triggerHeartBurst = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.2, friction: 3, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap -> Like with burst animation
      if (!post.isLiked) {
        toggleLikePost(post.id);
      }
      triggerHeartBurst();
    } else {
      // Single tap -> Toggle Play/Pause reliably
      if (player) {
        try {
          if (!isUserPaused) {
            player.pause();
            setIsUserPaused(true);
            setIsPlaying(false);
          } else {
            player.play();
            setIsUserPaused(false);
            setIsPlaying(true);
          }
        } catch (e) {
          console.warn('Video toggle play error:', e?.message);
        }
      }
    }
    setLastTap(now);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch "${post.title}" on FunFlick! https://funflick-theta.vercel.app/video/${post.id}`,
        url: `https://funflick-theta.vercel.app/video/${post.id}`,
      });
    } catch (e) {}
  };

  return (
    <View style={styles.card}>
      {/* Media Player Container */}
      <TouchableOpacity activeOpacity={0.96} onPress={handleTap} style={styles.playerContainer}>
        {isVideo && player ? (
          <VideoView
            player={player}
            style={styles.videoPlayer}
            contentFit="cover"
            nativeControls={false}
            pointerEvents="none"
          />
        ) : (
          <Image
            source={{ uri: post.mediaUrl || post.posterUrl }}
            style={styles.videoPlayer}
            resizeMode="cover"
          />
        )}

        {/* Top Vignette Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={styles.topVignette}
          pointerEvents="none"
        />

        {/* Bottom Vignette Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomVignette}
          pointerEvents="none"
        />

        {/* Center Pause Indicator */}
        {(!isPlaying || isUserPaused) && isVideo && (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playIconCircle}>
              <Play size={32} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
            </View>
          </View>
        )}

        {/* Double-tap animated heart burst */}
        <Animated.View
          style={[
            styles.burstHeartWrap,
            { transform: [{ scale: heartScale }] },
          ]}
          pointerEvents="none"
        >
          <Heart size={80} color="#ff007a" fill="#ff007a" />
        </Animated.View>

        {/* Top-Right Mute Pill Button */}
        {isVideo && (
          <TouchableOpacity style={styles.muteBtn} activeOpacity={0.8} onPress={toggleMute}>
            {isReelsMuted ? <VolumeX size={18} color="#fff" strokeWidth={2.2} /> : <Volume2 size={18} color="#ff007a" strokeWidth={2.2} />}
          </TouchableOpacity>
        )}

        {/* Bottom Details Overlay (Instagram Reels Style) */}
        <View style={styles.bottomOverlay} pointerEvents="box-none">
          {/* Creator handle + Follow button */}
          <View style={styles.creatorRow}>
            <TouchableOpacity
              onPress={() => navigation?.navigate('CreatorProfile', { username: post.creator?.username })}
              style={styles.handleBtn}
            >
              <Text style={styles.creatorHandle}>@{post.creator?.username}</Text>
              <View style={styles.verifiedDot}>
                <Check size={9} color="#fff" strokeWidth={3} />
              </View>
            </TouchableOpacity>

            {!isOwner && (
              <TouchableOpacity
                style={[styles.followBtn, post.isFollowing && styles.followingBtn]}
                onPress={() => toggleFollowCreator(post.creator?.username)}
              >
                <Text style={[styles.followText, post.isFollowing && styles.followingText]}>
                  {post.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Caption */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCaptionExpanded(prev => !prev)}
            style={styles.captionWrap}
          >
            <Text
              style={styles.captionText}
              numberOfLines={captionExpanded ? undefined : 2}
            >
              {post.caption || post.title}
            </Text>
            {(post.caption || post.title)?.length > 60 && (
              <Text style={styles.moreText}>
                {captionExpanded ? 'less' : '...more'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Audio Track Pill */}
          <View style={styles.audioPill}>
            <Music size={12} color="#ff007a" />
            <Text style={styles.audioTitle} numberOfLines={1}>
              {post.audioTitle || `Original Audio • @${post.creator?.username}`}
            </Text>
          </View>
        </View>

        {/* Right Floating Vertical Action Bar */}
        <View style={styles.rightActionsBar} pointerEvents="box-none">
          {/* Creator Avatar with Follow Plus Badge */}
          <View style={styles.avatarActionWrap}>
            <TouchableOpacity
              onPress={() => navigation?.navigate('CreatorProfile', { username: post.creator?.username })}
              style={styles.avatarTouch}
            >
              {post.creator?.avatar && !avatarErr ? (
                <Image
                  source={{ uri: post.creator?.avatar }}
                  style={styles.sideAvatar}
                  onError={() => setAvatarErr(true)}
                />
              ) : (
                <View style={[styles.sideAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {(post.creator?.name || post.creator?.username || 'F').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {!post.isFollowing && !isOwner && (
              <TouchableOpacity
                onPress={() => toggleFollowCreator(post.creator?.username)}
                style={styles.plusFollowBadge}
              >
                <Plus size={11} color="#fff" strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>

          {/* Like */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => {
              toggleLikePost(post.id);
              if (!post.isLiked) triggerHeartBurst();
            }}
          >
            <Heart
              size={26}
              color={post.isLiked ? '#ff007a' : '#fff'}
              fill={post.isLiked ? '#ff007a' : 'transparent'}
              strokeWidth={2}
            />
            <Text style={styles.actionCount}>{formatCount(post.likesCount)}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setIsCommentsOpen(true)}
          >
            <MessageCircle size={25} color="#fff" strokeWidth={2} />
            <Text style={styles.actionCount}>{formatCount(commentsCount)}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleShare}>
            <Share2 size={24} color="#fff" strokeWidth={2} />
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* Bookmark / Save */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setIsSaved(prev => !prev)}
          >
            <Bookmark
              size={24}
              color={isSaved ? '#fbbf24' : '#fff'}
              fill={isSaved ? '#fbbf24' : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Live Views */}
          <View style={styles.viewsBtn}>
            <Eye size={20} color="#f472b6" strokeWidth={2} />
            <Text style={styles.viewsCount}>{formatCount(post.viewsCount || 0)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Instagram-style Comments Bottom Sheet */}
      <CommentsModal
        visible={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={post.id}
        onCommentAdded={() => setCommentsCount((c) => c + 1)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0515',
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    aspectRatio: 9 / 16,
  },
  playerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
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
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  burstHeartWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 68,
    zIndex: 5,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  handleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorHandle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0070f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  followText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  followingText: {
    color: '#ffffff',
  },
  captionWrap: {
    marginBottom: 6,
  },
  captionText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13.5,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moreText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: '90%',
  },
  audioTitle: {
    color: '#e5e7eb',
    fontSize: 11.5,
    fontWeight: '600',
  },
  rightActionsBar: {
    position: 'absolute',
    bottom: 16,
    right: 10,
    alignItems: 'center',
    gap: 14,
    zIndex: 6,
  },
  avatarActionWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarTouch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: '#1b1236',
  },
  sideAvatar: {
    width: '100%',
    height: '100%',
  },
  plusFollowBadge: {
    position: 'absolute',
    bottom: -4,
    left: 14,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 2,
  },
  actionCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewsBtn: {
    alignItems: 'center',
    gap: 1,
  },
  viewsCount: {
    color: '#f472b6',
    fontSize: 10.5,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  avatarFallback: {
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
