import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image, Share } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Music, Bookmark } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

function ReelItem({
  item,
  isActive,
  isReelsMuted,
  toggleMute,
  toggleLikePost,
  toggleFollowCreator,
  handleShare,
  navigation,
}) {
  const [isPaused, setIsPaused] = useState(false);

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

  const handleTap = () => {
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
  };

  return (
    <View style={styles.reelContainer}>
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

        {isPaused && (
          <View style={styles.pausedOverlay}>
            <View style={styles.pausedCircle}>
              <Play size={36} color="#fff" fill="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Right Floating Actions Column */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => navigation.navigate('CreatorProfile', { username: item.creator?.username })}
        >
          <Image source={{ uri: item.creator?.avatar }} style={styles.sideAvatar} />
          {!item.isFollowing && (
            <TouchableOpacity
              style={styles.plusFollow}
              onPress={() => toggleFollowCreator(item.creator?.username)}
            >
              <Text style={styles.plusFollowText}>+</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={() => toggleLikePost(item.id)}>
          <Heart
            size={30}
            color={item.isLiked ? '#ff007a' : '#fff'}
            fill={item.isLiked ? '#ff007a' : 'transparent'}
          />
          <Text style={styles.sideCount}>{item.likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
        >
          <MessageCircle size={28} color="#fff" />
          <Text style={styles.sideCount}>{item.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={() => handleShare(item)}>
          <Share2 size={26} color="#fff" />
          <Text style={styles.sideCount}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn}>
          <Bookmark size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mutePill} onPress={toggleMute}>
          {isReelsMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Bottom Details Overlay */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatorProfile', { username: item.creator?.username })}
        >
          <Text style={styles.creatorTag}>@{item.creator?.username}</Text>
        </TouchableOpacity>
        <Text style={styles.reelTitle} numberOfLines={2}>
          {item.caption || item.title}
        </Text>
        <View style={styles.audioRow}>
          <Music size={13} color="#fff" />
          <Text style={styles.audioText} numberOfLines={1}>
            Original Audio • @{item.creator?.username}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const ReelsScreen = ({ navigation }) => {
  const { posts, isReelsMuted, toggleMute, toggleLikePost, toggleFollowCreator } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  const videoPosts = posts.filter(
    p => p.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(p.mediaUrl || '')
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
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
    <View style={styles.container}>
      <FlatList
        data={videoPosts}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === currentIndex}
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
        snapToInterval={WINDOW_HEIGHT - 60}
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
    backgroundColor: '#000',
  },
  reelContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT - 60,
    backgroundColor: '#000',
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
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 40,
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  sideAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#231545',
  },
  plusFollow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusFollowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  sideBtn: {
    alignItems: 'center',
    gap: 2,
  },
  sideCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mutePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 14,
    bottom: 24,
    right: 70,
    gap: 6,
    zIndex: 10,
  },
  creatorTag: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelTitle: {
    color: '#f3f4f6',
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  audioText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '500',
  },
});
