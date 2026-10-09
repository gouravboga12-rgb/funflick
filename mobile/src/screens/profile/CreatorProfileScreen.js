import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Play,
  Film,
  Heart,
  User,
  Edit3,
  Settings,
  Plus,
  Crown,
  Lock,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { apiRequest, setStoredUser } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 6) / 3;

export default function CreatorProfileScreen({ route, navigation }) {
  const {
    creator: initialCreator,
    username: paramUsername,
    initialTab = 'Videos',
  } = route.params || {};

  const {
    posts,
    toggleFollowCreator,
    currentUser,
    setCurrentUser,
  } = useApp();

  const targetUsername = paramUsername || initialCreator?.username || currentUser?.username;

  const isOwner = Boolean(
    currentUser?.username &&
    targetUsername &&
    targetUsername.toLowerCase() === currentUser.username.toLowerCase()
  );

  const [creatorProfile, setCreatorProfile] = useState(initialCreator || (isOwner ? currentUser : null));
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(initialCreator?.isFollowing || false);
  const [userVideos, setUserVideos] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  // Tabs: Owner sees Liked videos tab (private to owner). Other users NEVER see Liked tab.
  const tabs = isOwner ? ['Videos', 'Shorts', 'Liked', 'About'] : ['Videos', 'Shorts', 'About'];
  const [activeTab, setActiveTab] = useState(
    isOwner && initialTab === 'Liked' ? 'Liked' : (tabs.includes(initialTab) ? initialTab : 'Videos')
  );

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch live follow counts and user data
  const fetchCreatorData = useCallback(async () => {
    if (!targetUsername) return;
    try {
      setLoading(true);

      // 1. Fetch live followers & following from API
      const [followersRes, followingRes] = await Promise.all([
        apiRequest(`/follows/${targetUsername}/followers`).catch(() => null),
        apiRequest(`/follows/${targetUsername}/following`).catch(() => null),
      ]);

      setFollowCounts({
        followers: followersRes?.count !== undefined ? followersRes.count : (followersRes?.followers?.length || 0),
        following: followingRes?.count !== undefined ? followingRes.count : (followingRes?.following?.length || 0),
      });

      // 2. Fetch profile info
      if (isOwner) {
        setCreatorProfile(currentUser);
        // Load owner's liked videos
        const liked = (posts || []).filter(p => p.isLiked);
        setLikedVideos(liked);
      } else {
        const uRes = await apiRequest(`/users/${targetUsername}`).catch(() => null);
        if (uRes && uRes.user) {
          setCreatorProfile(uRes.user);
          setIsFollowing(Boolean(uRes.user.iFollowThem || uRes.user.is_following));
        }
      }

      // 3. Fetch user videos
      const vRes = await apiRequest(`/videos?username=${encodeURIComponent(targetUsername)}`).catch(() => null);
      if (vRes && Array.isArray(vRes.videos)) {
        setUserVideos(vRes.videos);
      } else {
        const filtered = (posts || []).filter(
          p => (p.creator?.username || '').toLowerCase() === targetUsername.toLowerCase()
        );
        setUserVideos(filtered);
      }
    } catch (e) {
      console.warn('Failed to fetch creator profile:', e);
    } finally {
      setLoading(false);
    }
  }, [targetUsername, isOwner, currentUser, posts]);

  useEffect(() => {
    fetchCreatorData();
  }, [fetchCreatorData]);

  // Handle follow toggle
  const handleFollowToggle = async () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to follow creators.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowCounts(prev => ({
      ...prev,
      followers: nextState ? prev.followers + 1 : Math.max(0, prev.followers - 1),
    }));

    await toggleFollowCreator(targetUsername);
  };

  // Handle share profile link
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out @${targetUsername}'s videos on FunFlick! https://funflick-theta.vercel.app/profile/${targetUsername}`,
        title: `@${targetUsername} on FunFlick`,
      });
    } catch (e) {}
  };

  // Handle block user (only for non-owner)
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

  // Handle save profile edits
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your display name.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
        }),
      });
      if (res && res.user) {
        setCurrentUser(res.user);
        await setStoredUser(res.user);
        setCreatorProfile(res.user);
      }
      setIsEditModalOpen(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved.');
    } catch (e) {
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = isOwner
    ? (currentUser?.name || currentUser?.username || 'You')
    : (creatorProfile?.name || creatorProfile?.creator_name || targetUsername || 'Creator');

  const displayAvatar = isOwner
    ? (currentUser?.avatar_url || currentUser?.avatar)
    : (creatorProfile?.avatar || creatorProfile?.avatar_url);

  const displayBio = isOwner
    ? (currentUser?.bio || 'FunFlick Creator | Enjoying Comedy & Entertainment')
    : (creatorProfile?.bio || 'Creator on FunFlick ✨ Bringing smiles and entertainment every day!');

  const isVerified = Boolean(isOwner ? currentUser?.isInfluencer : creatorProfile?.isInfluencer);

  // Filter videos based on active tab
  const getDisplayedItems = () => {
    if (activeTab === 'Shorts') {
      return userVideos.filter(v => {
        const d = Number(v.duration) || 0;
        return d > 0 && d <= 60;
      });
    }
    if (activeTab === 'Liked') {
      return isOwner ? likedVideos : [];
    }
    return userVideos;
  };

  const currentVideos = getDisplayedItems();

  const renderGridItem = ({ item }) => {
    const thumbUri =
      item.thumbnail_url ||
      item.thumbnailUrl ||
      item.posterUrl ||
      item.mediaUrl ||
      item.video_url ||
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131';
    const views = item.views_count ?? item.viewsCount ?? item.views ?? 0;

    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
      >
        <Image
          source={{ uri: thumbUri }}
          style={styles.gridThumb}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.gridOverlay}
        >
          <View style={styles.gridViewsRow}>
            <Play size={10} color="#fff" fill="#fff" />
            <Text style={styles.gridViewsText}>{views}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.usernameHeader}>@{targetUsername}</Text>
          {isOwner && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={19} color="#cbd5e1" />
          </TouchableOpacity>
          {!isOwner && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleBlockUser}>
              <ShieldAlert size={19} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Main Content Grid */}
      <FlatList
        data={activeTab === 'About' ? [] : currentVideos}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderGridItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            {/* Cover Banner */}
            <LinearGradient
              colors={['#831843', '#581c87', '#1e1b4b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.coverBanner}
            />

            {/* Avatar & Real Stats Row */}
            <View style={styles.avatarStatsRow}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={['#ff007a', '#7928ca', '#0070f3']}
                  style={styles.avatarBorder}
                >
                  {displayAvatar ? (
                    <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {(displayName || 'F').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                  </View>
                )}
              </View>

              {/* Stats: Videos, Followers, Following */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{userVideos.length}</Text>
                  <Text style={styles.statLabel}>Videos</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{followCounts.followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{followCounts.following}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            {/* Name & Bio */}
            <View style={styles.identityArea}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.bioText}>{displayBio}</Text>
            </View>

            {/* Action Buttons: Owner controls vs Non-owner controls */}
            <View style={styles.actionRow}>
              {isOwner ? (
                <View style={styles.ownerButtonsRow}>
                  <TouchableOpacity
                    style={styles.ownerEditBtn}
                    onPress={() => {
                      setEditName(currentUser?.name || '');
                      setEditBio(currentUser?.bio || '');
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit3 size={14} color="#f472b6" style={{ marginRight: 6 }} />
                    <Text style={styles.ownerEditBtnText}>Edit Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.ownerSettingsBtn}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
                  >
                    <Settings size={14} color="#c084fc" style={{ marginRight: 6 }} />
                    <Text style={styles.ownerSettingsBtnText}>Account & Wallet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.ownerUploadBtn}
                    onPress={() => navigation.navigate('UploadReel')}
                  >
                    <LinearGradient
                      colors={['#ff007a', '#ff4b2b']}
                      style={styles.ownerUploadGradient}
                    >
                      <Plus size={16} color="#ffffff" strokeWidth={3} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.visitorButtonsRow}>
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
                        colors={['#ff007a', '#ff4b2b']}
                        style={styles.gradientBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <UserPlus size={16} color="#fff" />
                        <Text style={styles.followBtnText}>Follow</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.subscribeBtn}
                    onPress={() => navigation.navigate('Subscription')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#7928ca', '#ff007a']}
                      style={styles.gradientBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Crown size={15} color="#fbbf24" />
                      <Text style={styles.subscribeBtnText}>Subscribe</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Tabs Bar: Videos, Shorts, [Liked], About */}
            <View style={styles.tabsBar}>
              {tabs.map(tab => {
                const isTabActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabBtn, isTabActive && styles.tabBtnActive]}
                  >
                    <Text style={[styles.tabBtnText, isTabActive && styles.tabBtnTextActive]}>
                      {tab}
                    </Text>
                    {isTabActive && <View style={styles.activeTabUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* About Tab Content */}
            {activeTab === 'About' && (
              <View style={styles.aboutCard}>
                <Text style={styles.aboutTitle}>About @{targetUsername}</Text>
                <Text style={styles.aboutDesc}>{displayBio}</Text>
                <View style={styles.aboutMetaRow}>
                  <Text style={styles.aboutMetaLabel}>Joined:</Text>
                  <Text style={styles.aboutMetaVal}>FunFlick Creator Network</Text>
                </View>
                <View style={styles.aboutMetaRow}>
                  <Text style={styles.aboutMetaLabel}>Status:</Text>
                  <Text style={[styles.aboutMetaVal, { color: isVerified ? '#fbbf24' : '#34d399' }]}>
                    {isVerified ? '⭐ Verified Influencer' : 'Active Member'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          activeTab !== 'About' && (
            <View style={styles.emptyContainer}>
              <Film size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'Liked' ? 'No Liked Videos Yet' : 'No Videos Published'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'Liked'
                  ? 'Videos you like will appear here privately.'
                  : 'Videos uploaded by this creator will appear here.'}
              </Text>
            </View>
          )
        }
      />

      {/* Edit Profile Modal for Owner */}
      <Modal visible={isEditModalOpen} animationType="fade" transparent onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter display name"
                placeholderTextColor="#64748b"
                style={styles.modalTextInput}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell others about yourself..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                style={[styles.modalTextInput, { height: 80, textAlignVertical: 'top' }]}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#ff007a', '#ff4b2b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSaveGradient}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconBtn: {
    padding: 8,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usernameHeader: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  youBadge: {
    backgroundColor: 'rgba(244,114,182,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  youBadgeText: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '800',
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverBanner: {
    height: 80,
    width: '100%',
  },
  profileSection: {
    paddingBottom: 4,
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarBorder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#18122c',
  },
  avatarFallback: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0070f3',
    borderWidth: 2,
    borderColor: '#090514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 16,
    paddingBottom: 4,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  identityArea: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  bioText: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
  actionRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  ownerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 10,
    borderRadius: 14,
  },
  ownerEditBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  ownerSettingsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,114,182,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.25)',
    paddingVertical: 10,
    borderRadius: 14,
  },
  ownerSettingsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  ownerUploadBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ownerUploadGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  followBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: 42,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: 42,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  tabsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnActive: {},
  tabBtnText: {
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: '800',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: '60%',
    backgroundColor: '#ff007a',
    borderRadius: 2,
  },
  aboutCard: {
    padding: 18,
    backgroundColor: '#120d29',
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  aboutTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  aboutDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  aboutMetaLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  aboutMetaVal: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  columnWrapper: {
    paddingHorizontal: 1,
    gap: 2,
  },
  gridItem: {
    flex: 1 / 3,
    maxWidth: '33.333%',
    aspectRatio: 0.75,
    marginVertical: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#18122c',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#18122c',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
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
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 240,
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
    borderRadius: 28,
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
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSaveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalSaveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
