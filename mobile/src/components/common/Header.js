import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Search, Bell, MessageSquare } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export const Header = ({
  tabs = ['For You', 'Trending', 'Latest'],
  activeTab = 'For You',
  unreadCount = 0,
  onTabChange,
  onSearchPress,
  onNotificationsPress,
  onMessagesPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Brand Logo & Title */}
      <View style={styles.left}>
        <Image
          source={{ uri: 'https://funflick-theta.vercel.app/brand/funflick-logo.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>
          fun<Text style={styles.brandAccent}>flick</Text>
        </Text>
      </View>

      {/* Vertical Divider */}
      <View style={styles.divider} />

      {/* Center: Inline Tabs (For You | Trending | Latest) */}
      <View style={styles.tabsWrap}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange?.(tab)}
              style={styles.tabBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
              {isActive && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right Actions: Search, Bell, Inbox */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn}>
          <Search size={19} color="#ffffff" strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onNotificationsPress} style={styles.iconBtn}>
          <Bell size={19} color="#ffffff" strokeWidth={2.2} />
          {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={onMessagesPress} style={styles.iconBtn}>
          <MessageSquare size={19} color="#ffffff" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090514',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 10,
  },
  tabsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabBtn: {
    paddingVertical: 6,
    position: 'relative',
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 6,
  },
  iconBtn: {
    padding: 4,
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff007a',
    borderWidth: 1.5,
    borderColor: '#090514',
  },
});
