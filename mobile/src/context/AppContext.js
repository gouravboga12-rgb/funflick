import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, getToken, setToken, getStoredUser, setStoredUser } from '../services/api';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from '../services/pushService';
import * as Notifications from 'expo-notifications';
import { navigate } from '../navigation/navigationService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  // Mute audio by default on app launch (matching web & standard social feeds)
  const [isReelsMuted, setIsReelsMuted] = useState(true);
  const [activePlayingVideoId, setActivePlayingVideoId] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Fetch live stories from EC2 MySQL backend
  const fetchLiveStories = useCallback(async () => {
    try {
      const data = await apiRequest('/stories');
      if (data && data.stories && Array.isArray(data.stories)) {
        const myStory = {
          id: 'my-story',
          isUser: true,
          username: 'Your Story',
          name: 'Your Story',
          avatar: currentUser?.avatar_url || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          hasUnseen: false,
          stories: [],
        };
        const userGroup = data.stories.find(s => s.userId === currentUser?.id || s.username === currentUser?.username);
        if (userGroup) {
          myStory.stories = userGroup.stories || [];
        }
        const others = data.stories
          .filter(s => s.userId !== currentUser?.id && s.username !== currentUser?.username)
          .map(s => ({
            id: s.id || `st_${s.username}`,
            isUser: false,
            username: s.username,
            name: s.name || s.username,
            avatar: s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            hasUnseen: true,
            stories: s.stories || [],
          }));
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
          setCurrentUser(user);
          setIsAuthenticated(true);
          // Register device push token in background
          registerForPushNotificationsAsync();
        }
      } catch (err) {
        console.warn('Auth restore error:', err);
      } finally {
        setIsLoadingAuth(false);
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
            isFollowing: Boolean(v.user_following),
            creator: {
              id: v.creator_id,
              name: v.creator_name || 'Creator',
              username: v.creator_username || 'creator',
              avatar: (v.creator_username === 'super_admin')
                ? (v.creator_avatar && !v.creator_avatar.includes('default-avatar') ? v.creator_avatar : 'https://funflick-theta.vercel.app/brand/funflick-logo.png')
                : (v.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'),
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
      await setToken(data.token);
      await setStoredUser(data.user);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      return data.user;
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
      await setToken(data.token);
      await setStoredUser(data.user);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      return data.user;
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
      await setToken(data.token);
      await setStoredUser(data.user);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      return data;
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
      await setToken(data.token);
      await setStoredUser(data.user);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      return data;
    }

    throw new Error(data.error || 'Failed to select account');
  };

  // Hydrate user session from OAuth token and user object
  const hydrateOAuthSession = async (token, user) => {
    if (token && user) {
      await setToken(token);
      await setStoredUser(user);
      setCurrentUser(user);
      setIsAuthenticated(true);
      registerForPushNotificationsAsync();
      fetchFeed();
      return user;
    }
  };

  // Logout handler
  const logout = async () => {
    await setToken(null);
    await setStoredUser(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Toggle like
  const toggleLikePost = async (videoId) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === videoId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await apiRequest(`/videos/${videoId}/like`, { method: 'POST' });
    } catch (e) {
      console.warn('Toggle like error:', e);
    }
  };

  // Record view count
  const recordPostView = async (videoId) => {
    try {
      await apiRequest(`/videos/${videoId}/view`, { method: 'POST' });
    } catch (e) {}
  };

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
      } catch (err2) {
        console.warn('Toggle follow error:', err2);
      }
    }
  }, []);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);

  // Fetch live conversations from EC2 backend (merges cleanly without erasing loaded messages)
  const fetchLiveConversations = useCallback(async () => {
    try {
      const data = await apiRequest('/messages/conversations');
      if (data && data.conversations && Array.isArray(data.conversations)) {
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
  }, []);

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
  const hasTriggeredAdOnLaunchRef = useRef(false);

  const isPaidInfluencer = Boolean(
    currentUser?.isInfluencer ||
    currentUser?.is_influencer ||
    currentUser?.role === 'influencer' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.username === 'super_admin' ||
    (currentUser?.subscription_plan && currentUser?.subscription_plan !== 'Free Member') ||
    (currentUser?.subscriptionPlan && currentUser?.subscriptionPlan !== 'Free Member') ||
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date()) ||
    (currentUser?.subscription_expires_at && new Date(currentUser.subscription_expires_at) > new Date())
  );

  const fetchAds = useCallback(async () => {
    try {
      const data = await apiRequest('/ads');
      if (data && Array.isArray(data.ads)) {
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
    if (isPaidInfluencer) return; // Paid / Influencer members NEVER see any ads!
    const target = adId
      ? adsList.find(a => a.id === adId)
      : adsList.find(a =>
          a.active &&
          (a.frequency === 'Pop-up Ads' || a.frequency === 'On App Open' || a.frequency === 'Once per session')
        );
    if (target) {
      setActivePopupAd(target);
      recordAdMetric(target.id, 'impression');
    }
  }, [isPaidInfluencer, adsList, recordAdMetric]);

  const dismissMobileAd = useCallback(() => {
    setActivePopupAd(null);
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
  }, []);

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
      registerForPushNotificationsAsync();
      const interval = setInterval(fetchNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchAds, fetchNotifications]);

  // Automatic In-App Pop-up Ad trigger for unpaid users
  useEffect(() => {
    if (!isAuthenticated || isPaidInfluencer || hasTriggeredAdOnLaunchRef.current) return;
    if (!adsList || adsList.length === 0) return;

    const popupAd = adsList.find(a =>
      a.active && (a.frequency === 'Pop-up Ads' || a.frequency === 'On App Open' || a.frequency === 'Once per session')
    );

    if (popupAd) {
      hasTriggeredAdOnLaunchRef.current = true;
      const timer = setTimeout(() => {
        showMobileAd(popupAd.id);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isPaidInfluencer, adsList, showMobileAd]);

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
      notifData.sender ||
      title.includes('message') ||
      title.includes('chat')
    ) {
      const partner = notifData.sender_username || notifData.sender || notifData.username;
      navigate('MainTabs', {
        screen: 'Inbox',
        params: partner ? {
          targetUser: {
            username: partner,
            name: notifData.sender_name || notifData.name || partner,
            avatar: notifData.sender_avatar || notifData.avatar,
          },
        } : undefined,
      });
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
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
        stories,
        fetchLiveStories,
        isLoadingFeed,
        fetchFeed,
        isReelsMuted,
        setIsReelsMuted,
        toggleMute: () => setIsReelsMuted(prev => !prev),
        activePlayingVideoId,
        setActivePlayingVideoId,
        toggleLikePost,
        recordPostView,
        toggleFollowCreator,
        followingUsernames,
        fetchMyFollowing,
        blockedUsers,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
