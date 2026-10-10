import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  CheckCheck,
  Trash2,
  Bell,
  Heart,
  UserPlus,
  MessageSquare,
  MessageCircle,
  Sparkles,
  CreditCard,
  Users,
  UserCheck,
  X,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const CATEGORIES = ['All', 'Requests', 'Likes', 'Comments', 'Follows', 'System'];

export const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    fetchNotifications,
    markAllNotificationsRead,
    clearAllNotifications,
    toggleFollowCreator,
    followingUsernames,
    followRequests,
    acceptFollowRequest,
    declineFollowRequest,
  } = useApp();

  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications?.();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications?.();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    if (markAllNotificationsRead) {
      await markAllNotificationsRead();
    }
  };

  const handleClearAll = () => {
    if (!notifications || notifications.length === 0) {
      Alert.alert('No Notifications', 'No notifications to clear');
      return;
    }
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all your notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (clearAllNotifications) {
              await clearAllNotifications();
            }
          },
        },
      ]
    );
  };

  const handleNotificationItemPress = (item) => {
    if (!item) return;

    if (item.id && !item.is_read) {
      item.is_read = 1;
      item.unread = false;
    }

    const type = String(item.type || '').toLowerCase();
    const title = String(item.title || '').toLowerCase();
    const msg = String(item.message || item.text || '').toLowerCase();
    const rawUser = item.actor_username || item.actorUsername || item.user || item.actor_name;
    const cleanUser = String(rawUser || '').replace(/^@+/, '');

    // 1. Direct Messages / Chat
    if (
      type === 'message' ||
      type === 'chat' ||
      title.includes('message') ||
      title.includes('chat') ||
      title.startsWith('💬')
    ) {
      navigation.navigate('MainTabs', {
        screen: 'Inbox',
        params: {
          targetUser: {
            username: cleanUser,
            name: item.actor_name || item.actorName || cleanUser,
            avatar: item.actor_avatar || item.avatar,
          },
        },
      });
      return;
    }

    // 2. Payout / Wallet / Payment
    if (
      type === 'payout' ||
      type === 'wallet' ||
      type === 'payment' ||
      title.includes('payout') ||
      title.includes('wallet') ||
      msg.includes('wallet')
    ) {
      navigation.navigate('Wallet');
      return;
    }

    // 3. Like or Comment on a video
    const targetVideoId = item.target_id || item.targetId;
    if ((type === 'like' || type === 'comment') && targetVideoId) {
      navigation.navigate('VideoDetail', { videoId: targetVideoId });
      return;
    }

    // 4. Follow -> Creator Profile
    if (type === 'follow' && cleanUser) {
      navigation.navigate('CreatorProfile', { username: cleanUser });
      return;
    }

    // 5. Moderation or System Alerts
    if (type?.startsWith('moderation') || type === 'system') {
      Alert.alert(item.title || 'Notification Update', item.text || item.message || '');
      return;
    }
  };

  const filteredNotifs = useMemo(() => {
    const list = notifications || [];
    if (activeTab === 'Requests') {
      return []; // Requests are shown in the dedicated follow requests section
    }
    if (activeTab === 'Likes') return list.filter(n => n.type === 'like');
    if (activeTab === 'Comments') return list.filter(n => n.type === 'comment');
    if (activeTab === 'Follows') return list.filter(n => n.type === 'follow');
    if (activeTab === 'System') {
      return list.filter(n =>
        n.type === 'system' ||
        n.type === 'subscription' ||
        n.type === 'payout' ||
        n.type === 'wallet' ||
        n.type?.startsWith('moderation')
      );
    }
    return list;
  }, [notifications, activeTab]);

  const hasUnread = (notifications || []).some(n => Boolean(n.unread || (!n.is_read && n.is_read !== 1)));

  const renderBadgeIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={10} color="#ff007a" fill="#ff007a" />;
      case 'follow':
        return <UserPlus size={10} color="#38bdf8" />;
      case 'comment':
        return <MessageSquare size={10} color="#4ade80" />;
      case 'message':
      case 'chat':
        return <MessageCircle size={10} color="#ff007a" />;
      case 'subscription':
        return <Sparkles size={10} color="#c084fc" />;
      case 'payout':
      case 'wallet':
        return <CreditCard size={10} color="#fbbf24" />;
      default:
        return <Bell size={10} color="#94a3b8" />;
    }
  };

  const showRequests = (activeTab === 'All' || activeTab === 'Requests') && followRequests && followRequests.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. Top Header (Identical to Website image copy 54.png) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Activity</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleMarkAllRead}
            disabled={!hasUnread}
            activeOpacity={0.7}
          >
            <CheckCheck size={14} color={hasUnread ? '#ff007a' : '#64748b'} strokeWidth={2.5} />
            <Text style={[styles.actionText, hasUnread ? styles.actionTextActive : styles.actionTextDisabled]}>
              Read All
            </Text>
          </TouchableOpacity>

          <Text style={styles.actionDivider}>|</Text>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleClearAll}
            disabled={!notifications || notifications.length === 0}
            activeOpacity={0.7}
          >
            <Trash2
              size={14}
              color={notifications && notifications.length > 0 ? '#ef4444' : '#64748b'}
            />
            <Text
              style={[
                styles.actionText,
                notifications && notifications.length > 0 ? styles.actionTextDanger : styles.actionTextDisabled,
              ]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Filter Pills (All | Requests | Likes | Comments | Follows | System) */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat;
            const hasRequestsCount = cat === 'Requests' && followRequests && followRequests.length > 0;

            if (isActive) {
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveTab(cat)}
                  activeOpacity={0.85}
                  style={styles.pillActiveWrapper}
                >
                  <LinearGradient
                    colors={['#ff007a', '#7928ca']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pillActiveGradient}
                  >
                    <View style={styles.pillRow}>
                      <Text style={styles.pillTextActive}>{cat}</Text>
                      {hasRequestsCount && (
                        <View style={styles.requestsPillBadge}>
                          <Text style={styles.requestsPillBadgeText}>{followRequests.length}</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveTab(cat)}
                activeOpacity={0.7}
                style={styles.pillInactive}
              >
                <View style={styles.pillRow}>
                  <Text style={styles.pillTextInactive}>{cat}</Text>
                  {hasRequestsCount && (
                    <View style={styles.requestsPillBadgeInactive}>
                      <Text style={styles.requestsPillBadgeText}>{followRequests.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Notifications & Requests List */}
      <FlatList
        data={filteredNotifs}
        keyExtractor={(item) => String(item.id || item.created_at || Math.random())}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          showRequests ? (
            <View style={styles.requestsSection}>
              <View style={styles.requestsHeader}>
                <View style={styles.requestsHeaderLeft}>
                  <Users size={16} color="#60a5fa" />
                  <Text style={styles.requestsTitle}>Follow Requests</Text>
                  <View style={styles.requestsCountBadge}>
                    <Text style={styles.requestsCountText}>{followRequests.length}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {followRequests.map(req => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestAvatarWrap}>
                    {req.avatar ? (
                      <Image source={{ uri: req.avatar }} style={styles.requestAvatar} />
                    ) : (
                      <View style={[styles.requestAvatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>{((req.name || req.username || 'U')[0]).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestUsername} numberOfLines={1}>@{req.username}</Text>
                    <Text style={styles.requestName} numberOfLines={1}>{req.name || req.username}</Text>
                    <Text style={styles.requestTime}>{req.time || 'Recently'}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity onPress={() => acceptFollowRequest?.(req.id)} activeOpacity={0.85}>
                      <LinearGradient
                        colors={['#ff007a', '#7928ca']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmBtn}
                      >
                        <UserCheck size={12} color="#fff" />
                        <Text style={styles.confirmText}>Confirm</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => declineFollowRequest?.(req.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.8}
                    >
                      <X size={12} color="#cbd5e1" />
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          activeTab === 'Requests' ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Users size={32} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.emptyText}>No pending follow requests.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Bell size={32} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.emptyText}>No notifications in this category.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isUnread = Boolean(item.unread || (!item.is_read && item.is_read !== 1));
          const rawUser = item.actor_username || item.actorUsername || item.user || item.actor_name || 'FunFlick';
          const cleanUser = String(rawUser).replace(/^@+/, '');
          const isFollowingActor = followingUsernames ? followingUsernames.has(cleanUser.toLowerCase()) : false;

          let displayText = item.text || item.message || '';
          if (!displayText) {
            if (item.type === 'follow') displayText = `${item.actor_name || cleanUser} started following you.`;
            else if (item.type === 'like') displayText = `liked your post.`;
            else if (item.type === 'comment') displayText = `commented on your post.`;
            else if (item.type === 'message' || item.type === 'chat') displayText = `sent you a message.`;
            else displayText = item.title || 'Notification update';
          }

          const timeStr = item.time || (item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recently');

          const avatarUri = item.actor_avatar || item.avatar;
          const initialChar = ((item.actor_name || cleanUser || 'F')[0] || 'F').toUpperCase();

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleNotificationItemPress(item)}
              style={[styles.notifCard, isUnread ? styles.notifCardUnread : styles.notifCardRead]}
            >
              {/* Avatar with Micro Type Badge (matching image copy 54.png) */}
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{initialChar}</Text>
                  </View>
                )}

                {/* Micro Badge on bottom-right */}
                <View style={styles.typeBadge}>
                  {renderBadgeIcon(item.type)}
                </View>
              </View>

              {/* Text content area */}
              <View style={styles.notifBody}>
                <Text style={styles.notifText} numberOfLines={3}>
                  <Text style={styles.usernameText}>@{cleanUser} </Text>
                  <Text style={styles.contentText}>{displayText}</Text>
                </Text>

                <Text style={styles.notifTime}>{timeStr}</Text>

                {/* Follow Back button (matching website image copy 54.png) */}
                {item.type === 'follow' && (
                  <View style={styles.followActionRow}>
                    {isFollowingActor ? (
                      <TouchableOpacity
                        style={styles.followingBtn}
                        onPress={() => toggleFollowCreator?.(cleanUser)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.followingBtnText}>Following</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => toggleFollowCreator?.(cleanUser)}
                        activeOpacity={0.85}
                        style={styles.followBackBtnWrapper}
                      >
                        <LinearGradient
                          colors={['#ff007a', '#7928ca']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.followBackGradient}
                        >
                          <Text style={styles.followBackText}>Follow Back</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Pink unread indicator dot (matching website image copy 54.png) */}
              {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionTextActive: {
    color: '#ff007a',
  },
  actionTextDanger: {
    color: '#f87171',
  },
  actionTextDisabled: {
    color: '#64748b',
  },
  actionDivider: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
    marginHorizontal: 1,
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterContent: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillActiveWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  pillActiveGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pillInactive: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  pillTextInactive: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  requestsPillBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  requestsPillBadgeInactive: {
    backgroundColor: '#ff007a',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  requestsPillBadgeText: {
    color: '#090514',
    fontSize: 9,
    fontWeight: '800',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 12,
  },
  requestsSection: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 14, 43, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  requestsCountBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requestsCountText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800',
  },
  seeAllText: {
    color: '#ff007a',
    fontSize: 11,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#140e2b',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 8,
    gap: 10,
  },
  requestAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    overflow: 'hidden',
  },
  requestAvatar: {
    width: '100%',
    height: '100%',
  },
  requestInfo: {
    flex: 1,
  },
  requestUsername: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  requestName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  requestTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    marginTop: 1,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  deleteText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  notifCardRead: {
    backgroundColor: '#140e2b',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  notifCardUnread: {
    backgroundColor: 'rgba(80, 10, 45, 0.32)',
    borderColor: 'rgba(255, 0, 122, 0.35)',
  },
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarFallback: {
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1b1434',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
    paddingTop: 1,
  },
  notifText: {
    fontSize: 12,
    lineHeight: 17,
  },
  usernameText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  contentText: {
    color: '#d1d5db',
    fontWeight: '400',
  },
  notifTime: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },
  followActionRow: {
    marginTop: 8,
  },
  followBackBtnWrapper: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
  },
  followBackGradient: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
  },
  followBackText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  followingBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  followingBtnText: {
    color: '#d1d5db',
    fontSize: 10.5,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff007a',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
});
