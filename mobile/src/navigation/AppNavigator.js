import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import BottomTabNavigator from './BottomTabNavigator';
import { UploadReelScreen } from '../screens/create/UploadReelScreen';
import { CreatePostScreen } from '../screens/create/CreatePostScreen';
import CreatorProfileScreen from '../screens/profile/CreatorProfileScreen';
import { VideoDetailScreen } from '../screens/media/VideoDetailScreen';
import StoryViewerScreen from '../screens/feed/StoryViewerScreen';
import { SubscriptionScreen } from '../screens/subscription/SubscriptionScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { colors } from '../theme/colors';

import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: 'rgba(255,255,255,0.08)',
    primary: colors.primary,
  },
};

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'funflick://', 'https://funflick-theta.vercel.app'],
  config: {
    screens: {
      Splash: 'splash',
      MainTabs: {
        screens: {
          Feed: 'feed',
          Discover: 'discover',
          Inbox: 'inbox',
          Profile: 'profile',
        },
      },
      Login: 'login',
      SignUp: 'signup',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={CustomDarkTheme} linking={linking}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="UploadReel"
          component={UploadReelScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="CreateStory"
          component={CreatePostScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="CreatorProfile"
          component={CreatorProfileScreen}
        />
        <Stack.Screen
          name="VideoDetail"
          component={VideoDetailScreen}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
        />
        <Stack.Screen
          name="Wallet"
          component={WalletScreen}
        />
        <Stack.Screen
          name="StoryViewer"
          component={StoryViewerScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
