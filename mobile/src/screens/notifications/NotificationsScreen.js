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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Check,
  Trash2,
  Bell,
  Heart,
  UserPlus,
  MessageSquare,
  Sparkles,
  CreditCard,
  ShieldAlert,
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
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear your notification history?',
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

  const filteredNotifs = useMemo(() => {
    const list = notifications || [];
    if (activeTab === 'Likes') return list.filter(n => n.type === 'like');
    if (activeTab === 'Comments') return list.filter(n => n.type === 'comment');
    if (activeTab === 'Follows') return list.filter(n => n.type === 'follow');
    if (activeTab === 'Requests') return list.filter(n => n.type === 'request');
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

  const hasUnread = (notifications || []).some(n => !n.is_read);

  const renderIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} color="#ff007a" fill="#ff007a" />;
      case 'follow':
        return <UserPlus size={16} color="#38bdf8" />;
      case 'comment':
        return <MessageSquare size={16} color="#4ade80" />;
      case 'subscription':
        return <Sparkles size={16} color="#c084fc" />;
      case 'payout':
      case 'wallet':
        return <CreditCard size={16} color="#fbbf24" />;
      case 'moderation_rejected':
        return <ShieldAlert size={16} color="#f87171" />;
      default:
        return <Bell size={16} color="#94a3b8" />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. Top Header (Matching image copy 51.png) */}
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
            <Check size={14} color={hasUnread ? '#ff007a' : '#64748b'} strokeWidth={2.5} />
            <Text style={[styles.actionText, hasUnread ? styles.actionTextActive : styles.actionTextDisabled]}>
              Read All
            </Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleClearAll}
            disabled={!notifications || notifications.length === 0}
            activeOpacity={0.7}
          >
            <Trash2
              size={14}
              color={notifications && notifications.length > 0 ? '#cbd5e1' : '#64748b'}
            />
            <Text
              style={[
                styles.actionText,
                notifications && notifications.length > 0 ? styles.actionTextNormal : styles.actionTextDisabled,
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
            if (isActive) {
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveTab(cat)}
                  activeOpacity={0.85}
                  style={styles.pillActiveWrapper}
                >
                  <LinearGradient
                    colors={[colors.primary, '#9333ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pillActiveGradient}
                  >
                    <Text style={styles.pillTextActive}>{cat}</Text>
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
                <Text style={styles.pillTextInactive}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Notifications List */}
      <FlatList
        data={filteredNotifs}
        keyExtractor={(item) => String(item.id || item.created_at)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Bell size={36} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyText}>No notifications in this category.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.is_read;
          const timeStr = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Today';

          return (
            <View style={[styles.notifCard, isUnread && styles.notifCardUnread]}>
              <View style={styles.notifIconWrap}>{renderIcon(item.type)}</View>

              <View style={styles.notifBody}>
                <View style={styles.notifHeaderRow}>
                  <Text style={styles.notifTitle} numberOfLines={1}>
                    {item.title || 'Notification'}
                  </Text>
                  <Text style={styles.notifTime}>{timeStr}</Text>
                </View>

                {Boolean(item.message) && (
                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                )}
              </View>

              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07040d',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionTextActive: {
    color: '#ff007a',
  },
  actionTextNormal: {
    color: '#cbd5e1',
  },
  actionTextDisabled: {
    color: '#64748b',
  },
  actionDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  filterContent: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },
  pillActiveWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  pillActiveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pillTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillTextInactive: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#120b22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  notifCardUnread: {
    borderColor: 'rgba(255,0,122,0.3)',
    backgroundColor: '#170e2c',
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '500',
  },
  notifMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff007a',
  },
});
