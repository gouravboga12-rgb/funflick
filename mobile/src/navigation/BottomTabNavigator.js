import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Plus, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeScreen } from '../screens/feed/HomeScreen';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { InboxScreen } from '../screens/inbox/InboxScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { CreateChooserModal } from '../screens/create/CreateChooserModal';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

function DummyCreateScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

export default function BottomTabNavigator({ navigation }) {
  const insets = useSafeAreaInsets();
  const { currentUser, conversations, isChatOpen } = useApp();
  const [isChooserVisible, setIsChooserVisible] = useState(false);

  const bottomInset = Math.max(insets.bottom, 14);
  const tabHeight = 60 + bottomInset;

  const unreadMessagesCount = (conversations || []).reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0
  );

  const handleSelectCreateType = (type) => {
    setIsChooserVisible(false);
    if (type === 'UploadReel') {
      navigation.navigate('UploadReel');
    } else if (type === 'CreatePost') {
      navigation.navigate('CreatePost');
    } else if (type === 'CreateStory') {
      navigation.navigate('CreateStory');
    } else if (type === 'Subscription') {
      navigation.navigate('Subscription');
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: isChatOpen
            ? { display: 'none' }
            : [
                styles.tabBar,
                {
                  height: tabHeight,
                  paddingBottom: bottomInset,
                },
              ],
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        {/* 1. Home */}
        <Tab.Screen
          name="Feed"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        {/* 2. Discover */}
        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarLabel: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        {/* 3. Create */}
        <Tab.Screen
          name="Create"
          component={DummyCreateScreen}
          options={{
            tabBarLabel: '',
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.createBtnContainer}
                activeOpacity={0.8}
                onPress={() => setIsChooserVisible(true)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createBtn}
                >
                  <Plus size={24} color="#ffffff" strokeWidth={3} />
                </LinearGradient>
              </TouchableOpacity>
            ),
          }}
        />

        {/* 4. Inbox (Matching Website 4th Tab) */}
        <Tab.Screen
          name="Inbox"
          component={InboxScreen}
          options={{
            tabBarLabel: 'Inbox',
            tabBarIcon: ({ color, focused }) => (
              <View style={{ position: 'relative' }}>
                <MessageSquare size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                {unreadMessagesCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        {/* 5. Profile (Avatar Circle matching Website) */}
        <Tab.Screen
          name="Profile"
          component={UserProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => (
              <View style={[styles.avatarTabBorder, focused && styles.avatarTabBorderActive]}>
                <Image
                  source={{
                    uri: currentUser?.avatar_url || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                  }}
                  style={styles.avatarImg}
                />
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      <CreateChooserModal
        visible={isChooserVisible}
        onClose={() => setIsChooserVisible(false)}
        onSelect={handleSelectCreateType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0a0515',
  },
  tabBar: {
    backgroundColor: '#0a0515',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 2,
  },
  createBtnContainer: {
    top: -10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  createBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarTabBorder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    padding: 1.5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1b1236',
  },
  avatarTabBorderActive: {
    borderColor: colors.primary,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff007a',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
