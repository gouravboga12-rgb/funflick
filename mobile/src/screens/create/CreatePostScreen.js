import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Image as ImageIcon,
  UploadCloud,
  Check,
  MapPin,
  Hash,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureMediaLibraryPermission } from '../../services/permissionsService';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest, getToken } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const CATEGORIES = [
  'Comedy',
  'BTS',
  'Shoot Day',
  'Memes',
  'Entertainment',
  'Telugu Humor',
  'Photography',
  'Standup',
];

const SUGGESTED_LOCATIONS = [
  'Hyderabad Film City',
  'Jubilee Hills, Hyderabad',
  'Mumbai Comedy Central',
  'Bengaluru Studios',
];

const TRENDING_TAGS = ['#funflick', '#post', '#comedy', '#bts', '#shootday', '#teluguhumor'];

export const CreatePostScreen = ({ navigation, route }) => {
  const isStory = route?.name === 'CreateStory';
  const { fetchFeed, fetchLiveStories, isAuthenticated, currentUser } = useApp();
  const [imageUri, setImageUri] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState(isStory ? 'BTS' : 'Comedy');
  const [selectedTags, setSelectedTags] = useState(['#funflick', isStory ? '#story' : '#post']);
  const [location, setLocation] = useState('Hyderabad Film City');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProcessPhoto = (fileOrAsset) => {
    const size = fileOrAsset.size || fileOrAsset.fileSize || 0;
    if (size > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', `The selected photo is ${(size / (1024 * 1024)).toFixed(1)}MB. Photos must be 5MB or less. Please select a smaller photo.`);
      return;
    }
    const uri = fileOrAsset.uri || (typeof window !== 'undefined' && window.URL ? window.URL.createObjectURL(fileOrAsset) : null);
    setImageUri(uri);
    setSelectedFile(fileOrAsset.file || fileOrAsset);
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') return;
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        handleProcessPhoto(asset.file || asset);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo from device');
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handlePublish = async () => {
    if (!imageUri && !selectedFile) {
      Alert.alert('Photo Required', 'Please select a photo first.');
      return;
    }

    const token = await getToken();
    if (!token && !currentUser) {
      Alert.alert('Login Required', 'Please log in to your FunFlick account to share a story.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Upload to S3
      const s3ImageUrl = await uploadMediaToS3(
        selectedFile || imageUri,
        `${isStory ? 'story' : 'post'}_${Date.now()}.jpg`,
        'image/jpeg',
        isStory ? 'stories' : 'images',
        (pct) => setProgress(pct)
      );

      // 2. Persist to database on AWS EC2
      if (isStory) {
        await apiRequest('/stories', {
          method: 'POST',
          body: JSON.stringify({
            media_url: s3ImageUrl,
            media_type: 'image',
            caption: caption ? caption.trim() : '',
            music: '',
            sticker: '',
          }),
        });
        if (fetchLiveStories) await fetchLiveStories();
        Alert.alert('Story Shared! ✨', 'Your story is live for 24 hours on FunFlick!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Feed' }) },
        ]);
      } else {
        await apiRequest('/videos', {
          method: 'POST',
          body: JSON.stringify({
            title: caption.trim().slice(0, 50) || 'New Photo Post',
            description: caption.trim(),
            category,
            video_url: s3ImageUrl,
            thumbnail_url: s3ImageUrl,
            duration: 0,
            media_type: 'image',
            hashtags: selectedTags.join(' '),
            location,
          }),
        });

        await fetchFeed();
        Alert.alert('Published!', 'Your photo post is live on FunFlick!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Feed' }) },
        ]);
      }
    } catch (err) {
      Alert.alert('Publish Failed', err.message || `Could not upload ${isStory ? 'story' : 'photo post'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{isStory ? 'Create Story' : 'Create Post'}</Text>
          <Text style={styles.headerSub}>
            {isStory ? 'Share a 24-hour photo moment' : 'Share a photo or comedy clip to your feed'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading}
          style={styles.publishHeaderBtn}
        >
          <LinearGradient
            colors={['#ff007a', '#ff4b2b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishHeaderGradient}
          >
            <Text style={styles.publishHeaderText}>{isStory ? 'Share' : 'Post'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Media Picker */}
        <TouchableOpacity
          style={[styles.pickerBox, { position: 'relative' }]}
          activeOpacity={0.9}
          onPress={Platform.OS === 'web' ? undefined : handlePickPhoto}
          disabled={isUploading}
        >
          {Platform.OS === 'web' && (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessPhoto(file);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%',
                zIndex: 10,
              }}
            />
          )}
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.changeOverlay}>
                <Text style={styles.changeOverlayText}>Tap to change</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyPicker}>
              <LinearGradient
                colors={['#ff007a', '#7928ca']}
                style={styles.iconCircle}
              >
                <ImageIcon size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.pickerPrompt}>Tap to Select Photo</Text>
              <Text style={styles.pickerSub}>JPG, PNG, WebP up to 5MB • 100% Free</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a hilarious caption, setup & punchline..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
            editable={!isUploading}
          />
        </View>

        {/* Category Chips */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {CATEGORIES.map(cat => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.chipPill, isSelected && styles.chipPillActive]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Hashtags */}
        <View style={styles.inputGroup}>
          <View style={styles.groupHeaderRow}>
            <Text style={styles.label}>Trending Hashtags</Text>
            <Text style={styles.labelSub}>Tap to toggle</Text>
          </View>
          <View style={styles.tagsWrap}>
            {TRENDING_TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagPill, isSelected && styles.tagPillActive]}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {SUGGESTED_LOCATIONS.map(loc => {
              const isSelected = location === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setLocation(loc)}
                  style={[styles.chipPill, isSelected && styles.chipPillActive]}
                >
                  <MapPin size={12} color={isSelected ? '#fff' : '#9ca3af'} style={{ marginRight: 4 }} />
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Free Upload Guarantee Banner */}
        <View style={styles.freeBanner}>
          <Text style={{ fontSize: 16 }}>⭐</Text>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.freeBannerTitle}>Uploading is 100% Free for Everyone!</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>
            <Text style={styles.freeBannerSub}>
              Want deep 8-factor analytics & Admin cash rewards? Upgrade to Influencer
            </Text>
          </View>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Uploading to FunFlick... {progress}%</Text>
          </View>
        )}

        {/* Publish Button */}
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={handlePublish}
          disabled={isUploading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#ff007a', '#ff4b2b', '#7928ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishGradient}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.publishBtnText}>{isStory ? 'Share Story' : 'Publish Photo Post'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSub: {
    color: '#f472b6',
    fontSize: 10,
    marginTop: 1,
  },
  publishHeaderBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishHeaderGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  publishHeaderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
  },
  pickerBox: {
    height: 220,
    borderRadius: 20,
    backgroundColor: '#18122c',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeOverlayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyPicker: {
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickerPrompt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  pickerSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  labelSub: {
    color: '#9ca3af',
    fontSize: 10,
  },
  textInput: {
    backgroundColor: '#18122c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipsScroll: {
    gap: 8,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#18122c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipPillActive: {
    backgroundColor: '#ff007a',
    borderColor: '#ff007a',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tagPillActive: {
    backgroundColor: 'rgba(255,0,122,0.2)',
    borderColor: '#ff007a',
  },
  tagText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#ff007a',
    fontWeight: '800',
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    padding: 12,
    marginBottom: 16,
  },
  freeBannerTitle: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  freeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
  freeBannerSub: {
    color: '#fcd34d',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  progressContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff007a',
  },
  progressText: {
    color: '#f472b6',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '700',
  },
  publishBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  publishGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
