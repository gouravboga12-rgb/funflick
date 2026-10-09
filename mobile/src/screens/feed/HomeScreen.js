import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { StoryBar } from '../../components/feed/StoryBar';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export const HomeScreen = ({ navigation }) => {
  const { posts, isLoadingFeed, fetchFeed } = useApp();
  const [activeTab, setActiveTab] = useState('For You');

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Trending') return (post.likesCount || 0) > 10;
    if (activeTab === 'Latest') return post.timeAgo?.includes('Recently') || post.timeAgo?.includes('Just');
    return true; // For You shows all
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        onSearchPress={() => navigation.navigate('Discover')}
        onMessagesPress={() => {}}
      />

      {/* Feed Sub-Header Tabs */}
      <View style={styles.tabBar}>
        {['For You', 'Trending', 'Latest'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <StoryBar
            onAddStory={() => navigation.navigate('CreateStory')}
            onStoryPress={(story) => navigation.navigate('StoryViewer', { story })}
          />
        }
        renderItem={({ item, index }) => (
          <View style={styles.cardWrapper}>
            <VideoPostCard post={item} isActive={index === 0} navigation={navigation} />
          </View>
        )}
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
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: colors.background,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  cardWrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
