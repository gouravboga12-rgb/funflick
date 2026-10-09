import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  MapPin,
  Hash,
  Sparkles,
  Search,
  ShieldCheck,
  Volume2,
  VolumeX,
  Clock,
  X,
  ChevronDown,
  Crown,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureMediaLibraryPermission } from '../../services/permissionsService';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const CATEGORIES = [
  'Comedy',
  'Stand-up',
  'Memes',
  'Dance',
  'Regional Comedy',
  'Entertainment',
];

const DEFAULT_SUGGESTED_LOCATIONS = [
  'Madhapur, Serilingampally Mandal, Hyderabad District, Telangana, India - 500081',
  'Jubilee Hills, Shaikpet Mandal, Hyderabad District, Telangana, India - 500033',
  'Ramoji Film City, Hayathnagar Mandal, Ranga Reddy District, Telangana, India - 501512',
  'Gachibowli, Serilingampally Mandal, Rangareddy District, Telangana, India - 500032',
  'Bandra West, Mumbai Suburban District, Maharashtra, India - 400050',
  'Koramangala, Bengaluru South Mandal, Bengaluru Urban District, Karnataka, India - 560034',
  'Connaught Place, New Delhi District, Delhi, India - 110001',
];

const BASE_TRENDING_TAGS = [
  'comedy',
  'viralreels',
  'teluguhumor',
  'standup',
  'memes',
  'entertainment',
  'dance',
];

