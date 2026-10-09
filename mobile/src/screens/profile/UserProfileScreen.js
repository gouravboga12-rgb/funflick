import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Shield, LogOut, Grid, Bookmark, Heart, UserX, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

export const UserProfileScreen = ({ navigation }) => {
  const { currentUser, logout, posts } = useApp();
  const [activeTab, setActiveTab] = useState('Reels');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const myPosts = posts.filter(p => p.creator?.username === currentUser?.username);

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
          <Settings size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <LinearGradient colors={['#ff007a', '#7928ca']} style={styles.avatarBorder}>
            <Image
              source={{
                uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatar}
            />
          </LinearGradient>

          <Text style={styles.displayName}>{currentUser?.name || 'FunFlick Member'}</Text>
          <Text style={styles.bioText}>{currentUser?.bio || 'Creator on FunFlick 🎬'}</Text>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{myPosts.length}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>1.2K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>148</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Profile Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Reels' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Reels')}
          >
            <Grid size={18} color={activeTab === 'Reels' ? colors.primary : '#9ca3af'} />
            <Text style={[styles.tabText, activeTab === 'Reels' && styles.tabTextActive]}>My Reels</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Saved' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Saved')}
          >
            <Bookmark size={18} color={activeTab === 'Saved' ? colors.primary : '#9ca3af'} />
            <Text style={[styles.tabText, activeTab === 'Saved' && styles.tabTextActive]}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Media Grid */}
        <View style={styles.grid}>
          {myPosts.map(post => (
            <TouchableOpacity
              key={post.id}
              style={styles.gridItem}
              onPress={() => navigation.navigate('VideoDetail', { id: post.id })}
            >
              <Image source={{ uri: post.posterUrl || post.mediaUrl }} style={styles.gridImg} />
            </TouchableOpacity>
          ))}
          {myPosts.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No reels published yet</Text>
              <TouchableOpacity
                style={styles.createReelBtn}
                onPress={() => navigation.navigate('UploadReel')}
              >
                <Text style={styles.createReelText}>Upload Your First Reel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

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
    backgroundColor: colors.background,
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
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 6,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 2.5,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    backgroundColor: '#1b1236',
  },
  displayName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  bioText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  statNum: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 0.75,
    borderWidth: 0.5,
    borderColor: colors.background,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  emptyWrap: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  createReelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
  settingsSheet: {
    backgroundColor: '#130b26',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  noBlockedText: {
    color: colors.textDim,
    fontSize: 12,
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  blockedUsername: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  unblockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '700',
  },
});
