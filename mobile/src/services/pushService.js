import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequest } from './api';
import { ensureNotificationsPermission } from './permissionsService';

let handlerInitialized = false;

function initNotificationHandlerSafe() {
  if (handlerInitialized) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerInitialized = true;
  } catch (err) {
    console.warn('Notification handler init skipped:', err?.message);
  }
}

/**
 * Register device for Expo Push Notifications and sync token with FunFlick backend
 */
export async function registerForPushNotificationsAsync() {
  initNotificationHandlerSafe();

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
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'FunFlick Activity',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ff007a',
          sound: 'default',
        });
      } catch (channelErr) {
        console.warn('Notification channel setup error:', channelErr?.message);
      }
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const pushToken = tokenResponse?.data;
    if (!pushToken) return null;

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
    console.warn('Push notification setup gracefully handled:', error?.message);
    return null;
  }
}
