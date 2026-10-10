import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  X,
  TrendingUp,
  UserPlus,
  MessageSquare,
  Hash,
  Film,
  Eye,
  Heart,
  Play,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATIC_TRENDING_CHIPS = ['#funflick', '#reels', '#comedy', '#viralreels', '#teluguhumor'];

const STATIC_HASHTAGS = [
  { tag: '#FunFlickComedy', posts: '0 videos' },
  { tag: '#TrendingReels', posts: '0 videos' },
  { tag: '#StandUpComedy', posts: '0 videos' },
  { tag: '#ViralMoments', posts: '0 videos' },
  { tag: '#TeluguComedy', posts: '0 videos' },
];

function CreatorAvatarCircle({ avatar, name, username, size = 64 }) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || username || 'F').charAt(0).toUpperCase();
  const isDefaultOrMissing = !avatar || String(avatar).includes('default-avatar') || hasError;

  if (isDefaultOrMissing) {
    const colorsList = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    const charCode = (name || username || 'A').charCodeAt(0);
    const bgColor = colorsList[charCode % colorsList.length];

    return (
      <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
        <Text style={[styles.avatarInitial, { fontSize: size * 0.45 }]}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatar }}
      style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}
      onError={() => setHasError(true)}
    />
  );
}

export const DiscoverScreen = ({ navigation }) => {
  const { currentUser, posts, toggleFollowCreator } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCreators, setLiveCreators] = useState([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);

  // Fetch real creators from AWS EC2 backend
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoadingCreators(true);
      try {
        const q = searchQuery.trim();
        const data = await apiRequest(`/users/search?limit=15${q ? `&q=${encodeURIComponent(q)}` : ''}`);
        if (isMounted && data && Array.isArray(data.users)) {
          const filtered = data.users.filter(u =>
            u.role !== 'moderator' &&
            !u.username?.toLowerCase().startsWith('moderator')
          );
          setLiveCreators(filtered);
        }
      } catch (e) {
        console.warn('Could not fetch creators:', e);
      } finally {
        if (isMounted) setIsLoadingCreators(false);
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  // Dynamic trending hashtags calculation
  const dynamicHashtagCards = useMemo(() => {
    const counts = {};
    (posts || []).forEach(p => {
      const allTags = (p.tags || []).concat(
        (p.hashtags || '').split(/[\s,]+/).filter(Boolean).map(t => (t.startsWith('#') ? t : `#${t}`))
      );
      allTags.forEach(t => {
        const clean = t.toLowerCase();
        counts[clean] = (counts[clean] || 0) + 1;
      });
    });

    return STATIC_HASHTAGS.map(item => {
      const c = counts[item.tag.toLowerCase()] || 0;
      return {
        ...item,
        posts: `${c} videos`,
      };
    });
  }, [posts]);

  const [showAllTrending, setShowAllTrending] = useState(false);

  // Filtered posts when searching
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
    return (posts || []).filter(p => {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchCaption = (p.caption || '').toLowerCase().includes(q);
      const matchHashtags = (p.hashtags || '').toLowerCase().includes(q);
      const matchCreator = (p.creator?.name || p.creator?.username || '').toLowerCase().includes(q);
      return matchTitle || matchCaption || matchHashtags || matchCreator;
    });
  }, [posts, searchQuery]);

  // Ranked Trending Videos
  const trendingVideos = useMemo(() => {
    const list = [...(posts || [])];
    return list.sort((a, b) => {
      const vA = (Number(a.viewsCount) || 0) + (Number(a.likesCount) || 0) * 2;
      const vB = (Number(b.viewsCount) || 0) + (Number(b.likesCount) || 0) * 2;
      return vB - vA;
    });
  }, [posts]);

  // Limit to 5 preview videos initially with View All toggle option
  const displayedTrendingVideos = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return filteredPosts;
    }
    return showAllTrending ? trendingVideos : trendingVideos.slice(0, 5);
  }, [searchQuery, filteredPosts, trendingVideos, showAllTrending]);

  const handleOpenCreator = (creator) => {
    const isSelf = creator.username === currentUser?.username;
    if (isSelf) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('CreatorProfile', { username: creator.username });
    }
  };

  const handleMessageCreator = (creator) => {
    // Navigate to Inbox tab with selected conversation
    navigation.navigate('Inbox', { targetUser: creator });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header with funflick Logo + DISCOVER pill */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Image
            source={{ uri: 'https://funflick-theta.vercel.app/brand/funflick-logo.png' }}
            style={styles.brandLogo}
          />
          <Text style={styles.brandTitle}>
            fun<Text style={styles.brandTitleGradient}>flick</Text>
          </Text>
        </View>

        <View style={styles.discoverBadge}>
          <Text style={styles.discoverBadgeText}>DISCOVER</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Search Input Bar */}
        <View style={styles.searchBarWrap}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search comedy videos, creators, hashtags..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. # TRENDING: Chips Horizontal Row */}
        <View style={styles.trendingChipsRow}>
          <View style={styles.trendingLabelWrap}>
            <Text style={styles.trendingLabel}># TRENDING:</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingChipsScroll}
          >
            {STATIC_TRENDING_CHIPS.map(chip => {
              const isSelected = searchQuery.toLowerCase().trim() === chip.toLowerCase();
              return (
                <TouchableOpacity
                  key={chip}
                  onPress={() => setSearchQuery(isSelected ? '' : chip)}
                  style={[styles.chipPill, isSelected && styles.chipPillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Search Results Feedback Banner (when search active) */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchResultsBanner}>
            <View style={styles.bannerInfo}>
              <View style={styles.bannerHashBadge}>
                <Hash size={14} color="#ff007a" />
              </View>
              <View>
                <Text style={styles.bannerTitle}>Results for "{searchQuery}"</Text>
                <Text style={styles.bannerSubtitle}>
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'reel / post' : 'reels / posts'} found
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.bannerClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Trending / Search Results Videos Section (Always visible) */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderBetween}>
            <View>
              <Text style={styles.sectionTitle}>
                {searchQuery.trim() ? `Search Results (${filteredPosts.length})` : '🔥 Top Trending Videos'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {searchQuery.trim() ? `Showing reels matching "${searchQuery}"` : 'Most viewed comedy sketches & viral reels'}
              </Text>
            </View>
            {!searchQuery.trim() && trendingVideos.length > 5 && (
              <TouchableOpacity
                onPress={() => setShowAllTrending(prev => !prev)}
                style={styles.viewMorePill}
              >
                <Text style={styles.viewMoreText}>
                  {showAllTrending ? 'Show Less ▴' : `+ Show More (${trendingVideos.length}) ▾`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {displayedTrendingVideos.length === 0 ? (
            <View style={styles.emptyVideosCard}>
              <Film size={26} color="#f472b6" />
              <Text style={styles.emptyVideosTitle}>No videos found</Text>
              <Text style={styles.emptyVideosSub}>Try another keyword or hashtag.</Text>
            </View>
          ) : (
            <View style={styles.trendingGrid}>
              {displayedTrendingVideos.map((video, idx) => {
                const dynamicCardWidth = Math.min(240, Math.max(150, Math.floor((windowWidth - 42) / 2)));
                const dynamicCardHeight = Math.floor(dynamicCardWidth * 1.45);
                return (
                  <TouchableOpacity
                    key={video.id}
                    style={[
                      styles.gridVideoCard,
                      { width: dynamicCardWidth, height: dynamicCardHeight }
                    ]}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('VideoDetail', { videoId: video.id })}
                  >
                    <Image
                      source={{ uri: video.thumbnailUrl || video.posterUrl || video.mediaUrl }}
                      style={styles.gridVideoThumb}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.92)']}
                      style={styles.gridVideoGradient}
                    />
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                    </View>
                    <View style={styles.viewsBadge}>
                      <Eye size={10} color="#f472b6" />
                      <Text style={styles.viewsBadgeText}>{video.viewsCount || '0'}</Text>
                    </View>
                    <View style={styles.singlePlayOverlay} pointerEvents="none">
                      <View style={styles.singlePlayCircle}>
                        <Play size={16} color="#ffffff" fill="#ffffff" />
                      </View>
                    </View>
                    <View style={styles.gridVideoMeta}>
                      <Text style={styles.gridVideoTitle} numberOfLines={1}>
                        {video.title}
                      </Text>
                      <Text style={styles.gridVideoAuthor} numberOfLines={1}>
                        @{video.creator?.username || 'user'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!searchQuery.trim() && trendingVideos.length > 5 && (
            <TouchableOpacity
              onPress={() => setShowAllTrending(prev => !prev)}
              style={styles.bottomViewMoreBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.bottomViewMoreText}>
                {showAllTrending ? 'Show Less ▴' : `+ Show More (${trendingVideos.length} Trending Videos) ▾`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 6. People & Creators to Follow Section (Carousel matching image copy 30.png) */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People & Creators to Follow</Text>
            <Text style={styles.sectionSubtitle}>
              Discover real users, follow them and connect directly
            </Text>
          </View>

          {isLoadingCreators && liveCreators.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorsScroll}
            >
              {liveCreators.map(creator => {
                const isSelf = creator.username === currentUser?.username;
                const isFollowing = Boolean(creator.isFollowing);

                return (
                  <View key={creator.id || creator.username} style={styles.creatorCard}>
                    {/* Avatar with Gradient Border */}
                    <TouchableOpacity
                      onPress={() => handleOpenCreator(creator)}
                      activeOpacity={0.8}
                      style={styles.creatorAvatarWrap}
                    >
                      <LinearGradient
                        colors={['#ff8a00', '#ff007a', '#7928ca']}
                        style={styles.avatarGradientRing}
                      >
                        <View style={styles.avatarInner}>
                          <CreatorAvatarCircle
                            avatar={creator.avatar || creator.avatar_url}
                            name={creator.name}
                            username={creator.username}
                            size={56}
                          />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Name & Username */}
                    <TouchableOpacity
                      onPress={() => handleOpenCreator(creator)}
                      activeOpacity={0.8}
                      style={styles.creatorInfoTouch}
                    >
                      <Text style={styles.creatorName} numberOfLines={1}>
                        {creator.name || creator.username}
                      </Text>
                      <Text style={styles.creatorHandle} numberOfLines={1}>
                        @{creator.username}
                      </Text>
                      <Text style={styles.creatorFollowers}>
                        {creator.followersCount || creator.stats?.followers || 0} followers
                      </Text>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.creatorActions}>
                      {isSelf ? (
                        <TouchableOpacity
                          style={styles.myAccountBtn}
                          onPress={() => navigation.navigate('Profile')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.myAccountBtnText}>My Account</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.followBtnWrap}
                            onPress={() => toggleFollowCreator(creator.username)}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={
                                isFollowing
                                  ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)']
                                  : ['#ff007a', '#ff4b2b']
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.followGradientBtn}
                            >
                              <Text style={styles.followBtnText}>
                                {isFollowing ? 'Following' : 'Follow'}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.messageBtn}
                            onPress={() => handleMessageCreator(creator)}
                            activeOpacity={0.7}
                          >
                            <MessageSquare size={13} color="#f472b6" style={{ marginRight: 4 }} />
                            <Text style={styles.messageBtnText}>Message</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 7. Trending Hashtags Section (2-Column Cards matching image copy 30.png) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Trending Hashtags</Text>

          <View style={styles.hashtagsGrid}>
            {dynamicHashtagCards.map(item => (
              <TouchableOpacity
                key={item.tag}
                style={styles.hashtagCard}
                activeOpacity={0.75}
                onPress={() => setSearchQuery(item.tag)}
              >
                <View style={styles.hashtagCardLeft}>
                  <Text style={styles.hashtagTagText}>{item.tag}</Text>
                  <Text style={styles.hashtagCountText}>{item.posts}</Text>
                </View>
                <TrendingUp size={16} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom spacing for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTitleGradient: {
    color: '#ff007a',
  },
  discoverBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  discoverBadgeText: {
    color: '#9ca3af',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18122c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  trendingChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  trendingLabelWrap: {
    marginRight: 8,
  },
  trendingLabel: {
    color: '#ff007a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trendingChipsScroll: {
    gap: 6,
    paddingRight: 10,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipPillActive: {
    backgroundColor: '#ff007a',
    borderColor: '#ff007a',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  searchResultsBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,0,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerHashBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,0,122,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 1,
  },
  bannerClearText: {
    color: '#ff007a',
    fontSize: 11,
    fontWeight: '700',
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewMorePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,0,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.25)',
  },
  viewMoreText: {
    color: '#ff007a',
    fontSize: 11,
    fontWeight: '800',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff007a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  viewsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viewsBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomViewMoreBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomViewMoreText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyVideosCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyVideosTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyVideosSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  gridVideoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18122c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gridVideoThumb: {
    width: '100%',
    height: '100%',
  },
  singlePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singlePlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 0, 122, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  gridVideoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  gridVideoMeta: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  gridVideoTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  gridVideoAuthor: {
    color: '#f472b6',
    fontSize: 10,
  },
  sectionWrap: {
    marginTop: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  creatorsScroll: {
    gap: 12,
    paddingRight: 10,
  },
  creatorCard: {
    width: 148,
    backgroundColor: '#18122c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    alignItems: 'center',
  },
  creatorAvatarWrap: {
    marginBottom: 8,
  },
  avatarGradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: '#18122c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#ffffff',
    fontWeight: '800',
  },
  creatorInfoTouch: {
    alignItems: 'center',
    width: '100%',
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  creatorHandle: {
    color: '#f472b6',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  creatorFollowers: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  creatorActions: {
    width: '100%',
    marginTop: 10,
    gap: 6,
  },
  myAccountBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  myAccountBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  followBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  followGradientBtn: {
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,0,122,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.22)',
    paddingVertical: 6,
  },
  messageBtnText: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '700',
  },
  hashtagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  hashtagCard: {
    width: (SCREEN_WIDTH - 38) / 2,
    backgroundColor: '#18122c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hashtagCardLeft: {
    flex: 1,
    marginRight: 6,
  },
  hashtagTagText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '800',
  },
  hashtagCountText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 3,
  },
});
