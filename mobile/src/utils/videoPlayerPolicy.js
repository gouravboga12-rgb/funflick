import { Platform } from 'react-native';

/**
 * Android devices enforce a strict hardware MediaCodec limit (4-6 concurrent decoders).
 * Holding players for off-screen items causes an immediate native SIGABRT/OOM crash.
 *
 * Policy:
 * - On iOS / other native platforms: returns mediaUrl unchanged (AVPlayer handles decoder virtualization).
 * - On Web: returns null (web uses native HTML5 <video>).
 * - On Android: returns mediaUrl ONLY when screen is focused AND the item is active OR preloading (the immediate next item).
 *   For all other items, returns null so expo-video unmounts/releases the native ExoPlayer MediaCodec instance.
 */
export const getManagedVideoSource = ({
  isVideo = false,
  mediaUrl = '',
  isActive = false,
  isFocused = true,
  shouldPreload = false,
}) => {
  if (!isVideo || !mediaUrl || Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS !== 'android') {
    return mediaUrl;
  }

  // On Android, only allocate native ExoPlayer decoder for active or preloaded item when screen is in focus
  const isAllowedOnAndroid = isFocused && (isActive || shouldPreload);
  return isAllowedOnAndroid ? mediaUrl : null;
};

