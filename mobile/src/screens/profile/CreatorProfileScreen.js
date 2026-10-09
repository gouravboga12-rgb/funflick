import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserPlus, UserCheck, ShieldAlert, Play, Grid } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 6) / 3;

export default function CreatorProfileScreen({ route, navigation }) {
  const { creator: initialCreator, username: paramUsername } = route.params || {};
  const { posts, toggleFollowCreator, currentUser } = useApp();

  const [creatorProfile, setCreatorProfile] = useState(initialCreator || null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(initialCreator?.isFollowing || false);
  const [creatorPosts, setCreatorPosts] = useState([]);

  const targetUsername = initialCreator?.username || paramUsername;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (targetUsername) {
          const res = await apiRequest(`/users/profile/${targetUsername}`).catch(() => null);
          if (res && res.user) {
            setCreatorProfile(res.user);
            setIsFollowing(Boolean(res.user.is_following));
          }
        }
      } catch (e) {
        console.warn('Failed to load creator profile:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUsername]);

  useEffect(() => {
    if (targetUsername && posts) {
      const filtered = posts.filter(
        p => (p.creator?.username || '').toLowerCase() === targetUsername.toLowerCase()
      );
      setCreatorPosts(filtered);
    }
  }, [targetUsername, posts]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to follow creators.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    setIsFollowing(prev => !prev);
    await toggleFollowCreator(targetUsername);
  };

  const handleBlockUser = () => {
    Alert.alert(
      `Block @${targetUsername}?`,
      'They will not be able to interact with you and their videos will be hidden.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest('/users/block', {
                method: 'POST',
                body: JSON.stringify({ username: targetUsername }),
              });
              Alert.alert('User Blocked', `@${targetUsername} has been blocked.`);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const displayName = creatorProfile?.name || creatorProfile?.creator_name || targetUsername || 'Creator';
  const displayAvatar =
    creatorProfile?.avatar ||
    creatorProfile?.avatar_url ||
    (targetUsername === 'super_admin'
      ? 'https://funflick-theta.vercel.app/brand/funflick-logo.png'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
    >
      <Image
        source={{ uri: item.posterUrl || item.thumbnailUrl || item.mediaUrl }}
        style={styles.gridThumb}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gridOverlay}
      >
        <View style={styles.gridViewsRow}>
          <Play size={10} color="#fff" fill="#fff" />
          <Text style={styles.gridViewsText}>{item.viewsCount || '0'}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.usernameHeader}>@{targetUsername}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleBlockUser}>
          <ShieldAlert size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {loading && !creatorProfile ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={creatorPosts}
          keyExtractor={item => String(item.id)}
          numColumns={3}
          renderItem={renderGridItem}
          ListHeaderComponent={
            <View style={styles.profileSection}>
              {/* Avatar & Badges */}
              <View style={styles.avatarRow}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.avatarGlow}
                >
                  <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                </LinearGradient>

                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>{creatorPosts.length}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>{creatorProfile?.followers_count || '128'}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>{creatorProfile?.following_count || '42'}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.bioText}>
                {creatorProfile?.bio || 'Creator on FunFlick ✨ Bringing smiles and entertainment every day!'}
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.followBtn, isFollowing && styles.followingBtn]}
                  onPress={handleFollowToggle}
                  activeOpacity={0.8}
                >
                  {isFollowing ? (
                    <View style={styles.btnContent}>
                      <UserCheck size={16} color="#fff" />
                      <Text style={styles.followBtnText}>Following</Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      style={styles.gradientBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <UserPlus size={16} color="#fff" />
                      <Text style={styles.followBtnText}>Follow</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.tabDivider}>
                <View style={styles.activeTabIndicator}>
                  <Grid size={18} color={colors.primary} />
                  <Text style={styles.activeTabText}>Reels & Posts</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>This creator hasn't published any reels yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconBtn: {
    padding: 8,
  },
  usernameHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1f1638',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  bioText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  actionRow: {
    marginTop: 16,
    marginBottom: 8,
  },
  followBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 42,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabDivider: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  activeTabIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeTabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.35,
    margin: 1,
    position: 'relative',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1b1232',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 6,
  },
  gridViewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridViewsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 4,
  },
});
