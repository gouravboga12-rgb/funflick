import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Plus, Film, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeScreen } from '../screens/feed/HomeScreen';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { ReelsScreen } from '../screens/feed/ReelsScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { CreateChooserModal } from '../screens/create/CreateChooserModal';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Placeholder screen for Create tab (intercepted by tabPress)
function DummyCreateScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

export default function BottomTabNavigator({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isChooserVisible, setIsChooserVisible] = useState(false);

  const bottomInset = Math.max(insets.bottom, 16);
  const tabHeight = 58 + bottomInset;

  const handleSelectCreateType = (type) => {
    setIsChooserVisible(false);
    if (type === 'UploadReel') {
      navigation.navigate('UploadReel');
    } else if (type === 'CreatePost') {
      navigation.navigate('CreatePost');
    } else if (type === 'CreateStory') {
      navigation.navigate('CreatePost'); // Stories share photo upload flow
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
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
        <Tab.Screen
          name="Feed"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Home size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarLabel: 'Discover',
            tabBarIcon: ({ color, size, focused }) => (
              <Compass size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

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

        <Tab.Screen
          name="Reels"
          component={ReelsScreen}
          options={{
            tabBarLabel: 'Reels',
            tabBarIcon: ({ color, size, focused }) => (
              <Film size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={UserProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <User size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  createBtnContainer: {
    top: -12,
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
});
