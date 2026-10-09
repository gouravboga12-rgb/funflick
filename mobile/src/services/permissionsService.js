import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

/**
 * Transparently guide user to device Settings when a permission is blocked or denied
 */
export function promptOpenSettings(featureName, reason) {
  Alert.alert(
    `${featureName} Permission Required`,
    `${reason}\n\nPlease enable this permission in your phone's Settings to continue.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ]
  );
}

/**
 * Request Media Library (Photo/Video Gallery) permission
 * Returns boolean (true if granted, false if denied)
 */
export async function ensureMediaLibraryPermission() {
  const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (status === 'granted') {
    return true;
  }

  // Request system permission
  const requestRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (requestRes.status === 'granted') {
    return true;
  }

  // If denied, show transparent dialog directing user to Settings
  promptOpenSettings(
    'Photos & Media',
    'FunFlick requires permission to access your photo & video gallery to pick reels, posts, and stories.'
  );
  return false;
}

/**
 * Request Camera permission
 * Returns boolean (true if granted, false if denied)
 */
export async function ensureCameraPermission() {
  const { status } = await ImagePicker.getCameraPermissionsAsync();

  if (status === 'granted') {
    return true;
  }

  const requestRes = await ImagePicker.requestCameraPermissionsAsync();
  if (requestRes.status === 'granted') {
    return true;
  }

  promptOpenSettings(
    'Camera',
    'FunFlick requires camera access to record reels and take photos directly within the app.'
  );
  return false;
}

/**
 * Request Push Notifications permission
 * Returns boolean (true if granted, false if denied)
 */
export async function ensureNotificationsPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}
