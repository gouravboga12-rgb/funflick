import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VideoPostCard = ({ post, isActive = false, navigation }) => {
  const { toggleLikePost, recordPostView, toggleFollowCreator, isReelsMuted, toggleMute } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const isVideo = post.mediaType === 'video' && Boolean(post.mediaUrl);
  const player = useVideoPlayer(isVideo ? post.mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    if (isActive) {
      p.play();
      setIsPlaying(true);
    }
  });

  // Play/pause based on active viewport state
  useEffect(() => {
    if (!player) return;
    try {
      if (isActive) {
        player.play();
        setIsPlaying(true);
        recordPostView(post.id);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    } catch {}
  }, [isActive, player, post.id]);

  // Sync mute state
  useEffect(() => {
    if (player) {
      try {
        player.muted = isReelsMuted;
      } catch {}
    }
  }, [isReelsMuted, player]);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap -> Like
      if (!post.isLiked) {
        toggleLikePost(post.id);
      }
    } else {
      // Single tap -> Toggle Play/Pause
      if (player) {
        try {
          if (player.playing) {
            player.pause();
            setIsPlaying(false);
          } else {
            player.play();
            setIsPlaying(true);
          }
        } catch {}
      }
    }
    setLastTap(now);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this reel "${post.title}" on FunFlick! https://funflick-theta.vercel.app/video/${post.id}`,
        url: `https://funflick-theta.vercel.app/video/${post.id}`,
      });
    } catch (e) {}
  };

  return (
    <View style={styles.card}>
      {/* 1. Header: Creator Info */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.creatorRow}
          onPress={() => navigation?.navigate('CreatorProfile', { username: post.creator?.username })}
        >
          <Image source={{ uri: post.creator?.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.creatorName}>{post.creator?.name || 'Creator'}</Text>
            <Text style={styles.username}>@{post.creator?.username}</Text>
          </View>
        </TouchableOpacity>

        {!post.isFollowing && (
          <TouchableOpacity
            style={styles.followBtn}
            onPress={() => toggleFollowCreator(post.creator?.username)}
          >
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Media Player */}
      <TouchableOpacity activeOpacity={0.95} onPress={handleTap} style={styles.playerContainer}>
        {isVideo && player ? (
          <VideoView
            player={player}
            style={styles.videoPlayer}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: post.mediaUrl || post.posterUrl }}
            style={styles.videoPlayer}
            resizeMode="cover"
          />
        )}

        {/* Play Overlay if Paused */}
        {!isPlaying && isVideo && (
          <View style={styles.playOverlay}>
            <View style={styles.playIconCircle}>
              <Play size={28} color="#fff" fill="#fff" />
            </View>
          </View>
        )}

        {/* Volume Mute Toggle Button */}
        {isVideo && (
          <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
            {isReelsMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* 3. Actions Row */}
      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLikePost(post.id)}>
            <Heart
              size={24}
              color={post.isLiked ? '#ff007a' : '#fff'}
              fill={post.isLiked ? '#ff007a' : 'transparent'}
            />
            <Text style={styles.actionCount}>{post.likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation?.navigate('VideoDetail', { videoId: post.id })}
          >
            <MessageCircle size={23} color="#fff" />
            <Text style={styles.actionCount}>{post.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 size={23} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionBtn}>
          <Bookmark size={23} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 4. Caption & Details */}
      <View style={styles.captionArea}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
          <Text style={styles.timeAgo}>• {post.timeAgo}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#110920',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#261b44',
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  username: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,0,122,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.4)',
  },
  followText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  playerContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 1.15,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  muteBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  captionArea: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  caption: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});
