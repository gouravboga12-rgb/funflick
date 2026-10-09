import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Megaphone,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  Film,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { colors } from '../../theme/colors';

export const SubmitAdRequestModal = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'my_requests'
  const [brandName, setBrandName] = useState('');
  const [contactPerson, setContactPerson] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.phone || '');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adType, setAdType] = useState('video'); // 'video' | 'image'
  const [actionUrl, setActionUrl] = useState('https://');
  const [actionText, setActionText] = useState('Learn More');

  // File upload state
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My requests & contact settings
  const [myAdRequests, setMyAdRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [adContactSettings, setAdContactSettings] = useState({
    adContactPhone: '+91 98765 43210',
    adContactWhatsapp: '+91 98765 43210',
    adContactEmail: 'ads@funflick.in',
  });

  useEffect(() => {
    if (!isOpen) return;
    fetchContactSettings();
    fetchMyRequests();
  }, [isOpen]);

  const fetchContactSettings = async () => {
    try {
      const data = await apiRequest('/ads/contact-settings');
      if (data && data.settings) {
        setAdContactSettings(data.settings);
      }
    } catch (e) {}
  };

  const fetchMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await apiRequest('/ads/my-requests');
      if (data && Array.isArray(data.requests)) {
        setMyAdRequests(data.requests);
      }
    } catch (e) {} finally {
      setIsLoadingRequests(false);
    }
  };

  const handlePhoneChange = (val) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleProcessFile = async (fileOrAsset) => {
    const isVideo = adType === 'video';
    const maxBytes = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = isVideo ? '10MB' : '5MB';

    const fileSize = fileOrAsset.size || fileOrAsset.fileSize || 0;
    if (fileSize > maxBytes) {
      Alert.alert(
        'File Limit Exceeded',
        `The selected ${isVideo ? 'video' : 'image'} is ${(fileSize / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is ${maxLabel}. Please choose a file under ${maxLabel}.`
      );
      return;
    }

    const previewUri = fileOrAsset.uri || (typeof window !== 'undefined' && window.URL ? window.URL.createObjectURL(fileOrAsset) : null);
    setMediaPreview(previewUri);
    setIsUploading(true);

    try {
      const extension = isVideo ? 'mp4' : 'jpg';
      const mimeType = fileOrAsset.type || (isVideo ? 'video/mp4' : 'image/jpeg');
      const s3Url = await uploadMediaToS3(
        fileOrAsset,
        `ad_${Date.now()}.${extension}`,
        mimeType,
        'ads'
      );
      setUploadedUrl(s3Url);
      Alert.alert('Creative Uploaded', 'Creative uploaded to AWS S3 successfully!');
    } catch (err) {
      Alert.alert('Upload Error', err.message || 'Failed to upload creative to S3. Please try again.');
      setMediaPreview(null);
      setUploadedUrl('');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: adType === 'video' ? ['videos'] : ['images'],
        allowsEditing: adType === 'image',
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await handleProcessFile(asset.file || asset);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open media gallery');
    }
  };

  const handleSubmit = async () => {
    if (!brandName.trim()) {
      Alert.alert('Required', 'Please enter your Brand or Business Name');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a Campaign Title');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your Contact Phone number');
      return;
    }
    if (!uploadedUrl) {
      Alert.alert('Required', 'Please select and upload your Ad Video or Image creative');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/ads/request', {
        method: 'POST',
        body: JSON.stringify({
          brandName: brandName.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim(),
          title: title.trim(),
          description: description.trim(),
          adType,
          mediaUrl: uploadedUrl,
          actionUrl: actionUrl.trim() || 'https://funflick.in',
          actionText: actionText.trim() || 'Learn More',
        }),
      });

      Alert.alert(
        'Campaign Submitted! 🎉',
        'Our brand partnership team will review your ad creative and reach out within 24 hours.'
      );
      // Reset form & view my requests
      setBrandName('');
      setTitle('');
      setDescription('');
      setMediaPreview(null);
      setUploadedUrl('');
      setActiveTab('my_requests');
      fetchMyRequests();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit campaign request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const cleanWhatsapp = (adContactSettings?.adContactWhatsapp || '+91 98765 43210').replace(/[^0-9]/g, '');

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient colors={['#ff007a', '#7928ca']} style={styles.headerIcon}>
                <Megaphone size={18} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.title}>Advertise with FunFlick</Text>
                <Text style={styles.subtitle}>Sponsor & Brand Partnership Hub</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Quick Contact Bar */}
          <View style={styles.contactBar}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${adContactSettings.adContactPhone || '+919876543210'}`)}
            >
              <Phone size={13} color="#34d399" />
              <Text style={styles.contactItemText}>Call Desk</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`https://wa.me/${cleanWhatsapp}?text=Hi%20FunFlick%20Ad%20Team%2C%20I%20want%20to%20advertise%20my%20brand`)}
            >
              <MessageCircle size={13} color="#22c55e" />
              <Text style={styles.contactItemText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${adContactSettings.adContactEmail || 'ads@funflick.in'}?subject=Advertising%20Inquiry`)}
            >
              <Mail size={13} color="#60a5fa" />
              <Text style={styles.contactItemText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'new' && styles.tabBtnActive]}
              onPress={() => setActiveTab('new')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'new' && styles.tabBtnTextActive]}>
                + Submit New Campaign
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'my_requests' && styles.tabBtnActive]}
              onPress={() => setActiveTab('my_requests')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'my_requests' && styles.tabBtnTextActive]}>
                My Submissions ({myAdRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {activeTab === 'new' ? (
              <View style={{ gap: 14 }}>
                {/* Brand & Person */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Brand / Business Name *</Text>
                    <TextInput
                      value={brandName}
                      onChangeText={setBrandName}
                      placeholder="e.g. Swiggy, Nike, Local Cafe"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Contact Person</Text>
                    <TextInput
                      value={contactPerson}
                      onChangeText={setContactPerson}
                      placeholder="Your Name"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Phone & Email */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      value={phone}
                      onChangeText={handlePhoneChange}
                      placeholder="+91 XXXXX XXXXX"
                      placeholderTextColor="#64748b"
                      keyboardType="phone-pad"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="brand@example.com"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Campaign Title & Description */}
                <View>
                  <Text style={styles.inputLabel}>Campaign Title *</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Summer Comedy Festival 2026 Promo"
                    placeholderTextColor="#64748b"
                    style={styles.textInput}
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Campaign Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Briefly describe your product, offer or campaign goals..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={3}
                    style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                  />
                </View>

                {/* Ad Creative Type Selector */}
                <View>
                  <Text style={styles.inputLabel}>Ad Format</Text>
                  <View style={styles.adTypeTabs}>
                    <TouchableOpacity
                      style={[styles.adTypeTab, adType === 'video' && styles.adTypeTabActive]}
                      onPress={() => {
                        setAdType('video');
                        setMediaPreview(null);
                        setUploadedUrl('');
                      }}
                    >
                      <Film size={14} color={adType === 'video' ? '#fff' : '#94a3b8'} />
                      <Text style={[styles.adTypeTabText, adType === 'video' && styles.adTypeTabTextActive]}>
                        Video Ad (Reel / MP4)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.adTypeTab, adType === 'image' && styles.adTypeTabActive]}
                      onPress={() => {
                        setAdType('image');
                        setMediaPreview(null);
                        setUploadedUrl('');
                      }}
                    >
                      <ImageIcon size={14} color={adType === 'image' ? '#fff' : '#94a3b8'} />
                      <Text style={[styles.adTypeTabText, adType === 'image' && styles.adTypeTabTextActive]}>
                        Poster Image (Banner)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* File Upload Box */}
                <View>
                  <Text style={styles.inputLabel}>Upload Ad Creative *</Text>
                  <TouchableOpacity
                    style={[styles.uploadDropZone, { position: 'relative' }]}
                    onPress={Platform.OS === 'web' ? undefined : handlePickMedia}
                    activeOpacity={0.8}
                    disabled={isUploading}
                  >
                    {Platform.OS === 'web' && (
                      <input
                        type="file"
                        accept={adType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessFile(file);
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
                    {isUploading ? (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <ActivityIndicator color="#ff007a" size="small" />
                        <Text style={{ color: '#f472b6', fontSize: 11, fontWeight: '700' }}>
                          Uploading to AWS S3...
                        </Text>
                      </View>
                    ) : mediaPreview ? (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <Image source={{ uri: mediaPreview }} style={styles.previewImage} resizeMode="cover" />
                        <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '800' }}>
                          ✓ Creative Attached (Tap to change)
                        </Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <UploadCloud size={28} color="#f472b6" />
                        <Text style={styles.uploadPromptTitle}>
                          Tap to select {adType === 'video' ? 'Video (MP4)' : 'Image (PNG/JPG)'}
                        </Text>
                        <Text style={styles.uploadPromptSub}>Direct upload to AWS S3 • Max {adType === 'video' ? '10 MB' : '5 MB'}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Action URL & Button Text */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Website / Landing Page</Text>
                    <TextInput
                      value={actionUrl}
                      onChangeText={setActionUrl}
                      placeholder="https://yourbrand.com"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Call To Action Text</Text>
                    <TextInput
                      value={actionText}
                      onChangeText={setActionText}
                      placeholder="e.g. Shop Now, Visit Site"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={isSubmitting || isUploading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#ff007a', '#ff4b2b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={16} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit Campaign for Review</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* My Submissions Tab */
              <View style={{ gap: 12 }}>
                {isLoadingRequests ? (
                  <ActivityIndicator color="#ff007a" style={{ marginVertical: 30 }} />
                ) : myAdRequests.length === 0 ? (
                  <View style={styles.emptyRequestsBox}>
                    <Megaphone size={28} color="#64748b" />
                    <Text style={styles.emptyRequestsTitle}>No Ad Campaigns Yet</Text>
                    <Text style={styles.emptyRequestsSub}>
                      Switch to "Submit New Campaign" to launch your brand advertisement.
                    </Text>
                  </View>
                ) : (
                  myAdRequests.map(req => {
                    const statusColor =
                      req.status === 'Approved' ? '#10b981' : req.status === 'Rejected' ? '#f43f5e' : '#f59e0b';
                    return (
                      <View key={req.id} style={styles.requestCard}>
                        <View style={styles.requestCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.requestBrand}>{req.brandName || req.brand_name}</Text>
                            <Text style={styles.requestTitle}>{req.title}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}25`, borderColor: `${statusColor}50` }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                              {req.status || 'Pending'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.requestDate}>
                          Submitted on {new Date(req.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>

                        {req.admin_note ? (
                          <View style={styles.adminNoteBox}>
                            <Text style={styles.adminNoteLabel}>Admin Note:</Text>
                            <Text style={styles.adminNoteText}>{req.admin_note}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: '#120a24',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  subtitle: {
    color: '#f472b6',
    fontSize: 10.5,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  contactItemText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabBtnActive: {
    backgroundColor: '#ff007a',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 24,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 12,
  },
  adTypeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  adTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  adTypeTabActive: {
    backgroundColor: 'rgba(255,0,122,0.15)',
    borderColor: '#ff007a',
  },
  adTypeTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  adTypeTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  uploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,0,122,0.4)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,0,122,0.04)',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 120,
    height: 80,
    borderRadius: 10,
  },
  uploadPromptTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  uploadPromptSub: {
    color: '#94a3b8',
    fontSize: 10,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  submitGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyRequestsBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyRequestsTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyRequestsSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
  },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 6,
  },
  requestCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  requestBrand: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  requestTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  requestDate: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  adminNoteBox: {
    marginTop: 4,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f472b6',
  },
  adminNoteLabel: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '800',
  },
  adminNoteText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
});
