import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Image as ImageIcon, UploadCloud } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureMediaLibraryPermission } from '../../services/permissionsService';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export const CreatePostScreen = ({ navigation }) => {
  const { fetchFeed } = useApp();
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [hashtags, setHashtags] = useState('#funflick #viral');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const categories = ['Comedy', 'Meme', 'Photo', 'Celebrity', 'BehindTheScenes'];

  const handlePickPhoto = async () => {
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const handlePublish = async () => {
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please select a photo to post.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Upload to S3
      const s3ImageUrl = await uploadMediaToS3(
        imageUri,
        `post_${Date.now()}.jpg`,
        'image/jpeg',
        'images',
        (pct) => setProgress(pct)
      );

      // 2. Persist to database
      await apiRequest('/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: caption.trim().slice(0, 45) || 'New Photo Post',
          description: caption.trim(),
          category,
          video_url: s3ImageUrl,
          thumbnail_url: s3ImageUrl,
          duration: 0,
          media_type: 'image',
          hashtags: hashtags.trim(),
        }),
      });

      await fetchFeed();
      Alert.alert('Published!', 'Your photo post is live on FunFlick!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      Alert.alert('Publish Failed', err.message || 'Could not upload photo post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Photo Post</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.pickerBox}
          activeOpacity={0.9}
          onPress={handlePickPhoto}
          disabled={isUploading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.emptyPicker}>
              <View style={styles.iconCircle}>
                <ImageIcon size={32} color="#7928ca" />
              </View>
              <Text style={styles.pickerPrompt}>Tap to Select Photo</Text>
              <Text style={styles.pickerSub}>JPG, PNG, WebP up to 10MB</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
            editable={!isUploading}
          />
        </View>

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
            placeholder="#funflick #meme #photo"
            placeholderTextColor="#6b7280"
            style={styles.textInput}
            editable={!isUploading}
          />
        </View>

        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Uploading: {progress}%</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading}
          activeOpacity={0.85}
          style={styles.publishBtnWrap}
        >
          <LinearGradient colors={['#7928ca', '#0070f3']} style={styles.publishBtn}>
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <UploadCloud size={20} color="#fff" />
                <Text style={styles.publishText}>Publish Post</Text>
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
    backgroundColor: 'rgba(121,40,202,0.15)',
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
  previewImage: {
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
    backgroundColor: '#7928ca',
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
    backgroundColor: '#7928ca',
  },
  progressLabel: {
    color: '#7928ca',
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
