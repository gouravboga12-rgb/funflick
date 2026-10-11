import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Switch,
  Platform,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  Heart,
  Bookmark,
  History,
  Crown,
  Wallet,
  Video,
  Megaphone,
  HelpCircle,
  LogOut,
  Ban,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  Lock,
  Plus,
  TrendingUp,
  BarChart3,
  DollarSign,
  Phone,
  Mail,
  UserX,
  ShieldCheck,
  Unlock,
  Building2,
  Moon,
  Sun,
  Globe,
  Wifi,
  Bell,
  Shield,
  Check,
  Play,
  Camera,
  Copy,
} from 'lucide-react-native';
import { SubmitAdRequestModal } from '../../components/user/SubmitAdRequestModal';
import { FollowListModal } from '../../components/common/FollowListModal';
import { useApp } from '../../context/AppContext';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { apiRequest, setStoredUser, setToken } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function AvatarWithFallback({ avatar, name, username, size = 80 }) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || username || 'F').charAt(0).toUpperCase();
  const isDefaultOrMissing = !avatar || String(avatar).includes('default-avatar') || hasError;

  if (isDefaultOrMissing) {
    return (
      <View
        style={[
          styles.avatarFallback,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: '#0d9488' },
        ]}
      >
        <Text style={[styles.avatarInitialText, { fontSize: size * 0.45 }]}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatar }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setHasError(true)}
    />
  );
}

