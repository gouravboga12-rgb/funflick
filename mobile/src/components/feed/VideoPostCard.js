import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VideoPostCard = ({ post, isActive = false, navigation }) => {
  const { toggleLikePost, recordPostView, toggleFollowCreator, isReelsMuted, toggleMute } = useApp();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  // Play/pause based on active viewport state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().then(() => {
        setIsPlaying(true);
        recordPostView(post.id);
      }).catch(() => {});
    } else {
      videoRef.current.pauseAsync().then(() => {
        setIsPlaying(false);
      }).catch(() => {});
    }
  }, [isActive, post.id]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(isReelsMuted);
    }
  }, [isReelsMuted]);

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
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          videoRef.current.playAsync();
          setIsPlaying(true);
        }
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
        {post.mediaType === 'video' && post.mediaUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: post.mediaUrl }}
            posterSource={{ uri: post.posterUrl || post.thumbnailUrl }}
            usePoster={true}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted={isReelsMuted}
            style={styles.videoPlayer}
          />
        ) : (
          <Image
            source={{ uri: post.mediaUrl || post.posterUrl }}
            style={styles.videoPlayer}
            resizeMode="cover"
          />
        )}

        {/* Play Overlay if Paused */}
        {!isPlaying && post.mediaType === 'video' && (
          <View style={styles.playOverlay}>
            <View style={styles.playIconCircle}>
              <Play size={28} color="#fff" fill="#fff" />
            </View>
          </View>
        )}

        {/* Volume Mute Toggle Button */}
        {post.mediaType === 'video' && (
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

          <TouchableOpacity style={styles.actionBtn}>
            <MessageCircle size={24} color="#fff" />
            <Text style={styles.actionCount}>{post.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 size={23} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Bookmark size={23} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 4. Caption & Details */}
      <View style={styles.details}>
        {post.title ? (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionUser}>@{post.creator?.username} </Text>
            {post.caption || post.title}
          </Text>
        ) : null}
        <Text style={styles.timestamp}>{post.timeAgo || 'Recently'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.cardHeader,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#231545',
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  username: {
    color: colors.textMuted,
    fontSize: 11,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  followText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  playerContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 1.15,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 4,
  },
  caption: {
    color: '#e5e7eb',
    fontSize: 13,
    lineHeight: 18,
  },
  captionUser: {
    fontWeight: '700',
    color: '#fff',
  },
  timestamp: {
    color: colors.textDim,
    fontSize: 11,
  },
});
