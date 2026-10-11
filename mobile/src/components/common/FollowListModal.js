import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, UserCheck, UserPlus, UserX } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

export const FollowListModal = ({
  visible,
  onClose,
  targetUsername,
  initialTab = 'followers',
  currentUsername,
  onRelationshipChanged,
  navigation,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = useCallback(async () => {
    if (!targetUsername) return;
    setIsLoading(true);
    try {
      const [f1, f2] = await Promise.all([
        apiRequest(`/follows/${targetUsername}/followers`),
        apiRequest(`/follows/${targetUsername}/following`),
      ]);
      setFollowers(f1?.followers || []);
      setFollowing(f2?.following || []);
    } catch (e) {
      console.warn('Error fetching follow list:', e?.message);
    } finally {
      setIsLoading(false);
    }
  }, [targetUsername]);

  useEffect(() => {
    if (visible && targetUsername) {
      loadData();
    }
  }, [visible, targetUsername, loadData]);

  const handleToggleFollow = async (user) => {
    if (!user?.username) return;
    setActionLoadingId(user.id);
    const willFollow = !user.iFollowThem;
    const endpoint = willFollow ? `/follows/${user.username}/follow` : `/follows/${user.username}/unfollow`;

    try {
      await apiRequest(endpoint, { method: 'POST' });
      const updateItem = item => item.id === user.id ? { ...item, iFollowThem: willFollow } : item;
      setFollowers(prev => prev.map(updateItem));
      setFollowing(prev => {
        if (!willFollow && targetUsername?.toLowerCase() === currentUsername?.toLowerCase()) {
          return prev.filter(item => item.id !== user.id);
        }
        return prev.map(updateItem);
      });
      onRelationshipChanged?.();
    } catch (e) {
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFollower = async (user) => {
    if (!user?.username) return;
    setActionLoadingId(user.id);
    try {
      await apiRequest(`/follows/${user.username}/remove-follower`, { method: 'POST' });
      setFollowers(prev => prev.filter(f => f.id !== user.id));
      onRelationshipChanged?.();
    } catch (e) {
    } finally {
      setActionLoadingId(null);
    }
  };

  const rawList = activeTab === 'followers' ? followers : following;
  const filteredList = rawList.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  });

  const handleNavigateToUser = (u) => {
    onClose();
    if (u.username?.toLowerCase() === currentUsername?.toLowerCase()) {
      navigation?.navigate('MainTabs', { screen: 'Profile' });
    } else {
      navigation?.navigate('CreatorProfile', { username: u.username });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'followers' && styles.tabBtnActive]}
                onPress={() => setActiveTab('followers')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'followers' && styles.tabBtnTextActive]}>
                  Followers ({followers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'following' && styles.tabBtnActive]}
                onPress={() => setActiveTab('following')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'following' && styles.tabBtnTextActive]}>
                  Following ({following.length})
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchWrap}>
            <Search size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* User List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : filteredList.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching people found' : `No ${activeTab} yet`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredList}
              keyExtractor={item => String(item.id || item.username)}
              contentContainerStyle={{ paddingBottom: 30 }}
              renderItem={({ item }) => {
                const isSelf = item.username?.toLowerCase() === currentUsername?.toLowerCase();
                const isViewingOwnProfile = targetUsername?.toLowerCase() === currentUsername?.toLowerCase();
                const initial = (item.name || item.username || 'F').charAt(0).toUpperCase();

                return (
                  <View style={styles.userRow}>
                    <TouchableOpacity
                      style={styles.userLeft}
                      onPress={() => handleNavigateToUser(item)}
                      activeOpacity={0.7}
                    >
                      {item.avatar && !item.avatar.includes('default-avatar') ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.fallbackAvatar]}>
                          <Text style={styles.fallbackInitial}>{initial}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {item.name || item.username}
                        </Text>
                        <Text style={styles.userHandle} numberOfLines={1}>
                          @{item.username}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Action buttons */}
                    {!isSelf && (
                      <View style={styles.actionsRight}>
                        {isViewingOwnProfile && activeTab === 'followers' ? (
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveFollower(item)}
                            disabled={actionLoadingId === item.id}
                          >
                            <UserX size={13} color="#ef4444" style={{ marginRight: 4 }} />
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.followBtn, item.iFollowThem && styles.followBtnActive]}
                            onPress={() => handleToggleFollow(item)}
                            disabled={actionLoadingId === item.id}
                          >
                            {actionLoadingId === item.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : item.iFollowThem ? (
                              <>
                                <UserCheck size={13} color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.followBtnText}>Following</Text>
                              </>
                            ) : (
                              <>
                                <UserPlus size={13} color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.followBtnText}>Follow</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    backgroundColor: '#110b20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,0,122,0.15)',
  },
  tabBtnText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#ff007a',
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  fallbackAvatar: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  userHandle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff007a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  followBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
