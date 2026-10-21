import React from 'react';
import { View, Dimensions, Share } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ReelItem } from '../../screens/feed/ReelsScreen';
import { useApp } from '../../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VideoPostCard = React.memo(function VideoPostCard({ post, isActive = false, navigation }) {
  const isFocused = useIsFocused();
  const {
    isReelsMuted,
    toggleMute,
    isReelsPaused,
    togglePlayPause,
    toggleLikePost,
    toggleFollowCreator,
    recordPostView,
  } = useApp();

  // Exactly calculate 16:9 vertical format capped to fit viewport between top header and bottom tabs
  const cardHeight = Math.min(
    Math.floor(SCREEN_HEIGHT - 120),
    Math.floor(SCREEN_WIDTH * (16 / 9))
  );

  const handleShare = async p => {
    try {
      const shareUrl = `https://funflick.in/video/${p?.id}`;
      await Share.share({
        title: p?.title || 'Watch on FunFlick',
        message: `Watch "${p?.title || 'this reel'}" on FunFlick!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.warn('Share error:', e?.message || e);
    }
  };

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: cardHeight,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      <ReelItem
        item={post}
        isActive={isActive}
        isScreenFocused={isFocused}
        reelHeight={cardHeight}
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
    </View>
  );
});
