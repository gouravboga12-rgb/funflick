import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Flame, Sparkles } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 36) / 3;

export const DiscoverScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [creators, setCreators] = useState([]);
  const [videos, setVideos] = useState([]);

  const categories = ['All', 'Comedy', 'Trending', 'Memes', 'Skits', 'Standup', 'Cinema'];

  useEffect(() => {
    // Fetch creators
    apiRequest(`/users/search?limit=10${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`)
      .then(d => {
        if (d && d.users) setCreators(d.users);
      })
      .catch(() => {});

    // Fetch trending videos
    apiRequest('/videos')
      .then(d => {
        if (d && d.videos) setVideos(d.videos);
      })
      .catch(() => {});
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search creators, comedy reels, hashtags..."
            placeholderTextColor="#6b7280"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.catWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item}
          contentContainerStyle={styles.catScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveCategory(item)}
              style={[styles.pill, activeCategory === item && styles.pillActive]}
            >
              <Text style={[styles.pillText, activeCategory === item && styles.pillTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          creators.length > 0 ? (
            <View style={styles.creatorsSection}>
              <View style={styles.sectionHeader}>
                <Flame size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>Featured Creators</Text>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={creators}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.creatorsScroll}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.creatorCard}
                    onPress={() => navigation.navigate('CreatorProfile', { username: item.username })}
                  >
                    <Image source={{ uri: item.avatar }} style={styles.creatorAvatar} />
                    <Text style={styles.creatorName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.creatorUsername} numberOfLines={1}>@{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
              <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                <Sparkles size={16} color="#7928ca" />
                <Text style={styles.sectionTitle}>Trending Reels & Posts</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VideoDetail', { id: item.id })}
          >
            <Image
              source={{ uri: item.thumbnail_url || item.video_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.gridContainer}
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
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  catWrap: {
    paddingVertical: 6,
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  creatorsSection: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  creatorsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    alignItems: 'center',
    width: 76,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1b1236',
    marginBottom: 6,
  },
  creatorName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  creatorUsername: {
    color: colors.textDim,
    fontSize: 10,
    textAlign: 'center',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH * 1.35,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#130b26',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