// Cross-platform alert helper that works seamlessly on Mobile and Web
const showAppAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    if (buttons && buttons[0] && buttons[0].onPress) {
      buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

function ReelPreview({ videoUri, isMuted }) {
  const player = useVideoPlayer(videoUri, p => {
    if (!p) return;
    p.loop = true;
    p.muted = isMuted;
    p.play();
  });

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

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
  const { fetchFeed, currentUser } = useApp();

  // Media state
  const [videoUri, setVideoUri] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Location search state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Hashtags state
  const [selectedTags, setSelectedTags] = useState(['funflick', 'reels']);
  const [hashtagSearchQuery, setHashtagSearchQuery] = useState('');

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Location search effect (Debounced reverse geocoding via Nominatim)
  useEffect(() => {
    const q = locationSearchQuery.trim();
    if (!q || q.length < 2) {
      setLocationSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
          { headers: { 'User-Agent': 'FunFlickApp/1.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map(item => {
              const a = item.address || {};
              const parts = [];
              const colony = a.suburb || a.neighbourhood || a.village || a.road || a.residential;
              if (colony) parts.push(colony);
              const mandal = a.county || a.city || a.town || a.municipality;
              if (mandal && !parts.includes(mandal)) parts.push(mandal);
              const dist = a.state_district;
              if (dist && !parts.includes(dist)) parts.push(dist);
              if (a.state && !parts.includes(a.state)) parts.push(a.state);
              if (a.country) parts.push(a.country);
              let full = parts.join(', ');
              if (a.postcode) full += ` - ${a.postcode}`;
              return full || item.display_name;
            });
            setLocationSearchResults(formatted);
          } else {
            // Local fallback filter from default locations
            const localMatches = DEFAULT_SUGGESTED_LOCATIONS.filter(l =>
              l.toLowerCase().includes(q.toLowerCase())
            );
            setLocationSearchResults(localMatches);
          }
        }
      } catch (err) {
        const localMatches = DEFAULT_SUGGESTED_LOCATIONS.filter(l =>
          l.toLowerCase().includes(q.toLowerCase())
        );
        setLocationSearchResults(localMatches);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [locationSearchQuery]);

  const handleProcessVideo = (fileOrAsset) => {
    const size = fileOrAsset.size || fileOrAsset.fileSize || 0;
    if (size > 10 * 1024 * 1024) {
      showAppAlert(
        'Video Exceeds Limit',
        `The selected video is ${(size / (1024 * 1024)).toFixed(1)}MB. Videos must be 10MB or less. Please select a smaller video.`
      );
      return;
    }
    const uri = fileOrAsset.uri || (typeof window !== 'undefined' && window.URL ? window.URL.createObjectURL(fileOrAsset) : null);
    setVideoUri(uri);
    setSelectedFile(fileOrAsset.file || fileOrAsset);
    setVideoDuration(fileOrAsset.duration ? Math.round(fileOrAsset.duration / 1000) : 15);

    if (!title && fileOrAsset.name) {
      const cleanName = fileOrAsset.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handlePickVideo = async () => {
    if (Platform.OS === 'web') return;
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        handleProcessVideo(asset.file || asset);
      }
    } catch (err) {
      showAppAlert('Error', 'Failed to pick video from device');
    }
  };

  // Hashtag helpers
  const cleanTagInput = hashtagSearchQuery.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '');
  const filteredHashtags = cleanTagInput
    ? BASE_TRENDING_TAGS.filter(t => t.includes(cleanTagInput) && !selectedTags.includes(t))
    : BASE_TRENDING_TAGS.filter(t => !selectedTags.includes(t));

  const handleAddTag = (tag) => {
    const clean = tag.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags(prev => [...prev, clean]);
    }
    setHashtagSearchQuery('');
  };

  const handleRemoveTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Publish / Upload flow
  const handlePublish = async () => {
    if (!videoUri && !selectedFile) {
      showAppAlert('Video Required', 'Please choose a video from your device or gallery first.');
      return;
    }

    setIsUploading(true);
    setProgress(5);

    try {
      // 1. Upload video file directly to AWS S3
      const s3VideoUrl = await uploadMediaToS3(
        selectedFile || videoUri,
        `reel_${Date.now()}.mp4`,
        'video/mp4',
        'videos',
        pct => setProgress(pct)
      );

      // 2. Persist to MySQL database on EC2 (Directly publishes live globally)
      const finalTitle = title.trim() || description.trim().slice(0, 40) || 'Untitled Reel';
      const finalHashtags = selectedTags.map(t => `#${t}`).join(' ');

      await apiRequest('/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: finalTitle,
          description: description.trim(),
          category,
          video_url: s3VideoUrl,
          thumbnail_url: s3VideoUrl,
          duration: videoDuration || 30,
          media_type: 'video',
          hashtags: finalHashtags,
          location: selectedLocation || '',
        }),
      });

      // 3. Refresh live feed and navigate back to feed
      await fetchFeed();
      showAppAlert(
        'Reel Published! 🎉',
        'Your reel is now live on FunFlick! It has also been submitted to the Admin Moderation Queue.',
        [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Feed' }) },
        ]
      );
    } catch (err) {
      showAppAlert('Upload Failed', err.message || 'Could not upload reel');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header without Share button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>New Reel</Text>
          <Text style={styles.headerSub}>Admin Verification Queue</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Publishing Subscription Banner */}
        <View style={styles.planBanner}>
          <View style={styles.planBannerLeft}>
            <Crown size={15} color="#f59e0b" style={{ marginRight: 6 }} />
            <Text style={styles.planBannerText}>
              Publishing Plan Active ({currentUser?.subscriptionPlan || 'Weekly Influencer'})
            </Text>
          </View>
          <Text style={styles.planBannerRight}>Ready to Upload</Text>
        </View>

        {/* Video Player & Media Preview Box */}
        <View style={styles.videoSection}>
          {!videoUri ? (
            <TouchableOpacity
              style={[styles.emptyPickerBox, { position: 'relative' }]}
              activeOpacity={0.85}
              onPress={Platform.OS === 'web' ? undefined : handlePickVideo}
              disabled={isUploading}
            >
              {Platform.OS === 'web' && (
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessVideo(file);
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
              <LinearGradient colors={['rgba(255,0,122,0.2)', 'rgba(121,40,202,0.2)']} style={styles.iconCircle}>
                <UploadCloud size={30} color="#f472b6" />
              </LinearGradient>
              <Text style={styles.pickerPrompt}>Choose Video from Device / Gallery</Text>
              <Text style={styles.pickerSub}>MP4, WebM, MOV up to 10MB • Max 30s • 100% Free</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              <ReelPreview videoUri={videoUri} isMuted={isMuted} />

              {/* Showcase Limit Badge */}
              <View style={styles.showcaseBadge}>
                <Clock size={11} color="#f472b6" style={{ marginRight: 4 }} />
                <Text style={styles.showcaseText}>Showcase Limit: 30s</Text>
              </View>

              {/* Mute Toggle Button */}
              <TouchableOpacity
                style={styles.muteBtn}
                onPress={() => setIsMuted(prev => !prev)}
              >
                {isMuted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#f472b6" />}
              </TouchableOpacity>

              {/* Bottom Tag */}
              <View style={styles.previewBottomBar}>
                <Text style={styles.previewTag}>Reel Preview</Text>
              </View>
            </View>
          )}

          {/* Action Button: Choose / Change Video */}
          <TouchableOpacity
            style={[styles.chooseBtn, { position: 'relative' }]}
            activeOpacity={0.8}
            onPress={Platform.OS === 'web' ? undefined : handlePickVideo}
            disabled={isUploading}
          >
            {Platform.OS === 'web' && (
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessVideo(file);
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
            <UploadCloud size={16} color="#f472b6" style={{ marginRight: 6 }} />
            <Text style={styles.chooseBtnText}>
              {videoUri ? 'Choose Different Video from Device' : 'Choose Video from Device / Gallery'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.limitNotice}>
            • Video limit: <Text style={{ color: '#f472b6', fontWeight: '700' }}>Maximum 10MB</Text> (MP4, MOV, WebM)
          </Text>
        </View>

        {/* Reel Title (optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Reel Title <Text style={styles.optionalText}>(optional)</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your reel a catchy title... (optional)"
            placeholderTextColor="#6b7280"
            style={styles.textInput}
            editable={!isUploading}
          />
        </View>

        {/* Caption & Description (optional) */}
        <View style={styles.inputGroup}>
          <View style={styles.groupHeaderRow}>
            <Text style={styles.label}>
              Caption & Description <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <Text style={styles.counterText}>{description.length}/500</Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write a caption... mention what happened! (optional)"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            maxLength={500}
            style={[styles.textInput, styles.textArea]}
            editable={!isUploading}
          />
        </View>

        {/* Category Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setIsCategoryModalOpen(true)}
          >
            <Text style={styles.dropdownValue}>{category}</Text>
            <ChevronDown size={14} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Hashtags Section with Search & Custom Creation */}
        <View style={styles.inputGroup}>
          <View style={styles.groupHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Hash size={13} color="#f472b6" />
              <Text style={styles.label}>
                Hashtags <Text style={styles.optionalText}>({selectedTags.length} added)</Text>
              </Text>
            </View>
            <Text style={styles.trendingDiscovery}>Trending Discovery</Text>
          </View>

          {/* Selected Hashtags Chips with X */}
          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map(tag => (
                <View key={tag} style={styles.selectedTagPill}>
                  <Text style={styles.selectedTagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.removeTagBtn}>
                    <X size={11} color="#f472b6" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Hashtag Search Input */}
          <View style={styles.searchRow}>
            <Search size={14} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              value={hashtagSearchQuery}
              onChangeText={setHashtagSearchQuery}
              placeholder="Search or add custom hashtag (e.g. comedy, dance)"
              placeholderTextColor="#6b7280"
              style={[styles.textInput, styles.searchInput]}
              autoCapitalize="none"
            />
            {cleanTagInput ? (
              <TouchableOpacity onPress={() => handleAddTag(cleanTagInput)} style={styles.addCustomTagBtn}>
                <Text style={styles.addCustomTagText}>+ Add #{cleanTagInput}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Trending Suggestions */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Sparkles size={11} color="#f59e0b" />
              <Text style={styles.trendingPrompt}>
                {cleanTagInput ? 'Matching Hashtags (tap to add):' : 'Trending on FunFlick (tap to add):'}
              </Text>
            </View>
            <View style={styles.tagsWrap}>
              {filteredHashtags.slice(0, 6).map(tag => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => handleAddTag(tag)}
                  style={styles.suggestionPill}
                >
                  <Text style={styles.suggestionText}>+ #{tag}</Text>
                </TouchableOpacity>
              ))}
              {cleanTagInput && !BASE_TRENDING_TAGS.includes(cleanTagInput) && (
                <TouchableOpacity
                  onPress={() => handleAddTag(cleanTagInput)}
                  style={[styles.suggestionPill, { borderColor: '#ff007a', backgroundColor: 'rgba(255,0,122,0.15)' }]}
                >
                  <Text style={[styles.suggestionText, { color: '#f472b6', fontWeight: '700' }]}>
                    ✨ Add custom "#{cleanTagInput}"
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Location Section with Real Search & Geocoding Details */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="#f472b6" />
              <Text style={styles.label}>Location</Text>
              <Text style={styles.optionalText}>(optional)</Text>
            </View>
            {selectedLocation ? (
              <TouchableOpacity onPress={() => setSelectedLocation('')}>
                <Text style={styles.clearLocationText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedLocation ? (
            <View style={styles.selectedLocationCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <MapPin size={15} color="#f472b6" style={{ marginRight: 6 }} />
                <Text style={styles.selectedLocationText} numberOfLines={2}>{selectedLocation}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLocationModalOpen(true)} style={styles.changeLocBtn}>
                <Text style={styles.changeLocText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setIsLocationModalOpen(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MapPin size={14} color="#9ca3af" style={{ marginRight: 6 }} />
                <Text style={styles.placeholderDropdown}>Search area, colony, mandal, district, pincode...</Text>
              </View>
              <Search size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Central Admin Verification Policy Card */}
        <View style={styles.policyCard}>
          <View style={styles.policyHeaderRow}>
            <ShieldCheck size={16} color="#34d399" />
            <Text style={styles.policyTitle}>Instant Publishing & Admin Verification Policy</Text>
          </View>
          <Text style={styles.policyDesc}>
            Upon submission, your reel is <Text style={{ fontWeight: '700', color: '#fff' }}>directly published live</Text> on FunFlick globally! It is simultaneously sent to the Admin Moderation Desk for review against community standards.
          </Text>
        </View>

        {/* Upload Progress Bar */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Publishing Reel ({progress}%)...</Text>
          </View>
        )}

        {/* Big Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handlePublish}
          disabled={isUploading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#ff007a', '#ff4b2b', '#7928ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isUploading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitBtnText}>Publishing Reel ({progress}%)...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.submitBtnText}>Submit Reel for Admin Approval</Text>
                <ArrowRight size={16} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={isCategoryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCategoryModalOpen(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalOpen(false)}>
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {CATEGORIES.map(item => {
                const isSelected = category === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setCategory(item);
                      setIsCategoryModalOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {item}
                    </Text>
                    {isSelected && <Check size={14} color="#f472b6" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Interactive Location Search Modal */}
      <Modal
        visible={isLocationModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLocationModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={18} color="#f472b6" />
                <Text style={styles.modalTitle}>Search & Tag Location</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLocationModalOpen(false)}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Location Search Input */}
            <View style={[styles.searchRow, { marginHorizontal: 0, marginBottom: 12 }]}>
              <Search size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
                placeholder="Type colony, mandal, district, city or pincode..."
                placeholderTextColor="#6b7280"
                style={[styles.textInput, styles.searchInput]}
                autoFocus
              />
              {isSearchingLocation ? (
                <ActivityIndicator size="small" color="#f472b6" style={{ marginRight: 8 }} />
              ) : locationSearchQuery ? (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')} style={{ padding: 4 }}>
                  <X size={14} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Custom Location Option */}
            {locationSearchQuery.trim().length > 2 && (
              <TouchableOpacity
                style={styles.customLocBtn}
                onPress={() => {
                  setSelectedLocation(locationSearchQuery.trim());
                  setIsLocationModalOpen(false);
                  setLocationSearchQuery('');
                }}
              >
                <MapPin size={14} color="#f472b6" style={{ marginRight: 6 }} />
                <Text style={styles.customLocText}>
                  Use <Text style={{ color: '#fff', fontWeight: '700' }}>"{locationSearchQuery.trim()}"</Text> as location
                </Text>
              </TouchableOpacity>
            )}

            {/* Search Results / Suggested List */}
            <Text style={styles.locSubheader}>
              {locationSearchResults.length > 0 ? 'Search Results:' : 'Popular Entertainment & Comedy Locations:'}
            </Text>

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {(locationSearchResults.length > 0 ? locationSearchResults : DEFAULT_SUGGESTED_LOCATIONS).map((loc, idx) => {
                const isSelected = selectedLocation === loc;
                return (
                  <TouchableOpacity
                    key={`${loc}_${idx}`}
                    style={[styles.locationResultRow, isSelected && styles.locationResultRowActive]}
                    onPress={() => {
                      setSelectedLocation(loc);
                      setIsLocationModalOpen(false);
                      setLocationSearchQuery('');
                    }}
                  >
                    <View style={styles.locPinIconCircle}>
                      <MapPin size={14} color="#f472b6" />
                    </View>
                    <Text style={[styles.locationResultText, isSelected && styles.locationResultTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0714',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  headerSub: {
    fontSize: 10,
    color: '#f472b6',
    fontWeight: '600',
    marginTop: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 30,
  },
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  planBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6ee7b7',
  },
  planBannerRight: {
    fontSize: 10,
    color: '#9ca3af',
  },
  videoSection: {
    marginBottom: 18,
  },
  emptyPickerBox: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 280,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(24, 18, 44, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.3)',
  },
  pickerPrompt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  pickerSub: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    alignSelf: 'center',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  showcaseBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  showcaseText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f472b6',
  },
  muteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  previewBottomBar: {
    position: 'absolute',
    bottom: 8,
    right: 10,
  },
  previewTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,0,122,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  chooseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  limitNotice: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '400',
  },
  counterText: {
    fontSize: 10,
    color: '#6b7280',
  },
  trendingDiscovery: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  placeholderDropdown: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  selectedTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,122,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.4)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f472b6',
    marginRight: 4,
  },
  removeTagBtn: {
    padding: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  addCustomTagBtn: {
    backgroundColor: 'rgba(255,0,122,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addCustomTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f472b6',
  },
  trendingPrompt: {
    fontSize: 10,
    color: '#9ca3af',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestionText: {
    fontSize: 10,
    color: '#d1d5db',
  },
  clearLocationText: {
    fontSize: 10,
    color: '#f472b6',
    fontWeight: '600',
  },
  selectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244,114,182,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  changeLocBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeLocText: {
    fontSize: 10,
    color: '#f472b6',
    fontWeight: '700',
  },
  policyCard: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  policyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  policyDesc: {
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 16,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff007a',
  },
  progressText: {
    fontSize: 10,
    color: '#f472b6',
    textAlign: 'center',
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#120a22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(255,0,122,0.08)',
    borderRadius: 10,
  },
  modalItemText: {
    fontSize: 13,
    color: '#d1d5db',
  },
  modalItemTextActive: {
    color: '#f472b6',
    fontWeight: '700',
  },
  customLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244,114,182,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  customLocText: {
    fontSize: 11,
    color: '#d1d5db',
    flex: 1,
  },
  locSubheader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 8,
  },
  locationResultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  locationResultRowActive: {
    backgroundColor: 'rgba(244,114,182,0.1)',
    borderRadius: 10,
  },
  locPinIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244,114,182,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  locationResultText: {
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 18,
    flex: 1,
  },
  locationResultTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
