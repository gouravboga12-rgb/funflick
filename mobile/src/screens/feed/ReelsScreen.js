import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image, Share, Animated, Platform, RefreshControl, Modal } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Music, Bookmark, Plus, Eye, Check, MoreVertical, Download, Flag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { CommentsModal } from '../../components/feed/CommentsModal';
import { ReportModal } from '../../components/common/ReportModal';
import { downloadMediaFile } from '../../services/mediaDownloadService';
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

export function ReelItem({
  item,
  isActive,
  isScreenFocused,
  reelHeight,
  isReelsMuted: propMuted,
  toggleMute: propToggleMute,
  isReelsPaused: propPaused,
  togglePlayPause: propTogglePlayPause,
  toggleLikePost,
  toggleFollowCreator,
  recordPostView,
  handleShare,
  navigation,
}) {
  const insets = useSafeAreaInsets();
  const {
    toggleSavePost,
    isReelsMuted: appMuted,
    toggleMute: appToggleMute,
    isReelsPaused: appPaused,
    togglePlayPause: appTogglePlayPause,
    currentUser,
    activePopupAd,
    mediaLimits,
  } = useApp();

  const isReelsMuted = propMuted !== undefined ? propMuted : appMuted;
  const toggleMute = propToggleMute || appToggleMute;
  const isReelsPaused = propPaused !== undefined ? propPaused : appPaused;
  const togglePlayPause = propTogglePlayPause || appTogglePlayPause;

  // Check if current user is owner of this reel (never show follow option on own content)
  const isOwner = Boolean(
    (currentUser?.username && item?.creator?.username && currentUser.username.toLowerCase() === item.creator.username.toLowerCase()) ||
    (currentUser?.id && item?.creator?.id && Number(currentUser.id) === Number(item.creator.id))
  );

  // Dynamic admin showcase limit (defaults: Reels 30s)
  const maxShowcaseDuration = Number(mediaLimits?.maxReelDuration) || 30;

  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(item?.isSaved));
  const [lastTap, setLastTap] = useState(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const hasRecordedViewRef = useRef(false);

  // 3-Dots More Options & Reporting State
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    setIsSaved(Boolean(item?.isSaved));
  }, [item?.isSaved]);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(Number(item?.commentsCount ?? item?.comments_count ?? 0));

  useEffect(() => {
    setLocalCommentsCount(Number(item?.commentsCount ?? item?.comments_count ?? 0));
  }, [item?.commentsCount, item?.comments_count]);

  // Optimistic like state so likes work instantly in Reels feed and in Discovery/Trending modal
  const [localLiked, setLocalLiked] = useState(Boolean(item?.isLiked || item?.user_liked));
  const [localLikesCount, setLocalLikesCount] = useState(Number(item?.likesCount ?? item?.likes_count ?? 0));

  useEffect(() => {
    setLocalLiked(Boolean(item?.isLiked || item?.user_liked));
    setLocalLikesCount(Number(item?.likesCount ?? item?.likes_count ?? 0));
  }, [item?.id, item?.isLiked, item?.user_liked, item?.likesCount, item?.likes_count]);

  const mediaUrl = item?.mediaUrl || item?.video_url || item?.videoUrl || '';
  const isVideo = item?.mediaType === 'video' ||
    /\.(mp4|webm|mov|m4v)($|\?)/i.test(mediaUrl) ||
    (!item?.mediaType && !/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(mediaUrl));

  // Safe poster URI that is NOT an mp4 video URL
  const validPoster = (() => {
    const candidates = [
      item?.posterUrl,
      item?.thumbnailUrl,
      item?.thumbnail,
      item?.poster,
      item?.mediaUrl,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim() && !/\.(mp4|webm|mov|m4v)($|\?)/i.test(c)) {
        return c.trim();
      }
    }
    return null;
  })();

  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    setIsVideoReady(false);
  }, [item?.id, isActive]);

  // Hardware decoder safeguard: ONLY mount player on active reel when screen is focused AND no popup ad is active
  const shouldMountPlayer = Boolean(isVideo && isActive && isScreenFocused && !activePopupAd);

  const player = useVideoPlayer(shouldMountPlayer ? mediaUrl : null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isReelsMuted;
    if (shouldMountPlayer && !isReelsPaused && !activePopupAd) {
      p.play();
    }
  });

  // Track player readiness to eliminate black screen flicker on swipe
  useEffect(() => {
    if (!player) {
      setIsVideoReady(false);
      return;
    }
    if (player.status === 'readyToPlay') {
      setIsVideoReady(true);
    }
    const statusSub = player.addListener ? player.addListener('statusChange', (payload) => {
      if (payload?.status === 'readyToPlay') {
        setIsVideoReady(true);
      }
    }) : null;
    const playSub = player.addListener ? player.addListener('playingChange', (payload) => {
      if (payload?.isPlaying) {
        setIsVideoReady(true);
      }
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
    hasRecordedViewRef.current = false;
  }, [item?.id]);

  useEffect(() => {
    if (!player) return;
    let viewTimer = null;
    try {
      if (shouldMountPlayer && !isReelsPaused && !activePopupAd) {
        player.play();
        // Record view only after 5 seconds of continuous playback
        if (!hasRecordedViewRef.current && recordPostView && item?.id) {
          viewTimer = setTimeout(() => {
            if (!hasRecordedViewRef.current) {
              hasRecordedViewRef.current = true;
              recordPostView(item.id);
            }
          }, 5000);
        }
      } else {
        player.pause();
      }
    } catch {}

    return () => {
      if (viewTimer) clearTimeout(viewTimer);
    };
  }, [shouldMountPlayer, isReelsPaused, activePopupAd, player, item?.id, recordPostView]);

  // Enforce Admin Reel Duration showcase limit: loops back to 0s when currentTime reaches maxShowcaseDuration
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener ? player.addListener('timeUpdate', (event) => {
      if (event && event.currentTime >= maxShowcaseDuration) {
        try {
          player.seekTo(0);
        } catch (e) {}
      }
    }) : null;

    return () => {
      sub?.remove?.();
    };
  }, [player, maxShowcaseDuration]);

  // Clean unmount pause to prevent audio leaking into other screens
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
    if (player) {
      try {
        player.muted = isReelsMuted;
      } catch {}
    }
  }, [isReelsMuted, player]);

  const tapTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const triggerHeartBurst = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.25, friction: 3, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const webVideoRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = isReelsMuted;
      if (isActive && isScreenFocused && !isReelsPaused && !activePopupAd) {
        webVideoRef.current.play().catch(() => {});
      } else {
        webVideoRef.current.pause();
      }

      // Enforce admin max showcase limit on web
      const handleWebTime = () => {
        if (webVideoRef.current && webVideoRef.current.currentTime >= maxShowcaseDuration) {
          webVideoRef.current.currentTime = 0;
        }
      };
      const el = webVideoRef.current;
      el.addEventListener('timeupdate', handleWebTime);
      return () => {
        el.removeEventListener('timeupdate', handleWebTime);
      };
    }
  }, [isActive, isScreenFocused, isReelsPaused, isReelsMuted, activePopupAd, maxShowcaseDuration]);

  const handleTogglePlayPause = () => {
    togglePlayPause();
  };

  const handleToggleLike = () => {
    const nextLiked = !localLiked;
    setLocalLiked(nextLiked);
    setLocalLikesCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (toggleLikePost && item?.id) {
      toggleLikePost(item.id);
    }
    if (nextLiked) {
      triggerHeartBurst();
    }
  };

  const lastTapRef = useRef(0);

  const handleMediaPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      if (!localLiked) {
        handleToggleLike();
      } else {
        triggerHeartBurst();
      }
    } else {
      lastTapRef.current = now;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
        tapTimeoutRef.current = null;
      }, 220);
    }
  };

  return (
    <View style={[styles.reelContainer, { height: reelHeight }]}>
      {/* Background Media — 2-Layer Instagram-style display (No Cropping, Ambient Backdrop) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {/* Layer 1: Ambient Blurred Backdrop matching Instagram */}
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

        {/* Layer 2: True Aspect-Ratio Video (Never Cropped or Zoomed in) */}
        {shouldMountPlayer && player && (
          Platform.OS === 'web' ? (
            <video
              ref={webVideoRef}
              src={item.mediaUrl}
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
              style={styles.fullscreenVideo}
              contentFit="contain"
              surfaceType="textureView"
              useExoShutter={false}
              nativeControls={false}
            />
          )
        )}

        {/* Persistent Poster Image until first video frame is decoded & ready to play — eliminates black flash on swipe */}
        {(!isVideoReady || !shouldMountPlayer || !player) && validPoster && (
          <Image
            source={{ uri: validPoster }}
            style={[styles.fullscreenVideo, StyleSheet.absoluteFillObject]}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Dedicated Tap Layer Covering Entire Screen */}
      <TouchableOpacity activeOpacity={1} onPress={handleMediaPress} style={StyleSheet.absoluteFillObject} />

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

      {/* Animated Heart Burst */}
      <Animated.View
        style={[styles.burstHeartWrap, { transform: [{ scale: heartScale }] }]}
        pointerEvents="none"
      >
        <Heart size={84} color="#ff007a" fill="#ff007a" />
      </Animated.View>

      {/* Top Right Floating Controls: Mute Pill and Play/Pause Pill safely placed away from bottom phone navigation gestures */}
      <View style={[styles.topRightControls, { top: Math.max(insets.top, 16) + 12 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.topMutePill} activeOpacity={0.8} onPress={toggleMute}>
          {isReelsMuted ? <VolumeX size={18} color="#fff" strokeWidth={2.2} /> : <Volume2 size={18} color="#ff007a" strokeWidth={2.2} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topMutePill, { marginTop: 10 }]} activeOpacity={0.8} onPress={togglePlayPause}>
          {isReelsPaused ? <Play size={17} color="#ff007a" fill="#ff007a" style={{ marginLeft: 2 }} /> : <Pause size={17} color="#fff" fill="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Center Pause/Play Indicator: prominent frosted circle with PAUSED badge when paused — strictly only on active & focused reel */}
      {Boolean(isActive && isScreenFocused && isReelsPaused) && (
        <View style={styles.pausedOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.pausedCircle} onPress={togglePlayPause} activeOpacity={0.85}>
            <Play size={34} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
            <Text style={styles.pausedBadgeText}>PAUSED</Text>
          </TouchableOpacity>
        </View>
      )}

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
          {!isOwner && !item.isFollowing && (
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
          onPress={handleToggleLike}
        >
          <Heart
            size={28}
            color={localLiked ? '#ff007a' : '#fff'}
            fill={localLiked ? '#ff007a' : 'transparent'}
            strokeWidth={2}
          />
          <Text style={styles.sideCount}>{formatCount(localLikesCount)}</Text>
        </TouchableOpacity>

        {/* Comments */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => setIsCommentsOpen(true)}
        >
          <MessageCircle size={27} color="#fff" strokeWidth={2} />
          <Text style={styles.sideCount}>{formatCount(localCommentsCount)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (handleShare) {
              handleShare(item);
            } else {
              const shareUrl = `https://funflick.in/video/${item.id}`;
              Share.share({
                title: item.title || 'Watch on FunFlick',
                message: `Watch "${item.title || 'this reel'}" on FunFlick!\n${shareUrl}`,
                url: shareUrl,
              }).catch(() => {});
            }
          }}
        >
          <Share2 size={26} color="#fff" strokeWidth={2} />
          <Text style={styles.sideCount}>Share</Text>
        </TouchableOpacity>

        {/* Bookmark / Save */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => {
            setIsSaved(prev => !prev);
            if (toggleSavePost && item?.id) {
              toggleSavePost(item.id);
            }
          }}
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

        {/* 3-Dots More Options (Replaces Duplicate Pause Button with Report, Download, Share) */}
        <TouchableOpacity
          style={styles.sideBtn}
          activeOpacity={0.7}
          onPress={() => setIsMoreMenuOpen(true)}
        >
          <View style={styles.moreIconPill}>
            <MoreVertical size={20} color="#fff" />
          </View>
          <Text style={styles.sideCount}>More</Text>
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

          {!isOwner && !item.isFollowing && (
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
          {item.title && item.title !== item.caption ? (
            <Text style={styles.reelHeading} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}
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

      {/* Comments Drawer Modal */}
      <CommentsModal
        visible={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={item?.id}
        onCommentAdded={() => setLocalCommentsCount(c => c + 1)}
      />

      {/* 3-Dots Options Menu Modal (Instagram Style) */}
      <Modal
        visible={isMoreMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMoreMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setIsMoreMenuOpen(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />

            {/* Report Option */}
            <TouchableOpacity
              style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}
              onPress={() => {
                setIsMoreMenuOpen(false);
                setIsReportModalOpen(true);
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(244,63,94,0.15)' }]}>
                <Flag size={18} color="#f43f5e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuOptionText, { color: '#f43f5e', fontWeight: '800' }]}>Report Reel</Text>
                <Text style={styles.menuOptionSub}>Flag inappropriate or copyright content</Text>
              </View>
            </TouchableOpacity>

            {/* Download Option */}
            <TouchableOpacity
              style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}
              onPress={() => {
                setIsMoreMenuOpen(false);
                downloadMediaFile(mediaUrl, `funflick_${item?.id || 'reel'}.mp4`);
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Download size={18} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuOptionText}>Download Video</Text>
                <Text style={styles.menuOptionSub}>Save directly to your phone gallery</Text>
              </View>
            </TouchableOpacity>

            {/* Share Option */}
            <TouchableOpacity
              style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}
              onPress={() => {
                setIsMoreMenuOpen(false);
                if (handleShare) {
                  handleShare(item);
                } else {
                  const shareUrl = `https://funflick.in/video/${item.id}`;
                  Share.share({
                    title: item.title || 'Watch on FunFlick',
                    message: `Watch "${item.title || 'this reel'}" on FunFlick!\n${shareUrl}`,
                    url: shareUrl,
                  }).catch(() => {});
                }
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(0,112,243,0.15)' }]}>
                <Share2 size={18} color="#0070f3" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuOptionText}>Share Reel</Text>
                <Text style={styles.menuOptionSub}>Share link with friends and social apps</Text>
              </View>
            </TouchableOpacity>

            {/* Save to Collection */}
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setIsMoreMenuOpen(false);
                setIsSaved(prev => !prev);
                if (toggleSavePost && item?.id) {
                  toggleSavePost(item.id);
                }
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Bookmark size={18} color={isSaved ? '#fbbf24' : '#ffffff'} fill={isSaved ? '#fbbf24' : 'transparent'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuOptionText}>{isSaved ? 'Remove from Saved' : 'Save to Collection'}</Text>
                <Text style={styles.menuOptionSub}>Add to your private bookmarked reels</Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.menuCloseBtn}
              onPress={() => setIsMoreMenuOpen(false)}
            >
              <Text style={styles.menuCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* In-App Content Report Modal */}
      <ReportModal
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetVideoId={item?.id}
        targetUsername={item?.creator?.username}
        title={item?.title}
      />
    </View>
  );
}

export const ReelsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const {
    posts,
    isReelsMuted,
    toggleMute,
    isReelsPaused,
    togglePlayPause,
    toggleLikePost,
    toggleFollowCreator,
    recordPostView,
    isAuthenticated,
    currentUser,
  } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(WINDOW_HEIGHT - 65);
  const [reelsData, setReelsData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch category-personalized and dynamically seeded video-only feed
  const fetchDedicatedReels = useCallback(async (newSeed) => {
    try {
      const seedParam = newSeed || Date.now();
      const res = await apiRequest(`/videos/reels?limit=25&seed=${seedParam}`);
      if (res && res.videos && Array.isArray(res.videos) && res.videos.length > 0) {
        const mapped = res.videos.map(v => {
          const safePoster = v.thumbnail_url && !/\.(mp4|webm|mov|m4v)($|\?)/i.test(v.thumbnail_url) ? v.thumbnail_url : null;
          return {
            id: v.id,
            title: v.title || 'FunFlick Video',
            caption: v.description || v.title || '',
            category: v.category || 'Comedy',
            mediaType: 'video',
            mediaUrl: v.video_url,
            posterUrl: safePoster,
            thumbnailUrl: safePoster,
            likesCount: Number(v.likes_count) || 0,
            viewsCount: String(v.views_count || '0'),
            commentsCount: Number(v.comments_count) || 0,
            isLiked: Boolean(v.user_liked),
            isFollowing: Boolean(v.user_following),
            isSaved: false,
            creator: {
              id: v.creator_id,
              name: v.creator_name || 'Creator',
              username: v.creator_username || 'creator',
              avatar: v.creator_avatar || 'https://funflick.in/brand/funflick-logo.png',
            },
          };
        });
        setReelsData(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch dedicated reels feed:', err);
    }
  }, []);

  useEffect(() => {
    fetchDedicatedReels();
  }, [fetchDedicatedReels]);

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Regenerate seed to reshuffle and prioritize fresh/different videos
      await fetchDedicatedReels(Date.now());
      setCurrentIndex(0);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fallbackVideoPosts = (posts || []).filter(
    p => p.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(p.mediaUrl || '')
  );

  const displayVideos = reelsData.length > 0 ? reelsData : fallbackVideoPosts;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIdx = viewableItems[0].index || 0;
      setCurrentIndex(newIdx);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 65,
  }).current;

  const handleShare = async post => {
    try {
      const shareUrl = `https://funflick.in/video/${post?.id}`;
      await Share.share({
        title: post?.title || 'Watch on FunFlick',
        message: `Watch "${post?.title || 'this video'}" on FunFlick!\n${shareUrl}`,
        url: shareUrl,
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
      {/* Top Floating Header (Matching Web Videos) */}
      <View style={[styles.topHeader, { top: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Videos</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <FlatList
        data={displayVideos}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === currentIndex}
            isScreenFocused={isFocused}
            reelHeight={containerHeight}
            isReelsMuted={isReelsMuted}
            toggleMute={toggleMute}
            isReelsPaused={isReelsPaused}
            togglePlayPause={togglePlayPause}
            toggleLikePost={toggleLikePost}
            toggleFollowCreator={toggleFollowCreator}
            recordPostView={recordPostView}
            handleShare={handleShare}
            navigation={navigation}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
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
    zIndex: 25,
    elevation: 25,
  },
  pausedCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    elevation: 30,
  },
  pausedBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  topRightControls: {
    position: 'absolute',
    right: 14,
    zIndex: 40,
    elevation: 40,
  },
  topMutePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  playPausePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    zIndex: 35,
    elevation: 35,
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
    fontSize: 13,
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
    fontSize: 11.5,
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
    zIndex: 30,
    elevation: 30,
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
    fontSize: 17,
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
    fontSize: 12,
    fontWeight: '700',
  },
  reelHeading: {
    color: '#ffffff',
    fontSize: 16.5,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 15.5,
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moreToggleText: {
    color: '#f472b6',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
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
    fontSize: 12.5,
    fontWeight: '600',
  },
  moreIconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#120a24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  menuHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  menuOptionSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  menuCloseBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuCloseText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
});
