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
  Modal,
  ActivityIndicator,
  AppState,
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
  if (Platform.OS === 'web') {
    return (
      <video
        src={mediaUrl}
        autoPlay
        playsInline
        muted={false}
        loop={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000000',
        }}
      />
    );
  }

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
    p.loop = false;
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
        player.staysActiveInBackground = false;
        if (shouldPlay) player.play();
        else player.pause();
      } catch (e) {}
    }
  }, [shouldPlay, player]);

  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

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
  const { currentUser, stories: allStories, recordStoryView, fetchLiveStories, deleteStory } = useApp();

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

  const rawStories = React.useMemo(() => {
    return targetStory?.stories && targetStory.stories.length > 0
      ? targetStory.stories
      : (targetStory?.mediaUrl ? [targetStory] : []);
  }, [targetStory]);

  const [storiesList, setStoriesList] = useState(rawStories);

  useEffect(() => {
    if (rawStories && rawStories.length > 0) {
      setStoriesList(rawStories);
    }
  }, [rawStories]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeStory = storiesList[currentIndex] || storiesList[0];

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isLiked, setIsLiked] = useState(Boolean(activeStory?.isLiked));
  const [likesCount, setLikesCount] = useState(Number(activeStory?.likesCount) || 0);
  const [isPaused, setIsPaused] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const currentProgressRef = useRef(0);

  const goToNextStory = () => {
    currentProgressRef.current = 0;
    progressAnim.setValue(0);
    if (currentIndex < storiesList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (currentGroupIndex >= 0 && currentGroupIndex < availableStoryGroups.length - 1) {
      const nextGroup = availableStoryGroups[currentGroupIndex + 1];
      navigation.replace('StoryViewer', { story: nextGroup });
    } else {
      navigation.goBack();
    }
  };

  const goToPrevStory = () => {
    currentProgressRef.current = 0;
    progressAnim.setValue(0);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      const prevGroup = availableStoryGroups[currentGroupIndex - 1];
      navigation.replace('StoryViewer', { story: prevGroup });
    } else {
      progressAnim.setValue(0);
    }
  };

  useEffect(() => {
    let anim;

    if (!isPaused && !showDeleteModal) {
      const remainingTime = Math.max(300, STORY_DURATION * (1 - currentProgressRef.current));
      anim = Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingTime,
        useNativeDriver: false,
      });
      anim.start(({ finished }) => {
        if (finished) {
          currentProgressRef.current = 0;
          goToNextStory();
        }
      });
    } else {
      progressAnim.stopAnimation((val) => {
        currentProgressRef.current = typeof val === 'number' ? val : 0;
      });
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [currentIndex, isPaused, showDeleteModal]);

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
      currentUser?.role === 'moderator' ||
      currentUser?.username === 'mrspysoal_16' ||
      currentUser?.username === 'gourav.boga1' ||
      targetStory?.isUser ||
      targetStory?.isMe ||
      String(targetStory?.userId) === String(currentUser?.id) ||
      (targetStory?.username && targetStory?.username.toLowerCase() === currentUser?.username?.toLowerCase()) ||
      String(activeStory?.user_id) === String(currentUser?.id) ||
      String(activeStory?.userId) === String(currentUser?.id) ||
      (activeStory?.username && activeStory?.username.toLowerCase() === currentUser?.username?.toLowerCase())
    )
  );

  const handleOpenDeleteModal = () => {
    setIsPaused(true);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const storyIdToDelete = activeStory?.id || targetStory?.id;
    if (!storyIdToDelete) {
      setShowDeleteModal(false);
      setIsPaused(false);
      return;
    }
    try {
      setIsDeleting(true);
      if (deleteStory) {
        await deleteStory(storyIdToDelete);
      } else {
        await apiRequest(`/stories/${storyIdToDelete}`, { method: 'DELETE' });
        if (fetchLiveStories) await fetchLiveStories();
      }

      setIsDeleting(false);
      setShowDeleteModal(false);

      const remaining = storiesList.filter(s => String(s.id) !== String(storyIdToDelete));
      if (remaining.length === 0) {
        navigation.goBack();
      } else {
        setStoriesList(remaining);
        const nextIdx = Math.min(currentIndex, remaining.length - 1);
        setCurrentIndex(nextIdx);
        currentProgressRef.current = 0;
        progressAnim.setValue(0);
        setIsPaused(false);
      }
    } catch (e) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Delete Failed', e?.message || 'Could not delete story. Please try again.');
      setIsPaused(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch @${targetStory?.username || 'creator'}'s story on FunFlick! https://funflick.in/feed`,
      });
    } catch (e) {}
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(20)
    .cancelsTouchesInView(false)
    .activeOffsetY([25, 1000])
    .activeOffsetX([-35, 35])
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
      </Animated.View>
    </GestureDetector>

    {/* Top & Bottom Controls Overlay - Isolated from Pan Gesture */}
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
      <View style={styles.topSection} pointerEvents="box-none">
            {/* Instagram-style Segmented Progress Bar */}
            <View style={styles.progressBarContainer} pointerEvents="none">
              {storiesList.map((_, idx) => (
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
            <View style={styles.header} pointerEvents="box-none">
              <View style={styles.creatorRow} pointerEvents="box-none">
                {targetStory?.avatar && !targetStory.avatar.includes('default-avatar') ? (
                  <Image source={{ uri: targetStory.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.initialWrap]}>
                    <Text style={styles.initialText}>{(targetStory?.name || targetStory?.username || 'F').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View pointerEvents="box-none">
                  <Text style={styles.creatorName}>
                    {targetStory?.isMe ? (currentUser?.name || 'Your Story') : (targetStory?.name || targetStory?.username || 'Creator')}
                  </Text>
                  <Text style={styles.timeAgo}>
                    @{targetStory?.isMe ? (currentUser?.username || 'you') : (targetStory?.username || 'creator')} · Active 24h
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
                {isOwner && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleOpenDeleteModal}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
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

    {/* Custom Delete Confirmation Modal: 100% reliable tap & execution on all devices */}
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isDeleting) {
          setShowDeleteModal(false);
          setIsPaused(false);
        }
      }}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.deleteModalCard}>
          <View style={styles.deleteModalIconWrap}>
            <Trash2 size={28} color="#ef4444" />
          </View>
          <Text style={styles.deleteModalTitle}>Delete Story?</Text>
          <Text style={styles.deleteModalDesc}>
            This story will be permanently removed from your profile and feed.
          </Text>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => {
                setShowDeleteModal(false);
                setIsPaused(false);
              }}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmDeleteModalBtn}
              onPress={handleConfirmDelete}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.confirmDeleteModalBtnText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Explicit Floating Navigation Arrows with top zIndex */}
    <TouchableOpacity
      style={styles.leftNavArrow}
      onPress={goToPrevStory}
      activeOpacity={0.7}
      hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
    >
      <ChevronLeft size={28} color="#ffffff" />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.rightNavArrow}
      onPress={goToNextStory}
      activeOpacity={0.7}
      hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
    >
      <ChevronRight size={28} color="#ffffff" />
    </TouchableOpacity>
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
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  rightNavArrow: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  touchArea: {
    position: 'absolute',
    top: 90,
    bottom: 100,
    left: 0,
    right: 0,
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
    zIndex: 120,
    elevation: 120,
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
    zIndex: 130,
    elevation: 130,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239,68,68,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 130,
    elevation: 130,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 999,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1b1433',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  deleteModalIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(239,68,68,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  deleteModalTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalDesc: {
    color: '#9ca3af',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelModalBtnText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDeleteModalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteModalBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
