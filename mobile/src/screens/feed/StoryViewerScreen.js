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
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Share2, Music } from 'lucide-react-native';
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
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function StoryViewerScreen({ route, navigation }) {
  const { story } = route.params || {};
  const { currentUser, stories: allStories } = useApp();

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

  useEffect(() => {
    if (activeStory) {
      setIsLiked(Boolean(activeStory.isLiked));
      setLikesCount(Number(activeStory.likesCount) || 0);
    }
  }, [currentIndex, activeStory]);

  const goToNextStory = () => {
    if (currentIndex < rawStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      progressAnim.setValue(0);
    } else {
      navigation.goBack();
    }
  };

  const goToPrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      progressAnim.setValue(0);
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


  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch @${targetStory?.username || 'creator'}'s story on FunFlick! https://funflick-theta.vercel.app/feed`,
      });
    } catch (e) {}
  };

  const displayMedia = activeStory?.mediaUrl || activeStory?.media_url;
  const isVideo = activeStory?.mediaType === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(displayMedia || '');

  return (
    <View style={styles.container}>
      <View style={styles.storyFrame}>
        {/* Background Media */}
        {isVideo && displayMedia ? (
          <StoryVideo mediaUrl={displayMedia} isPaused={isPaused} />
        ) : displayMedia ? (
          <Image source={{ uri: displayMedia }} style={styles.mediaBackground} resizeMode="cover" />
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

        <SafeAreaView style={styles.contentOverlay} edges={['top', 'bottom']}>
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

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>
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
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyFrame: {
    width: '100%',
    height: '100%',
    maxWidth: 440,
    aspectRatio: Platform.OS === 'web' ? 9 / 16 : undefined,
    maxHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  mediaBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  contentOverlay: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  topSection: {
    paddingTop: 8,
    gap: 8,
    zIndex: 20,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    gap: 10,
    zIndex: 20,
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
    paddingBottom: 20,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnLiked: {
    backgroundColor: 'rgba(255,0,122,0.25)',
    borderColor: '#ff007a',
  },
  likeCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});
