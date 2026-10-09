import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Video as VideoIcon, UploadCloud, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureMediaLibraryPermission } from '../../services/permissionsService';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

function ReelPreview({ videoUri }) {
  const player = useVideoPlayer(videoUri, p => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.previewVideo}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export const UploadReelScreen = ({ navigation }) => {
  const { fetchFeed } = useApp();
  const [videoUri, setVideoUri] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [hashtags, setHashtags] = useState('#funflick #reels');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const categories = ['Comedy', 'Prank', 'Meme', 'Standup', 'Drama', 'Cinema', 'Music'];

  const handlePickVideo = async () => {
    // 1. Transparently check and request native Media Library permission
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setVideoUri(asset.uri);
        setVideoDuration(asset.duration ? Math.round(asset.duration / 1000) : 15);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video from device');
    }
  };

  const handlePublish = async () => {
    if (!videoUri) {
      Alert.alert('Video Required', 'Please select a video reel from your phone first.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your reel.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Upload video file to AWS S3
      const s3VideoUrl = await uploadMediaToS3(
        videoUri,
        `reel_${Date.now()}.mp4`,
        'video/mp4',
        'videos',
        (pct) => setProgress(pct)
      );

      // 2. Persist to MySQL database on EC2
      await apiRequest('/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: caption.trim() || title.trim(),
          category,
          video_url: s3VideoUrl,
          thumbnail_url: s3VideoUrl,
          duration: videoDuration || 15,
          media_type: 'video',
          hashtags: hashtags.trim(),
          audio_title: '🎵 Original Audio - You',
        }),
      });

      // 3. Refresh live feed and navigate back
      await fetchFeed();
      Alert.alert('Published!', 'Your reel has been published to FunFlick!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      Alert.alert('Publish Failed', err.message || 'Could not upload reel');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Reel</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Video Picker / Preview Area */}
        <TouchableOpacity
          style={styles.pickerBox}
          activeOpacity={0.9}
          onPress={handlePickVideo}
          disabled={isUploading}
        >
          {videoUri ? (
            <ReelPreview videoUri={videoUri} />
          ) : (
            <View style={styles.emptyPicker}>
              <View style={styles.iconCircle}>
                <VideoIcon size={32} color={colors.primary} />
              </View>
              <Text style={styles.pickerPrompt}>Tap to Select Reel Video</Text>
              <Text style={styles.pickerSub}>MP4, MOV up to 60 seconds</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reel title (e.g. Comedy Scene)"
            placeholderTextColor="#6b7280"
            style={styles.textInput}
            editable={!isUploading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a funny caption or backstory..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
            editable={!isUploading}
          />
        </View>

        {/* Category Pills */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.catPill, category === cat && styles.catPillActive]}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hashtags</Text>
          <TextInput
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="#funflick #comedy #reels"
            placeholderTextColor="#6b7280"
            style={styles.textInput}
            editable={!isUploading}
          />
        </View>

        {/* Upload Progress Bar */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Uploading to AWS S3: {progress}%</Text>
          </View>
        )}

        {/* Publish Button */}
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading}
          activeOpacity={0.85}
          style={styles.publishBtnWrap}
        >
          <LinearGradient colors={['#ff007a', '#7928ca']} style={styles.publishBtn}>
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <UploadCloud size={20} color="#fff" />
                <Text style={styles.publishText}>Publish Reel</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  pickerBox: {
    width: '100%',
    height: 260,
    backgroundColor: '#130b26',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPicker: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,0,122,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerPrompt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  catPillActive: {
    backgroundColor: colors.primary,
  },
  catText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  progressContainer: {
    gap: 6,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  publishBtnWrap: {
    marginTop: 8,
  },
  publishBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  publishText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
