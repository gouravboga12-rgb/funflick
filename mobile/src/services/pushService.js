import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequest } from './api';
import { ensureNotificationsPermission } from './permissionsService';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for Expo Push Notifications and sync token with FunFlick backend
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const isGranted = await ensureNotificationsPermission();
    if (!isGranted) {
      console.log('Notification permission was not granted');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FunFlick Activity',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff007a',
        sound: 'default',
      });
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const pushToken = tokenResponse.data;

    // Send push token to FunFlick backend
    try {
      await apiRequest('/users/push-token', {
        method: 'POST',
        body: JSON.stringify({ pushToken }),
      });
      console.log('Push token successfully registered with backend:', pushToken);
    } catch (e) {
      console.warn('Could not sync push token with backend:', e.message);
    }

    return pushToken;
  } catch (error) {
    console.warn('Error during push notification registration:', error);
    return null;
  }
}