export const UserProfileScreen = ({ navigation, route }) => {
  const { currentUser, setCurrentUser, logout, posts, fetchFeed, deleteUserPost } = useApp();
  const [activeMode, setActiveMode] = useState('viewer'); // 'viewer' | 'influencer'

  // Dynamic live followers / following count
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isLoadingFollows, setIsLoadingFollows] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isWatchHistoryModalOpen, setIsWatchHistoryModalOpen] = useState(false);
  const [isSavedVideosModalOpen, setIsSavedVideosModalOpen] = useState(false);
  const [isContentLibraryModalOpen, setIsContentLibraryModalOpen] = useState(false);
  const [watchHistoryList, setWatchHistoryList] = useState([]);
  const [myMediaList, setMyMediaList] = useState([]);
  const [isLoadingMyMedia, setIsLoadingMyMedia] = useState(false);

  useEffect(() => {
    if (posts && posts.length > 0) {
      setWatchHistoryList(posts.slice(0, 15));
    }
  }, [posts]);

  // Edit form state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar_url || currentUser?.avatar || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Settings & Contact state
  const [settingsEmail, setSettingsEmail] = useState(currentUser?.email || '');
  const [settingsPhone, setSettingsPhone] = useState(currentUser?.phone || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [isPrivateAccount, setIsPrivateAccount] = useState(Boolean(currentUser?.isPrivate));
  const [allowDMs, setAllowDMs] = useState(currentUser?.allowDMs !== false);
  const [autoplayWifi, setAutoplayWifi] = useState(true);
  const [uploadHighQuality, setUploadHighQuality] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);

  // Payout details state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('bank'); // 'bank' | 'upi'
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountNum, setPayoutAccountNum] = useState('');
  const [payoutConfirmAccountNum, setPayoutConfirmAccountNum] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');
  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Blocked users state
  const [blockedList, setBlockedList] = useState([]);

  // Cross-platform helper functions for Alert and Confirm
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

  const showAppConfirm = (title, message, onOk) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          onOk();
        }
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', style: 'destructive', onPress: onOk },
      ]);
    }
  };

  // Fetch real follow counts from AWS EC2 backend
  const fetchFollowCounts = useCallback(async () => {
    if (!currentUser?.username) return;
    setIsLoadingFollows(true);
    try {
      const [f1, f2] = await Promise.all([
        apiRequest(`/follows/${currentUser.username}/followers`),
        apiRequest(`/follows/${currentUser.username}/following`),
      ]);
      setFollowCounts({
        followers: f1?.count !== undefined ? f1.count : (f1?.followers?.length || 0),
        following: f2?.count !== undefined ? f2.count : (f2?.following?.length || 0),
      });
    } catch (e) {
      console.warn('Could not fetch follow counts:', e);
    } finally {
      setIsLoadingFollows(false);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    fetchFollowCounts();
    if (currentUser) {
      setSettingsEmail(currentUser.email || '');
      setSettingsPhone(currentUser.phone || '');
      setEditName(currentUser.name || '');
      setEditUsername(currentUser.username || '');
      setEditBio(currentUser.bio || '');
      setEditAvatar(currentUser.avatar_url || currentUser.avatar || '');
      setEditEmail(currentUser.email || '');
    }

    const unsub = navigation.addListener('focus', () => {
      fetchFollowCounts();
    });
    return unsub;
  }, [fetchFollowCounts, currentUser, navigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchFollowCounts(),
        fetchFeed ? fetchFeed() : Promise.resolve(),
      ]);
    } catch (e) {
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const data = await apiRequest('/users/blocked');
      if (data && Array.isArray(data.blocked)) {
        setBlockedList(data.blocked);
      }
    } catch (e) {}
  };

  const handleUnblock = async (username) => {
    try {
      await apiRequest('/users/unblock', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      setBlockedList(prev => prev.filter(u => u !== username));
      showAppAlert('Unblocked', `@${username} has been unblocked.`);
    } catch (e) {
      showAppAlert('Error', 'Failed to unblock user');
    }
  };

  // Avatar picker & upload to S3
  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploadingAvatar(true);
        const asset = result.assets[0];
        const s3Url = await uploadMediaToS3(
          asset.file || asset.uri,
          `avatar_${Date.now()}.jpg`,
          'image/jpeg',
          'avatars'
        );
        if (s3Url) {
          setEditAvatar(s3Url);
        }
      }
    } catch (e) {
      showAppAlert('Avatar Error', 'Could not select photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save changes to profile, contact & password
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showAppAlert('Required', 'Please enter your display name.');
      return;
    }
    if (!editUsername.trim()) {
      showAppAlert('Required', 'Please enter a username.');
      return;
    }
    if (editPassword) {
      if (editPassword.length < 6) {
        showAppAlert('Password Too Short', 'Password must be at least 6 characters.');
        return;
      }
      if (editPassword !== editConfirmPassword) {
        showAppAlert('Password Mismatch', 'New passwords do not match.');
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const updated = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          username: editUsername.trim().toLowerCase(),
          bio: editBio.trim(),
          avatar_url: editAvatar,
          email: editEmail.trim(),
          ...(editPassword ? { password: editPassword } : {}),
        }),
      });
      if (updated && updated.user) {
        setCurrentUser(updated.user);
        await setStoredUser(updated.user);
        if (updated.token) {
          await setToken(updated.token);
        }
      }
      setIsEditModalOpen(false);
      setEditPassword('');
      setEditConfirmPassword('');
      showAppAlert('Saved', 'Your profile details have been updated globally!');
    } catch (e) {
      showAppAlert('Update Failed', e.message || 'Could not save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Permanent account deletion
  const handleDeleteAccount = () => {
    showAppConfirm(
      'Delete Account Permanently',
      'Are you sure you want to permanently delete your account? All your profile data, uploaded videos, reels, and messages will be permanently removed. This action cannot be undone.',
      async () => {
        try {
          await apiRequest('/auth/account', { method: 'DELETE' });
          showAppAlert('Account Deleted', 'Your account has been permanently deleted.', [
            {
              text: 'OK',
              onPress: async () => {
                await logout?.();
                const parent = navigation.getParent();
                if (parent) {
                  parent.reset({ index: 0, routes: [{ name: 'Splash' }] });
                } else {
                  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
                }
              },
            },
          ]);
        } catch (err) {
          showAppAlert('Error', err.message || 'Failed to delete account');
        }
      }
    );
  };

  // Content Library fetching and deletion
  const fetchMyMedia = async () => {
    setIsLoadingMyMedia(true);
    try {
      const res = await apiRequest('/videos/my-media');
      if (res && Array.isArray(res.media)) {
        setMyMediaList(res.media);
      }
    } catch (e) {
      console.warn('Could not fetch my media:', e);
    } finally {
      setIsLoadingMyMedia(false);
    }
  };

  const handleDeleteVideo = (videoId, videoTitle) => {
    showAppConfirm(
      'Delete Video?',
      `Are you sure you want to delete "${videoTitle || 'this post'}"?`,
      async () => {
        try {
          await apiRequest(`/videos/${videoId}`, { method: 'DELETE' });
          setMyMediaList(prev => prev.filter(v => v.id !== videoId));
          fetchFeed?.();
          showAppAlert('Deleted', 'Video deleted successfully');
        } catch (err) {
          showAppAlert('Error', err.message || 'Failed to delete video');
        }
      }
    );
  };

  const fetchPayoutDetails = async () => {
    setIsLoadingPayout(true);
    try {
      const data = await apiRequest('/payouts/details');
      if (data && data.payoutDetails) {
        const d = data.payoutDetails;
        setPayoutMethod(d.payout_method || 'bank');
        setPayoutBankName(d.bank_name || '');
        setPayoutAccountNum(d.account_number || '');
        setPayoutConfirmAccountNum(d.account_number || '');
        setPayoutIfsc(d.ifsc_code || '');
        setPayoutUpiId(d.upi_id || '');
      }
    } catch (e) {
      // no details yet
    } finally {
      setIsLoadingPayout(false);
    }
  };

  const handleSavePayoutDetails = async () => {
    if (payoutMethod === 'bank') {
      if (!payoutBankName.trim()) {
        Alert.alert('Required', 'Please enter your bank name.');
        return;
      }
      if (!payoutAccountNum.trim() || payoutAccountNum.length < 8) {
        Alert.alert('Required', 'Please enter a valid bank account number (min 8 digits).');
        return;
      }
      if (payoutAccountNum !== payoutConfirmAccountNum) {
        Alert.alert('Mismatch', 'Bank account numbers do not match.');
        return;
      }
      if (!payoutIfsc.trim() || payoutIfsc.trim().length !== 11) {
        Alert.alert('Required', 'Please enter an 11-character valid IFSC code.');
        return;
      }
    } else {
      if (!payoutUpiId.trim() || !payoutUpiId.includes('@')) {
        Alert.alert('Required', 'Please enter a valid UPI ID (e.g. mobile@upi).');
        return;
      }
    }

    setIsSavingPayout(true);
    try {
      await apiRequest('/payouts/details', {
        method: 'POST',
        body: JSON.stringify({
          payout_method: payoutMethod,
          bank_name: payoutBankName.trim(),
          account_number: payoutAccountNum.trim(),
          ifsc_code: payoutIfsc.trim().toUpperCase(),
          upi_id: payoutUpiId.trim(),
          phone: settingsPhone || currentUser?.phone,
          email: settingsEmail || currentUser?.email,
        }),
      });
      setIsPayoutModalOpen(false);
      Alert.alert('Saved', 'Your payout details have been updated!');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save payout details.');
    } finally {
      setIsSavingPayout(false);
    }
  };

  const handleSaveContactSettings = async () => {
    setIsSavingSettings(true);
    try {
      let res;
      try {
        res = await apiRequest('/auth/profile/contact', {
          method: 'PUT',
          body: JSON.stringify({
            email: settingsEmail.trim(),
            phone: settingsPhone.trim(),
            isPrivate: isPrivateAccount,
            allowDMs: allowDMs,
          }),
        });
      } catch (err) {
        // Fallback to /auth/profile
        res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: currentUser?.name || '',
            username: currentUser?.username || '',
            bio: currentUser?.bio || '',
            avatar_url: currentUser?.avatar_url || currentUser?.avatar || '',
            email: settingsEmail.trim(),
            phone: settingsPhone.trim(),
          }),
        });
      }

      if (res && res.user) {
        setCurrentUser(res.user);
        await setStoredUser(res.user);
      }
      setIsSettingsModalOpen(false);
      Alert.alert('Settings Saved', '⚙️ Account settings and preferences saved successfully!');
    } catch (e) {
      Alert.alert('Update Failed', e.message || 'Could not save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    setIsSettingsModalOpen(false);
    try {
      await logout?.();
      const parent = navigation.getParent();
      if (parent) {
        parent.reset({ index: 0, routes: [{ name: 'Splash' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      }
    } catch (e) {
      console.warn('Logout error:', e);
      navigation.navigate('Splash');
    }
  };

  // User posts / submissions
  const myPosts = (posts || []).filter(p => p.creator?.username === currentUser?.username);
  const myLikedPosts = (posts || []).filter(p => p.isLiked);
  const mySavedPosts = (posts || []).filter(p => p.isSaved);

  const realPostCount = myPosts.length;
  const isInfluencer = Boolean(currentUser?.isInfluencer);

  // Viewer Menu Items matching website (image copy 32.png & image copy 33.png)
  const viewerMenuItems = [
    {
      id: 'my-profile',
      icon: User,
      iconColor: '#f472b6',
      label: 'My Profile',
      badge: 'Feed & Videos',
      badgeGradient: true,
      onPress: () => navigation.navigate('CreatorProfile', { username: currentUser?.username }),
    },
    {
      id: 'liked-videos',
      icon: Heart,
      iconColor: '#f472b6',
      label: 'Liked Videos',
      badge: myLikedPosts.length > 0 ? String(myLikedPosts.length) : null,
      onPress: () => navigation.navigate('CreatorProfile', { username: currentUser?.username, initialTab: 'Liked' }),
    },
    {
      id: 'saved-videos',
      icon: Bookmark,
      iconColor: '#fbbf24',
      label: 'Saved Videos',
      badge: mySavedPosts.length > 0 ? String(mySavedPosts.length) : null,
      onPress: () => setIsSavedVideosModalOpen(true),
    },
    {
      id: 'watch-history',
      icon: History,
      iconColor: '#60a5fa',
      label: 'Watch History',
      badge: 'Recents',
      badgeColor: 'rgba(96,165,250,0.18)',
      badgeTextColor: '#60a5fa',
      onPress: () => setIsWatchHistoryModalOpen(true),
    },
    {
      id: 'membership-plans',
      icon: Crown,
      iconColor: '#fbbf24',
      label: 'Influencer Membership Plans',
      badge: isInfluencer ? '⭐ Active' : 'Upgrade to Influencer',
      badgeColor: isInfluencer ? 'rgba(251,191,36,0.2)' : '#ff007a',
      badgeTextColor: isInfluencer ? '#fbbf24' : '#ffffff',
      onPress: () => navigation.navigate('Subscription'),
    },
    {
      id: 'wallet-payouts',
      icon: Wallet,
      iconColor: '#34d399',
      label: 'Wallet & Payouts',
      badge: `₹${currentUser?.walletBalance || 0}`,
      badgeColor: 'rgba(52,211,153,0.18)',
      badgeTextColor: '#34d399',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      id: 'content-library',
      icon: Video,
      iconColor: '#fb7185',
      label: 'My Content Library',
      badge: `${realPostCount} posts`,
      badgeColor: 'rgba(255,255,255,0.08)',
      badgeTextColor: '#9ca3af',
      onPress: () => {
        fetchMyMedia();
        setIsContentLibraryModalOpen(true);
      },
    },
    {
      id: 'advertise',
      icon: Megaphone,
      iconColor: '#f472b6',
      label: 'Advertise with FunFlick',
      badge: 'Promote',
      badgeColor: 'rgba(244,114,182,0.18)',
      badgeTextColor: '#f472b6',
      onPress: () => setIsAdvertiseModalOpen(true),
    },
    {
      id: 'account-settings',
      icon: Settings,
      iconColor: '#cbd5e1',
      label: 'Account Settings',
      badge: 'Preferences',
      badgeColor: 'rgba(255,255,255,0.08)',
      badgeTextColor: '#9ca3af',
      onPress: () => {
        setSettingsEmail(currentUser?.email || '');
        setSettingsPhone(currentUser?.phone || '');
        setIsSettingsModalOpen(true);
      },
    },
    {
      id: 'help-support',
      icon: HelpCircle,
      iconColor: '#22d3ee',
      label: 'Help & Support',
      badge: '24/7 Desk',
      badgeColor: 'rgba(34,211,238,0.18)',
      badgeTextColor: '#22d3ee',
      onPress: () => setIsHelpModalOpen(true),
    },
    {
      id: 'logout',
      icon: LogOut,
      iconColor: '#f43f5e',
      label: 'Logout',
      isDestructive: true,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Top Header with Back, Logo, Name & Settings */}
      <View style={styles.topHeader}>
        <View style={styles.topLeft}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Feed');
              }
            }}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <Image
              source={{ uri: 'https://funflick-theta.vercel.app/brand/funflick-logo.png' }}
              style={styles.headerLogo}
            />
            <Text style={styles.headerBrandText}>
              fun<Text style={styles.headerBrandTextPink}>flick</Text>
            </Text>
          </View>
        </View>

        <View style={styles.topCenter}>
          <Text style={styles.headerUserName} numberOfLines={1}>
            {currentUser?.name || 'User Profile'}
          </Text>
          <Text style={styles.headerUserHandle} numberOfLines={1}>
            @{currentUser?.username || 'user'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSettingsEmail(currentUser?.email || '');
            setSettingsPhone(currentUser?.phone || '');
            setIsSettingsModalOpen(true);
          }}
          style={styles.settingsIconBtn}
        >
          <Settings size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 2. User Info Card */}
        <View style={styles.profileHeaderCard}>
          {/* Avatar with Pink Border */}
          <TouchableOpacity
            style={styles.avatarTouchWrap}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CreatorProfile', { username: currentUser?.username })}
          >
            <View style={styles.avatarBorderRing}>
              <AvatarWithFallback
                avatar={currentUser?.avatar_url || currentUser?.avatar}
                name={currentUser?.name}
                username={currentUser?.username}
                size={80}
              />
            </View>
            {isInfluencer && (
              <View style={styles.influencerStarBadge}>
                <Text style={styles.starText}>⭐</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name & Role Badge */}
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{currentUser?.name || 'FunFlick Member'}</Text>
            <View
              style={[
                styles.roleBadge,
                isInfluencer ? styles.roleBadgeInfluencer : styles.roleBadgeFree,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  isInfluencer ? styles.roleBadgeTextInfluencer : styles.roleBadgeTextFree,
                ]}
              >
                {isInfluencer ? '⭐ Influencer' : 'User (Free Member)'}
              </Text>
            </View>
          </View>

          {/* Handle & Location */}
          <Text style={styles.profileHandle}>
            @{currentUser?.username || 'user'} · Hyderabad
          </Text>

          {currentUser?.bio ? (
            <Text style={styles.profileBio}>{currentUser.bio}</Text>
          ) : null}

          {/* Company Badge: FunFlick Creator & Entertainment Network */}
          <View style={styles.companyBadge}>
            <Image
              source={{ uri: 'https://funflick-theta.vercel.app/brand/funflick-logo.png' }}
              style={styles.companyBadgeLogo}
            />
            <Text style={styles.companyBadgeText}>
              FunFlick Creator & Entertainment Network
            </Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{realPostCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => {
                setFollowModalTab('following');
                setIsFollowModalOpen(true);
              }}
            >
              <Text style={styles.statValue}>{followCounts.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => {
                setFollowModalTab('followers');
                setIsFollowModalOpen(true);
              }}
            >
              <Text style={styles.statValue}>{followCounts.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
          </View>

          {/* "My Profile" Gradient Banner Card (View >) */}
          <TouchableOpacity
            style={styles.myProfileBannerCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('CreatorProfile', { username: currentUser?.username })}
          >
            <LinearGradient
              colors={['#ff007a', '#ff4b2b', '#7928ca']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.myProfileBannerGradient}
            >
              <View style={styles.myProfileBannerLeft}>
                <View style={styles.myProfileIconCircle}>
                  <User size={16} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.myProfileBannerTitle}>My Profile</Text>
                  <Text style={styles.myProfileBannerSubtitle}>
                    View your uploaded videos, reels & likes
                  </Text>
                </View>
              </View>
              <View style={styles.myProfileBannerRight}>
                <Text style={styles.myProfileViewText}>View</Text>
                <ChevronRight size={14} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* CTA Buttons: Edit Profile & Get Influencer Pass */}
          <View style={styles.ctaButtonsRow}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              activeOpacity={0.8}
              onPress={() => {
                setEditName(currentUser?.name || '');
                setEditBio(currentUser?.bio || '');
                setIsEditModalOpen(true);
              }}
            >
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.influencerPassBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Subscription')}
            >
              <LinearGradient
                colors={['#f59e0b', '#ec4899', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.influencerPassGradient}
              >
                <Text style={styles.starIconText}>⭐</Text>
                <Text style={styles.influencerPassText}>
                  {isInfluencer ? 'Influencer Active' : 'Get Influencer Pass'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs: Viewer Profile vs Influencer Hub */}
          <View style={styles.modeSwitcherContainer}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                activeMode === 'viewer' && styles.modeTabActive,
              ]}
              onPress={() => setActiveMode('viewer')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  activeMode === 'viewer' && styles.modeTabTextActive,
                ]}
              >
                🎥 Viewer Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeTab,
                activeMode === 'influencer' && styles.modeTabActive,
              ]}
              onPress={() => setActiveMode('influencer')}
              activeOpacity={0.8}
            >
              <View style={styles.influencerTabContent}>
                <Text
                  style={[
                    styles.modeTabText,
                    activeMode === 'influencer' && styles.modeTabTextActive,
                  ]}
                >
                  ✨ Influencer Hub
                </Text>
                <View style={styles.yellowDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. MODE CONTENT */}
        {activeMode === 'viewer' ? (
          /* =================================================== */
          /* VIEWER PROFILE MENU LIST (Matching image copy 32/33) */
          /* =================================================== */
          <View style={styles.viewerMenuListCard}>
            {viewerMenuItems.map((item, index) => {
              const IconComp = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    index === viewerMenuItems.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuIconBox}>
                      <IconComp size={18} color={item.iconColor} />
                    </View>
                    <Text
                      style={[
                        styles.menuRowLabel,
                        item.isDestructive && styles.destructiveLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  <View style={styles.menuRowRight}>
                    {item.badge ? (
                      item.badgeGradient ? (
                        <LinearGradient
                          colors={['#ff007a', '#7928ca']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientBadge}
                        >
                          <Text style={styles.gradientBadgeText}>{item.badge}</Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.normalBadge,
                            item.badgeColor && { backgroundColor: item.badgeColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.normalBadgeText,
                              item.badgeTextColor && { color: item.badgeTextColor },
                            ]}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      )
                    ) : null}
                    <ChevronRight
                      size={16}
                      color={item.isDestructive ? '#f43f5e' : '#64748b'}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* =================================================== */
          /* INFLUENCER HUB (Creator Status, Metrics, Submissions)*/
          /* =================================================== */
          <View style={styles.influencerHubSection}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardTop}>
                <View style={styles.statusIconWrap}>
                  <Award size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Influencer & Creator Status</Text>
                  <Text style={styles.statusSubtitle}>
                    Free upload for all! Upgrade to Influencer to unlock in-depth media analytics & cash rewards.
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadgePill,
                    isInfluencer ? styles.statusBadgeInfluencer : styles.statusBadgeFree,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {isInfluencer ? 'Influencer Active' : 'User (Free)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <BarChart3 size={16} color="#ec4899" />
                <Text style={styles.metricValue}>
                  {myPosts.reduce((acc, p) => acc + (p.viewsCount || p.views || 0), 0)}
                </Text>
                <Text style={styles.metricLabel}>Total Views</Text>
              </View>

              <View style={styles.metricCard}>
                <DollarSign size={16} color="#10b981" />
                <Text style={styles.metricValue}>₹{currentUser?.walletBalance || 0}</Text>
                <Text style={styles.metricLabel}>Earnings</Text>
              </View>

              <View style={styles.metricCard}>
                <TrendingUp size={16} color="#8b5cf6" />
                <Text style={styles.metricValue}>{realPostCount}</Text>
                <Text style={styles.metricLabel}>Uploads</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsWrap}>
              <Text style={styles.sectionHeaderTitle}>Creator Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('UploadReel')}
                >
                  <Video size={18} color="#ec4899" />
                  <Text style={styles.quickActionText}>Upload Reel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('CreatePost')}
                >
                  <Plus size={18} color="#8b5cf6" />
                  <Text style={styles.quickActionText}>Create Post</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Crown size={18} color="#f59e0b" />
                  <Text style={styles.quickActionText}>Influencer Plans</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setIsAdvertiseModalOpen(true)}
                >
                  <Megaphone size={18} color="#06b6d4" />
                  <Text style={styles.quickActionText}>Advertise</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* My Submissions Tracker */}
            <View style={styles.submissionsWrap}>
              <View style={styles.submissionsHeader}>
                <Clock size={16} color="#ec4899" />
                <Text style={styles.submissionsTitle}>
                  My Submissions & Admin Approvals ({myPosts.length})
                </Text>
              </View>

              {myPosts.length === 0 ? (
                <View style={styles.emptySubmissionsBox}>
                  <Text style={styles.emptySubmissionsText}>
                    No videos uploaded yet. Tap "Upload Reel" to publish your first video!
                  </Text>
                </View>
              ) : (
                myPosts.map(item => (
                  <View key={item.id} style={styles.submissionCard}>
                    <Image
                      source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                      style={styles.submissionThumb}
                    />
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionTitle} numberOfLines={1}>
                        {item.title || 'Untitled Post'}
                      </Text>
                      <Text style={styles.submissionMeta}>
                        {item.category || 'Reel'} · Views: {item.viewsCount || item.views || 0}
                      </Text>
                      <View style={styles.approvalBadge}>
                        <CheckCircle2 size={12} color="#10b981" />
                        <Text style={styles.approvalText}>Live on FunFlick</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Delete Post', `Permanently delete "${item.title}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteUserPost?.(item.id),
                          },
                        ]);
                      }}
                      style={styles.deleteSubmissionBtn}
                    >
                      <Trash2 size={16} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* 4. Blocked Accounts Section */}
        <View style={styles.blockedSectionCard}>
          <View style={styles.blockedLeft}>
            <View style={styles.blockedIconBox}>
              <Ban size={18} color="#f43f5e" />
            </View>
            <View>
              <Text style={styles.blockedTitle}>Blocked Accounts</Text>
              <Text style={styles.blockedSubtitle}>Check and unblock restricted accounts</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.manageBlockedBtn}
            onPress={() => {
              fetchBlockedUsers();
              setIsBlockedModalOpen(true);
            }}
          >
            <Text style={styles.manageBlockedText}>Manage</Text>
            <ChevronRight size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Extra Bottom Spacing for Tab Bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* =================================================== */}
      {/* =================================================== */}
      {/* MODAL 1: EDIT PROFILE                               */}
      {/* =================================================== */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.settingsHeaderIcon, { backgroundColor: '#ff007a' }]}>
                  <User size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <Text style={{ color: '#f472b6', fontSize: 10.5, fontWeight: '600' }}>
                    Update your public identity
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Avatar Picker with Camera button */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                  style={{ position: 'relative' }}
                >
                  <View
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      borderWidth: 2.5,
                      borderColor: '#ff007a',
                      overflow: 'hidden',
                      backgroundColor: '#1b1236',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color="#ff007a" />
                    ) : (
                      <AvatarWithFallback
                        avatar={editAvatar || currentUser?.avatar_url || currentUser?.avatar}
                        name={editName || currentUser?.name}
                        username={editUsername || currentUser?.username}
                        size={86}
                      />
                    )}
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#ff007a',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#18122c',
                    }}
                  >
                    <Camera size={14} color="#ffffff" />
                  </View>
                </TouchableOpacity>
                <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginTop: 6 }}>
                  Tap to change profile picture
                </Text>
              </View>

              {/* Display Name */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748b"
                  style={styles.modalTextInput}
                />
              </View>

              {/* Username */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputLabel}>Username (Unique ID)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12 }}>
                  <Text style={{ color: '#ff007a', fontWeight: '800', fontSize: 14 }}>@</Text>
                  <TextInput
                    value={editUsername}
                    onChangeText={t => setEditUsername(t.replace(/\s+/g, ''))}
                    placeholder="username"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    style={[{ flex: 1, color: '#ffffff', fontSize: 13, paddingHorizontal: 6, paddingVertical: 10 }]}
                  />
                </View>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>
                  Changing username updates your login handle across FunFlick.
                </Text>
              </View>

              {/* Email */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.modalTextInput}
                />
              </View>

              {/* Bio */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  style={[styles.modalTextInput, { height: 70, textAlignVertical: 'top' }]}
                />
              </View>

              {/* Password Section */}
              <View style={{ marginTop: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Lock size={14} color="#f472b6" />
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>Change Password (Optional)</Text>
                </View>

                <View style={[styles.modalInputGroup, { marginBottom: 8 }]}>
                  <Text style={[styles.inputLabel, { fontSize: 10.5 }]}>New Password</Text>
                  <TextInput
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder="Leave empty to keep current"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    style={[styles.modalTextInput, { paddingVertical: 8, fontSize: 12 }]}
                  />
                </View>

                <View style={[styles.modalInputGroup, { marginBottom: 0 }]}>
                  <Text style={[styles.inputLabel, { fontSize: 10.5 }]}>Confirm New Password</Text>
                  <TextInput
                    value={editConfirmPassword}
                    onChangeText={setEditConfirmPassword}
                    placeholder="Repeat new password"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    style={[styles.modalTextInput, { paddingVertical: 8, fontSize: 12 }]}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { marginTop: 16 }]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ff007a', '#ff4b2b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveGradient}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 2: INFLUENCER PLANS                           */}
      {/* =================================================== */}
      <Modal visible={isPlansModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Influencer Membership</Text>
              <TouchableOpacity onPress={() => setIsPlansModalOpen(false)}>
                <X size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={styles.planCard}>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>POPULAR</Text>
                </View>
                <Text style={styles.planName}>Monthly Influencer Pro</Text>
                <Text style={styles.planPrice}>₹199 / month</Text>
                <Text style={styles.planDesc}>
                  • Deep 8-factor audience analytics{'\n'}
                  • View-based weekly cash payouts{'\n'}
                  • Verified Influencer profile badge{'\n'}
                  • Priority placement on Discover feed
                </Text>
                <TouchableOpacity
                  style={styles.planSubscribeBtn}
                  onPress={() => {
                    setIsPlansModalOpen(false);
                    Alert.alert('Influencer Activated', 'Your account has been upgraded to Influencer Pro!');
                  }}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#ec4899']}
                    style={styles.planSubscribeGradient}
                  >
                    <Text style={styles.planSubscribeText}>Activate Plan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 3: HELP & SUPPORT                             */}
      {/* =================================================== */}
      <Modal visible={isHelpModalOpen} animationType="slide" transparent onRequestClose={() => setIsHelpModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.settingsHeaderIcon, { backgroundColor: '#22d3ee' }]}>
                  <HelpCircle size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Help & Support Desk</Text>
                  <Text style={{ color: '#22d3ee', fontSize: 10.5, fontWeight: '600' }}>
                    Contact FunFlick Support Directly
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsHelpModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.helpContent}>
              <View style={[styles.helpItem, { flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(34,211,238,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} color="#22d3ee" />
                  </View>
                  <View>
                    <Text style={styles.helpItemTitle}>Official Support Email</Text>
                    <Text style={[styles.helpItemText, { color: '#ffffff', fontWeight: '800', fontSize: 13, marginTop: 2 }]}>
                      funflick0308@gmail.com
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#94a3b8', fontSize: 11, lineHeight: 16, marginTop: 4 }}>
                  Have an issue with your account, video uploads, monetization, or payouts? Write directly to our support team and we will assist you promptly.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { marginTop: 4 }]}
                activeOpacity={0.85}
                onPress={() => {
                  Linking.openURL('mailto:funflick0308@gmail.com?subject=FunFlick%20Support%20Request');
                }}
              >
                <LinearGradient
                  colors={['#06b6d4', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveGradient}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Mail size={16} color="#ffffff" />
                    <Text style={styles.modalSaveText}>Send Email to Support</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 4: BLOCKED USERS (Matching image copy 41.png)  */}
      {/* =================================================== */}
      <Modal visible={isBlockedModalOpen} animationType="fade" transparent onRequestClose={() => setIsBlockedModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.blockedModalCard}>
            {/* Header: Ban Icon, Title with Badge, Subtitle & Close */}
            <View style={styles.blockedModalHeader}>
              <View style={styles.blockedHeaderLeft}>
                <View style={styles.blockedBanIconCircle}>
                  <Ban size={18} color="#f43f5e" />
                </View>
                <View>
                  <View style={styles.blockedTitleBadgeRow}>
                    <Text style={styles.blockedModalTitle}>Blocked Accounts</Text>
                    <View style={styles.blockedCountPill}>
                      <Text style={styles.blockedCountText}>{blockedList.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.blockedModalSub}>Manage accounts you've restricted</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsBlockedModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Info Note: Rose banner */}
            <View style={styles.blockedInfoBanner}>
              <UserX size={16} color="#f43f5e" style={{ marginTop: 1, marginRight: 8 }} />
              <Text style={styles.blockedInfoText}>
                Blocked accounts cannot view your profile or posts, and their content is completely hidden from your feed and reels.
              </Text>
            </View>

            {/* List or Empty State */}
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {blockedList.length === 0 ? (
                <View style={styles.emptyBlockedBox}>
                  <View style={styles.shieldGreenBox}>
                    <ShieldCheck size={26} color="#10b981" />
                  </View>
                  <Text style={styles.emptyBlockedTitle}>No Blocked Accounts</Text>
                  <Text style={styles.emptyBlockedSub}>
                    You haven't blocked anyone yet. Users you block from post options will appear here.
                  </Text>
                </View>
              ) : (
                blockedList.map(u => (
                  <View key={u} style={styles.blockedUserRow}>
                    <View style={styles.blockedUserLeft}>
                      <View style={styles.blockedUserAvatarCircle}>
                        <Text style={styles.blockedUserAvatarInitial}>
                          {(u || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.blockedUserName}>@{u}</Text>
                        <Text style={styles.blockedStatusLabel}>Blocked</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.unblockBtn}
                      onPress={() => handleUnblock(u)}
                    >
                      <Unlock size={12} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.unblockBtnText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Footer Done Button */}
            <TouchableOpacity
              style={styles.blockedDoneBtn}
              onPress={() => setIsBlockedModalOpen(false)}
            >
              <Text style={styles.blockedDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 5: ADVERTISE (SubmitAdRequestModal)           */}
      {/* =================================================== */}
      <SubmitAdRequestModal
        isOpen={isAdvertiseModalOpen}
        onClose={() => setIsAdvertiseModalOpen(false)}
      />

      {/* =================================================== */}
      {/* MODAL 5B: WATCH HISTORY                             */}
      {/* =================================================== */}
      <Modal
        visible={isWatchHistoryModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsWatchHistoryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.settingsHeaderIcon, { backgroundColor: '#3b82f6' }]}>
                  <History size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Watch History</Text>
                  <Text style={{ color: '#60a5fa', fontSize: 10.5, fontWeight: '600' }}>
                    Recently Played Reels & Sketches
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsWatchHistoryModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>
                {watchHistoryList.length} Videos Saved
              </Text>
              {watchHistoryList.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Clear History', 'Are you sure you want to clear your watch history?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear All', style: 'destructive', onPress: () => setWatchHistoryList([]) },
                    ]);
                  }}
                >
                  <Text style={{ color: '#f43f5e', fontSize: 11, fontWeight: '700' }}>Clear History</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 10 }}>
              {watchHistoryList.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                  <History size={32} color="#64748b" />
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>No Watch History</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                    Videos and reels you watch while exploring FunFlick will appear here.
                  </Text>
                </View>
              ) : (
                watchHistoryList.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsWatchHistoryModalOpen(false);
                      navigation.navigate('VideoDetail', { videoId: item.id });
                    }}
                  >
                    <View style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden', position: 'relative', backgroundColor: '#18122c' }}>
                      <Image
                        source={{ uri: item.thumbnailUrl || item.posterUrl || item.mediaUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <Play size={16} color="#fff" fill="#fff" />
                      </View>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: '#ffffff', fontSize: 12.5, fontWeight: '800' }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={{ color: '#f472b6', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                        @{item.creator?.username || 'creator'}
                      </Text>
                      <Text style={{ color: '#94a3b8', fontSize: 10 }}>
                        {item.viewsCount || 0} views • Watched recently
                      </Text>
                    </View>

                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => setWatchHistoryList(prev => prev.filter(w => w.id !== item.id))}
                      style={{ padding: 6 }}
                    >
                      <Trash2 size={14} color="#64748b" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 5C: SAVED VIDEOS                              */}
      {/* =================================================== */}
      <Modal
        visible={isSavedVideosModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSavedVideosModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.settingsHeaderIcon, { backgroundColor: '#f59e0b' }]}>
                  <Bookmark size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Saved Videos</Text>
                  <Text style={{ color: '#fbbf24', fontSize: 10.5, fontWeight: '600' }}>
                    {mySavedPosts.length} Bookmarked Videos
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsSavedVideosModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 10 }}>
              {mySavedPosts.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                  <Bookmark size={32} color="#64748b" />
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>No Saved Videos</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                    Tap the bookmark button on any reel to save it for quick viewing here.
                  </Text>
                </View>
              ) : (
                mySavedPosts.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsSavedVideosModalOpen(false);
                      navigation.navigate('VideoDetail', { videoId: item.id });
                    }}
                  >
                    <View style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden', position: 'relative', backgroundColor: '#18122c' }}>
                      <Image
                        source={{ uri: item.thumbnailUrl || item.posterUrl || item.mediaUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <Play size={16} color="#fff" fill="#fff" />
                      </View>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: '#ffffff', fontSize: 12.5, fontWeight: '800' }} numberOfLines={1}>
                        {item.title || 'Saved Reel'}
                      </Text>
                      <Text style={{ color: '#f472b6', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                        @{item.creator?.username || 'creator'}
                      </Text>
                      <Text style={{ color: '#94a3b8', fontSize: 10 }}>
                        {item.viewsCount || 0} views • Bookmarked
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 5D: MY CONTENT LIBRARY                        */}
      {/* =================================================== */}
      <Modal
        visible={isContentLibraryModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsContentLibraryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.settingsHeaderIcon, { backgroundColor: '#ec4899' }]}>
                  <Video size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>My Content Library</Text>
                  <Text style={{ color: '#f472b6', fontSize: 10.5, fontWeight: '600' }}>
                    {myMediaList.length} Uploaded Videos & Reels
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsContentLibraryModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {isLoadingMyMedia ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#ff007a" />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 10 }}>
                {myMediaList.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                    <Video size={32} color="#64748b" />
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>No Videos Uploaded</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                      You haven't uploaded any reels or videos yet.
                    </Text>
                    <TouchableOpacity
                      style={[styles.modalSaveBtn, { width: 160, marginTop: 12 }]}
                      onPress={() => {
                        setIsContentLibraryModalOpen(false);
                        navigation.navigate('UploadReel');
                      }}
                    >
                      <LinearGradient colors={['#ff007a', '#ff4b2b']} style={styles.modalSaveGradient}>
                        <Text style={styles.modalSaveText}>Upload Reel</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myMediaList.map(item => (
                    <View
                      key={item.id}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setIsContentLibraryModalOpen(false);
                          navigation.navigate('VideoDetail', { videoId: item.id });
                        }}
                        style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden', position: 'relative', backgroundColor: '#18122c' }}
                      >
                        <Image
                          source={{ uri: item.thumbnail_url || item.thumbnailUrl || item.media_url || item.mediaUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                          <Play size={16} color="#fff" fill="#fff" />
                        </View>
                      </TouchableOpacity>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ color: '#ffffff', fontSize: 12.5, fontWeight: '800' }} numberOfLines={1}>
                          {item.title || 'Untitled Video'}
                        </Text>
                        <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '700' }}>
                          ● Active • {item.views_count || item.viewsCount || 0} views
                        </Text>
                        <Text style={{ color: '#94a3b8', fontSize: 10 }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Uploaded'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => handleDeleteVideo(item.id, item.title)}
                        style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(244,63,94,0.1)' }}
                      >
                        <Trash2 size={16} color="#f43f5e" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 6: ACCOUNT SETTINGS (Cloned from website)     */}
      {/* =================================================== */}
      <Modal
        visible={isSettingsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSettingsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '88%', maxHeight: 680, display: 'flex', flexDirection: 'column' }]}>
            {/* 1. Header (Pinned at Top) */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <LinearGradient
                  colors={['#ff007a', '#7928ca']}
                  style={styles.settingsHeaderIcon}
                >
                  <Settings size={18} color="#ffffff" />
                </LinearGradient>
                <View>
                  <Text style={styles.modalTitle}>Account Settings</Text>
                  <Text style={{ color: '#f472b6', fontSize: 10.5, fontWeight: '600' }}>
                    Preferences & Privacy Controls
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsSettingsModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* 2. Scrollable Settings Sections */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* SECTION 1: Account Information */}
              <Text style={styles.settingsSectionTitle}>ACCOUNT INFORMATION</Text>
              <View style={styles.settingsSectionCard}>
                <View style={styles.settingsRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Mail size={16} color="#f472b6" />
                    <Text style={styles.settingsRowLabel}>Email Address</Text>
                  </View>
                  <TextInput
                    value={settingsEmail}
                    onChangeText={setSettingsEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.settingsInput}
                  />
                </View>

                <View style={[styles.settingsRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Phone size={16} color="#34d399" />
                    <Text style={styles.settingsRowLabel}>Mobile Number</Text>
                  </View>
                  <TextInput
                    value={settingsPhone}
                    onChangeText={setSettingsPhone}
                    placeholder="+91 XXXXX XXXXX"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    style={styles.settingsInput}
                  />
                </View>
                <Text style={styles.settingsHintText}>
                  Tap a field to edit, then press <Text style={{ color: '#f472b6', fontWeight: '700' }}>Save Settings</Text>.
                </Text>
              </View>

              {/* SECTION 2: Creator Payout & Bank Account */}
              <Text style={styles.settingsSectionTitle}>CREATOR PAYOUT & BANK ACCOUNT</Text>
              <View style={styles.settingsSectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={styles.payoutIconCircle}>
                    <Building2 size={16} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsCardHead}>Bank & UPI Payout Details</Text>
                    <Text style={styles.settingsCardSub}>Where admins disburse your creator earnings</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.updatePayoutBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsSettingsModalOpen(false);
                    navigation.navigate('Wallet');
                  }}
                >
                  <Building2 size={14} color="#f472b6" style={{ marginRight: 6 }} />
                  <Text style={styles.updatePayoutBtnText}>Update Bank / UPI Details</Text>
                </TouchableOpacity>
              </View>

              {/* SECTION 3: Appearance & Theme */}
              <Text style={styles.settingsSectionTitle}>APPEARANCE & THEME</Text>
              <View style={styles.settingsSectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <LinearGradient
                      colors={['#7928ca', '#ff007a']}
                      style={styles.themeIconBox}
                    >
                      <Moon size={18} color="#ffffff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingsRowLabel}>Dark Mode (Default)</Text>
                      <Text style={styles.settingsRowSub}>Cinematic dark appearance for feed and reels</Text>
                    </View>
                  </View>
                  <View style={styles.themeActiveBadge}>
                    <Check size={10} color="#ff007a" strokeWidth={3} />
                    <Text style={styles.themeActiveBadgeText}>Active</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 4: Privacy & Safety */}
              <Text style={styles.settingsSectionTitle}>PRIVACY & SAFETY</Text>
              <View style={styles.settingsSectionCard}>
                <View style={styles.settingsSwitchRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingsRowLabel}>Private Account</Text>
                    <Text style={styles.settingsRowSub}>Only approved followers can view your feed</Text>
                  </View>
                  <Switch
                    value={isPrivateAccount}
                    onValueChange={setIsPrivateAccount}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#ff007a' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={[styles.settingsSwitchRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingsRowLabel}>Allow Direct Messages</Text>
                    <Text style={styles.settingsRowSub}>Receive inbox chats from followers</Text>
                  </View>
                  <Switch
                    value={allowDMs}
                    onValueChange={setAllowDMs}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#ff007a' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.settingsSwitchRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsSettingsModalOpen(false);
                    fetchBlockedUsers();
                    setIsBlockedModalOpen(true);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsRowLabel}>Blocked Accounts ({blockedList.length})</Text>
                    <Text style={styles.settingsRowSub}>Check and unblock restricted profiles</Text>
                  </View>
                  <View style={styles.badgeSmall}>
                    <Text style={styles.badgeSmallText}>Manage</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* SECTION 5: Video Playback Quality */}
              <Text style={styles.settingsSectionTitle}>VIDEO PLAYBACK & QUALITY</Text>
              <View style={styles.settingsSectionCard}>
                <View style={styles.settingsSwitchRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingsRowLabel}>Autoplay on Wi-Fi Only</Text>
                    <Text style={styles.settingsRowSub}>Save mobile data when scrolling feed</Text>
                  </View>
                  <Switch
                    value={autoplayWifi}
                    onValueChange={setAutoplayWifi}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#ff007a' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={[styles.settingsSwitchRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingsRowLabel}>Upload High Quality HD</Text>
                    <Text style={styles.settingsRowSub}>Always upload full quality 1080p reels</Text>
                  </View>
                  <Switch
                    value={uploadHighQuality}
                    onValueChange={setUploadHighQuality}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#ff007a' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* SECTION 6: Notifications */}
              <Text style={styles.settingsSectionTitle}>NOTIFICATIONS</Text>
              <View style={styles.settingsSectionCard}>
                <View style={styles.settingsSwitchRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingsRowLabel}>Likes & Comments Alerts</Text>
                    <Text style={styles.settingsRowSub}>Notify when someone interacts</Text>
                  </View>
                  <Switch
                    value={notifLikes}
                    onValueChange={setNotifLikes}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#ff007a' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={[styles.settingsSwitchRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingsRowLabel}>Earnings & Payout Alerts</Text>
                    <Text style={styles.settingsRowSub}>Instant push notification for cash disbursements</Text>
                  </View>
                  <Switch
                    value={notifEarnings}
                    onValueChange={setNotifEarnings}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#ff007a' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* SECTION 7: Storage & Danger Zone */}
              <Text style={styles.settingsSectionTitle}>STORAGE & DANGER ZONE</Text>
              <View style={styles.settingsSectionCard}>
                <TouchableOpacity
                  style={styles.storageActionRow}
                  onPress={() => {
                    showAppAlert('Cache Cleared', '48.5 MB of temporary data and cache freed successfully!');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Trash2 size={16} color="#cbd5e1" />
                    <Text style={styles.settingsRowLabel}>Clear App Cache</Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>48.5 MB</Text>
                </TouchableOpacity>

                {/* Delete Account Permanently */}
                <TouchableOpacity
                  style={[styles.storageActionRow, { borderTopWidth: 1, borderTopColor: 'rgba(244,63,94,0.15)', paddingTop: 12, marginTop: 4 }]}
                  onPress={handleDeleteAccount}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Trash2 size={16} color="#f43f5e" />
                    <View>
                      <Text style={[styles.settingsRowLabel, { color: '#f43f5e', fontWeight: '800' }]}>
                        Delete Account Permanently
                      </Text>
                      <Text style={{ color: '#fda4af', fontSize: 10 }}>
                        Erase all posts, videos, and account data
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* 3. PINNED BOTTOM FOOTER: Save Settings Button */}
            <View style={styles.modalStickyFooter}>
              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                onPress={handleSaveContactSettings}
                disabled={isSavingSettings}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ff007a', '#ff4b2b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSettingsGradient}
                >
                  {isSavingSettings ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveSettingsBtnText}>Save Settings</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 7: PAYOUT DETAILS                             */}
      {/* =================================================== */}
      <Modal
        visible={isPayoutModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPayoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.settingsHeaderIcon, { backgroundColor: '#f59e0b' }]}>
                  <Building2 size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Payout Settings</Text>
                  <Text style={{ color: '#fbbf24', fontSize: 10.5, fontWeight: '600' }}>
                    Bank & UPI Payout Details
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsPayoutModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Method Toggle: Bank vs UPI */}
              <View style={styles.payoutMethodTabs}>
                <TouchableOpacity
                  style={[
                    styles.payoutMethodTab,
                    payoutMethod === 'bank' && styles.payoutMethodTabActive,
                  ]}
                  onPress={() => setPayoutMethod('bank')}
                >
                  <Text
                    style={[
                      styles.payoutMethodTabText,
                      payoutMethod === 'bank' && styles.payoutMethodTabTextActive,
                    ]}
                  >
                    🏦 Bank Account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.payoutMethodTab,
                    payoutMethod === 'upi' && styles.payoutMethodTabActive,
                  ]}
                  onPress={() => setPayoutMethod('upi')}
                >
                  <Text
                    style={[
                      styles.payoutMethodTabText,
                      payoutMethod === 'upi' && styles.payoutMethodTabTextActive,
                    ]}
                  >
                    ⚡ UPI ID
                  </Text>
                </TouchableOpacity>
              </View>

              {payoutMethod === 'bank' ? (
                <View style={{ gap: 12, marginTop: 14 }}>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.inputLabel}>Bank Name</Text>
                    <TextInput
                      value={payoutBankName}
                      onChangeText={setPayoutBankName}
                      placeholder="e.g. State Bank of India, HDFC"
                      placeholderTextColor="#64748b"
                      style={styles.modalTextInput}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.inputLabel}>Account Number</Text>
                    <TextInput
                      value={payoutAccountNum}
                      onChangeText={setPayoutAccountNum}
                      placeholder="Enter Bank Account Number"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      secureTextEntry
                      style={styles.modalTextInput}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.inputLabel}>Confirm Account Number</Text>
                    <TextInput
                      value={payoutConfirmAccountNum}
                      onChangeText={setPayoutConfirmAccountNum}
                      placeholder="Re-enter Bank Account Number"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      style={styles.modalTextInput}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.inputLabel}>IFSC Code (11 Characters)</Text>
                    <TextInput
                      value={payoutIfsc}
                      onChangeText={t => setPayoutIfsc(t.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      style={styles.modalTextInput}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 14 }}>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.inputLabel}>UPI ID (VPA)</Text>
                    <TextInput
                      value={payoutUpiId}
                      onChangeText={setPayoutUpiId}
                      placeholder="yourname@oksbi or mobile@upi"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                      style={styles.modalTextInput}
                    />
                  </View>
                  <Text style={styles.settingsHintText}>
                    Ensure your UPI ID is linked to your active bank account. Payments will be sent directly here.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                onPress={handleSavePayoutDetails}
                disabled={isSavingPayout}
              >
                <LinearGradient
                  colors={['#f59e0b', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSettingsGradient}
                >
                  {isSavingPayout ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveSettingsBtnText}>Save Payout Details</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 8: FOLLOWERS & FOLLOWING LIST MODAL           */}
      {/* =================================================== */}
      <FollowListModal
        visible={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        targetUsername={currentUser?.username}
        initialTab={followModalTab}
        currentUsername={currentUser?.username}
        onRelationshipChanged={fetchFollowCounts}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  headerBrandText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerBrandTextPink: {
    color: '#ff007a',
  },
  topCenter: {
    alignItems: 'center',
    maxWidth: 160,
  },
  headerUserName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  headerUserHandle: {
    color: '#ff007a',
    fontSize: 10,
    fontWeight: '600',
  },
  settingsIconBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  profileHeaderCard: {
    alignItems: 'center',
  },
  avatarTouchWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarBorderRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: '#ff007a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b1236',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  influencerStarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#090514',
    borderWidth: 2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeFree: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  roleBadgeInfluencer: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  roleBadgeTextFree: {
    color: '#93c5fd',
  },
  roleBadgeTextInfluencer: {
    color: '#fcd34d',
  },
  profileHandle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  profileBio: {
    color: '#d1d5db',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,0,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 16,
    marginTop: 8,
  },
  companyBadgeLogo: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  companyBadgeText: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginTop: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  myProfileBannerCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 14,
  },
  myProfileBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  myProfileBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  myProfileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myProfileBannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  myProfileBannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    marginTop: 1,
  },
  myProfileBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myProfileViewText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  ctaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  editProfileBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  influencerPassBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  influencerPassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  starIconText: {
    fontSize: 12,
  },
  influencerPassText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#18122c',
    borderRadius: 16,
    padding: 4,
    marginTop: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: '#ff007a',
  },
  modeTabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  influencerTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  yellowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  viewerMenuListCard: {
    marginTop: 14,
    backgroundColor: '#18122c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: {
    color: '#e2e8f0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  destructiveLabel: {
    color: '#f43f5e',
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradientBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gradientBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  normalBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  normalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  influencerHubSection: {
    marginTop: 14,
    gap: 14,
  },
  statusCard: {
    backgroundColor: '#18122c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  statusCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ff007a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  statusSubtitle: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeFree: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusBadgeInfluencer: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#18122c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  quickActionsWrap: {
    backgroundColor: '#18122c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  sectionHeaderTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionBtn: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  submissionsWrap: {
    backgroundColor: '#18122c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  submissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  submissionsTitle: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptySubmissionsBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptySubmissionsText: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
  },
  submissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 8,
    marginBottom: 8,
    gap: 10,
  },
  submissionThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  submissionMeta: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  approvalText: {
    color: '#10b981',
    fontSize: 9.5,
    fontWeight: '700',
  },
  deleteSubmissionBtn: {
    padding: 8,
  },
  blockedSectionCard: {
    marginTop: 14,
    backgroundColor: '#18122c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(244,63,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedTitle: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  blockedSubtitle: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  manageBlockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  manageBlockedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#18122c',
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSaveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalSaveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    position: 'relative',
    marginBottom: 14,
  },
  planBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  planName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  planPrice: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  planDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },
  planSubscribeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  planSubscribeGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  planSubscribeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  helpContent: {
    gap: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
  },
  helpItemTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  helpItemText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  // Blocked modal specific styles matching image copy 41.png
  blockedModalCard: {
    backgroundColor: '#140c2a',
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    maxHeight: '85%',
  },
  blockedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  blockedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  blockedBanIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(244,63,94,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockedModalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  blockedCountPill: {
    backgroundColor: 'rgba(244,63,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
  },
  blockedCountText: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: '900',
  },
  blockedModalSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blockedInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(159,18,57,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.25)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  blockedInfoText: {
    color: '#fecdd3',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  emptyBlockedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  shieldGreenBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyBlockedTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptyBlockedSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 16,
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  blockedUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockedUserAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff007a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedUserAvatarInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  blockedUserName: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  blockedStatusLabel: {
    color: '#f43f5e',
    fontSize: 9.5,
    fontWeight: '700',
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  unblockBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  blockedDoneBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  blockedDoneBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  advertiseDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  contactAdsBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  contactAdsGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactAdsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  settingsHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ff007a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingsSectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsRowLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsInput: {
    color: '#f472b6',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 150,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244,114,182,0.3)',
  },
  settingsHintText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  payoutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCardHead: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsCardSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  updatePayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,114,182,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.25)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  updatePayoutBtnText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '800',
  },
  settingsActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  blockedSmallIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(244,63,94,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSmall: {
    backgroundColor: '#f43f5e',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSmallText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  storageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalStickyFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#120d20',
  },
  saveSettingsSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  saveSettingsGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSettingsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  themePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  themePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  themeCardsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  themeCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    position: 'relative',
  },
  themeCardActive: {
    borderColor: '#ff007a',
    backgroundColor: 'rgba(255,0,122,0.08)',
  },
  themeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  themeCardSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,0,122,0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  themeActiveBadgeText: {
    color: '#ff007a',
    fontSize: 9.5,
    fontWeight: '800',
  },
  settingsSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingsRowSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  langChipActive: {
    backgroundColor: 'rgba(192,132,252,0.18)',
    borderColor: '#c084fc',
  },
  langChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  langChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  payoutMethodTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
  },
  payoutMethodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  payoutMethodTabActive: {
    backgroundColor: '#271744',
  },
  payoutMethodTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  payoutMethodTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
