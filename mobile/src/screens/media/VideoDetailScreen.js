import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, Share2, AlertCircle, Home, Flame } from 'lucide-react-native';
import { ReelItem } from '../feed/ReelsScreen';
import { apiRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export const VideoDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { id, videoId, initialList, initialIndex } = route.params || {};
  const activeId = id || videoId;

  const {
    posts,
    isReelsMuted,
    toggleMute,
    toggleLikePost,
    toggleFollowCreator,
    recordPostView,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [singleVideo, setSingleVideo] = useState(null);
  const [containerHeight, setContainerHeight] = useState(WINDOW_HEIGHT);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // 1. Determine the video playlist:
  // If initialList was provided (e.g. from Discover trending reels), use it.
  // Otherwise, start with single fetched video and append feed reels.
  const videoList = useMemo(() => {
    if (initialList && Array.isArray(initialList) && initialList.length > 0) {
      return initialList;
    }

    const list = [];
    if (singleVideo) {
      list.push(singleVideo);
    } else if (activeId && posts && posts.length > 0) {
      const matched = posts.find(p => String(p.id) === String(activeId));
      if (matched) list.push(matched);
    }

    // Append other available video posts so scrolling down continuously plays reels
    const otherPosts = (posts || []).filter(
      p => String(p.id) !== String(activeId) && (p.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(p.mediaUrl || ''))
    );

    return [...list, ...otherPosts];
  }, [initialList, singleVideo, activeId, posts]);

  // 2. Fetch single video details if not already present in memory
  useEffect(() => {
    if (!activeId) return;

    const alreadyInList = (initialList && initialList.some(p => String(p.id) === String(activeId))) ||
                          (posts && posts.some(p => String(p.id) === String(activeId)));

    if (!alreadyInList) {
      setLoading(true);
      apiRequest(`/videos/${activeId}`)
        .then(data => {
          if (data && data.video) {
            setSingleVideo(data.video);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch video detail:', err?.message || err);
        })
        .finally(() => setLoading(false));
    }
  }, [activeId, initialList, posts]);

  // 3. Set initial scroll position if initialIndex is passed
  useEffect(() => {
    if (typeof initialIndex === 'number' && initialIndex > 0 && videoList.length > initialIndex) {
      setCurrentIndex(initialIndex);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
  }, [initialIndex, videoList.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const newIdx = viewableItems[0].index ?? 0;
      setCurrentIndex(newIdx);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleShare = async post => {
    try {
      const targetPost = post || videoList[currentIndex] || { id: activeId };
      const shareUrl = `https://funflick.in/video/${targetPost.id}`;
      await Share.share({
        title: targetPost.title || 'Watch on FunFlick',
        message: `Watch "${targetPost.title || 'this reel'}" on FunFlick!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {}
  };

  if (loading && videoList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reel #{activeId}...</Text>
      </View>
    );
  }

  if (!loading && videoList.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.errorIconCircle}>
          <AlertCircle size={36} color={colors.rose} />
        </View>
        <Text style={styles.errorTitle}>Reel Unavailable</Text>
        <Text style={styles.errorDesc}>This video may have been removed or the link is expired.</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#fff" />
          <Text style={styles.homeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
      {/* Floating Top Navigation Header */}
      <View style={[styles.floatingHeader, { top: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.floatingCircleBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>

        {initialList && initialList.length > 0 && (
          <View style={styles.trendingBadge}>
            <Flame size={13} color="#ff007a" />
            <Text style={styles.trendingBadgeText}>
              Trending • {currentIndex + 1}/{videoList.length}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => handleShare(videoList[currentIndex])}
          style={styles.floatingCircleBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vertical Paged Reel Stream: Swipe down seamlessly to watch next reel */}
      <FlatList
        ref={flatListRef}
        data={videoList}
        keyExtractor={(item, idx) => String(item.id || idx)}
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
        getItemLayout={(data, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 150);
        }}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={currentIndex === index}
            isScreenFocused={isFocused}
            reelHeight={containerHeight}
            isReelsMuted={isReelsMuted}
            toggleMute={toggleMute}
            toggleLikePost={toggleLikePost}
            toggleFollowCreator={toggleFollowCreator}
            recordPostView={recordPostView}
            handleShare={handleShare}
            navigation={navigation}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#07040d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(244,63,94,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  errorDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
  },
  homeBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#ff007a',
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingHeader: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 50,
    elevation: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  trendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
