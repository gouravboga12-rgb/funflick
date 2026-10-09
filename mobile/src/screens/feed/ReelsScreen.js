import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image, Share, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Music, Bookmark, Plus, Eye, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

function formatCount(num) {
  if (!num) return '0';
  if (typeof num === 'string' && (num.includes('K') || num.includes('M'))) return num;
  const n = Number(num);
  if (isNaN(n)) return String(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function ReelItem({
  item,
  isActive,
  reelHeight,
  isReelsMuted,
  toggleMute,
  toggleLikePost,
  toggleFollowCreator,
  handleShare,
  navigation,
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const heartScale = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(item.mediaUrl, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    if (isActive && !isPaused) {
      p.play();
    }
  });

  useEffect(() => {
    if (!player) return;
    try {
      if (isActive && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    } catch {}
  }, [isActive, isPaused, player]);

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
      Animated.spring(heartScale, { toValue: 1.25, friction: 3, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!item.isLiked) {
        toggleLikePost(item.id);
      }
      triggerHeartBurst();
    } else {
      if (player) {
        try {
          if (player.playing) {
            player.pause();
            setIsPaused(true);
          } else {
            player.play();
            setIsPaused(false);
          }
        } catch {}
      }
    }
    setLastTap(now);
  };

  return (
    <View style={[styles.reelContainer, { height: reelHeight }]}>
      <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.mediaTouch}>
        {player ? (
          <VideoView
            player={player}
            style={styles.fullscreenVideo}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: item.posterUrl || item.thumbnailUrl || item.mediaUrl }}
            style={styles.fullscreenVideo}
            resizeMode="cover"
          />
        )}

        {/* Top Gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topVignette}
          pointerEvents="none"
        />

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomVignette}
          pointerEvents="none"
        />

        {/* Center Pause/Play Indicator */}
        {isPaused && (
          <View style={styles.pausedOverlay} pointerEvents="none">
            <View style={styles.pausedCircle}>
              <Play size={36} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
            </View>
          </View>
        )}

        {/* Animated Heart Burst */}
        <Animated.View
          style={[styles.burstHeartWrap, { transform: [{ scale: heartScale }] }]}
          pointerEvents="none"
        >
          <Heart size={84} color="#ff007a" fill="#ff007a" />
        </Animated.View>
      </TouchableOpacity>

      {/* Right Floating Actions Bar (Matching Web Reels) */}
      <View style={styles.rightActions} pointerEvents="box-none">
        {/* Creator Avatar with Follow Plus Badge */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={styles.avatarTouch}
            onPress={() => navigation.navigate('CreatorProfile', { username: item.creator?.username })}
          >
            <Image source={{ uri: item.creator?.avatar }} style={styles.sideAvatar} />
          </TouchableOpacity>
          {!item.isFollowing && (
            <TouchableOpacity
              style={styles.plusFollow}
              onPress={() => toggleFollowCreator(item.creator?.username)}
            >
              <Plus size={11} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Heart / Like */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => {
            toggleLikePost(item.id);
            if (!item.isLiked) triggerHeartBurst();
          }}
        >
          <Heart
            size={28}
            color={item.isLiked ? '#ff007a' : '#fff'}
            fill={item.isLiked ? '#ff007a' : 'transparent'}
            strokeWidth={2}
          />
          <Text style={styles.sideCount}>{formatCount(item.likesCount)}</Text>
        </TouchableOpacity>

        {/* Comments */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
        >
          <MessageCircle size={27} color="#fff" strokeWidth={2} />
          <Text style={styles.sideCount}>{formatCount(item.commentsCount)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.sideBtn} activeOpacity={0.7} onPress={() => handleShare(item)}>
          <Share2 size={26} color="#fff" strokeWidth={2} />
          <Text style={styles.sideCount}>Share</Text>
        </TouchableOpacity>

        {/* Bookmark / Save */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => setIsSaved(prev => !prev)}
        >
          <Bookmark
            size={25}
            color={isSaved ? '#fbbf24' : '#fff'}
            fill={isSaved ? '#fbbf24' : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Live Views */}
        <View style={styles.viewsBtn}>
          <Eye size={22} color="#f472b6" strokeWidth={2} />
          <Text style={styles.viewsCount}>{formatCount(item.viewsCount || 0)}</Text>
        </View>

        {/* Mute Pill */}
        <TouchableOpacity style={styles.mutePill} activeOpacity={0.8} onPress={toggleMute}>
          {isReelsMuted ? <VolumeX size={18} color="#fff" strokeWidth={2.2} /> : <Volume2 size={18} color="#ff007a" strokeWidth={2.2} />}
        </TouchableOpacity>
      </View>

      {/* Bottom Details Overlay (Matching Web Reels) */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={styles.creatorRow}>
          <TouchableOpacity
            style={styles.creatorHandleWrap}
            onPress={() => navigation.navigate('CreatorProfile', { username: item.creator?.username })}
          >
            <Text style={styles.creatorTag}>@{item.creator?.username}</Text>
            <View style={styles.verifiedBadge}>
              <Check size={9} color="#fff" strokeWidth={3} />
            </View>
          </TouchableOpacity>

          {!item.isFollowing && (
            <TouchableOpacity
              style={styles.followBadge}
              onPress={() => toggleFollowCreator(item.creator?.username)}
            >
              <Text style={styles.followBadgeText}>Follow</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setCaptionExpanded(prev => !prev)}
        >
          <Text style={styles.reelTitle} numberOfLines={captionExpanded ? undefined : 2}>
            {item.caption || item.title}
          </Text>
          {(item.caption || item.title)?.length > 60 && (
            <Text style={styles.moreToggleText}>
              {captionExpanded ? 'less' : '...more'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.audioRow}>
          <Music size={13} color="#ff007a" />
          <Text style={styles.audioText} numberOfLines={1}>
            Original Audio • @{item.creator?.username}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const ReelsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { posts, isReelsMuted, toggleMute, toggleLikePost, toggleFollowCreator } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(WINDOW_HEIGHT - 65);

  const videoPosts = posts.filter(
    p => p.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(p.mediaUrl || '')
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 65,
  }).current;

  const handleShare = async post => {
    try {
      await Share.share({
        message: `Watch this reel on FunFlick! https://funflick-theta.vercel.app/video/${post.id}`,
        url: `https://funflick-theta.vercel.app/video/${post.id}`,
      });
    } catch (e) {}
  };

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const h = e.nativeEvent.layout.height;
        if (h > 200 && h !== containerHeight) {
          setContainerHeight(h);
        }
      }}
    >
      {/* Top Floating Header (Matching Web Reels) */}
      <View style={[styles.topHeader, { top: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Reels</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <FlatList
        data={videoPosts}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === currentIndex}
            reelHeight={containerHeight}
            isReelsMuted={isReelsMuted}
            toggleMute={toggleMute}
            toggleLikePost={toggleLikePost}
            toggleFollowCreator={toggleFollowCreator}
            handleShare={handleShare}
            navigation={navigation}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  topHeader: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  liveBadge: {
    backgroundColor: '#ff007a',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reelContainer: {
    width: WINDOW_WIDTH,
    backgroundColor: '#000000',
    position: 'relative',
  },
  mediaTouch: {
    width: '100%',
    height: '100%',
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
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  burstHeartWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    position: 'absolute',
    bottom: 22,
    right: 12,
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  avatarTouch: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: '#1b1236',
  },
  sideAvatar: {
    width: '100%',
    height: '100%',
  },
  plusFollow: {
    position: 'absolute',
    bottom: -4,
    left: 15,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  sideBtn: {
    alignItems: 'center',
    gap: 2,
  },
  sideCount: {
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
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mutePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 76,
    zIndex: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  creatorHandleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorTag: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0070f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 14,
  },
  followBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moreToggleText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: '90%',
  },
  audioText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
  },
});
