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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ImageIcon,
  UploadCloud,
  Check,
  MapPin,
  Hash,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureMediaLibraryPermission } from '../../services/permissionsService';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest, getToken } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';
import { UploadSuccessModal } from '../../components/common/UploadSuccessModal';

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

const DEFAULT_SUGGESTED_LOCATIONS = [
  'Madhapur, Serilingampally Mandal, Hyderabad District, Telangana, India - 500081',
  'Jubilee Hills, Shaikpet Mandal, Hyderabad District, Telangana, India - 500033',
  'Ramoji Film City, Hayathnagar Mandal, Ranga Reddy District, Telangana, India - 501512',
  'Gachibowli, Serilingampally Mandal, Rangareddy District, Telangana, India - 500032',
  'Bandra West, Mumbai Suburban District, Maharashtra, India - 400050',
  'Koramangala, Bengaluru South Mandal, Bengaluru Urban District, Karnataka, India - 560034',
  'Connaught Place, New Delhi District, Delhi, India - 110001',
];

const TRENDING_TAGS = ['#funflick', '#post', '#comedy', '#bts', '#shootday', '#teluguhumor'];

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

export const CreatePostScreen = ({ navigation }) => {
  const { fetchFeed, isAuthenticated, currentUser } = useApp();

  const handleExitScreen = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Feed' });
    }
  };

  const [photos, setPhotos] = useState([]); // [{ uri, file, size }]
  const [previewIndex, setPreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [selectedTags, setSelectedTags] = useState(['#funflick', '#post']);
  const [location, setLocation] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccessModalVisible, setUploadSuccessModalVisible] = useState(false);
  const [publishedPostTitle, setPublishedPostTitle] = useState('');

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

  const handleProcessPhotos = (assetsOrFiles) => {
    const list = Array.isArray(assetsOrFiles) ? assetsOrFiles : [assetsOrFiles];
    const newPhotos = [];
    for (const item of list) {
      const size = item.size || item.fileSize || 0;
      if (size > 10 * 1024 * 1024) {
        showAppAlert('File Too Large', `One of the selected photos is ${(size / (1024 * 1024)).toFixed(1)}MB. Photos must be 10MB or less.`);
        continue;
      }
      const uri = item.uri || (typeof window !== 'undefined' && window.URL ? window.URL.createObjectURL(item) : null);
      if (uri) {
        newPhotos.push({
          uri,
          file: item.file || item,
          size,
        });
      }
    }
    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
    }
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') return;
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleProcessPhotos(result.assets);
      }
    } catch (err) {
      showAppAlert('Error', 'Failed to pick photos from device');
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      setPreviewIndex(curr => Math.max(0, Math.min(curr, updated.length - 1)));
      return updated;
    });
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handlePublish = async () => {
    if (isSubmittingRef.current || isUploading) return;

    if (photos.length === 0) {
      showAppAlert('Photo Required', 'Please select at least one photo first.');
      return;
    }

    const token = await getToken();
    if (!token && !currentUser) {
      showAppAlert('Login Required', 'Please log in to your FunFlick account to share a post.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    isSubmittingRef.current = true;
    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Upload all selected photos to AWS S3
      const uploadedUrls = [];
      const totalPhotos = photos.length;

      for (let i = 0; i < totalPhotos; i++) {
        const p = photos[i];
        const s3Url = await uploadMediaToS3(
          p.file || p.uri,
          `post_${Date.now()}_${i}.jpg`,
          'image/jpeg',
          'images',
          (pct) => {
            const base = (i / totalPhotos) * 90;
            const share = ((pct / 100) / totalPhotos) * 90;
            setProgress(Math.round(base + share));
          }
        );
        if (!s3Url || s3Url.startsWith('blob:')) {
          throw new Error('Failed to upload all photos to AWS S3 storage.');
        }
        uploadedUrls.push(s3Url);
      }

      const finalVideoUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : JSON.stringify(uploadedUrls);
      const finalThumbnailUrl = uploadedUrls[0];

      // 2. Persist to database on AWS EC2
      await apiRequest('/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: caption.trim().slice(0, 50) || 'New Photo Post',
          description: caption.trim(),
          category,
          video_url: finalVideoUrl,
          thumbnail_url: finalThumbnailUrl,
          duration: 0,
          media_type: 'image',
          hashtags: selectedTags.join(' '),
          location,
        }),
      });

      await fetchFeed();
      setPublishedPostTitle(caption.trim().slice(0, 50) || 'Photo Post');
      setUploadSuccessModalVisible(true);
    } catch (err) {
      showAppAlert('Publish Failed', err.message || 'Could not upload photo post');
    } finally {
      isSubmittingRef.current = false;
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleExitScreen} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Text style={styles.headerSub}>Share a photo or comedy clip to your feed</Text>
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
            <Text style={styles.publishHeaderText}>Post</Text>
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
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) handleProcessPhotos(files);
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
          {photos.length > 0 ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photos[previewIndex]?.uri || photos[0]?.uri }} style={styles.previewImage} resizeMode="cover" />

              {/* Frosted Left Chevron */}
              {previewIndex > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setPreviewIndex(prev => Math.max(0, prev - 1));
                  }}
                  style={styles.previewChevronLeft}
                >
                  <ChevronLeft size={20} color="#fff" />
                </TouchableOpacity>
              )}

              {/* Frosted Right Chevron */}
              {previewIndex < photos.length - 1 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setPreviewIndex(prev => Math.min(photos.length - 1, prev + 1));
                  }}
                  style={styles.previewChevronRight}
                >
                  <ChevronRight size={20} color="#fff" />
                </TouchableOpacity>
              )}

              {/* Counter Badge */}
              <View style={styles.previewCounterPill}>
                <Text style={styles.previewCounterText}>
                  {previewIndex + 1}/{photos.length}
                </Text>
              </View>

              {/* Remove Photo */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleRemovePhoto(previewIndex);
                }}
                style={styles.previewTrashBtn}
              >
                <Trash2 size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyPicker}>
              <LinearGradient
                colors={['#ff007a', '#7928ca']}
                style={styles.iconCircle}
              >
                <ImageIcon size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.pickerPrompt}>Tap to Select Photos</Text>
              <Text style={styles.pickerSub}>Select up to 10 photos • JPG, PNG, WebP up to 5MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Thumbnail Preview Strip when photos selected */}
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbsScroll}>
            {photos.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setPreviewIndex(idx)}
                style={[styles.thumbItem, idx === previewIndex && styles.thumbItemActive]}
              >
                <Image source={{ uri: p.uri }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
            {photos.length < 10 && (
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={styles.thumbAddBtn}
              >
                <Plus size={20} color="#f472b6" />
                <Text style={styles.thumbAddText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

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

        {/* Location Section with Real Search & Geocoding Details */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="#f472b6" />
              <Text style={styles.label}>Location</Text>
              <Text style={styles.optionalText}>(optional)</Text>
            </View>
            {location ? (
              <TouchableOpacity onPress={() => setLocation('')}>
                <Text style={styles.clearLocationText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {location ? (
            <View style={styles.selectedLocationCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <MapPin size={15} color="#f472b6" style={{ marginRight: 6 }} />
                <Text style={styles.selectedLocationText} numberOfLines={2}>{location}</Text>
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
              <Text style={styles.publishBtnText}>Publish Photo Post</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

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
                  setLocation(locationSearchQuery.trim());
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
                const isSelected = location === loc;
                return (
                  <TouchableOpacity
                    key={`${loc}_${idx}`}
                    style={[styles.locationResultRow, isSelected && styles.locationResultRowActive]}
                    onPress={() => {
                      setLocation(loc);
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

      {/* Post-Upload Monetization & Creator Fund Celebration Modal */}
      <UploadSuccessModal
        visible={uploadSuccessModalVisible}
        type="Post"
        title={publishedPostTitle}
        onClose={() => {
          setUploadSuccessModalVisible(false);
          handleExitScreen();
        }}
        onUnlockMonetization={() => {
          setUploadSuccessModalVisible(false);
          navigation.navigate('Subscription');
        }}
      />
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
  previewChevronLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewChevronRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewCounterPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  previewCounterText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  previewTrashBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
  thumbsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  thumbItem: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbItemActive: {
    borderColor: '#ff007a',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbAddBtn: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,0,122,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,0,122,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbAddText: {
    color: '#f472b6',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
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
  optionalText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
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
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18122c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  placeholderDropdown: {
    color: '#6b7280',
    fontSize: 12,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
    fontSize: 12,
    color: '#fff',
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
