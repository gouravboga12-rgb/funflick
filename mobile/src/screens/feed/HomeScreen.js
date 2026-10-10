import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, X, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { StoryBar } from '../../components/feed/StoryBar';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { SponsoredAdCard } from '../../components/feed/SponsoredAdCard';
import { MobileAdPopup } from '../../components/common/MobileAdPopup';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export const HomeScreen = ({ navigation }) => {
  const {
    posts,
    isLoadingFeed,
    fetchFeed,
    adsList,
    isPaidInfluencer,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    showMobileAd,
  } = useApp();
  const [activeTab, setActiveTab] = useState('For You');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const hasTriggeredPopupRef = useRef(false);

  // Auto trigger popup ad once for unpaid users upon landing on HomeScreen
  useEffect(() => {
    if (isPaidInfluencer) return;
    if (!hasTriggeredPopupRef.current && adsList && adsList.length > 0) {
      hasTriggeredPopupRef.current = true;
      const timer = setTimeout(() => {
        showMobileAd();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPaidInfluencer, adsList, showMobileAd]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveVideoId(viewableItems[0].item?.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const filteredPosts = useMemo(() => {
    const list = [...(posts || [])];
    if (activeTab === 'Trending') {
      return list.sort((a, b) => {
        const scoreA = (Number(a.viewsCount) || 0) + (Number(a.likesCount) || 0) * 2;
        const scoreB = (Number(b.viewsCount) || 0) + (Number(b.likesCount) || 0) * 2;
        return scoreB - scoreA;
      });
    }
    if (activeTab === 'Latest') {
      return list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime() || (Number(a.id) || 0);
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime() || (Number(b.id) || 0);
        return timeB - timeA;
      });
    }
    return list; // 'For You' returns list as-is
  }, [posts, activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1-Line Top Header matching website (Logo | For You Trending Latest   Search Bell Inbox) */}
      <Header
        activeTab={activeTab}
        unreadCount={unreadNotificationCount}
        onTabChange={setActiveTab}
        onSearchPress={() => navigation.navigate('Discover')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('Inbox')}
      />

      <FlatList
        data={filteredPosts}
        keyExtractor={item => String(item.id)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          <StoryBar
            onAddStory={() => navigation.navigate('CreateStory')}
            onStoryPress={(story) => navigation.navigate('StoryViewer', { story })}
          />
        }
        renderItem={({ item, index }) => {
          // In-feed sponsored ads:
          // 1. Paid / Subscribed influencer accounts NEVER see any ads!
          // 2. Only show ads specifically configured in admin panel with frequency === 'After 5 Reels'
          // 3. Only appear every 5 reels ((index + 1) % 5 === 0)
          const inFeedAds = (adsList || []).filter(a =>
            a.active &&
            a.frequency === 'After 5 Reels'
          );
          const showFeedAd = !isPaidInfluencer && inFeedAds.length > 0 && ((index + 1) % 5 === 0);
          const adIndex = Math.floor(index / 5) % Math.max(1, inFeedAds.length);
          const feedAd = showFeedAd ? inFeedAds[adIndex] : null;

          return (
            <View style={styles.cardWrapper}>
              <VideoPostCard
                post={item}
                isActive={activeVideoId ? item.id === activeVideoId : index === 0}
                navigation={navigation}
              />
              {feedAd && (
                <View style={{ marginTop: 8 }}>
                  <SponsoredAdCard ad={feedAd} isActive={false} />
                </View>
              )}
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingFeed}
            onRefresh={fetchFeed}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#18122c',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bellIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff007a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  notifContent: {
    gap: 12,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff007a',
    marginTop: 5,
  },
  notifItemTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  notifItemText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  notifItemTime: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
