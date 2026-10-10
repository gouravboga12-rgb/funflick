import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, getToken, setToken, getStoredUser, setStoredUser } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/pushService';

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

  // Toggle follow
  const toggleFollowCreator = async (username) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.creator?.username === username) {
          return { ...p, isFollowing: !p.isFollowing };
        }
        return p;
      })
    );

    try {
      await apiRequest(`/follows/${username}/toggle`, { method: 'POST' });
    } catch (e) {
      console.warn('Toggle follow error:', e);
    }
  };

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
        blockedUsers,
        conversations,
        fetchLiveConversations,
        fetchConversationMessages,
        openOrCreateConversation,
        sendMessage,
        unsendMessage,
        userSubmissions,
        deleteUserPost,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
