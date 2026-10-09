import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Modal, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Shield, LogOut, Grid, Bookmark, Heart, Play, Edit3, X, Check, Eye } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { apiRequest, setStoredUser } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3;

function formatCount(num) {
  if (!num) return '0';
  if (typeof num === 'string' && (num.includes('K') || num.includes('M'))) return num;
  const n = Number(num);
  if (isNaN(n)) return String(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export const UserProfileScreen = ({ navigation }) => {
  const { currentUser, logout, posts } = useApp();
  const [activeTab, setActiveTab] = useState('Reels'); // 'Reels' | 'Saved' | 'Liked'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isLoadingFollows, setIsLoadingFollows] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Filter dynamic media lists based on real database posts
  const myReels = posts.filter(p => p.creator?.username === currentUser?.username);
  const savedReels = posts.filter(p => p.isSaved);
  const likedReels = posts.filter(p => p.isLiked);

  const displayList = activeTab === 'Reels' ? myReels : (activeTab === 'Saved' ? savedReels : likedReels);

  // Fetch real follow stats from EC2 backend
  const fetchFollowStats = useCallback(async () => {
    if (!currentUser?.username) return;
    setIsLoadingFollows(true);
    try {
      const [f1, f2] = await Promise.all([
        apiRequest(`/follows/${currentUser.username}/followers`),
        apiRequest(`/follows/${currentUser.username}/following`),
      ]);
      setFollowCounts({
        followers: f1?.count !== undefined ? f1.count : (f1?.followers?.length || 0),
        following: f2?.count !== undefined ? f2.count : (f2?.following?.length || 0),
      });
    } catch (e) {
      console.warn('Could not fetch follow counts:', e);
    } finally {
      setIsLoadingFollows(false);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    fetchFollowStats();
  }, [fetchFollowStats]);

  // Fetch blocked users when opening settings
  const fetchBlockedUsers = async () => {
    try {
      const data = await apiRequest('/users/blocked');
      if (data && data.blocked) {
        setBlockedUsers(data.blocked);
      }
    } catch (e) {}
  };

  const handleUnblock = async (username) => {
    try {
      await apiRequest('/users/unblock', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      setBlockedUsers(prev => prev.filter(u => u !== username));
      Alert.alert('Unblocked', `@${username} has been unblocked.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your display name.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
        }),
      });
      if (updated?.user) {
        await setStoredUser(updated.user);
        currentUser.name = updated.user.name;
        currentUser.bio = updated.user.bio;
      }
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Could not update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of FunFlick?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setShowSettingsModal(false);
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.usernameHeader}>@{currentUser?.username || 'profile'}</Text>
        <TouchableOpacity
          onPress={() => {
            fetchBlockedUsers();
            setShowSettingsModal(true);
          }}
          style={styles.iconBtn}
        >
          <Settings size={22} color="#ffffff" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Profile Info Header */}
        <View style={styles.profileHeader}>
          {/* Avatar with glowing Instagram gradient ring */}
          <LinearGradient
            colors={['#ff8a00', '#ff007a', '#7928ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBorder}
          >
            <View style={styles.avatarInnerRing}>
              <Image
                source={{
                  uri: currentUser?.avatar_url || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.avatar}
              />
            </View>
          </LinearGradient>

          <Text style={styles.displayName}>{currentUser?.name || 'FunFlick Member'}</Text>
          <Text style={styles.bioText}>{currentUser?.bio || 'Creator on FunFlick 🎬 India’s Video Comedy Hub'}</Text>

          {/* Action Buttons: Edit Profile & Settings */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                setEditName(currentUser?.name || '');
                setEditBio(currentUser?.bio || '');
                setShowEditModal(true);
              }}
            >
              <Edit3 size={14} color="#ffffff" strokeWidth={2.2} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsPillBtn}
              onPress={() => {
                fetchBlockedUsers();
                setShowSettingsModal(true);
              }}
            >
              <Settings size={14} color="#ffffff" strokeWidth={2.2} />
              <Text style={styles.settingsPillText}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Bar (Live dynamic counts from AWS backend) */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{myReels.length}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{formatCount(followCounts.followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{formatCount(followCounts.following)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Profile Tabs (My Reels | Saved | Liked) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Reels' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Reels')}
          >
            <Grid size={18} color={activeTab === 'Reels' ? colors.primary : '#9ca3af'} strokeWidth={2.2} />
            <Text style={[styles.tabText, activeTab === 'Reels' && styles.tabTextActive]}>My Reels</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Saved' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Saved')}
          >
            <Bookmark size={18} color={activeTab === 'Saved' ? colors.primary : '#9ca3af'} strokeWidth={2.2} />
            <Text style={[styles.tabText, activeTab === 'Saved' && styles.tabTextActive]}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Liked' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Liked')}
          >
            <Heart size={18} color={activeTab === 'Liked' ? colors.primary : '#9ca3af'} strokeWidth={2.2} />
            <Text style={[styles.tabText, activeTab === 'Liked' && styles.tabTextActive]}>Liked</Text>
          </TouchableOpacity>
        </View>

        {/* 3-Column Media Grid (Matching Web Profile Grid) */}
        <View style={styles.grid}>
          {displayList.map(post => (
            <TouchableOpacity
              key={post.id}
              style={styles.gridItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VideoDetail', { videoId: post.id })}
            >
              <Image source={{ uri: post.posterUrl || post.mediaUrl }} style={styles.gridImg} />
              
              {/* Views Count Overlay */}
              <View style={styles.gridOverlay}>
                <Play size={11} color="#ffffff" fill="#ffffff" />
                <Text style={styles.gridViewsText}>{formatCount(post.viewsCount || 0)}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {displayList.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {activeTab === 'Reels' ? 'No reels published yet' : `No ${activeTab.toLowerCase()} reels found`}
              </Text>
              {activeTab === 'Reels' && (
                <TouchableOpacity
                  style={styles.createReelBtn}
                  onPress={() => navigation.navigate('UploadReel')}
                >
                  <Text style={styles.createReelText}>Upload Your First Reel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={styles.textInput}
                placeholder="Your Name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                style={[styles.textInput, styles.textArea]}
                placeholder="Tell the community about yourself..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <LinearGradient colors={['#ff007a', '#7928ca']} style={styles.saveBtnGradient}>
                {isSavingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal with Blocked Users Management */}
      <Modal visible={showSettingsModal} transparent animationType="slide" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsSheet}>
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>Settings & Privacy</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Blocked Users Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Shield size={18} color={colors.primary} />
                <Text style={styles.sectionHeading}>Blocked People</Text>
              </View>

              {blockedUsers.length === 0 ? (
                <Text style={styles.noBlockedText}>No blocked users on your account.</Text>
              ) : (
                blockedUsers.map((u, i) => (
                  <View key={i} style={styles.blockedRow}>
                    <Text style={styles.blockedUsername}>@{u}</Text>
                    <TouchableOpacity
                      style={styles.unblockBtn}
                      onPress={() => handleUnblock(u)}
                    >
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Logout Action */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={20} color="#f43f5e" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  usernameHeader: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 6,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarInnerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#090514',
    overflow: 'hidden',
    backgroundColor: '#1b1236',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  displayName: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
  },
  bioText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingsPillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNum: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    gap: 2,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 8) / 3,
    height: ((SCREEN_WIDTH - 8) / 3) * 1.35,
    backgroundColor: '#1b1236',
    position: 'relative',
  },
  gridImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridViewsText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyWrap: {
    width: '100%',
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  createReelBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  createReelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#130a24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingsSheet: {
    backgroundColor: '#130a24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  noBlockedText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  blockedUsername: {
    color: '#ffffff',
    fontSize: 13,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  unblockText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '700',
  },
});
