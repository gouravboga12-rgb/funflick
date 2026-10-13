import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, getToken, setToken, getStoredUser, setStoredUser, getStoredSavedPosts, setStoredSavedPosts } from '../services/api';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from '../services/pushService';
import * as Notifications from 'expo-notifications';
import { navigate } from '../navigation/navigationService';

const AppContext = createContext();
export const cleanAvatar = (url, fallback = 'https://funflick.in/brand/funflick-logo.png') => {
  if (!url || typeof url !== 'string') return fallback;
  let clean = url.trim();
  clean = clean.replace(/https?:\/\/funflick-theta\.vercel\.app/g, 'https://funflick.in');
  clean = clean.replace(/https?:\/\/98\.130\.142\.69/g, 'https://funflick.in');
  if (clean.startsWith('/')) clean = `https://funflick.in${clean}`;
  if (
    clean.includes('default-avatar') ||
    clean.endsWith('.svg') ||
    !clean.startsWith('http')
  ) {
    return fallback;
  }
  return clean;
};

export const sanitizeUser = (u) => {
  if (!u || typeof u !== 'object') return u;
  const avatar = cleanAvatar(u.avatar || u.avatar_url);
  return {
    ...u,
    avatar,
    avatar_url: avatar,
  };
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  // Mute audio by default on app launch (matching web & standard social feeds)
  const [isReelsMuted, setIsReelsMuted] = useState(false);
  // Global pause state (like volume/mute) so all reels pause/play together
  const [isReelsPaused, setIsReelsPaused] = useState(false);
  const [activePlayingVideoId, setActivePlayingVideoId] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const locallySeenStoryIdsRef = useRef(new Set());
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const savedPostIdsRef = useRef(new Set());

  const [adContactSettings, setAdContactSettings] = useState({
    adContactPhone: '+91 98765 43210',
    adContactWhatsapp: '+91 98765 43210',
    adContactEmail: 'ads@funflick.in',
    adContactTimings: 'Mon - Sat, 9:00 AM - 7:00 PM IST',
  });

  // In-app floating toast banner state
  const [inAppBanner, setInAppBanner] = useState({
    visible: false,
    title: '',
    body: '',
    avatar: null,
    data: null,
  });

  const showInAppBanner = useCallback(({ title, body, avatar, data }) => {
    setInAppBanner({
      visible: true,
      title: title || 'FunFlick',
      body: body || '',
      avatar: avatar || null,
      data: data || null,
    });
  }, []);

  const dismissInAppBanner = useCallback(() => {
    setInAppBanner(prev => ({ ...prev, visible: false }));
  }, []);

  // Fetch live stories from EC2 MySQL backend
  const fetchLiveStories = useCallback(async () => {
    try {
      const data = await apiRequest('/stories');
      if (data && data.stories && Array.isArray(data.stories)) {
        const userGroup = data.stories.find(s => 
          (currentUser?.id && String(s.userId) === String(currentUser.id)) ||
          (currentUser?.username && s.username?.toLowerCase() === currentUser.username?.toLowerCase())
        );

        const myStory = {
          id: userGroup?.id || 'my-story',
          isUser: true,
          userId: currentUser?.id || userGroup?.userId,
          username: currentUser?.username || 'Your Story',
          name: 'Your Story',
          avatar: cleanAvatar(currentUser?.avatar_url || currentUser?.avatar || userGroup?.avatar),
          hasUnseen: false,
          stories: userGroup?.stories || [],
        };

        const others = data.stories
          .filter(s => {
            const isMe = (currentUser?.id && String(s.userId) === String(currentUser.id)) ||
                         (currentUser?.username && s.username?.toLowerCase() === currentUser.username?.toLowerCase());
            return !isMe && s.stories && s.stories.length > 0;
          })
          .map(s => {
            const updatedStories = (s.stories || []).map(item => ({
              ...item,
              isViewed: Boolean(item.isViewed || locallySeenStoryIdsRef.current.has(item.id)),
            }));
            const hasUnseen = (s.hasUnseen === true || s.hasUnseen === 1) && updatedStories.some(item => !item.isViewed);

            return {
              id: s.id || `st_${s.userId || s.username}`,
              userId: s.userId,
              isUser: false,
              username: s.username,
              name: s.name || s.username,
              avatar: cleanAvatar(s.avatar),
              hasUnseen,
              stories: updatedStories,
            };
          });

        setStories([myStory, ...others]);
      }
    } catch (e) {
      console.warn('Could not fetch live stories in mobile:', e.message);
    }
  }, [currentUser]);

  // Load auth session on launch
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        let user = await getStoredUser();
        if (token && !user) {
          try {
            const meData = await apiRequest('/auth/me');
            if (meData?.user) {
              user = meData.user;
              await setStoredUser(user);
            }
          } catch (e) {}
        }
        if (token && user) {
          const safeUser = sanitizeUser(user);
          setCurrentUser(safeUser);
          setIsAuthenticated(true);
          // Register device push token in background
          registerForPushNotificationsAsync();
        }

        // Restore persistent saved post IDs
        try {
          const savedIds = await getStoredSavedPosts();
          if (Array.isArray(savedIds)) {
            const set = new Set(savedIds.map(String));
            setSavedPostIds(set);
            savedPostIdsRef.current = set;
          }
        } catch (e) {}

        // Fetch central platform & ad contact settings
        try {
          const sData = await apiRequest('/settings');
          if (sData && sData.settings) {
            setAdContactSettings(sData.settings);
          }
        } catch (e) {}
      } catch (err) {
        console.warn('Auth restore error:', err);
      } finally {
        setIsLoadingAuth(false);
        fetchLiveStories();
      }
    })();
  }, []);

  // Fetch feed videos
  const fetchFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const data = await apiRequest('/videos');
      if (data && data.videos && Array.isArray(data.videos)) {
        const mapped = data.videos.map(v => {
          const url = v.video_url || '';
          const isImg = /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(url) ||
                        v.category === 'Photo' ||
                        v.category === 'Post';
          return {
            id: v.id,
            title: v.title || 'FunFlick Post',
            caption: v.description || v.title || '',
            category: v.category || 'Comedy',
            mediaType: isImg ? 'image' : (v.media_type || 'video'),
            mediaUrl: v.video_url,
            posterUrl: v.thumbnail_url || v.video_url,
            thumbnailUrl: v.thumbnail_url || v.video_url,
            likesCount: Number(v.likes_count) || 0,
            viewsCount: String(v.views_count || '0'),
            commentsCount: Number(v.comments_count) || 0,
            timeAgo: v.created_at ? new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently',
            isLiked: Boolean(v.user_liked),
            isSaved: Boolean(savedPostIdsRef.current.has(String(v.id))),
            isFollowing: Boolean(v.user_following),
            creator: {
              id: v.creator_id,
              name: v.creator_name || 'Creator',
              username: v.creator_username || 'creator',
              avatar: cleanAvatar(
                v.creator_avatar,
                v.creator_username === 'super_admin'
                  ? 'https://funflick.in/brand/funflick-logo.png'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              ),
            }
          };
        });
        setPosts(mapped);
      }
    } catch (e) {
      console.warn('Error fetching feed:', e.message);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    fetchLiveStories();
  }, [fetchFeed, fetchLiveStories]);

  // Login handler
  const login = async (identifier, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (data.token && data.user) {
      const safeUser = sanitizeUser(data.user);
      await setToken(data.token);
      await setStoredUser(safeUser);
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      hasTriggeredAdOnLaunchRef.current = false;
      return safeUser;
    }
    throw new Error('Invalid login response');
  };

  // Register handler
  const register = async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (data.token && data.user) {
      const safeUser = sanitizeUser(data.user);
      await setToken(data.token);
      await setStoredUser(safeUser);
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      hasTriggeredAdOnLaunchRef.current = false;
      return safeUser;
    }
    return data;
  };

  // Google Login handler
  const loginWithGoogle = async (email) => {
    const data = await apiRequest('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (data.requiresAccountChoice) {
      return data;
    }

    if (data.token && data.user) {
      const safeUser = sanitizeUser(data.user);
      await setToken(data.token);
      await setStoredUser(safeUser);
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      hasTriggeredAdOnLaunchRef.current = false;
      return safeUser;
    }

    throw new Error(data.error || 'Google login failed');
  };

  // Google select account handler
  const selectGoogleAccount = async (userId, email) => {
    const data = await apiRequest('/auth/google-select-account', {
      method: 'POST',
      body: JSON.stringify({ userId, email: email.trim().toLowerCase() }),
    });

    if (data.token && data.user) {
      const safeUser = sanitizeUser(data.user);
      await setToken(data.token);
      await setStoredUser(safeUser);
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      hasTriggeredAdOnLaunchRef.current = false;
      return safeUser;
    }

    throw new Error(data.error || 'Failed to select account');
  };

  // Hydrate user session from OAuth token and user object
  const hydrateOAuthSession = async (token, user) => {
    if (token && user) {
      const safeUser = sanitizeUser(user);
      await setToken(token);
      await setStoredUser(safeUser);
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      return safeUser;
    }
  };

  // Logout handler
  const logout = async () => {
    sessionSeenAdIdsRef.current.clear();
    await setToken(null);
    await setStoredUser(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Toggle like
  const toggleLikePost = useCallback(async (videoId) => {
    if (!videoId) return null;
    const strId = String(videoId);
    setPosts(prev =>
      prev.map(p => {
        if (String(p.id) === strId) {
          const nextLiked = !p.isLiked;
          const currentCount = Number(p.likesCount) || 0;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        }
        return p;
      })
    );

    try {
      const data = await apiRequest(`/videos/${videoId}/like`, { method: 'POST' });
      return data;
    } catch (e) {
      console.warn('Toggle like error:', e?.message || e);
      return null;
    }
  }, []);

  // Record view count
  const recordPostView = useCallback(async (videoId) => {
    if (!videoId) return;
    try {
      await apiRequest(`/videos/${videoId}/view`, { method: 'POST' });
    } catch (e) {}
  }, []);

  // Persistent toggle save / bookmark post
  const toggleSavePost = useCallback(async (postId) => {
    if (!postId) return;
    const strId = String(postId);
    let willSave = false;
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(strId)) {
        next.delete(strId);
        willSave = false;
      } else {
        next.add(strId);
        willSave = true;
      }
      savedPostIdsRef.current = next;
      setStoredSavedPosts(Array.from(next));
      return next;
    });

    setPosts(prev =>
      prev.map(p => {
        if (String(p.id) === strId) {
          return { ...p, isSaved: willSave };
        }
        return p;
      })
    );
  }, []);

  // Fetch live platform & ad contact settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiRequest('/settings');
      if (data && data.settings) {
        setAdContactSettings(data.settings);
      }
    } catch (e) {}
  }, []);

  // Following graph state
  const [followingUsernames, setFollowingUsernames] = useState(new Set());

  const fetchMyFollowing = useCallback(async () => {
    if (!currentUser?.username) return;
    try {
      const data = await apiRequest(`/follows/${currentUser.username}/following`);
      if (data && Array.isArray(data.following)) {
        const set = new Set(data.following.map(u => (u.username || '').toLowerCase()));
        setFollowingUsernames(set);
      }
    } catch (e) {}
  }, [currentUser?.username]);

  useEffect(() => {
    fetchMyFollowing();
  }, [fetchMyFollowing]);

  // Toggle follow
  const toggleFollowCreator = useCallback(async (username) => {
    if (!username) return;
    const cleanUser = username.toLowerCase();

    let willFollow = false;
    setFollowingUsernames(prev => {
      const next = new Set(prev);
      if (next.has(cleanUser)) {
        next.delete(cleanUser);
        willFollow = false;
      } else {
        next.add(cleanUser);
        willFollow = true;
      }
      return next;
    });

    setPosts(prev =>
      prev.map(p => {
        if (p.creator?.username?.toLowerCase() === cleanUser) {
          return { ...p, isFollowing: willFollow };
        }
        return p;
      })
    );

    // Optimistically remove stories from tray immediately on unfollow
    if (!willFollow) {
      setStories(prev => prev.filter(s => s.isUser || s.username?.toLowerCase() !== cleanUser));
    }

      try {
        const endpoint = willFollow ? `/follows/${username}/follow` : `/follows/${username}/unfollow`;
        const res = await apiRequest(endpoint, { method: 'POST' });
        if (res && typeof res.following === 'boolean') {
          setFollowingUsernames(prev => {
            const next = new Set(prev);
            if (res.following) {
              next.add(cleanUser);
            } else {
              next.delete(cleanUser);
            }
            return next;
          });
        }
        fetchMyFollowing();
        // Refresh story tray so unfollowed user's stories disappear immediately
        fetchLiveStories();
      } catch (e) {
        // Fallback: try /toggle if available
        try {
          const res2 = await apiRequest(`/follows/${username}/toggle`, { method: 'POST' });
          if (res2 && typeof res2.following === 'boolean') {
            setFollowingUsernames(prev => {
              const next = new Set(prev);
              if (res2.following) {
                next.add(cleanUser);
              } else {
                next.delete(cleanUser);
              }
              return next;
            });
          }
          fetchMyFollowing();
          // Refresh story tray so unfollowed user's stories disappear immediately
          fetchLiveStories();
        } catch (err2) {
          console.warn('Toggle follow error:', err2);
        }
      }
    },
    [fetchMyFollowing, fetchLiveStories]
  );

  // Follow requests state (matching website)
  const [followRequests, setFollowRequests] = useState([]);

  const acceptFollowRequest = useCallback((requestId) => {
    const req = followRequests.find(r => r.id === requestId);
    if (!req) return;
    setFollowRequests(prev => prev.filter(r => r.id !== requestId));
    if (req.username) {
      setFollowingUsernames(prev => {
        const next = new Set(prev);
        next.add(req.username.toLowerCase());
        return next;
      });
    }
  }, [followRequests]);

  const declineFollowRequest = useCallback((requestId) => {
    setFollowRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const seenLastMsgIdsRef = useRef(new Map());
  const isInitialConversationsFetchRef = useRef(true);

  // Fetch live conversations from EC2 backend (merges cleanly without erasing loaded messages)
  const fetchLiveConversations = useCallback(async () => {
    try {
      const data = await apiRequest('/messages/conversations');
      if (data && data.conversations && Array.isArray(data.conversations)) {
        // Trigger in-app toast & push notification for incoming direct messages
        for (const dbConv of data.conversations) {
          const uId = String(dbConv.userId || dbConv.user?.id || '');
          const lastMsg = String(dbConv.lastMessage || '');
          const unread = Number(dbConv.unreadCount) || 0;

          if (!isInitialConversationsFetchRef.current && unread > 0) {
            const prevRecorded = seenLastMsgIdsRef.current.get(uId);
            if (prevRecorded !== lastMsg) {
              seenLastMsgIdsRef.current.set(uId, lastMsg);
              scheduleLocalNotification({
                title: `💬 ${dbConv.user?.name || dbConv.user?.username || 'New Message'}`,
                body: lastMsg || 'Sent you a message',
                data: {
                  type: 'chat',
                  partnerId: dbConv.userId,
                  senderUsername: dbConv.user?.username,
                  senderName: dbConv.user?.name,
                  senderAvatar: dbConv.user?.avatar,
                },
              });
              showInAppBanner({
                title: `💬 ${dbConv.user?.name || dbConv.user?.username || 'New Message'}`,
                body: lastMsg || 'Sent you a message',
                avatar: dbConv.user?.avatar,
                data: {
                  type: 'chat',
                  partnerId: dbConv.userId,
                  senderUsername: dbConv.user?.username,
                  senderName: dbConv.user?.name,
                  senderAvatar: dbConv.user?.avatar,
                },
              });
            }
          } else {
            seenLastMsgIdsRef.current.set(uId, lastMsg);
          }
        }
        isInitialConversationsFetchRef.current = false;

        setConversations(prev => {
          const seenIds = new Set();
          const merged = [];

          for (const dbConv of data.conversations) {
            const existingLocal = prev.find(p =>
              p.id === dbConv.id ||
              (p.userId && String(p.userId) === String(dbConv.userId)) ||
              (p.user?.username && p.user.username.toLowerCase() === dbConv.user?.username?.toLowerCase())
            );
            const mergedConv = {
              ...dbConv,
              messages: (existingLocal?.messages && existingLocal.messages.length > 0)
                ? existingLocal.messages
                : (dbConv.messages || [])
            };
            merged.push(mergedConv);
            seenIds.add(dbConv.id);
            if (dbConv.userId) seenIds.add(String(dbConv.userId));
            if (dbConv.user?.username) seenIds.add(dbConv.user.username.toLowerCase());
          }

          // Append local conversations that haven't hit the DB list yet
          for (const localConv of prev) {
            const alreadyIn =
              seenIds.has(localConv.id) ||
              (localConv.userId && seenIds.has(String(localConv.userId))) ||
              (localConv.user?.username && seenIds.has(localConv.user.username.toLowerCase()));
            if (!alreadyIn) {
              merged.push(localConv);
            }
          }

          return merged;
        });
      }
    } catch (e) {
      console.warn('Could not fetch conversations in mobile:', e.message);
    }
  }, [showInAppBanner]);

  // Fetch messages with specific partner
  const fetchConversationMessages = useCallback(async (targetPartner) => {
    try {
      if (!targetPartner) return [];
      const data = await apiRequest(`/messages/${targetPartner}`);
      if (data && data.messages && Array.isArray(data.messages)) {
        setConversations(prev =>
          prev.map(conv => {
            const matches =
              conv.id === targetPartner ||
              String(conv.userId) === String(targetPartner) ||
              conv.user?.username?.toLowerCase() === String(targetPartner).toLowerCase() ||
              conv.id === `conv_${targetPartner}`;
            if (matches) {
              return {
                ...conv,
                unreadCount: 0,
                messages: data.messages,
              };
            }
            return conv;
          })
        );
        return data.messages;
      }
    } catch (e) {
      console.warn('Could not fetch messages in mobile:', e.message);
    }
    return [];
  }, []);

  // Open or create conversation
  const openOrCreateConversation = useCallback((targetUser) => {
    if (!targetUser) return null;
    const username = typeof targetUser === 'string' ? targetUser : targetUser.username;
    const name = typeof targetUser === 'string' ? targetUser : (targetUser.name || targetUser.username);
    const avatar = (typeof targetUser === 'object' && targetUser.avatar) ? targetUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const userId = (typeof targetUser === 'object' && targetUser.id) ? targetUser.id : null;

    const existing = conversations.find(c =>
      c.user?.username?.toLowerCase() === username?.toLowerCase() ||
      (userId && c.userId === userId)
    );
    if (existing) return existing.id;

    const newConvId = `conv_${userId || username}`;
    const newConv = {
      id: newConvId,
      userId,
      user: {
        id: userId,
        name,
        username,
        avatar,
        isOnline: true,
      },
      lastMessage: 'Tap here to start chatting',
      time: 'Just now',
      unreadCount: 0,
      messages: [],
    };
    setConversations(prev => [newConv, ...prev]);
    return newConvId;
  }, [conversations]);

  // Send message
  const sendMessage = useCallback(async (convId, text, media = null) => {
    const conv = conversations.find(c => c.id === convId);
    const targetUserId = conv?.userId || conv?.user?.id || conv?.user?.username;

    // Optimistically update message stream
    const tempMsgId = `msg_${Date.now()}`;
    const tempMsg = {
      id: tempMsgId,
      sender: 'me',
      text,
      media,
      time: 'Just now',
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === convId || String(c.userId) === String(targetUserId) || c.user?.username === targetUserId) {
          return {
            ...c,
            lastMessage: text || (media?.type === 'video' ? '🎥 Video' : '📷 Photo'),
            time: 'Just now',
            messages: [...(c.messages || []), tempMsg],
          };
        }
        return c;
      })
    );

    try {
      const res = await apiRequest(`/messages/${targetUserId}`, {
        method: 'POST',
        body: JSON.stringify({
          recipientId: targetUserId,
          text: text?.trim() || '',
          media: media ? {
            url: media.url,
            type: media.type,
            name: media.name,
            size: media.size,
          } : null,
          mediaUrl: media?.url,
          mediaType: media?.type,
          mediaName: media?.name,
          mediaSize: media?.size,
        }),
      });

      if (res && res.message) {
        setConversations(prev =>
          prev.map(c => {
            if (c.id === convId || String(c.userId) === String(targetUserId) || c.user?.username === targetUserId) {
              return {
                ...c,
                messages: (c.messages || []).map(m => m.id === tempMsgId ? res.message : m),
              };
            }
            return c;
          })
        );
      }
    } catch (e) {
      console.warn('Send message error:', e);
    }
  }, [conversations]);

  // Unsend / Delete message (Instagram style: removes message for everyone / conversation)
  const unsendMessage = useCallback(async (convId, messageId) => {
    if (!messageId) return;

    // Optimistically remove from local state
    setConversations(prev =>
      prev.map(c => {
        const isMatch = !convId || 
                        c.id === convId || 
                        String(c.userId) === String(convId) || 
                        c.user?.username === convId || 
                        c.id === `conv_${convId}`;
        if (isMatch) {
          const remaining = (c.messages || []).filter(m => String(m.id) !== String(messageId));
          const lastMsg = remaining.length > 0 ? remaining[remaining.length - 1] : null;
          return {
            ...c,
            messages: remaining,
            lastMessage: lastMsg ? (lastMsg.text || (lastMsg.media?.type === 'video' ? '🎥 Video' : '📷 Photo')) : 'No messages yet',
          };
        }
        return c;
      })
    );

    try {
      if (typeof messageId === 'number' || (!isNaN(Number(messageId)) && !String(messageId).startsWith('msg_'))) {
        await apiRequest(`/messages/${messageId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Unsend message error:', e);
    }
  }, []);

  // Ads State
  const [adsList, setAdsList] = useState([]);
  const [activePopupAd, setActivePopupAd] = useState(null);
  const adsListRef = useRef([]);
  const hasTriggeredAdOnLaunchRef = useRef(false);
  const sessionSeenAdIdsRef = useRef(new Set());

  const isPaidInfluencer = Boolean(
    currentUser?.isAdFreeSubscriber === true ||
    (
      currentUser?.subscription_plan &&
      !['Free Member', 'Free User', 'free', 'Free Creator'].includes(currentUser.subscription_plan) &&
      currentUser?.subscription_expires_at &&
      new Date(currentUser.subscription_expires_at) > new Date()
    ) ||
    (
      currentUser?.subscriptionPlan &&
      !['Free Member', 'Free User', 'free', 'Free Creator'].includes(currentUser.subscriptionPlan) &&
      currentUser?.subscriptionExpiresAt &&
      new Date(currentUser.subscriptionExpiresAt) > new Date()
    )
  );

  const fetchAds = useCallback(async () => {
    try {
      const data = await apiRequest('/ads');
      if (data && Array.isArray(data.ads)) {
        adsListRef.current = data.ads;
        setAdsList(data.ads);
        return data.ads;
      }
    } catch (e) {
      console.warn('Fetch ads error:', e?.message);
    }
    return [];
  }, []);

  const recordAdMetric = useCallback(async (adId, action = 'impression') => {
    if (!adId) return;
    try {
      await apiRequest(`/ads/${adId}/metric`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
    } catch (e) {}
  }, []);

  const showMobileAd = useCallback((adId) => {
    // Ads strictly only display if the user is LOGGED IN and NOT a paid influencer!
    if (!isAuthenticated || !currentUser || isPaidInfluencer) return;
    const list = adsListRef.current?.length > 0 ? adsListRef.current : adsList;
    const activeAds = (list || []).filter(a => a.active);
    if (!activeAds.length) return;

    let target = null;
    if (adId) {
      target = activeAds.find(a => a.id === adId);
    } else {
      // 1. Try finding unshown popup ad
      target = activeAds.find(a =>
        (a.frequency === 'Pop-up Ads' || a.frequency === 'On App Open' || a.frequency === 'Once per session') &&
        !sessionSeenAdIdsRef.current.has(a.id)
      );
      // 2. If all popup ads have been seen, reset seen tracking and loop back through active popup ads
      if (!target) {
        const popupAds = activeAds.filter(a =>
          a.frequency === 'Pop-up Ads' || a.frequency === 'On App Open' || a.frequency === 'Once per session'
        );
        if (popupAds.length > 0) {
          sessionSeenAdIdsRef.current.clear();
          target = popupAds[0];
        }
      }
    }

    if (target) {
      sessionSeenAdIdsRef.current.add(target.id);
      setActivePopupAd(target);
      recordAdMetric(target.id, 'impression');
    }
  }, [isAuthenticated, currentUser, isPaidInfluencer, adsList, recordAdMetric]);

  const dismissMobileAd = useCallback(() => {
    const currentAdId = activePopupAd?.id;

    // Sequential Pop-up Ads Queue: Check if another active Pop-up Ad is in queue for this session (1, 2, 3 ads in sequence)
    if (isAuthenticated && currentUser && !isPaidInfluencer) {
      const list = adsListRef.current?.length > 0 ? adsListRef.current : adsList;
      const nextPopupAd = (list || []).find(a =>
        a.active &&
        (a.frequency === 'Pop-up Ads' || a.frequency === 'On App Open' || a.frequency === 'Once per session') &&
        a.id !== currentAdId &&
        !sessionSeenAdIdsRef.current.has(a.id)
      );

      if (nextPopupAd) {
        sessionSeenAdIdsRef.current.add(nextPopupAd.id);
        setActivePopupAd(nextPopupAd);
        recordAdMetric(nextPopupAd.id, 'impression');
        return;
      }
    }

    setActivePopupAd(null);
  }, [activePopupAd, isAuthenticated, currentUser, isPaidInfluencer, adsList, recordAdMetric]);

  // Story Viewed State Tracker
  const recordStoryView = useCallback(async (storyId, userGroupId) => {
    if (!storyId) return;
    locallySeenStoryIdsRef.current.add(storyId);
    apiRequest(`/stories/${storyId}/view`, { method: 'POST' }).catch(() => {});

    setStories(prev =>
      prev.map(group => {
        const hasStory = (group.stories || []).some(s => s.id === storyId);
        if (hasStory || (userGroupId && (group.id === userGroupId || group.userId === userGroupId))) {
          const updatedStories = (group.stories || []).map(s =>
            s.id === storyId ? { ...s, isViewed: true } : s
          );
          const allSeen = updatedStories.every(s => s.isViewed);
          return {
            ...group,
            hasUnseen: !allSeen,
            stories: updatedStories,
          };
        }
        return group;
      })
    );
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const seenNotificationIdsRef = useRef(new Set());
  const isInitialNotificationFetchRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiRequest('/notifications');
      if (data && Array.isArray(data.notifications)) {
        // Trigger banner alert for any new incoming unread notification
        if (!isInitialNotificationFetchRef.current) {
          for (const n of data.notifications) {
            if (!n.is_read && !seenNotificationIdsRef.current.has(n.id)) {
              scheduleLocalNotification({
                title: n.title || 'FunFlick Activity',
                body: n.message || 'You have a new notification',
                data: n,
              });
              showInAppBanner({
                title: n.title || 'FunFlick Activity',
                body: n.message || 'You have a new notification',
                avatar: n.avatar || n.actor_avatar,
                data: n,
              });
              break;
            }
          }
        }

        const ids = new Set(data.notifications.map(n => n.id));
        seenNotificationIdsRef.current = ids;
        isInitialNotificationFetchRef.current = false;

        setNotifications(data.notifications);
        setUnreadNotificationCount(data.notifications.filter(n => !n.is_read).length);
      }
    } catch (e) {}
  }, [showInAppBanner]);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadNotificationCount(0);
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' });
    } catch (e) {}
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadNotificationCount(0);
    try {
      await apiRequest('/notifications/clear-all', { method: 'POST' });
    } catch (e) {}
  }, []);

  // Sync ads & notifications on auth or launch + periodic polling
  useEffect(() => {
    fetchAds();
    if (isAuthenticated) {
      fetchNotifications();
      fetchLiveConversations();
      registerForPushNotificationsAsync();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchLiveConversations();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchAds, fetchNotifications, fetchLiveConversations]);

  // Automatic In-App Pop-up Ad trigger for unpaid users (logged in only)
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isPaidInfluencer || hasTriggeredAdOnLaunchRef.current) return;
    const list = adsListRef.current?.length > 0 ? adsListRef.current : adsList;
    if (!list || list.length === 0) return;

    const popupAd = list.find(a =>
      a.active && (a.frequency === 'Pop-up Ads' || a.frequency === 'On App Open' || a.frequency === 'Once per session')
    );

    if (popupAd) {
      const timer = setTimeout(() => {
        hasTriggeredAdOnLaunchRef.current = true;
        showMobileAd(popupAd.id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser, isPaidInfluencer, adsList, showMobileAd]);

  // Direct Redirection for External Notifications (Chats, Payments, Violations, Activities)
  const handleNotificationClick = useCallback((notifData) => {
    if (!notifData) return;
    const type = String(notifData.type || '').toLowerCase();
    const message = String(notifData.message || notifData.body || '').toLowerCase();
    const title = String(notifData.title || '').toLowerCase();

    // 1. Direct Messages / Chat
    if (
      type === 'message' ||
      type === 'chat' ||
      type === 'direct_message' ||
      notifData.sender_username ||
      notifData.senderUsername ||
      notifData.sender ||
      notifData.targetUser ||
      title.includes('message') ||
      title.includes('chat') ||
      title.startsWith('💬')
    ) {
      const usernameMatch = (notifData.title || '').match(/@([a-zA-Z0-9_.]+)/);
      const partner = notifData.targetUser?.username || notifData.senderUsername || notifData.sender_username || notifData.sender || notifData.username || (usernameMatch ? usernameMatch[1] : null);
      const partnerName = notifData.targetUser?.name || notifData.senderName || notifData.sender_name || notifData.name || partner;
      const partnerAvatar = notifData.targetUser?.avatar || notifData.senderAvatar || notifData.sender_avatar || notifData.avatar;

      navigate('MainTabs', {
        screen: 'Inbox',
        params: partner ? {
          targetUser: {
            username: partner,
            name: partnerName,
            avatar: partnerAvatar,
          },
        } : undefined,
      });
      return;
    }

    // 2. Likes & Comments -> Video Details
    const videoId = notifData.videoId || notifData.target_id || notifData.targetId;
    if ((type === 'like' || type === 'comment') && videoId) {
      navigate('VideoDetail', { videoId });
      return;
    }

    // 2. Payment / Payout / Wallet Updates from Admin
    if (
      type === 'payment' ||
      type === 'payout' ||
      type === 'wallet' ||
      type === 'withdrawal' ||
      message.includes('payment') ||
      message.includes('payout') ||
      message.includes('wallet') ||
      title.includes('payment') ||
      title.includes('payout')
    ) {
      navigate('Wallet');
      return;
    }

    // 3. Creator Profile
    if (type === 'creator' || type === 'profile') {
      const target = notifData.creator || notifData.user;
      if (target) {
        navigate('CreatorProfile', { user: target });
        return;
      }
    }

    // 4. Activity, Violations, Media removal by admin, Likes, Comments, System Updates
    navigate('Notifications');
  }, []);

  // Push notification listener (Foreground & External click response)
  useEffect(() => {
    let notifSub;
    let responseSub;
    try {
      // Check if app was opened directly from an external notification
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response?.notification?.request?.content?.data) {
          handleNotificationClick(response.notification.request.content.data);
        }
      }).catch(() => {});

      notifSub = Notifications.addNotificationReceivedListener(() => {
        fetchNotifications();
        fetchFeed();
        fetchLiveConversations();
      });

      responseSub = Notifications.addNotificationResponseReceivedListener(response => {
        fetchNotifications();
        if (response?.notification?.request?.content?.data) {
          handleNotificationClick(response.notification.request.content.data);
        }
      });
    } catch (e) {}

    return () => {
      if (notifSub) notifSub.remove();
      if (responseSub) responseSub.remove();
    };
  }, [fetchNotifications, fetchFeed, fetchLiveConversations, handleNotificationClick]);

  const deleteUserPost = useCallback(async (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setUserSubmissions(prev => prev.filter(s => s.id !== postId));
    try {
      await apiRequest(`/videos/${postId}`, { method: 'DELETE' });
    } catch (e) {}
  }, []);

  const deleteStory = useCallback(async (storyId) => {
    if (!storyId) return false;
    const strId = String(storyId);

    // 1. Immediate optimistic removal from state across the entire mobile application
    setStories(prev => {
      return prev.map(group => {
        if (!group.stories || group.stories.length === 0) return group;
        const filtered = group.stories.filter(s => String(s.id) !== strId);
        return {
          ...group,
          stories: filtered,
        };
      }).filter(group => {
        if (group.isUser) return true;
        return group.stories && group.stories.length > 0;
      });
    });

    // 2. Perform backend deletion
    try {
      await apiRequest(`/stories/${storyId}`, { method: 'DELETE' });
      // 3. Sync live stories from server
      await fetchLiveStories();
      return true;
    } catch (e) {
      console.warn('Delete story error in context:', e?.message || e);
      await fetchLiveStories();
      throw e;
    }
  }, [fetchLiveStories]);

  // Update a User Post (optimistic feed update + backend PUT /videos/:id)
  const updateUserPost = useCallback(async (postId, updatedFields) => {
    // 1. Optimistically update global posts feed
    setPosts(prev => prev.map(p => {
      if (String(p.id) === String(postId)) {
        return {
          ...p,
          ...updatedFields,
          title: updatedFields.title || p.title,
          caption: updatedFields.caption || p.caption,
          description: updatedFields.caption || p.description,
          category: updatedFields.category || p.category,
          mediaUrl: updatedFields.mediaUrl || p.mediaUrl,
          video_url: updatedFields.mediaUrl || p.video_url,
          posterUrl: updatedFields.posterUrl || p.posterUrl,
          thumbnailUrl: updatedFields.posterUrl || p.thumbnailUrl,
        };
      }
      return p;
    }));

    // 2. Call backend PUT /videos/:id
    try {
      await apiRequest(`/videos/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updatedFields.title,
          description: updatedFields.caption || updatedFields.description,
          category: updatedFields.category,
          thumbnail_url: updatedFields.posterUrl || updatedFields.thumbnailUrl || updatedFields.mediaUrl || null,
          video_url: updatedFields.mediaUrl || null,
          media_url: updatedFields.mediaUrl || null,
        }),
      });
      fetchFeed();
    } catch (e) {
      console.warn('updateUserPost error:', e);
    }
  }, [fetchFeed]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: (u) => setCurrentUser(u ? sanitizeUser(u) : null),
        cleanAvatar,
        sanitizeUser,
        isAuthenticated,
        isPaidInfluencer,
        isLoadingAuth,
        login,
        register,
        loginWithGoogle,
        selectGoogleAccount,
        hydrateOAuthSession,
        logout,
        posts,
        setPosts,
        updateUserPost,
        stories,
        fetchLiveStories,
        deleteStory,
        recordStoryView,
        isLoadingFeed,
        fetchFeed,
        isReelsMuted,
        setIsReelsMuted,
        toggleMute: () => setIsReelsMuted(prev => !prev),
        isReelsPaused,
        setIsReelsPaused,
        togglePlayPause: () => setIsReelsPaused(prev => !prev),
        activePlayingVideoId,
        setActivePlayingVideoId,
        toggleLikePost,
        recordPostView,
        toggleSavePost,
        savedPostIds,
        adContactSettings,
        fetchSettings,
        toggleFollowCreator,
        followingUsernames,
        fetchMyFollowing,
        blockedUsers,
        isChatOpen,
        setIsChatOpen,
        conversations,
        fetchLiveConversations,
        fetchConversationMessages,
        openOrCreateConversation,
        sendMessage,
        unsendMessage,
        userSubmissions,
        deleteUserPost,
        adsList,
        activePopupAd,
        fetchAds,
        showMobileAd,
        dismissMobileAd,
        recordAdMetric,
        notifications,
        unreadNotificationCount,
        fetchNotifications,
        markAllNotificationsRead,
        clearAllNotifications,
        followRequests,
        setFollowRequests,
        acceptFollowRequest,
        declineFollowRequest,
        inAppBanner,
        showInAppBanner,
        dismissInAppBanner,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
