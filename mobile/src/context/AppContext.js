import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, getToken, setToken, getStoredUser, setStoredUser } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/pushService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [posts, setPosts] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isReelsMuted, setIsReelsMuted] = useState(false);
  const [activePlayingVideoId, setActivePlayingVideoId] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Load auth session on launch
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const user = await getStoredUser();
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
  }, [fetchFeed]);

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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoadingAuth,
        login,
        register,
        logout,
        posts,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
