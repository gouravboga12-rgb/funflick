import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ArrowLeft,
  Camera,
  Music,
  Smile,
  Crown,
  X,
  Check,
  UploadCloud,
  Film,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureMediaLibraryPermission, ensureCameraPermission } from '../../services/permissionsService';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest, getToken } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const STICKERS = ['😂', '🔥', '❤️', '🎉', '🍿', '💯', '✨', '☕'];
const MUSIC_TRACKS = [
  '🎵 Telugu Comedy Beats - Trending',
  '🎵 Upbeat Chill Lofi - Mammu Mix',
  '🎵 Standup Crowd Punchline SFX',
];

// Cross-platform alert helper that works seamlessly on Mobile and Web
const showAppAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    if (buttons && buttons.length > 0) {
      const primaryBtn = buttons.find(b => b.style !== 'cancel') || buttons[0];
      if (primaryBtn && primaryBtn.onPress) {
        primaryBtn.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

// Helper video preview component using expo-video
function StoryVideoPreview({ videoUri }) {
  const player = useVideoPlayer(videoUri, p => {
    if (!p) return;
    p.loop = true;
    p.muted = false;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export const CreateStoryScreen = ({ navigation }) => {
  const { currentUser, fetchLiveStories } = useApp();

  const [mediaUri, setMediaUri] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedMusic, setSelectedMusic] = useState('🎵 Telugu Comedy Beats - Trending');
  const [selectedSticker, setSelectedSticker] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmittingRef = useRef(false);
  const [progress, setProgress] = useState(0);

  const maxStoryDuration = 15; // 15 seconds max

  // Robust cross-platform navigation back/exit to Feed
  const handleExitScreen = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Feed' });
    }
  };

  // Process picked file/asset
  const handleProcessMedia = (asset) => {
    const isVid = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/')) || (asset.uri && /\.(mp4|mov|webm|m4v)($|\?)/i.test(asset.uri));
    const size = asset.fileSize || asset.size || 0;
    const maxBytes = isVid ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = isVid ? '10MB' : '5MB';

    if (size > maxBytes) {
      showAppAlert(
        'File Too Large',
        `The selected ${isVid ? 'video' : 'photo'} is ${(size / (1024 * 1024)).toFixed(1)}MB. ${isVid ? 'Videos' : 'Photos'} must be ${maxLabel} or less.`
      );
      return;
    }

    if (isVid && asset.duration && asset.duration > maxStoryDuration * 1000) {
      showAppAlert(
        'Video Too Long',
        `Story videos must be ${maxStoryDuration} seconds or less. Please select a shorter clip.`
      );
      return;
    }

    setIsVideo(isVid);
    setMediaUri(asset.uri);
    setSelectedAsset(asset);
  };

  // Launch gallery picker (Photos & Videos)
  const handlePickFromGallery = async () => {
    if (isUploading) return;

    if (Platform.OS !== 'web') {
      const hasPermission = await ensureMediaLibraryPermission();
      if (!hasPermission) return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.9,
        videoMaxDuration: maxStoryDuration,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        handleProcessMedia(result.assets[0]);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      showAppAlert('Error', 'Failed to pick media from gallery.');
    }
  };

  // Launch device camera
  const handleCaptureCamera = async () => {
    if (isUploading) return;

    if (Platform.OS !== 'web') {
      const hasPermission = await ensureCameraPermission();
      if (!hasPermission) return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.9,
        videoMaxDuration: maxStoryDuration,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        handleProcessMedia(result.assets[0]);
      }
    } catch (err) {
      console.warn('Camera capture error:', err);
      showAppAlert('Error', 'Failed to capture from camera.');
    }
  };

  // Handle Publish / Share Story
  const handlePublish = async () => {
    if (isSubmittingRef.current || isUploading) return;

    if (!mediaUri && !selectedAsset) {
      showAppAlert('Media Required', 'Please select a photo or video for your story first!');
      return;
    }

    const token = await getToken();
    if (!token && !currentUser) {
      showAppAlert('Login Required', 'Please log in to share stories on FunFlick.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    isSubmittingRef.current = true;
    setIsUploading(true);
    setProgress(5);

    try {
      // 1. Upload to AWS S3
      const defaultExt = isVideo ? 'mp4' : 'jpg';
      const defaultMime = isVideo ? 'video/mp4' : 'image/jpeg';
      const fileName = `story_${Date.now()}.${defaultExt}`;

      const s3Url = await uploadMediaToS3(
        selectedAsset?.file || selectedAsset?.uri || mediaUri,
        fileName,
        selectedAsset?.mimeType || defaultMime,
        'stories',
        (pct) => setProgress(Math.min(90, Math.max(5, pct)))
      );

      if (!s3Url || s3Url.startsWith('blob:')) {
        throw new Error('Please wait for story media to upload to cloud storage before submitting.');
      }

      // 2. Persist to MySQL Backend via POST /api/stories
      await apiRequest('/stories', {
        method: 'POST',
        body: JSON.stringify({
          media_url: s3Url,
          media_type: isVideo ? 'video' : 'image',
          caption: caption ? caption.trim() : '',
          music: selectedMusic || '',
          sticker: selectedSticker || '',
        }),
      });

      setProgress(100);

      // Refresh live stories from MySQL
      if (fetchLiveStories) {
        await fetchLiveStories();
      }

      // Show immediate visual confirmation
      setIsSuccess(true);

      // Show alert and redirect
      showAppAlert(
        'Story Published! 🌟',
        'Your story is now live for everyone and will automatically expire in 24 hours.',
        [
          {
            text: 'OK',
            onPress: handleExitScreen,
          },
        ]
      );

      // Web automatic fallback redirection in case browser alert is dismissed or suppressed
      if (Platform.OS === 'web') {
        setTimeout(() => {
          handleExitScreen();
        }, 1500);
      }
    } catch (err) {
      console.error('Story upload failed:', err);
      showAppAlert('Upload Failed', err.message || 'Could not upload story. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header Controls - Instagram Stories Style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleExitScreen}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Add to Story</Text>
          <Text style={styles.headerSubtitle}>
            Max: {maxStoryDuration}s • Goes Live Instantly • Expires in 24h
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading || !mediaUri}
          style={[styles.shareBtnWrap, (!mediaUri || isUploading) && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={['#ec4899', '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareBtnGradient}
          >
            <Text style={styles.shareBtnText}>
              {isUploading ? 'Sending...' : 'Share'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Center Story Visual Canvas (9:16 vertical card) */}
      <View style={styles.canvasContainer}>
        {mediaUri ? (
          <View style={styles.mediaWrapper}>
            {isVideo ? (
              <StoryVideoPreview videoUri={mediaUri} />
            ) : (
              <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            )}

            {/* Floating Music Track Sticker (Top-Left) */}
            {selectedMusic ? (
              <View style={styles.musicStickerBadge}>
                <Music size={13} color="#ec4899" />
                <Text style={styles.musicStickerText} numberOfLines={1}>
                  {selectedMusic}
                </Text>
              </View>
            ) : null}

            {/* Floating Sticker (Top-Right) */}
            {selectedSticker ? (
              <View style={styles.stickerBadge}>
                <Text style={styles.stickerText}>{selectedSticker}</Text>
              </View>
            ) : null}

            {/* Floating Caption Overlay (Bottom) */}
            {caption.trim() ? (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionOverlayText}>{caption.trim()}</Text>
              </View>
            ) : null}

            {/* Floating Change Media Button */}
            <TouchableOpacity
              style={styles.changeMediaBtn}
              onPress={handlePickFromGallery}
              disabled={isUploading}
            >
              <Camera size={18} color="#ec4899" />
            </TouchableOpacity>
          </View>
        ) : (
          /* Empty Media Picker State */
          <View style={styles.emptyCanvas}>
            <LinearGradient
              colors={['rgba(236,72,153,0.25)', 'rgba(147,51,234,0.25)']}
              style={styles.emptyIconCircle}
            >
              <Camera size={36} color="#ec4899" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Select Story Photo or Video</Text>
            <Text style={styles.emptySub}>Photo (max 5MB) or Video (max 15s, 10MB)</Text>

            <View style={styles.pickerActionsRow}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ec4899', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <UploadCloud size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>Choose from Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleCaptureCamera}
                activeOpacity={0.8}
              >
                <Camera size={16} color="#ec4899" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnSecondaryText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <View style={styles.uploadProgressOverlay}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Uploading Story to AWS S3...</Text>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#ec4899', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Success Modal Overlay */}
        {isSuccess && (
          <View style={styles.uploadProgressOverlay}>
            <View style={styles.successCard}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.successIconCircle}
              >
                <Check size={36} color="#fff" />
              </LinearGradient>
              <Text style={styles.successTitle}>Story Published! 🌟</Text>
              <Text style={styles.successMessage}>
                Your story is now live for everyone and will automatically expire in 24 hours.
              </Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={handleExitScreen}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ec4899', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successBtnGradient}
                >
                  <Text style={styles.successBtnText}>Done • Go to Feed</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Story Controls (Instagram Stories Toolbox) */}
      <View style={styles.bottomToolbox}>
        {/* Caption Input */}
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add story text..."
          placeholderTextColor="#9ca3af"
          style={styles.captionInput}
          maxLength={150}
          editable={!isUploading}
        />

        {/* Stickers Horizontal Row */}
        <View style={styles.stickersContainer}>
          <Text style={styles.toolboxLabel}>STICKER:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickersScroll}>
            {STICKERS.map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setSelectedSticker(selectedSticker === st ? '' : st)}
                style={[
                  styles.stickerItem,
                  selectedSticker === st && styles.stickerItemSelected,
                ]}
              >
                <Text style={styles.stickerEmoji}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Music Track Horizontal Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.musicScroll}>
          {MUSIC_TRACKS.map((track) => (
            <TouchableOpacity
              key={track}
              onPress={() => setSelectedMusic(selectedMusic === track ? '' : track)}
              style={[
                styles.musicPill,
                selectedMusic === track && styles.musicPillActive,
              ]}
            >
              <Text
                style={[
                  styles.musicPillText,
                  selectedMusic === track && styles.musicPillTextActive,
                ]}
              >
                {track}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Creator Publishing Notice if not subscribed */}
        {currentUser?.hasPublishingSubscription === false ? (
          <TouchableOpacity
            style={styles.upgradeNotice}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Crown size={14} color="#fbbf24" style={{ marginRight: 6 }} />
            <Text style={styles.upgradeNoticeText}>Publishing Pass Required (Tap to Unlock)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  shareBtnWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  canvasContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    aspectRatio: Platform.OS === 'web' ? 9 / 16 : undefined,
    alignSelf: 'center',
    marginHorizontal: 14,
    marginVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  musicStickerBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    maxWidth: '75%',
    zIndex: 10,
  },
  musicStickerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  stickerBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  stickerText: {
    fontSize: 48,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  captionOverlayText: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
  },
  changeMediaBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  emptyCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.4)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
  },
  actionBtnSecondaryText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadProgressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 30,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#150f2c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.4)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercent: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  successCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  successBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  successBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomToolbox: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.95)',
    gap: 8,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 13,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolboxLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  stickersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stickerItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stickerItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ scale: 1.2 }],
  },
  stickerEmoji: {
    fontSize: 22,
  },
  musicScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  musicPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  musicPillActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  musicPillText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  musicPillTextActive: {
    color: '#fff',
  },
  upgradeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(131,24,67,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.4)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  upgradeNoticeText: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '600',
  },
});
