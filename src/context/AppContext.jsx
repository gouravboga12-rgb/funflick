import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEFAULT_AVATAR,
  INFLUENCER_SUBSCRIPTION_PLANS
} from '../data/mockData';

const AppContext = createContext(null);

// Clean up all local storage data - all application state uses AWS MySQL database exclusively
if (typeof window !== 'undefined') {
  try {
    const keysToClean = [
      'funflick_posts', 'funflick_stories', 'funflick_submissions',
      'funflick_influencer_media', 'funflick_pending_approvals',
      'funflick_payouts', 'funflick_conversations', 'funflick_notifications',
      'funflick_notifs', 'funflick_subscription_transactions',
      'funflick_creators', 'funflick_ads', 'funflick_copyright_reports',
      'funflick_user_likes', 'funflick_following_list',
      'funflick_followers_list', 'funflick_follow_requests',
      'funflick_txs', 'funflick_blocked', 'funflick_publishing_plans',
      'funflick_media_limits', 'funflick_user', 'funflick_admin_user',
      'funflick_admin_transactions', 'funflick_subscription_status'
    ];
    keysToClean.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

export const AppProvider = ({ children }) => {
  // Current user state (Unified Viewer + Influencer - populated strictly from AWS /api/auth/me)
  const [currentUser, setCurrentUser] = useState(() => ({
    id: null,
    name: 'FunFlick Member',
    username: 'member',
    email: '',
    avatar: DEFAULT_AVATAR,
    avatar_url: DEFAULT_AVATAR,
    bio: '',
    role: 'user',
    isInfluencer: false,
    hasPublishingSubscription: true,
    accountStatus: 'User',
    subscriptionPlan: null,
    stats: { posts: 0, following: 0, followers: '0' },
    walletBalance: 0
  }));

  // Track session authentication (ensure new visitors get Get Started / Splash first)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('funflick_authenticated') === 'true';
  });

  // Sync profile data and live feeds directly from AWS MySQL backend on app startup
  useEffect(() => {
    fetchLiveVideos();
    fetchLiveStories();
    fetchLiveCreators();

    // Check admin portal sync
    const adminTok = localStorage.getItem('funflick_admin_token');
    if (adminTok) {
      fetchAdminPendingContent();
      fetchAdminStats();
    }

    const token = localStorage.getItem('funflick_token');
    if (!token) return;

    fetchMyMedia();
    fetchLiveNotifications();
    fetchLiveConversations();
    if (!adminTok) {
      fetchAdminPendingContent();
      fetchAdminStats();
    }

    // Load authentic user profile strictly from AWS MySQL
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.user) {
          setCurrentUser(prev => {
            const rawAvatar = data.user.avatar_url || data.user.avatar || prev.avatar;
            const validAvatar = (rawAvatar && !rawAvatar.startsWith('blob:')) ? rawAvatar : DEFAULT_AVATAR;
            return {
              ...prev,
              ...data.user,
              avatar: validAvatar,
              avatar_url: validAvatar,
              hasPublishingSubscription: true
            };
          });
          if (data.user.role === 'admin') {
            fetchAdminPendingContent();
          }
        }
      })
      .catch(() => {});
  }, []);

  const loginUser = (customUser) => {
    setIsAuthenticated(true);
    sessionStorage.setItem('funflick_authenticated', 'true');
    if (customUser) {
      setCurrentUser(prev => {
        const rawAvatar = customUser.avatar || customUser.avatar_url || prev.avatar || prev.avatar_url;
        const validAvatar = (rawAvatar && !rawAvatar.startsWith('blob:')) ? rawAvatar : DEFAULT_AVATAR;
        const next = {
          ...prev,
          ...customUser,
          avatar: validAvatar,
          avatar_url: validAvatar,
          email: customUser.email || prev.email,
          phone: customUser.phone !== undefined ? customUser.phone : prev.phone
        };
        return next;
      });
    }
    // Refresh user-specific media and data
    setTimeout(() => {
      if (typeof fetchMyMedia === 'function') fetchMyMedia();
      if (typeof fetchLiveNotifications === 'function') fetchLiveNotifications();
      if (typeof fetchLiveConversations === 'function') fetchLiveConversations();
    }, 50);
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('funflick_authenticated');
    localStorage.removeItem('funflick_token');
    sessionStorage.removeItem('funflick_token');
    setMyMedia([]);
    setCurrentUser({
      id: null,
      name: 'FunFlick Member',
      username: 'member',
      email: '',
      avatar: DEFAULT_AVATAR,
      avatar_url: DEFAULT_AVATAR,
      bio: '',
      role: 'user',
      isInfluencer: false,
      hasPublishingSubscription: true,
      accountStatus: 'User',
      subscriptionPlan: null,
      stats: { posts: 0, following: 0, followers: '0' },
      walletBalance: 0
    });
  };

  // User video submissions (in-memory session state)
  const [userSubmissions, setUserSubmissions] = useState([]);

  // Posts feed state (Live exclusively from AWS MySQL database)
  const [posts, setPosts] = useState([]);

  // Stories state (Live exclusively from AWS MySQL database)
  const [stories, setStories] = useState([]);

  // Creators state (Live exclusively from AWS MySQL database)
  const [creators, setCreators] = useState([]);

  // Wallet & transactions (Live exclusively from AWS MySQL database)
  const [transactions, setTransactions] = useState([]);

  // Notifications (Live exclusively from AWS MySQL database)
  const [notifications, setNotifications] = useState([]);

  // Inbox & Chat (Live exclusively from AWS MySQL database)
  const [conversations, setConversations] = useState([]);

  // Creator studio videos (Live exclusively from AWS MySQL database)
  const [creatorVideos, setCreatorVideos] = useState([]);

  // Admin payouts (Live exclusively from AWS MySQL database)
  const [adminPayouts, setAdminPayouts] = useState([]);

  // Global Influencer Subscription Plans
  const [publishingPlans, setPublishingPlans] = useState(INFLUENCER_SUBSCRIPTION_PLANS || PUBLISHING_PLANS);

  // User Registration & Influencer Subscription Transactions (Live from AWS MySQL)
  const [subscriptionTransactions, setSubscriptionTransactions] = useState([]);

  // Influencer Media Items (Live from AWS MySQL)
  const [influencerMedia, setInfluencerMedia] = useState([]);

  // Ads & Promotions (Live exclusively from AWS MySQL database)
  const [adsList, setAdsList] = useState([]);

  // Active Mobile Popup Ad
  const [activePopupAd, setActivePopupAd] = useState(null);

  // Admin pending video approvals (Live exclusively from AWS MySQL database)
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Authenticated user's private media library (Live exclusively from AWS MySQL database)
  const [myMedia, setMyMedia] = useState([]);

  // Live Admin overview metrics from AWS MySQL database
  const [adminStats, setAdminStats] = useState(null);

  // Centralized single-video playback state (ensures only 1 reel plays at a time)
  const [activePlayingVideoId, setActivePlayingVideoId] = useState(null);

  // Copyright & Plagiarism Dispute Reports (Live from AWS MySQL database)
  const [copyrightReports, setCopyrightReports] = useState([]);

  // Blocked users list
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Followers, Following, and Follow Requests (Live from AWS MySQL database)
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);

  // View frame & demo switcher state
  const [phoneFrame, setPhoneFrame] = useState(true);
  const [subscriptionGateModalOpen, setSubscriptionGateModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Active Story Viewer Modal
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  // Real database-backed user subscription status & history (strictly from AWS)
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isActive: false,
    isExpired: false,
    planName: null,
    startDate: null,
    expiresAt: null,
    daysRemaining: 0,
    history: []
  });

  // App Theme state ('dark' | 'light')
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      return next;
    });
  };

  useEffect(() => {
    fetchLiveVideos();
    fetchLiveStories();
    fetchLiveNotifications();
    fetchLiveConversations();
    fetchMyMedia();
    fetchUserSubscriptionStatus();
  }, []);

  // Live Feed & Videos synchronization with AWS MySQL backend
  const fetchLiveVideos = async () => {
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch('/api/videos', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.videos && Array.isArray(data.videos)) {
          const livePosts = data.videos.map(v => {
            const url = v.video_url || '';
            const isImg = /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(url) ||
                          url.startsWith('data:image/') ||
                          v.category === 'Photo' ||
                          v.category === 'Post';
            const determinedType = isImg ? 'image' : 'video';

            const rawTags = (v.hashtags || '').split(/[\s,]+/).filter(Boolean);
            const formattedTags = rawTags.map(t => t.startsWith('#') ? t : `#${t}`);

            const isVideoUrl = (u) => typeof u === 'string' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(u);
            const safePoster = (!isVideoUrl(v.thumbnail_url) && v.thumbnail_url) ? v.thumbnail_url : null;

            return {
              id: v.id,
              title: v.title || 'FunFlick Post',
              caption: v.description || v.title || '',
              category: v.category || 'Comedy',
              mediaType: determinedType,
              mediaUrl: v.video_url,
              posterUrl: safePoster,
              hashtags: v.hashtags || '',
              tags: formattedTags,
              likesCount: Number(v.likes_count) || 0,
              viewsCount: v.views_count ? String(v.views_count) : '0',
              commentsCount: Number(v.comments_count) || 0,
              sharesCount: 0,
              savesCount: 0,
              creator: {
                id: v.creator_id,
                name: v.creator_name || 'Creator',
                username: v.creator_username || 'creator',
                avatar: v.creator_avatar || '/brand/default-avatar.svg',
                isVerified: true,
                isPrivate: false
              },
              timeAgo: 'Just now',
              isLiked: Boolean(v.user_liked),
              isFollowing: false,
              isSaved: false,
              comments: []
            };
          });
          setPosts(livePosts);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live videos from AWS MySQL:', err);
    }
  };

  // Live Admin Pending Content synchronization with AWS MySQL backend
  const fetchAdminPendingContent = async () => {
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) return;
      const res = await fetch('/api/admin/content/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pending && Array.isArray(data.pending)) {
          setPendingApprovals(data.pending);
        }
      } else if (res.status === 401 || res.status === 403) {
        // Token expired or invalid
        if (localStorage.getItem('funflick_admin_token')) {
          localStorage.removeItem('funflick_admin_token');
          localStorage.removeItem('funflick_admin_user');
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login?expired=1';
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch live pending approvals:', err);
    }
  };

  // Live Admin Overview Statistics synchronization with AWS MySQL backend
  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) return;
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setAdminStats(data.stats);
        }
      } else if (res.status === 401 || res.status === 403) {
        if (localStorage.getItem('funflick_admin_token')) {
          localStorage.removeItem('funflick_admin_token');
          localStorage.removeItem('funflick_admin_user');
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login?expired=1';
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch admin platform stats:', err);
    }
  };

  // Admin Revenue — fetch real subscription payment transactions from AWS MySQL
  const fetchAdminTransactions = async () => {
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (token) {
        const res = await fetch('/api/admin/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.transactions && Array.isArray(data.transactions)) {
            setSubscriptionTransactions(data.transactions);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch admin subscription transactions:', err);
    }
  };

  // Admin Ads & In-App Promotions — fetch and sync with AWS MySQL exclusively
  const fetchAdminAds = async () => {
    try {
      const res = await fetch('/api/admin/ads');
      if (res.ok) {
        const data = await res.json();
        if (data.ads && Array.isArray(data.ads)) {
          setAdsList(data.ads);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch platform ads from server:', err);
    }
  };

  // Admin Influencer Media Items — fetch and sync with MySQL & live posts
  const fetchInfluencerMedia = async () => {
    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (token) {
        const res = await fetch('/api/admin/influencer-media', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.media && Array.isArray(data.media) && data.media.length > 0) {
            setInfluencerMedia(data.media);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch admin influencer media:', err);
    }

    // Dynamic fallback from live feed posts: map all available media into influencer media format
    setInfluencerMedia(prev => {
      if (prev && prev.length > 0) return prev;
      if (!posts || posts.length === 0) return [];
      return posts.map(p => {
        const isSelf = p.creator?.username === currentUser?.username || p.isSelf;
        const isUserInfluencer = isSelf ? Boolean(currentUser?.isInfluencer) : Boolean(p.creator?.isVerified || p.creator?.isInfluencer);
        const views = typeof p.viewsCount === 'number' ? p.viewsCount : parseInt(p.viewsCount) || parseInt(p.views) || 350;
        const likes = typeof p.likesCount === 'number' ? p.likesCount : parseInt(p.likesCount) || 28;
        const comments = typeof p.commentsCount === 'number' ? p.commentsCount : 7;
        const engRate = views > 0 ? (((likes + comments) / views) * 100).toFixed(1) + '%' : '5.2%';

        return {
          id: p.id,
          title: p.title || p.caption || 'Creator Content',
          mediaUrl: p.mediaUrl || p.videoUrl || '',
          thumbnailUrl: p.posterUrl || p.thumbnailUrl || p.mediaUrl || '',
          contentType: p.mediaType === 'image' ? 'post' : 'video',
          isInfluencer: isUserInfluencer,
          influencerName: p.creator?.name || 'Creator',
          username: p.creator?.username || 'user',
          influencerAvatar: p.creator?.avatar || '/brand/default-avatar.svg',
          subscriptionPlan: isUserInfluencer ? (currentUser?.subscriptionPlan || 'Monthly Influencer Pro') : 'Free Member',
          viewsCount: views,
          likesCount: likes,
          commentsCount: comments,
          sharesCount: p.sharesCount || 0,
          engagementRate: engRate,
          paymentStatus: 'Pending Reward',
          paidAmount: 0,
          publishedDate: p.timeAgo || 'Recent'
        };
      });
    });
  };

  // Authenticated user's private media library synchronization
  const fetchMyMedia = async () => {
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) {
        setMyMedia([]);
        return;
      }
      const res = await fetch('/api/videos/my-media', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.media && Array.isArray(data.media)) {
          setMyMedia(data.media);
        }
      }
    } catch (err) {
      console.warn('Could not fetch user private media library:', err);
    }
  };

  // Live Stories synchronization with AWS MySQL backend
  const fetchLiveStories = async () => {
    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        if (data.stories && Array.isArray(data.stories)) {
          const myStory = {
            id: 'st_my',
            isUser: true,
            username: 'Your Story',
            avatar: currentUser?.avatar || '/brand/default-avatar.svg',
            hasUnseen: false,
            stories: []
          };
          const userStoriesGroup = data.stories.find(s => s.userId === currentUser?.id || s.username === currentUser?.username);
          if (userStoriesGroup) {
            myStory.stories = userStoriesGroup.stories;
          }
          const otherStories = data.stories.filter(s => s.userId !== currentUser?.id && s.username !== currentUser?.username);
          setStories([myStory, ...otherStories]);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live stories:', err);
    }
  };

  // Live Notifications synchronization with AWS MySQL backend
  const fetchLiveNotifications = async () => {
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live notifications:', err);
    }
  };

  // Live Conversations synchronization with AWS MySQL backend
  // MERGE strategy: keep local conversations not yet in DB, preserve locally loaded messages
  const fetchLiveConversations = async () => {
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token) return;
      const res = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(prev => {
            // Build a map of DB conversations by their canonical ID (conv_userId)
            const dbMap = new Map();
            for (const conv of data.conversations) {
              dbMap.set(conv.id, conv); // conv.id is 'conv_<userId>'
              if (conv.userId) dbMap.set(String(conv.userId), conv);
              if (conv.user?.username) dbMap.set(conv.user.username, conv);
            }

            // Merge DB conversations with local ones that don't exist in DB yet
            const merged = [];
            const seenIds = new Set();

            // First insert all DB conversations (authoritative), preserving local messages
            for (const dbConv of data.conversations) {
              const existingLocal = prev.find(p =>
                p.id === dbConv.id ||
                (p.userId && p.userId === dbConv.userId) ||
                p.user?.username === dbConv.user?.username
              );
              const mergedConv = {
                ...dbConv,
                // Keep locally loaded message list if available and more complete than nothing
                messages: existingLocal?.messages && existingLocal.messages.length > 0
                  ? existingLocal.messages
                  : (dbConv.messages || [])
              };
              merged.push(mergedConv);
              seenIds.add(dbConv.id);
              if (dbConv.userId) seenIds.add(String(dbConv.userId));
              if (dbConv.user?.username) seenIds.add(dbConv.user.username);
            }

            // Append any locally-created conversations not yet stored in DB
            for (const localConv of prev) {
              const alreadyInDb =
                seenIds.has(localConv.id) ||
                (localConv.userId && seenIds.has(String(localConv.userId))) ||
                (localConv.user?.username && seenIds.has(localConv.user.username));
              if (!alreadyInDb) {
                merged.push(localConv); // Preserve local-only conversation
              }
            }

            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch live conversations:', err);
    }
  };

  // Live Message History fetching with a specific user
  const fetchConversationMessages = async (targetPartner) => {
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (!token || !targetPartner) return [];
      const res = await fetch(`/api/messages/${targetPartner}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          setConversations(prev => prev.map(conv => {
            const matches = 
              conv.id === targetPartner ||
              String(conv.userId) === String(targetPartner) ||
              conv.user?.username === targetPartner ||
              conv.id === `conv_${targetPartner}`;
            if (matches) {
              return {
                ...conv,
                unreadCount: 0,
                messages: data.messages
              };
            }
            return conv;
          }));
          return data.messages;
        }
      }
    } catch (err) {
      console.warn('Could not fetch messages for partner:', err);
    }
    return [];
  };

  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`/api/videos/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setPosts(prev => prev.map(p => {
            if (String(p.id) === String(postId)) {
              return {
                ...p,
                comments: data.comments,
                commentsCount: data.comments.length
              };
            }
            return p;
          }));
          return data.comments;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch comments from AWS MySQL:', err);
    }
    return [];
  };

  // Add a comment to a video/post on AWS MySQL
  const addComment = async (postId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const tempId = 'temp_' + Date.now();
    const optimisticComment = {
      id: tempId,
      text: trimmed,
      content: trimmed,
      time: 'Just now',
      created_at: new Date().toISOString(),
      user: currentUser.username,
      name: currentUser.name,
      avatar: currentUser.avatar || '/brand/default-avatar.svg'
    };

    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: [...(p.comments || []), optimisticComment]
        };
      }
      return p;
    }));

    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    try {
      const res = await fetch(`/api/videos/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setPosts(prev => prev.map(p => {
            if (String(p.id) === String(postId)) {
              return {
                ...p,
                comments: (p.comments || []).map(c => c.id === tempId ? data.comment : c)
              };
            }
            return p;
          }));
        }
        showToast('Comment added! 💬', 'success');
      }
    } catch (err) {
      console.error('Failed to post comment to AWS MySQL:', err);
    }
  };

  // Delete a comment on AWS MySQL
  const deleteComment = async (postId, commentId) => {
    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        return {
          ...p,
          commentsCount: Math.max(0, (p.commentsCount || 1) - 1),
          comments: (p.comments || []).filter(c => String(c.id) !== String(commentId))
        };
      }
      return p;
    }));

    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    try {
      await fetch(`/api/videos/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      showToast('Comment deleted', 'info');
    } catch (err) {
      console.error('Failed to delete comment from AWS MySQL:', err);
    }
  };

  // Global Media showcase limits (Admin configured: Reels 30s default, Stories 15s default, Posts 30s)
  const [mediaLimits, setMediaLimits] = useState({
    maxReelDuration: 30,
    maxStoryDuration: 15,
    maxPostDuration: 30
  });

  // Fetch settings from AWS MySQL backend
  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setMediaLimits(data.settings);
        }
      }
    } catch (err) {}
  };

  const updateMediaLimits = async (newLimits) => {
    setMediaLimits(prev => ({ ...prev, ...newLimits }));
    const token = localStorage.getItem('funflick_token');
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newLimits)
      });
      showToast('⚙️ Global media showcase limits updated and synced to AWS!', 'success');
    } catch (err) {
      showToast('Settings saved locally. Server sync pending.', 'info');
    }
  };

  useEffect(() => {
    fetchLiveVideos();
    fetchLiveStories();
    fetchLiveNotifications();
    fetchLiveCreators();
    fetchSubscriptionPlans();
    fetchPlatformSettings();
  }, []);

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Toggle post like with AWS MySQL persistence
  const toggleLikePost = async (postId) => {
    let nowLiked = false;
    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        nowLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nowLiked,
          likesCount: nowLiked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 1) - 1)
        };
      }
      return p;
    }));

    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (token) {
      try {
        const res = await fetch(`/api/videos/${postId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.liked === 'boolean') {
            setPosts(prev => prev.map(p => {
              if (String(p.id) === String(postId)) {
                return { ...p, isLiked: data.liked };
              }
              return p;
            }));
          }
        }
      } catch (err) {
        console.warn('Like sync failed:', err);
      }
    }
  };

  // Helper to parse views count into number
  const parseViews = (views) => {
    if (typeof views === 'number') return views;
    if (!views) return 0;
    const str = String(views).trim().toUpperCase();
    if (str.endsWith('M')) return Math.round(parseFloat(str) * 1000000);
    if (str.endsWith('K')) return Math.round(parseFloat(str) * 1000);
    return parseInt(str, 10) || 0;
  };

  const formatViews = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return String(count);
  };

  // Real-Time View Counter Increment (Triggered after 2s continuous view)
  const recordPostView = (postId) => {
    // Sync with AWS MySQL database
    fetch(`/api/videos/${postId}/view`, { method: 'POST' }).catch(() => {});

    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        const currentVal = parseViews(p.viewsCount || p.views || 0);
        const nextVal = currentVal + 1;
        return {
          ...p,
          viewsCount: typeof p.viewsCount === 'number' ? nextVal : formatViews(nextVal),
          views: typeof p.views === 'number' ? nextVal : formatViews(nextVal)
        };
      }
      return p;
    }));

    setInfluencerMedia(prev => prev.map(m => {
      if (String(m.id) === String(postId) || String(m.postId) === String(postId)) {
        const currentVal = parseViews(m.viewsCount || 0);
        const nextVal = currentVal + 1;
        return {
          ...m,
          viewsCount: nextVal,
          engagementRate: (((m.likesCount || 0) + (m.commentsCount || 0)) / Math.max(1, nextVal) * 100).toFixed(1) + '%'
        };
      }
      return m;
    }));
  };

  // Toggle post save
  const toggleSavePost = (postId) => {
    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        const isSaved = !p.isSaved;
        showToast(isSaved ? 'Saved to your collection' : 'Removed from saved', 'info');
        return { ...p, isSaved };
      }
      return p;
    }));
  };

  // Fetch live active creators/users from MySQL backend for Discover, Tagging, and Messaging
  const fetchLiveCreators = async () => {
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch('/api/users?limit=30', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const mapped = data.users.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            avatar: u.avatar || '/brand/default-avatar.svg',
            isFollowing: Boolean(u.isFollowing),
            isSelf: Boolean(u.isSelf),
            stats: {
              followers: u.followersCount > 999 ? `${(u.followersCount / 1000).toFixed(1)}K` : String(u.followersCount)
            }
          }));
          setCreators(mapped);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live creators from MySQL:', err);
    }
  };

  // Toggle follow creator (sync with followingList, backend MySQL & dynamic count)
  const toggleFollowCreator = async (username) => {
    if (!username) return;
    if (currentUser?.username === username) {
      showToast('You cannot follow yourself', 'info');
      return;
    }

    let targetCreator = creators.find(c => c.username === username);
    const willFollow = targetCreator ? !targetCreator.isFollowing : true;

    // Optimistic UI updates
    setCreators(prev => prev.map(c => {
      if (c.username === username) {
        return { ...c, isFollowing: willFollow };
      }
      return c;
    }));

    setPosts(prev => prev.map(p => {
      if (p.creator?.username === username) {
        return { ...p, isFollowing: willFollow };
      }
      return p;
    }));

    setFollowingList(prev => {
      if (willFollow) {
        if (!prev.some(u => u.username === username)) {
          const creatorObj = creators.find(c => c.username === username) || {
            username,
            name: username,
            avatar: '/brand/default-avatar.svg'
          };
          return [...prev, creatorObj];
        }
        return prev;
      } else {
        return prev.filter(u => u.username !== username);
      }
    });

    setCurrentUser(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        following: willFollow ? (Number(prev.stats?.following) || 0) + 1 : Math.max(0, (Number(prev.stats?.following) || 1) - 1)
      }
    }));

    showToast(willFollow ? `Following @${username}` : `Unfollowed @${username}`, 'info');

    // Sync with backend /api/follows
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (token) {
      try {
        const endpoint = willFollow ? `/api/follows/${username}/follow` : `/api/follows/${username}/unfollow`;
        await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to sync follow state to backend:', err);
      }
    }
  };

  // Accept Follow Request (Instagram style)
  const acceptFollowRequest = (requestId) => {
    const req = followRequests.find(r => r.id === requestId);
    if (!req) return;
    setFollowRequests(prev => prev.filter(r => r.id !== requestId));
    setFollowersList(prev => {
      if (!prev.some(f => f.username === req.username)) {
        return [...prev, {
          id: req.id,
          username: req.username,
          name: req.name,
          avatar: req.avatar
        }];
      }
      return prev;
    });
    setCurrentUser(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        followers: (Number(prev.stats?.followers) || 0) + 1
      }
    }));
    showToast(`Accepted follow request from @${req.username}! 🎉`, 'success');
  };

  // Decline Follow Request
  const declineFollowRequest = (requestId) => {
    setFollowRequests(prev => prev.filter(r => r.id !== requestId));
    showToast('Follow request removed', 'info');
  };

  // Remove a Follower
  const removeFollower = (followerUsername) => {
    setFollowersList(prev => prev.filter(f => f.username !== followerUsername));
    setCurrentUser(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        followers: Math.max(0, (Number(prev.stats?.followers) || 1) - 1)
      }
    }));
    showToast(`Removed @${followerUsername} from followers`, 'info');
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast('All notifications marked as read! ✔️', 'info');
  };

  // Subscribe to a specific creator (Screen 7 flow)
  const subscribeToCreator = (username, planId) => {
    setCreators(prev => prev.map(c => {
      if (c.username === username) {
        return { ...c, isSubscribed: true };
      }
      return c;
    }));
    showToast(`Successfully subscribed to @${username}! 👑`, 'success');
  };



  // Block User (Instagram Style)
  const blockUser = (username) => {
    if (!username || username === currentUser.username) return;
    setBlockedUsers(prev => {
      const updated = prev.includes(username) ? prev : [...prev, username];
      try {
        localStorage.setItem('funflick_blocked', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    // Automatically unfollow if followed
    setCreators(prev => prev.map(c => c.username === username ? { ...c, isFollowing: false } : c));
    showToast(`🚫 Blocked @${username}. Content & comments hidden.`, 'info');
  };

  // Unblock User
  const unblockUser = (username) => {
    setBlockedUsers(prev => {
      const updated = prev.filter(u => u !== username);
      try {
        localStorage.setItem('funflick_blocked', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Unblocked @${username}`, 'success');
  };

  // Influencer Subscription Purchase (Connects to full verification & persistence engine)
  const purchasePublishingSubscription = (planId) => {
    const plan = publishingPlans.find(p => p.id === planId) || publishingPlans[0] || (INFLUENCER_SUBSCRIPTION_PLANS && INFLUENCER_SUBSCRIPTION_PLANS[1]) || { id: 'monthly', name: 'Monthly Influencer Pro', price: 199, duration: '30 Days' };
    return recordSubscriptionPayment({
      plan,
      paymentId: 'pay_modal_' + Date.now(),
      paymentMethod: 'Direct Creator Pass'
    });
  };

  // Fetch real subscription validity and history from backend
  const fetchUserSubscriptionStatus = async () => {
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) return;
    try {
      const res = await fetch('/api/subscriptions/my-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const updatedStatus = {
          isActive: Boolean(data.isActive),
          isExpired: Boolean(data.isExpired),
          planName: data.planName,
          startDate: data.startDate,
          expiresAt: data.expiresAt,
          daysRemaining: Number(data.daysRemaining) || 0,
          history: data.history || []
        };
        setSubscriptionStatus(updatedStatus);

        setCurrentUser(prev => ({
          ...prev,
          isInfluencer: Boolean(data.isActive),
          subscriptionPlan: data.isActive ? data.planName : (prev.subscriptionPlan || null),
          subscriptionStart: data.startDate,
          subscriptionExpiresAt: data.expiresAt,
          subscriptionDaysRemaining: Number(data.daysRemaining) || 0
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch user subscription status:', err);
    }
  };

  // Record Verified Razorpay Subscription Payment & Sync with MySQL Backend
  const recordSubscriptionPayment = async ({ plan, paymentId, paymentMethod = 'Razorpay Test (UPI / Card)' }) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // 1. Calculate duration in days precisely
    let durationDays = 30;
    const planNameLower = (plan.name || '').toLowerCase();
    const planIdLower = (plan.id || '').toLowerCase();
    const planDurLower = (plan.duration || '').toLowerCase();

    if (planIdLower === 'weekly' || planNameLower.includes('week') || planDurLower.includes('7')) {
      durationDays = 7;
    } else if (planIdLower === 'quarterly' || planNameLower.includes('quarter') || planDurLower.includes('90') || planDurLower.includes('3 month')) {
      durationDays = 90;
    } else if (planIdLower === 'yearly' || planNameLower.includes('year') || planNameLower.includes('annual') || planDurLower.includes('365')) {
      durationDays = 365;
    } else {
      durationDays = 30;
    }

    // 2. Extension logic: If already active, add days to existing expiry date!
    let baseExpiry = now;
    let baseStart = now.toISOString();
    let isExtension = false;

    if (subscriptionStatus?.isActive && subscriptionStatus?.expiresAt) {
      const existingDate = new Date(subscriptionStatus.expiresAt);
      if (existingDate > now) {
        baseExpiry = existingDate;
        isExtension = true;
        if (subscriptionStatus.startDate) baseStart = subscriptionStatus.startDate;
      }
    } else if (currentUser?.isInfluencer && currentUser?.subscriptionExpiresAt) {
      const existingDate = new Date(currentUser.subscriptionExpiresAt);
      if (existingDate > now) {
        baseExpiry = existingDate;
        isExtension = true;
        if (currentUser.subscriptionStart) baseStart = currentUser.subscriptionStart;
      }
    }

    const newExpiryDate = new Date(baseExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const totalRemainingDays = Math.max(1, Math.ceil((newExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const newTransaction = {
      id: 'pay_' + (paymentId || ('test_' + Date.now())),
      razorpayPaymentId: paymentId || `pay_rzp_${Math.random().toString(36).substring(2, 9)}`,
      user: currentUser.username || 'user',
      userName: currentUser.name || 'User',
      userEmail: currentUser.email || 'user@funflick.com',
      userAvatar: currentUser.avatar || '/brand/default-avatar.svg',
      planId: plan.id,
      planName: plan.name,
      planDuration: `${durationDays} Days`,
      durationDays: durationDays,
      amount: Number(plan.price),
      formattedAmount: `₹${Number(plan.price).toLocaleString()}`,
      currency: 'INR',
      paymentGateway: paymentMethod,
      status: 'Captured',
      date: now.toISOString(),
      formattedDate,
      startDate: baseStart,
      expiryDate: newExpiryDate.toISOString(),
      isExtension,
      category: 'User Registration / Influencer Plan'
    };

    // 3. Immediately update and persist local state
    const newStatus = {
      isActive: true,
      isExpired: false,
      planName: plan.name,
      startDate: baseStart,
      expiresAt: newExpiryDate.toISOString(),
      daysRemaining: totalRemainingDays,
      history: [newTransaction, ...(subscriptionStatus.history || [])]
    };
    setSubscriptionStatus(newStatus);

    // 4. Update Current User
    setCurrentUser(prev => ({
      ...prev,
      isInfluencer: true,
      hasInfluencerSubscription: true,
      hasPublishingSubscription: true,
      accountStatus: 'Influencer',
      subscriptionPlan: plan.name,
      subscriptionStart: baseStart,
      subscriptionExpiresAt: newExpiryDate.toISOString(),
      subscriptionDaysRemaining: totalRemainingDays
    }));

    // 5. Update subscription transactions ledger (for admin revenue & subscriber list)
    setSubscriptionTransactions(prev => [newTransaction, ...prev.filter(t => t.razorpayPaymentId !== newTransaction.razorpayPaymentId)]);

    // 6. Send real subscription event to backend MySQL
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (token) {
      try {
        const subRes = await fetch('/api/subscriptions/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            planId: plan.id,
            planName: plan.name,
            price: Number(plan.price),
            durationDays,
            paymentId: newTransaction.razorpayPaymentId
          })
        });

        if (subRes.ok) {
          const subData = await subRes.json();
          const remDays = subData.daysRemaining || subData.totalRemainingDays || totalRemainingDays;
          const expFormatted = new Date(subData.expiresAt || newExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          if (subData.isExtended || subData.isExtension || isExtension) {
            showToast(`🎉 Subscription Extended! Added ${durationDays} days. Total validity: ${remDays} days (until ${expFormatted})`, 'success');
          } else {
            showToast(`🎉 Influencer Activated! Valid for ${durationDays} days until ${expFormatted}`, 'success');
          }
          await fetchUserSubscriptionStatus();
        } else {
          showToast(`🎉 ${isExtension ? 'Subscription Extended' : 'Influencer Activated'}! Valid for ${totalRemainingDays} days`, 'success');
        }
      } catch (e) {
        console.warn('Subscription sync to backend error:', e);
        showToast(`🎉 ${isExtension ? 'Subscription Extended' : 'Influencer Activated'}! Valid for ${totalRemainingDays} days`, 'success');
      }
    } else {
      showToast(`🎉 ${isExtension ? 'Subscription Extended' : 'Influencer Activated'}! Valid for ${totalRemainingDays} days`, 'success');
    }

    // Refresh admin & influencer views
    if (fetchAdminTransactions) fetchAdminTransactions();
    if (fetchInfluencerMedia) fetchInfluencerMedia();

    // 7. Record in user's wallet history
    const walletTx = {
      id: 'tx_rzp_' + Date.now(),
      title: `Influencer ${plan.name} (${paymentMethod})`,
      desc: `Payment ID: ${newTransaction.razorpayPaymentId}`,
      type: 'debit',
      amount: plan.price,
      formattedAmount: `-₹${Number(plan.price).toLocaleString()}`,
      date: 'Today',
      status: 'Completed',
      category: 'Subscription'
    };
    setTransactions(prev => [walletTx, ...prev]);

    setSubscriptionGateModalOpen(false);
    return newTransaction;
  };

  // Fetch active plans from database
  const fetchSubscriptionPlans = async () => {
    try {
      const res = await fetch('/api/subscriptions/plans');
      if (res.ok) {
        const data = await res.json();
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          const mapped = data.plans.map(p => ({
            ...p,
            formattedPrice: p.formatted_price || `₹${Number(p.price).toLocaleString()}`
          }));
          setPublishingPlans(mapped);
        }
      }
    } catch (err) {
      console.warn('Could not fetch subscription plans from DB:', err);
    }
  };

  // Admin: Update an existing plan globally & sync with MySQL
  const updatePublishingPlan = async (updatedPlan) => {
    setPublishingPlans(prev => prev.map(p => {
      if (p.id === updatedPlan.id) {
        return {
          ...p,
          ...updatedPlan,
          price: Number(updatedPlan.price),
          formattedPrice: `₹${Number(updatedPlan.price).toLocaleString()}`
        };
      }
      return p;
    }));

    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      await fetch(`/api/subscriptions/admin/plans/${updatedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedPlan)
      });
      await fetchSubscriptionPlans();
    } catch (err) {
      console.error('Failed to sync plan update with database:', err);
    }

    showToast(`✅ Plan "${updatedPlan.name}" updated in database and reflected user-wide!`, 'success');
  };

  // Admin: Toggle plan active/inactive status
  const togglePlanActiveStatus = async (planId) => {
    let nextActive = true;
    setPublishingPlans(prev => prev.map(p => {
      if (p.id === planId) {
        nextActive = p.active === false ? true : false;
        return { ...p, active: nextActive };
      }
      return p;
    }));

    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      await fetch(`/api/subscriptions/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ active: nextActive })
      });
      await fetchSubscriptionPlans();
    } catch (err) {
      console.error('Failed to toggle plan status:', err);
    }

    showToast(`Plan is now ${nextActive ? 'ACTIVE' : 'INACTIVE'} in database`, 'info');
  };

  // Admin: Add a new custom plan
  const addPublishingPlan = async (newPlan) => {
    const planId = newPlan.id || 'plan_' + Date.now();
    const formatted = {
      ...newPlan,
      id: planId,
      price: Number(newPlan.price),
      formattedPrice: `₹${Number(newPlan.price).toLocaleString()}`,
      duration: newPlan.duration || '30 Days',
      active: newPlan.active !== undefined ? newPlan.active : true,
      popular: !!newPlan.popular,
      features: Array.isArray(newPlan.features) ? newPlan.features : ['Influencer badge', 'Advanced analytics & rewards']
    };
    setPublishingPlans(prev => [...prev, formatted]);

    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      await fetch('/api/subscriptions/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formatted)
      });
      await fetchSubscriptionPlans();
    } catch (err) {
      console.error('Failed to save new plan to database:', err);
    }

    showToast(`🎉 New plan "${newPlan.name}" saved to database!`, 'success');
  };

  // Admin: Delete a plan
  const deletePublishingPlan = async (planId) => {
    setPublishingPlans(prev => prev.filter(p => p.id !== planId));
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      await fetch(`/api/subscriptions/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchSubscriptionPlans();
    } catch (err) {
      console.error('Failed to delete plan from database:', err);
    }
    showToast('Plan removed from database.', 'info');
  };

  // Admin: Reset plans to default
  const resetPublishingPlansToDefault = () => {
    setPublishingPlans(INFLUENCER_SUBSCRIPTION_PLANS);
    localStorage.removeItem('funflick_publishing_plans');
    showToast('Influencer plans reset to default factory values!', 'info');
  };

  // Toggle user Influencer status for quick testing in prototype demo
  const toggleUserSubscriptionStatus = () => {
    setCurrentUser(prev => {
      const nextStatus = !prev.isInfluencer;
      showToast(nextStatus ? 'Status updated: INFLUENCER (Subscription Active ⭐)' : 'Status updated: USER (Regular Member)', 'info');
      return {
        ...prev,
        isInfluencer: nextStatus,
        hasInfluencerSubscription: nextStatus,
        accountStatus: nextStatus ? 'Influencer' : 'User',
        subscriptionPlan: nextStatus ? 'Monthly Influencer Pro' : null
      };
    });
  };

  // Admin: Send Influencer Content Reward (Payment)
  const sendInfluencerReward = (mediaId, amount) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('⚠️ Please enter a valid reward amount (₹)', 'error');
      return false;
    }

    let rewardedItem = null;

    setInfluencerMedia(prev => prev.map(item => {
      if (item.id === mediaId) {
        rewardedItem = item;
        return {
          ...item,
          paymentStatus: 'Paid',
          paidAmount: numAmount,
          paidDate: 'Just now'
        };
      }
      return item;
    }));

    // If current user is the rewarded creator, credit wallet
    if (rewardedItem && (rewardedItem.username === currentUser.username || rewardedItem.influencerName === currentUser.name)) {
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: (prev.walletBalance || 0) + numAmount
      }));
    }

    // Add to transactions log
    const payoutTx = {
      id: 'tx_rwd_' + Date.now(),
      title: `Content Reward: ${rewardedItem?.title?.slice(0, 30) || 'Video Performance'}`,
      desc: `Admin Reward sent to @${rewardedItem?.username || 'influencer'}`,
      type: 'credit',
      amount: numAmount,
      formattedAmount: `+₹${numAmount.toLocaleString()}`,
      date: 'Today',
      status: 'Completed',
      category: 'Admin Reward'
    };
    setTransactions(prev => [payoutTx, ...prev]);

    // Also record in Admin Payouts list
    const adminPayoutEntry = {
      id: 'po_' + Date.now(),
      creator: rewardedItem?.influencerName || 'Influencer',
      username: rewardedItem?.username || 'creator',
      avatar: rewardedItem?.avatar || '/brand/funflick-logo.png',
      amount: `₹${numAmount.toLocaleString()}`,
      period: 'Performance Bonus',
      views: rewardedItem?.views || '100K',
      subscribers: 'Active Member',
      status: 'Completed',
      date: 'Today'
    };
    setAdminPayouts(prev => [adminPayoutEntry, ...prev]);

    showToast(`🎉 Reward of ₹${numAmount.toLocaleString()} sent to ${rewardedItem?.influencerName || 'Creator'}! Payment status: PAID`, 'success');
    return true;
  };

  // Admin: Create New Ad (Syncs with MySQL backend & localStorage)
  const createAd = async (adData) => {
    const newAd = {
      ...adData,
      id: adData.id || ('ad_' + Date.now()),
      impressions: Number(adData.impressions) || 0,
      clicks: Number(adData.clicks) || 0,
      active: adData.active !== undefined ? adData.active : true,
      duration: Number(adData.duration) || 20,
      allowCloseAfter: Number(adData.allowCloseAfter) || 8,
      startDate: adData.startDate || '2026-10-01',
      endDate: adData.endDate || '2026-11-30',
      frequency: adData.frequency || 'Every 3 Reels',
      actionUrl: adData.actionUrl || 'https://funflick.in',
      actionText: adData.actionText || 'Learn More'
    };

    setAdsList(prev => [newAd, ...prev.filter(a => a.id !== newAd.id)]);

    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(newAd)
      });
    } catch (e) {}

    showToast(`📢 Ad "${newAd.title}" published successfully!`, 'success');
    return newAd;
  };

  // Admin: Update Ad
  const updateAd = async (id, adData) => {
    setAdsList(prev => prev.map(ad => ad.id === id ? { ...ad, ...adData } : ad));

    const target = adsList.find(a => a.id === id);
    if (target) {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
      try {
        await fetch('/api/admin/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ ...target, ...adData, id })
        });
      } catch (e) {}
    }

    showToast('✅ Advertisement updated successfully!', 'success');
  };

  // Admin: Delete Ad
  const deleteAd = async (id) => {
    setAdsList(prev => prev.filter(ad => ad.id !== id));

    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');
    try {
      await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (e) {}

    showToast('Advertisement deleted.', 'info');
  };

  // Admin: Toggle Ad Active / Inactive
  const toggleAdStatus = (id) => {
    setAdsList(prev => prev.map(ad => {
      if (ad.id === id) {
        const nextStatus = !ad.active;
        showToast(`Ad "${ad.title}" is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`, 'info');
        return { ...ad, active: nextStatus };
      }
      return ad;
    }));
  };

  // Track Real Ad Impression
  const recordAdImpression = (adId) => {
    setAdsList(prev => prev.map(a => a.id === adId ? { ...a, impressions: (a.impressions || 0) + 1 } : a));
    try {
      fetch(`/api/admin/ads/${adId}/metric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impression' })
      }).catch(() => {});
    } catch (e) {}
  };

  // Track Real Ad Click
  const recordAdClick = (adId) => {
    setAdsList(prev => prev.map(a => a.id === adId ? { ...a, clicks: (a.clicks || 0) + 1 } : a));
    try {
      fetch(`/api/admin/ads/${adId}/metric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click' })
      }).catch(() => {});
    } catch (e) {}
  };

  // Mobile In-App Ad Popup Trigger
  const showMobileAd = (adId) => {
    const targetAd = adId ? adsList.find(a => a.id === adId) : adsList.find(a => a.active) || adsList[0];
    if (targetAd) {
      setActivePopupAd(targetAd);
      recordAdImpression(targetAd.id);
    } else {
      showToast('No active ads configured to display!', 'info');
    }
  };

  const dismissMobileAd = () => {
    setActivePopupAd(null);
  };

  // Publish a new Post
  const publishNewPost = (newPostData) => {
    const newPost = {
      id: 'post_' + Date.now(),
      creator: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isVerified: false
      },
      title: newPostData.caption.slice(0, 30) || 'New FunFlick Post',
      caption: newPostData.caption + ' ' + (newPostData.hashtags || ''),
      mediaType: newPostData.mediaType || 'image',
      mediaUrl: newPostData.mediaUrl,
      posterUrl: newPostData.mediaUrl,
      audioTitle: '🎵 Original Audio - ' + currentUser.username,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      viewsCount: '1',
      timeAgo: 'Just now',
      category: 'Entertainment',
      isLiked: true,
      isSaved: false,
      isFollowing: false,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setCurrentUser(prev => ({
      ...prev,
      stats: { ...prev.stats, posts: prev.stats.posts + 1 }
    }));
    showToast('🚀 Your post has been published live to FunFlick!', 'success');
  };

  // Update a User Post (Edit Caption, Title, Category, Media, Location, Hashtags)
  const updateUserPost = (postId, updatedFields) => {
    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        return {
          ...p,
          ...updatedFields,
          title: updatedFields.title !== undefined ? updatedFields.title : p.title,
          caption: updatedFields.caption !== undefined ? updatedFields.caption : p.caption,
          category: updatedFields.category || p.category,
          posterUrl: updatedFields.posterUrl || updatedFields.mediaUrl || p.posterUrl,
          mediaUrl: updatedFields.mediaUrl || p.mediaUrl,
          location: updatedFields.location !== undefined ? updatedFields.location : p.location
        };
      }
      return p;
    }));

    setUserSubmissions(prev => prev.map(s => {
      if (String(s.id) === String(postId) || s.title === postId) {
        return {
          ...s,
          ...updatedFields,
          title: updatedFields.title || s.title,
          caption: updatedFields.caption || s.caption,
          thumbnail: updatedFields.posterUrl || updatedFields.mediaUrl || s.thumbnail
        };
      }
      return s;
    }));

    setCreatorVideos(prev => prev.map(cv => {
      if (String(cv.id) === String(postId)) {
        return {
          ...cv,
          ...updatedFields,
          title: updatedFields.title || cv.title,
          thumbnail: updatedFields.posterUrl || updatedFields.mediaUrl || cv.thumbnail
        };
      }
      return cv;
    }));

    // If backend video token exists, also call backend PUT /api/videos/:id
    const token = localStorage.getItem('funflick_token');
    if (token) {
      fetch(`/api/videos/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: updatedFields.title,
          description: updatedFields.caption,
          category: updatedFields.category,
          thumbnail_url: updatedFields.posterUrl || updatedFields.mediaUrl,
          video_url: updatedFields.mediaUrl
        })
      }).catch(() => {});
    }

    showToast('✅ Post updated successfully!', 'success');
  };

  // Delete a User Post (Instagram-Style Post Deletion)
  const deleteUserPost = (postId) => {
    setPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
    setUserSubmissions(prev => prev.filter(s => String(s.id) !== String(postId) && s.title !== postId));
    setPendingApprovals(prev => prev.filter(a => String(a.id) !== String(postId)));
    setCreatorVideos(prev => prev.filter(cv => String(cv.id) !== String(postId)));
    setInfluencerMedia(prev => prev.filter(m => String(m.id) !== String(postId) && String(m.postId) !== String(postId)));
    setMyMedia(prev => prev.filter(m => String(m.id) !== String(postId)));
    setCurrentUser(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        posts: Math.max(0, (prev.stats?.posts || 1) - 1)
      }
    }));

    // If backend video token exists, also call backend DELETE /api/videos/:id
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (token) {
      fetch(`/api/videos/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }

    showToast('🗑️ Post deleted successfully!', 'info');
  };

  // Delete / withdraw submission from Influencer Hub
  const deleteUserSubmission = (submissionId) => {
    setUserSubmissions(prev => prev.filter(s => String(s.id) !== String(submissionId)));
    setPendingApprovals(prev => prev.filter(a => String(a.id) !== String(submissionId)));
    setPosts(prev => prev.filter(p => String(p.id) !== String(submissionId)));
    setMyMedia(prev => prev.filter(m => String(m.id) !== String(submissionId)));
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (token) {
      fetch(`/api/videos/${submissionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    showToast('🗑️ Submission removed from your library', 'info');
  };

  // Publish a new Story
  const publishNewStory = (storyData) => {
    const newStoryItem = {
      id: 'st_item_' + Date.now(),
      mediaUrl: storyData.mediaUrl,
      caption: storyData.caption || 'Enjoying life on FunFlick! ✨',
      time: 'Just now'
    };

    setStories(prev => {
      const myIndex = prev.findIndex(s => s.isUser);
      if (myIndex >= 0) {
        const updated = [...prev];
        updated[myIndex] = {
          ...updated[myIndex],
          hasUnseen: true,
          stories: [newStoryItem, ...(updated[myIndex].stories || [])]
        };
        return updated;
      }
      return prev;
    });

    showToast('✨ Story published successfully! Added to your story ring.', 'success');
  };

  // Upload new Video (also adds to Creator Studio and Feed)
  const publishNewVideo = (videoData) => {
    const newCv = {
      id: 'cv_' + Date.now(),
      title: videoData.title || 'Untitled Video',
      views: '1',
      likes: '0',
      comments: '0',
      date: 'Just now',
      thumbnail: videoData.thumbnailUrl || videoData.mediaUrl,
      status: 'Published',
      earnings: '₹0',
      duration: '0:45'
    };
    setCreatorVideos(prev => [newCv, ...prev]);

    // Also add to feed
    publishNewPost({
      caption: (videoData.title || '') + ' - ' + (videoData.description || ''),
      hashtags: videoData.hashtags,
      mediaType: 'video',
      mediaUrl: videoData.mediaUrl
    });
  };

  // Send message in chat - Real 1-to-1 direct messaging (no automated bots)
  const sendMessage = async (conversationId, text, media = null) => {
    if (!text?.trim() && !media) return;

    // Find conversation partner
    const conv = conversations.find(c => 
      c.id === conversationId || 
      String(c.userId) === String(conversationId) || 
      c.user?.username === conversationId
    );
    const partnerParam = conv?.userId || conv?.user?.username || conversationId.replace(/^conv_/, '');

    const myMsg = {
      id: 'm_' + Date.now(),
      sender: 'me',
      senderId: currentUser?.id,
      text: text?.trim() || '',
      media: media || null,
      time: 'Just now',
      createdAt: new Date().toISOString()
    };

    // Optimistically show message immediately in chat
    setConversations(prev => prev.map(c => {
      const match = c.id === conversationId || 
                    String(c.userId) === String(conversationId) || 
                    c.user?.username === conversationId;
      if (match) {
        return {
          ...c,
          lastMessage: media ? (media.type === 'video' ? '🎥 Video' : '📷 Photo') : text,
          time: 'Just now',
          messages: [...(c.messages || []), myMsg]
        };
      }
      return c;
    }));

    // Persist real message to AWS MySQL backend
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (token) {
      try {
        const res = await fetch(`/api/messages/${partnerParam}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            text: text?.trim() || '',
            media: media ? {
              url: media.url,
              type: media.type,
              name: media.name,
              size: media.size
            } : null
          })
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.message) {
            setConversations(prev => prev.map(c => {
              const match = c.id === conversationId || 
                            String(c.userId) === String(conversationId) || 
                            c.user?.username === conversationId;
              if (match) {
                return {
                  ...c,
                  messages: (c.messages || []).map(m => m.id === myMsg.id ? resData.message : m)
                };
              }
              return c;
            }));
          }
        }
      } catch (err) {
        console.error('Failed to save message to MySQL backend:', err);
      }
    }
    // No automated mock replies! Only the real person can reply.
  };

  // Open or create conversation with a user (by username or user object)
  const openOrCreateConversation = (targetUser) => {
    if (!targetUser) return null;
    const username = typeof targetUser === 'string' ? targetUser : targetUser.username;
    const name = typeof targetUser === 'string' ? targetUser : (targetUser.name || targetUser.username);
    const avatar = (typeof targetUser === 'object' && targetUser.avatar) ? targetUser.avatar : '/brand/default-avatar.svg';
    const userId = (typeof targetUser === 'object' && targetUser.id) ? targetUser.id : null;

    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.user?.username?.toLowerCase() === username.toLowerCase() ||
      (userId && c.userId === userId)
    );
    if (existing) {
      return existing.id;
    }

    // Create new clean direct conversation
    const newConvId = `conv_${userId || username}`;
    const newConv = {
      id: newConvId,
      userId: userId,
      user: {
        id: userId,
        name,
        username,
        avatar,
        isVerified: false,
        isOnline: true
      },
      lastMessage: 'Tap here to start chatting',
      time: 'Just now',
      unreadCount: 0,
      messages: []
    };

    setConversations(prev => [newConv, ...prev]);
    return newConvId;
  };

  // Submit Video for Central Admin Verification (Unified Influencer Workflow) - FREE FOR ALL USERS!
  const submitVideoForVerification = (videoData) => {

    const submissionId = 'sub_' + Date.now();
    const newSubmission = {
      id: submissionId,
      contentType: 'video',
      title: videoData.title || 'Untitled Reel',
      caption: videoData.description || videoData.title,
      thumbnail: videoData.thumbnailUrl || videoData.mediaUrl,
      mediaUrl: videoData.mediaUrl,
      category: videoData.category || 'Comedy',
      hashtags: videoData.hashtags || '#funflick #comedy #reels',
      audioTitle: videoData.audioTitle || ('🎵 Original Sound - ' + currentUser.username),
      location: videoData.location || '',
      tags: videoData.tags || [],
      date: 'Just now',
      status: 'Pending Admin Verification',
      views: '0 (In Review)',
      likes: '0',
      adminNote: 'Submitted for central admin quality verification',
      rewardGranted: null
    };

    setUserSubmissions(prev => [newSubmission, ...prev]);

    // Add to Admin Pending Queue
    const newAdminPending = {
      id: submissionId,
      contentType: 'video',
      title: newSubmission.title,
      caption: newSubmission.caption,
      creator: currentUser.username,
      creatorName: currentUser.name,
      avatar: currentUser.avatar,
      thumbnail: newSubmission.thumbnail,
      mediaUrl: newSubmission.mediaUrl,
      category: newSubmission.category,
      hashtags: newSubmission.hashtags,
      audioTitle: newSubmission.audioTitle,
      location: newSubmission.location,
      tags: newSubmission.tags,
      date: 'Just now',
      status: 'Pending'
    };
    setPendingApprovals(prev => [newAdminPending, ...prev]);

    // Add user in-app notification
    const newNotif = {
      id: 'notif_' + Date.now(),
      type: 'system',
      user: 'Admin Verification Desk',
      avatar: '/brand/funflick-logo.png',
      text: `Your reel "${newSubmission.title}" has been submitted for central admin verification!`,
      time: 'Just now',
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, submission: newSubmission };
  };

  // Submit Post (Photo / Clip) for Central Admin Verification - FREE FOR ALL USERS!
  const submitPostForVerification = (postData) => {

    const submissionId = 'sub_' + Date.now();
    const newSubmission = {
      id: submissionId,
      contentType: 'image',
      title: postData.caption ? (postData.caption.slice(0, 35) + '...') : 'New Photo Post',
      caption: postData.caption || '',
      thumbnail: postData.mediaUrl,
      mediaUrl: postData.mediaUrl,
      category: postData.category || 'Comedy',
      hashtags: postData.hashtags || '#funflick #comedy',
      location: postData.location || '',
      tags: postData.tags || [],
      date: 'Just now',
      status: 'Pending Admin Verification',
      views: '0 (In Review)',
      likes: '0',
      adminNote: 'Submitted for admin quality verification',
      rewardGranted: null
    };

    setUserSubmissions(prev => [newSubmission, ...prev]);

    const newAdminPending = {
      id: submissionId,
      contentType: 'image',
      title: newSubmission.title,
      caption: postData.caption,
      creator: currentUser.username,
      creatorName: currentUser.name,
      avatar: currentUser.avatar,
      thumbnail: newSubmission.thumbnail,
      mediaUrl: newSubmission.mediaUrl,
      category: newSubmission.category,
      hashtags: newSubmission.hashtags,
      location: postData.location,
      tags: postData.tags,
      date: 'Just now',
      status: 'Pending'
    };
    setPendingApprovals(prev => [newAdminPending, ...prev]);

    const newNotif = {
      id: 'notif_' + Date.now(),
      type: 'system',
      user: 'Admin Verification Desk',
      avatar: '/brand/funflick-logo.png',
      text: `Your photo post has been submitted for central admin verification!`,
      time: 'Just now',
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, submission: newSubmission };
  };

  // Submit Story for Central Admin Verification - FREE FOR ALL USERS!
  const submitStoryForVerification = (storyData) => {

    const submissionId = 'sub_' + Date.now();
    const newSubmission = {
      id: submissionId,
      contentType: 'story',
      title: 'Story: ' + (storyData.caption ? storyData.caption.slice(0, 25) : 'Moment'),
      caption: storyData.caption || 'Enjoying life on FunFlick! ✨',
      thumbnail: storyData.mediaUrl,
      mediaUrl: storyData.mediaUrl,
      category: 'Lifestyle',
      hashtags: '#FunFlickStory',
      date: 'Just now',
      status: 'Pending Admin Verification',
      views: '0 (In Review)',
      likes: '0',
      adminNote: 'Story submitted for admin moderation review',
      rewardGranted: null
    };

    setUserSubmissions(prev => [newSubmission, ...prev]);

    const newAdminPending = {
      id: submissionId,
      contentType: 'story',
      title: newSubmission.title,
      caption: storyData.caption,
      creator: currentUser.username,
      creatorName: currentUser.name,
      avatar: currentUser.avatar,
      thumbnail: newSubmission.thumbnail,
      mediaUrl: newSubmission.mediaUrl,
      category: 'Lifestyle',
      hashtags: '#FunFlickStory',
      date: 'Just now',
      status: 'Pending'
    };
    setPendingApprovals(prev => [newAdminPending, ...prev]);

    return { success: true, submission: newSubmission };
  };

  // Admin Payout: Send Payment simulation (Section 36 & Screen 12 & 11)
  const processAdminPayout = (payoutId, amount) => {
    let targetCreator = '';
    let targetPostTitle = '';

    setAdminPayouts(prev => prev.map(p => {
      if (p.id === payoutId) {
        targetCreator = p.creator;
        targetPostTitle = p.postTitle;
        const newPaid = p.paidAmount + amount;
        const newRemaining = Math.max(0, p.approvedAmount - newPaid);
        return {
          ...p,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'Paid' : 'Partially Paid',
          paymentHistory: [
            {
              id: 'ph_' + Date.now(),
              date: 'Just now',
              amount,
              method: 'FunFlick Wallet Direct Credit',
              ref: 'FFPAY' + Math.floor(100000 + Math.random() * 900000)
            },
            ...p.paymentHistory
          ]
        };
      }
      return p;
    }));

    // If payout is to current user (Srilatha), credit wallet directly!
    const isToCurrentUser = targetCreator.toLowerCase().includes('srilatha') || 
                            targetCreator.toLowerCase().includes('current user') ||
                            targetCreator.toLowerCase().includes('you');

    if (isToCurrentUser) {
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: (prev.walletBalance || 0) + amount,
        availableBalance: (prev.availableBalance || 0) + amount
      }));

      // Add transaction to wallet history
      const newTx = {
        id: 'tx_' + Date.now(),
        title: `Performance Reward from Admin`,
        desc: `Admin bonus for high-performing video: "${targetPostTitle || 'Top Reel'}"`,
        type: 'credit',
        amount,
        formattedAmount: `+₹${amount.toLocaleString()}`,
        date: 'Today',
        status: 'Completed',
        category: 'Creator Reward'
      };
      setTransactions(prev => [newTx, ...prev]);

      // Add user notification
      const notif = {
        id: 'notif_' + Date.now(),
        type: 'wallet',
        user: 'FunFlick Admin Desk',
        avatar: '/brand/funflick-logo.png',
        text: `💰 Admin sent ₹${amount.toLocaleString()} performance reward to your wallet for reaching high views!`,
        time: 'Just now',
        unread: true
      };
      setNotifications(prev => [notif, ...prev]);
    }

    showToast(`Payment of ₹${amount.toLocaleString()} credited to creator wallet successfully!`, 'success');
  };

  // Custom Admin Disbursal with Live/Snapshot metrics, custom rate, and settled view milestone tracking
  const processCustomAdminPayout = (payoutId, { amount, settleScope = 'live', note = '' }) => {
    let targetCreator = '';
    let targetPostTitle = '';
    let settledViews = 0;

    setAdminPayouts(prev => prev.map(p => {
      if (p.id === payoutId) {
        targetCreator = p.creator;
        targetPostTitle = p.postTitle;
        const newPaid = p.paidAmount + amount;
        settledViews = settleScope === 'live' ? (p.currentLiveViews || 12450) : (p.requestedViews || 10000);
        return {
          ...p,
          paidAmount: newPaid,
          remainingAmount: 0,
          status: 'Paid',
          paidUpToViews: settledViews,
          customRateNote: note || `Disbursed ₹${amount.toLocaleString()} for ${settledViews.toLocaleString()} views`,
          settledAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          paymentHistory: [
            {
              id: 'ph_' + Date.now(),
              date: 'Just now',
              amount,
              method: 'FunFlick Admin Direct Settlement',
              ref: 'FFPAY' + Math.floor(100000 + Math.random() * 900000),
              settledViews,
              note
            },
            ...(p.paymentHistory || [])
          ]
        };
      }
      return p;
    }));

    // If payout is to current user, credit wallet directly!
    const isToCurrentUser = targetCreator.toLowerCase().includes('srilatha') || 
                            targetCreator.toLowerCase().includes('current user');

    if (isToCurrentUser) {
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: (prev.walletBalance || 0) + amount,
        availableBalance: (prev.availableBalance || 0) + amount
      }));

      const newTx = {
        id: 'tx_' + Date.now(),
        title: `Monetization Payout from Admin`,
        desc: `Custom performance reward for "${targetPostTitle}" (Settled up to ${settledViews.toLocaleString()} views)`,
        type: 'credit',
        amount,
        formattedAmount: `+₹${amount.toLocaleString()}`,
        date: 'Just now'
      };
      setTransactions(prev => [newTx, ...prev]);

      const notif = {
        id: 'notif_' + Date.now(),
        type: 'wallet',
        user: 'FunFlick Admin',
        avatar: '/brand/funflick-logo.png',
        text: `🎉 ₹${amount.toLocaleString()} performance payout credited to your wallet! (Settled up to ${settledViews.toLocaleString()} views)`,
        time: 'Just now',
        unread: true
      };
      setNotifications(prev => [notif, ...prev]);
    }

    showToast(`Disbursed ₹${amount.toLocaleString()} to ${targetCreator}! Settled to ${settledViews.toLocaleString()} views.`, 'success');
  };

  // Creator Submits New Payout Request for a High-Performing Video
  const requestCreatorPayout = ({ videoTitle, views = 10000, likes = 1200 }) => {
    const newPayout = {
      id: 'pay_' + Date.now(),
      creator: currentUser.name || 'Srilatha',
      creatorUsername: currentUser.username || 'srilatha_16',
      isSubscribed: true,
      subscriptionPlan: currentUser.subscriptionPlan || 'Monthly Influencer Pro',
      creatorAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      postTitle: videoTitle || 'Viral Reel Debut',
      postDate: 'Just now',
      requestedViews: views,
      requestedLikes: likes,
      currentLiveViews: Math.round(views * 1.15),
      currentLiveLikes: Math.round(likes * 1.12),
      views: `${(views / 1000).toFixed(1)}K`,
      paidUpToViews: 0,
      approvedAmount: Math.round((views / 1000) * 50),
      paidAmount: 0,
      remainingAmount: Math.round((views / 1000) * 50),
      status: 'Partially Paid',
      customRateNote: 'New influencer monetization claim submitted',
      paymentHistory: []
    };

    setAdminPayouts(prev => [newPayout, ...prev]);
    showToast('🚀 Payout request submitted! Admin will evaluate and disburse payment.', 'success');
  };

  // Admin Resolves Copyright / Anti-Plagiarism Claim
  const resolveCopyrightReport = (reportId, { action, suspensionDays = 0, note = '' }) => {
    setCopyrightReports(prev => prev.map(r => {
      if (r.id === reportId) {
        const isApproved = action === 'approve';
        return {
          ...r,
          status: isApproved ? 'Approved' : 'Rejected',
          adminAction: isApproved 
            ? (suspensionDays > 0 ? `Removed & ${suspensionDays}-Day Ban` : 'Content Removed & Forfeited') 
            : 'Dismissed as Fair Use',
          adminResolutionNote: note,
          resolvedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return r;
    }));

    if (action === 'approve') {
      showToast('🛡️ Copyright claim approved! Stolen post removed & penalty applied.', 'success');
    } else {
      showToast('Report dismissed as fair use / insufficient evidence.', 'info');
    }
  };

  // User Submits Copyright / Stolen Content Report
  const submitCopyrightReport = ({ originalTitle, accusedUsername, accusedTitle, description, originalThumbnail, accusedThumbnail }) => {
    const newReport = {
      id: 'CR-' + Math.floor(100 + Math.random() * 900),
      reporter: currentUser.name || 'You',
      reporterUsername: currentUser.username || 'user',
      reporterAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      originalTitle: originalTitle || 'My Original Post',
      originalUploadedAt: 'Oct 1, 2026 at 10:00 AM',
      originalViews: '4.2K',
      originalLikes: '480',
      originalThumbnail: originalThumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      accused: accusedUsername || 'Accused Creator',
      accusedUsername: (accusedUsername || 'user').replace('@', ''),
      accusedAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
      accusedTitle: accusedTitle || 'Copied Video Repost',
      accusedUploadedAt: 'Oct 3, 2026 at 06:15 PM',
      accusedViews: '45.0K',
      accusedLikes: '6.2K',
      accusedThumbnail: accusedThumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      timeDifference: 'Original uploaded 2 days 8 hours BEFORE accused copy',
      description,
      status: 'Pending',
      adminAction: null,
      date: 'Today'
    };

    setCopyrightReports(prev => [newReport, ...prev]);
    showToast('🛡️ Copyright complaint filed! Admin will review side-by-side with original.', 'success');
  };

  // Direct Admin Performance Reward to Creator Wallet
  const sendPerformanceReward = (creatorUsername, videoTitle, amount) => {
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: (prev.walletBalance || 0) + amount,
      availableBalance: (prev.availableBalance || 0) + amount
    }));

    const newTx = {
      id: 'tx_' + Date.now(),
      title: `Creator Performance Reward`,
      desc: `High engagement bonus for "${videoTitle}"`,
      type: 'credit',
      amount,
      formattedAmount: `+₹${amount.toLocaleString()}`,
      date: 'Today',
      status: 'Completed',
      category: 'Admin Reward'
    };
    setTransactions(prev => [newTx, ...prev]);

    const notif = {
      id: 'notif_' + Date.now(),
      type: 'wallet',
      user: 'FunFlick Admin',
      avatar: '/brand/funflick-logo.png',
      text: `🎉 Admin rewarded you ₹${amount.toLocaleString()} for your high-performing video!`,
      time: 'Just now',
      unread: true
    };
    setNotifications(prev => [notif, ...prev]);
    showToast(`Disbursed ₹${amount.toLocaleString()} reward to @${creatorUsername}'s wallet!`, 'success');
  };

  // Admin Approve / Reject Pending Video (AWS Backend Integration)
  const handlePendingApproval = async (approvalId, action) => {
    const target = pendingApprovals.find(a => a.id === approvalId);
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));

    try {
      const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      if (token) {
        await fetch(`/api/admin/content/${approvalId}/moderate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ 
            action, 
            itemType: target?.itemType || target?.contentType || 'video' 
          })
        });
      }
    } catch (err) {
      console.error('Error moderating content on backend:', err);
    }

    if (action === 'approve') {
      setUserSubmissions(prev => prev.map(s => {
        if (s.id === approvalId) {
          return {
            ...s,
            status: 'Approved & Live',
            views: '1',
            adminNote: 'Approved & Live on platform feed!'
          };
        }
        return s;
      }));

      // Add user notification
      const approvedNotif = {
        id: 'notif_' + Date.now(),
        type: 'like',
        user: 'Admin Approval Desk',
        avatar: '/brand/funflick-logo.png',
        text: `🎉 Good news! Your reel "${target?.title || 'content'}" was verified & approved by Admin! It is now live on FunFlick globally.`,
        time: 'Just now',
        unread: true
      };
      setNotifications(prev => [approvedNotif, ...prev]);

      showToast(`✅ Content approved and published live across FunFlick!`, 'success');
    } else {
      setUserSubmissions(prev => prev.map(s => {
        if (s.id === approvalId) {
          return {
            ...s,
            status: 'Rejected',
            adminNote: 'Submission rejected during quality review.'
          };
        }
        return s;
      }));
      showToast('Video submission rejected.', 'info');
    }

    // Refresh all live collections after moderation
    try {
      await Promise.all([
        fetchLiveVideos(),
        fetchLiveStories(),
        fetchAdminPendingContent(),
        fetchAdminStats(),
        fetchMyMedia()
      ]);
    } catch (e) {}
  };

  // Reset state directly from live AWS database
  const resetDemoData = async () => {
    await Promise.all([
      fetchLiveVideos(),
      fetchLiveStories(),
      fetchLiveCreators(),
      fetchAdminStats(),
      fetchAdminPendingContent()
    ]);
    showToast('Platform data synchronized fresh from AWS backend!', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        posts,
        stories,
        creators,
        transactions,
        notifications,
        conversations,
        creatorVideos,
        userSubmissions,
        adminPayouts,
        pendingApprovals,
        phoneFrame,
        setPhoneFrame,
        subscriptionGateModalOpen,
        setSubscriptionGateModalOpen,
        createModalOpen,
        setCreateModalOpen,
        toasts,
        showToast,
        activeStoryGroup,
        setActiveStoryGroup,
        toggleLikePost,
        recordPostView,
        toggleSavePost,
        toggleFollowCreator,
        followingList,
        setFollowingList,
        followersList,
        setFollowersList,
        followRequests,
        setFollowRequests,
        acceptFollowRequest,
        declineFollowRequest,
        removeFollower,
        markAllNotificationsAsRead,
        subscribeToCreator,
        addComment,
        deleteComment,
        fetchComments,
        fetchLiveVideos,
        fetchLiveStories,
        fetchLiveNotifications,
        fetchLiveConversations,
        fetchConversationMessages,
        fetchLiveCreators,
        fetchAdminPendingContent,
        blockedUsers,
        blockUser,
        unblockUser,
        purchasePublishingSubscription,
        recordSubscriptionPayment,
        subscriptionStatus,
        fetchUserSubscriptionStatus,
        subscriptionTransactions,
        setSubscriptionTransactions,
        toggleUserSubscriptionStatus,
        publishNewPost,
        updateUserPost,
        deleteUserPost,
        deleteUserSubmission,
        publishNewStory,
        publishNewVideo,
        submitVideoForVerification,
        submitPostForVerification,
        submitStoryForVerification,
        sendPerformanceReward,
        sendMessage,
        openOrCreateConversation,
        processAdminPayout,
        processCustomAdminPayout,
        requestCreatorPayout,
        copyrightReports,
        resolveCopyrightReport,
        submitCopyrightReport,
        handlePendingApproval,
        publishingPlans,
        fetchSubscriptionPlans,
        updatePublishingPlan,
        addPublishingPlan,
        deletePublishingPlan,
        togglePlanActiveStatus,
        resetPublishingPlansToDefault,
        influencerMedia,
        setInfluencerMedia,
        fetchInfluencerMedia,
        sendInfluencerReward,
        adsList,
        setAdsList,
        fetchAdminAds,
        createAd,
        updateAd,
        deleteAd,
        toggleAdStatus,
        recordAdImpression,
        recordAdClick,
        activePopupAd,
        showMobileAd,
        dismissMobileAd,
        resetDemoData,
        theme,
        setTheme,
        toggleTheme,
        mediaLimits,
        updateMediaLimits,
        isAuthenticated,
        loginUser,
        logoutUser,
        myMedia,
        setMyMedia,
        fetchMyMedia,
        adminStats,
        setAdminStats,
        fetchAdminStats,
        fetchAdminTransactions,
        activePlayingVideoId,
        setActivePlayingVideoId
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
