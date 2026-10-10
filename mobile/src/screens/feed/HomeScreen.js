import React, { useState, useMemo, useRef } from 'react';
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
    markAllNotificationsRead
  } = useApp();
  const [activeTab, setActiveTab] = useState('For You');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

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
        onNotificationsPress={() => setIsNotifModalOpen(true)}
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
          const showAdAfter = (index + 1) % 5 === 0;
          const adIndex = Math.floor(index / 5) % Math.max(1, (adsList || []).length);
          const feedAd = !isPaidInfluencer && adsList && adsList.length > 0 && showAdAfter ? adsList[adIndex] : null;

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

      {/* In-App Notifications Modal */}
      <Modal
        visible={isNotifModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNotifModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.bellIconCircle}>
                  <Bell size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSub}>Recent activity & updates</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsNotifModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.notifContent}>
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 10).map((n) => (
                  <View key={n.id} style={styles.notifItem}>
                    <View style={[styles.notifDot, n.is_read ? { backgroundColor: '#64748b' } : {}]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifItemTitle}>{n.title || 'FunFlick Activity'}</Text>
                      <Text style={styles.notifItemText}>{n.message || ''}</Text>
                      <Text style={styles.notifItemTime}>
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.notifItem}>
                  <View style={styles.notifDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifItemTitle}>Welcome to FunFlick! 🎉</Text>
                    <Text style={styles.notifItemText}>
                      Explore trending reels, comedy sketches, and connect with creators.
                    </Text>
                    <Text style={styles.notifItemTime}>Today</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setIsNotifModalOpen(false);
                  if (markAllNotificationsRead) markAllNotificationsRead();
                }}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global In-App Pop-up Ad for Unpaid Users */}
      <MobileAdPopup />
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
