import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Heart, Share2, Music, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors } from '../../theme/colors';
import { apiRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

function StoryVideo({ mediaUrl, isPaused }) {
  const player = useVideoPlayer(mediaUrl, p => {
    if (!p) return;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (player) {
      if (isPaused) player.pause();
      else player.play();
    }
  }, [isPaused, player]);

  if (!player) return null;

  return (
    <VideoView
      player={player}
      style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
      contentFit="contain"
      surfaceType="textureView"
      useExoShutter={false}
      nativeControls={false}
      pointerEvents="none"
    />
  );
}

export default function StoryViewerScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { story } = route.params || {};
  const { currentUser, stories: allStories, recordStoryView, fetchLiveStories } = useApp();

  const targetStory = React.useMemo(() => {
    if (story && typeof story === 'object' && (story.stories || story.mediaUrl)) {
      return story;
    }
    if (typeof story === 'string' || typeof story === 'number') {
      const idx = parseInt(story, 10);
      if (!isNaN(idx) && allStories && allStories[idx]) {
        return allStories[idx];
      }
      return (allStories || []).find(s => String(s.id) === String(story) || String(s.userId) === String(story)) || null;
    }
    return story || null;
  }, [story, allStories]);

  const rawStories = targetStory?.stories && targetStory.stories.length > 0
    ? targetStory.stories
    : (targetStory?.mediaUrl ? [targetStory] : []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeStory = rawStories[currentIndex] || rawStories[0];

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isLiked, setIsLiked] = useState(Boolean(activeStory?.isLiked));
  const [likesCount, setLikesCount] = useState(Number(activeStory?.likesCount) || 0);
  const [isPaused, setIsPaused] = useState(false);

  // Record story view immediately upon display
  useEffect(() => {
    if (activeStory?.id) {
      recordStoryView?.(activeStory.id, targetStory?.id || targetStory?.userId);
    }
  }, [activeStory?.id, targetStory, recordStoryView]);

  useEffect(() => {
    if (activeStory) {
      setIsLiked(Boolean(activeStory.isLiked));
      setLikesCount(Number(activeStory.likesCount) || 0);
    }
  }, [currentIndex, activeStory]);

  const availableStoryGroups = React.useMemo(() => {
    return (allStories || []).filter(g => (g.stories && g.stories.length > 0) || g.mediaUrl);
  }, [allStories]);

  const currentGroupIndex = availableStoryGroups.findIndex(g =>
    String(g.id) === String(targetStory?.id) ||
    String(g.userId) === String(targetStory?.userId) ||
    (g.username && g.username === targetStory?.username)
  );

  const goToNextStory = () => {
    if (currentIndex < rawStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      progressAnim.setValue(0);
    } else if (currentGroupIndex >= 0 && currentGroupIndex < availableStoryGroups.length - 1) {
      const nextGroup = availableStoryGroups[currentGroupIndex + 1];
      navigation.replace('StoryViewer', { story: nextGroup });
    } else {
      navigation.goBack();
    }
  };

  const goToPrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      progressAnim.setValue(0);
    } else if (currentGroupIndex > 0) {
      const prevGroup = availableStoryGroups[currentGroupIndex - 1];
      navigation.replace('StoryViewer', { story: prevGroup });
    } else {
      progressAnim.setValue(0);
    }
  };

  useEffect(() => {
    let anim;
    progressAnim.setValue(0);

    if (!isPaused) {
      anim = Animated.timing(progressAnim, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      });
      anim.start(({ finished }) => {
        if (finished) {
          goToNextStory();
        }
      });
    } else {
      progressAnim.stopAnimation();
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [currentIndex, isPaused]);

  const handleToggleLike = async () => {
    if (!activeStory?.id) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const data = await apiRequest(`/stories/${activeStory.id}/like`, { method: 'POST' });
      if (data) {
        setIsLiked(Boolean(data.liked));
        setLikesCount(Number(data.likesCount) || 0);
      }
    } catch (e) {
      console.warn('Story like error:', e.message);
    }
  };

  const isOwner = Boolean(
    currentUser && (
      currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      targetStory?.isUser ||
      targetStory?.isMe ||
      String(targetStory?.userId) === String(currentUser?.id) ||
      (targetStory?.username && targetStory?.username.toLowerCase() === currentUser?.username?.toLowerCase()) ||
      String(activeStory?.user_id) === String(currentUser?.id) ||
      String(activeStory?.userId) === String(currentUser?.id) ||
      (activeStory?.username && activeStory?.username.toLowerCase() === currentUser?.username?.toLowerCase())
    )
  );

  useEffect(() => {
    console.log('[DBG][StoryViewerScreen] isOwner inputs:', {
      currentUserId: currentUser?.id,
      currentUsername: currentUser?.username,
      currentUserRole: currentUser?.role,
      targetStoryUserId: targetStory?.userId,
      targetStoryUsername: targetStory?.username,
      targetStoryIsUser: targetStory?.isUser,
      targetStoryIsMe: targetStory?.isMe,
      activeStoryId: activeStory?.id,
      activeStoryUserId: activeStory?.user_id || activeStory?.userId,
      isOwner,
    });
  }, [currentUser, targetStory, activeStory, isOwner]);

  const handleDeleteStory = () => {
    if (!activeStory?.id) return;
    setIsPaused(true);
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? It will be permanently removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsPaused(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deleteResult = await apiRequest(`/stories/${activeStory.id}`, { method: 'DELETE' });
              console.log('[DBG][StoryViewerScreen] delete API result:', {
                storyId: activeStory.id,
                deleteResult,
              });
              fetchLiveStories?.();
              if (rawStories.length > 1) {
                if (currentIndex < rawStories.length - 1) {
                  goToNextStory();
                } else {
                  goToPrevStory();
                }
              } else {
                navigation.goBack();
              }
            } catch (e) {
              console.log('[DBG][StoryViewerScreen] delete API error:', { storyId: activeStory.id, error: e?.message });
              Alert.alert('Error', e?.message || 'Failed to delete story');
              setIsPaused(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch @${targetStory?.username || 'creator'}'s story on FunFlick! https://funflick-theta.vercel.app/feed`,
      });
    } catch (e) {}
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY([15, 1000])
    .activeOffsetX([-25, 25])
    .onUpdate((e) => {
      if (e.translationY > 0 && Math.abs(e.translationY) > Math.abs(e.translationX) * 0.7) {
        translateY.setValue(e.translationY);
        const s = Math.max(0.75, 1 - (e.translationY / height) * 0.35);
        scale.setValue(s);
      } else if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.setValue(e.translationX * 0.5);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 || (e.translationY > 40 && e.velocityY > 600)) {
        Animated.timing(translateY, {
          toValue: height,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          navigation.goBack();
        });
        return;
      }

      if (e.translationX < -70 || (e.translationX < -30 && e.velocityX < -450)) {
        if (currentGroupIndex >= 0 && currentGroupIndex < availableStoryGroups.length - 1) {
          const nextGroup = availableStoryGroups[currentGroupIndex + 1];
          navigation.replace('StoryViewer', { story: nextGroup });
          return;
        } else {
          navigation.goBack();
          return;
        }
      }

      if (e.translationX > 70 || (e.translationX > 30 && e.velocityX > 450)) {
        if (currentGroupIndex > 0) {
          const prevGroup = availableStoryGroups[currentGroupIndex - 1];
          navigation.replace('StoryViewer', { story: prevGroup });
          return;
        }
      }

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();
    });

  const displayMedia = activeStory?.mediaUrl || activeStory?.media_url;
  const isVideo = activeStory?.mediaType === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(displayMedia || '');

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.storyFrame,
            {
              transform: [{ translateY }, { translateX }, { scale }],
            },
          ]}
        >
          {/* Background Media with 9:16 fitting and zero-crop blur backdrop */}
          {isVideo && displayMedia ? (
            <View style={StyleSheet.absoluteFillObject}>
              <StoryVideo key={displayMedia} mediaUrl={displayMedia} isPaused={isPaused} />
            </View>
          ) : displayMedia ? (
          <View style={StyleSheet.absoluteFillObject}>
            <Image
              source={{ uri: displayMedia }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              blurRadius={Platform.OS === 'ios' ? 25 : 15}
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            <Image
              source={{ uri: displayMedia }}
              style={styles.mediaForeground}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={[styles.mediaBackground, { backgroundColor: '#120c24' }]} />
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Tap left/right to navigate, hold to pause */}
        <View style={styles.touchArea}>
          <TouchableWithoutFeedback
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            onPress={goToPrevStory}
          >
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            onPress={goToNextStory}
          >
            <View style={{ flex: 2 }} />
          </TouchableWithoutFeedback>
        </View>

        {/* Visible Chevron Navigation Arrows on the sides */}
        <TouchableOpacity
          style={styles.leftNavArrow}
          onPress={goToPrevStory}
          activeOpacity={0.7}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rightNavArrow}
          onPress={goToNextStory}
          activeOpacity={0.7}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ChevronRight size={24} color="#ffffff" />
        </TouchableOpacity>

        <View
          style={[
            styles.contentOverlay,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 12),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Top Controls Section */}
          <View style={styles.topSection}>
            {/* Instagram-style Segmented Progress Bar */}
            <View style={styles.progressBarContainer}>
              {rawStories.map((_, idx) => (
                <View key={idx} style={styles.progressBarBg}>
                  {idx < currentIndex ? (
                    <View style={[styles.progressBarFill, { width: '100%' }]} />
                  ) : idx === currentIndex ? (
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  ) : (
                    <View style={[styles.progressBarFill, { width: '0%' }]} />
                  )}
                </View>
              ))}
            </View>

            {/* Creator Info Header */}
            <View style={styles.header}>
              <View style={styles.creatorRow}>
                {targetStory?.avatar && !targetStory.avatar.includes('default-avatar') ? (
                  <Image source={{ uri: targetStory.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.initialWrap]}>
                    <Text style={styles.initialText}>{(targetStory?.name || targetStory?.username || 'F').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.creatorName}>
                    {targetStory?.isMe ? (currentUser?.name || 'Your Story') : (targetStory?.name || targetStory?.username || 'Creator')}
                  </Text>
                  <Text style={styles.timeAgo}>
                    @{targetStory?.isMe ? (currentUser?.username || 'you') : (targetStory?.username || 'creator')} · Active 24h
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteStory}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  activeOpacity={0.7}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Music Track Badge */}
            {activeStory?.music ? (
              <View style={styles.viewerMusicBadge} pointerEvents="none">
                <Music size={13} color="#ec4899" />
                <Text style={styles.viewerMusicText} numberOfLines={1}>
                  {activeStory.music}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Caption Overlay */}
            {activeStory?.caption ? (
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{activeStory.caption}</Text>
              </View>
            ) : null}

            {/* Bottom Actions Bar (Like & Share only, no message) */}
            <View style={styles.bottomBar}>
              <View style={{ flex: 1 }} />
              {/* Like Button */}
              <TouchableOpacity
                style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
                onPress={handleToggleLike}
                activeOpacity={0.7}
              >
                <Heart
                  size={24}
                  color={isLiked ? '#ff007a' : '#ffffff'}
                  fill={isLiked ? '#ff007a' : 'transparent'}
                />
                {likesCount > 0 ? (
                  <Text style={styles.likeCountText}>{likesCount}</Text>
                ) : null}
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Share2 size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  mediaBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  mediaForeground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  leftNavArrow: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
  },
  rightNavArrow: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    elevation: 100,
    justifyContent: 'space-between',
  },
  topSection: {
    width: '100%',
    paddingTop: 8,
    gap: 8,
    zIndex: 110,
    elevation: 110,
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    zIndex: 40,
    elevation: 40,
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
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  initialWrap: {
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 50,
    elevation: 50,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239,68,68,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 50,
    elevation: 50,
  },
  viewerMusicBadge: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    maxWidth: '80%',
  },
  viewerMusicText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  viewerStickerContainer: {
    position: 'absolute',
    top: 170,
    right: 24,
    zIndex: 10,
  },
  viewerStickerText: {
    fontSize: 52,
  },
  bottomSection: {
    width: '100%',
    gap: 10,
    zIndex: 110,
    elevation: 110,
  },
  captionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  captionText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
    gap: 12,
    zIndex: 40,
    elevation: 40,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 50,
    elevation: 50,
  },
  actionBtnLiked: {
    backgroundColor: 'rgba(255,0,122,0.35)',
    borderColor: '#ff007a',
  },
  likeCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});
