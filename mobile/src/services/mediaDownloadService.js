import { Platform, Linking, Share, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

/**
 * Robust cross-platform media downloader for FunFlick videos and images
 * @param {string} mediaUrl - The remote public URL of the video or image
 * @param {string} [fileName] - Optional filename
 */
export async function downloadMediaFile(mediaUrl, fileName = 'funflick_video.mp4') {
  if (!mediaUrl) {
    Alert.alert('Download Error', 'No media URL available to download.');
    return;
  }

  // 1. Web Platform: Standard direct blob or <a> download
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      Alert.alert('Download Started', 'Your media download has started.');
    } catch (e) {
      // Fallback: Open URL in new window/tab for native browser save
      if (typeof window !== 'undefined') {
        window.open(mediaUrl, '_blank');
      }
    }
    return;
  }

  // 2. Mobile (Android / iOS):
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      try {
        if (MediaLibrary.Asset && typeof MediaLibrary.Asset.create === 'function') {
          await MediaLibrary.Asset.create(mediaUrl);
          Alert.alert('Success! 🎬', 'Video has been saved directly to your phone gallery.');
          return;
        } else if (typeof MediaLibrary.saveToLibraryAsync === 'function') {
          await MediaLibrary.saveToLibraryAsync(mediaUrl);
          Alert.alert('Success! 🎬', 'Video has been saved directly to your phone gallery.');
          return;
        }
      } catch (assetErr) {
        console.log('Direct gallery asset save fallback:', assetErr?.message);
      }
    }

    // 3. Fallback: Native system share / save sheet or direct browser download
    const isSupported = await Linking.canOpenURL(mediaUrl);
    if (isSupported) {
      Alert.alert(
        'Download Video',
        'Open video in browser to save directly to your device storage?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Video',
            onPress: () => Linking.openURL(mediaUrl).catch(() => {}),
          },
        ]
      );
    } else {
      await Share.share({
        title: 'FunFlick Video',
        url: mediaUrl,
        message: `Watch & Download this video from FunFlick:\n${mediaUrl}`,
      });
    }
  } catch (err) {
    console.warn('Download error:', err);
    try {
      await Linking.openURL(mediaUrl);
    } catch {
      Alert.alert('Download', 'Could not open media downloader.');
    }
  }
}
