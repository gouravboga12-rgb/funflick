import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CURRENT_USER,
  INITIAL_POSTS,
  INITIAL_STORIES,
  CREATORS,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONVERSATIONS,
  CREATOR_VIDEOS,
  INITIAL_PAYOUTS,
  ADMIN_PENDING_APPROVALS,
  PUBLISHING_PLANS,
  INFLUENCER_SUBSCRIPTION_PLANS,
  INITIAL_INFLUENCER_MEDIA,
  INITIAL_ADS,
  INITIAL_USER_SUBMISSIONS,
  INITIAL_COPYRIGHT_REPORTS,
  INITIAL_SUBSCRIPTION_TRANSACTIONS
} from '../data/mockData';

const AppContext = createContext(null);

// Automatic Cache Purge: ensures browser localStorage is wiped of old dummy data
const DATA_VERSION = 'v6_clean_production_slate';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('funflick_data_version') !== DATA_VERSION) {
      localStorage.removeItem('funflick_posts');
      localStorage.removeItem('funflick_stories');
      localStorage.removeItem('funflick_submissions');
      localStorage.removeItem('funflick_influencer_media');
      localStorage.removeItem('funflick_pending_approvals');
      localStorage.removeItem('funflick_payouts');
      localStorage.removeItem('funflick_conversations');
      localStorage.removeItem('funflick_notifications');
      localStorage.removeItem('funflick_subscription_transactions');
      localStorage.removeItem('funflick_creators');
      localStorage.removeItem('funflick_ads');
      localStorage.removeItem('funflick_copyright_reports');
      localStorage.removeItem('funflick_user_likes');
      localStorage.removeItem('funflick_user');
      localStorage.setItem('funflick_data_version', DATA_VERSION);
    }
  } catch (e) {}
}

export const AppProvider = ({ children }) => {
  // Current user state (Unified Viewer + Influencer)
  // Rule 1: Upload is free for everyone!
  // Rule 2: Subscribing to an Influencer plan unlocks Influencer status & deep analytics
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('funflick_user');
    let userObj = CURRENT_USER;
    if (saved) {
      try {
        userObj = { ...JSON.parse(saved) };
      } catch (e) {}
    }
    const freshState = {
      ...userObj,
      hasPublishingSubscription: true, // Free upload for everyone!
      isInfluencer: !!userObj.isInfluencer,
      accountStatus: userObj.isInfluencer ? 'Influencer' : 'User',
      subscriptionPlan: userObj.subscriptionPlan || null
    };
    try {
      localStorage.setItem('funflick_user', JSON.stringify(freshState));
    } catch (e) {}
    return freshState;
  });

  // Track session authentication (ensure new visitors get Get Started / Splash first)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('funflick_authenticated') === 'true';
  });

  const loginUser = (customUser) => {
    setIsAuthenticated(true);
    sessionStorage.setItem('funflick_authenticated', 'true');
    if (customUser) {
      setCurrentUser(prev => {
        const next = {
          ...prev,
          ...customUser,
          email: customUser.email || prev.email,
          phone: customUser.phone !== undefined ? customUser.phone : prev.phone
        };
        try {
          localStorage.setItem('funflick_user', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('funflick_authenticated');
  };

  // User video submissions (for Influencer Section verification tracker)
  const [userSubmissions, setUserSubmissions] = useState(() => {
    const saved = localStorage.getItem('funflick_submissions');
    return saved ? JSON.parse(saved) : INITIAL_USER_SUBMISSIONS;
  });

  // Posts feed state
  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('funflick_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  // Stories state
  const [stories, setStories] = useState(() => {
    const saved = localStorage.getItem('funflick_stories');
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  // Creators state
  const [creators, setCreators] = useState(() => {
    const saved = localStorage.getItem('funflick_creators');
    return saved ? JSON.parse(saved) : CREATORS;
  });

  // Wallet & transactions
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('funflick_txs');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('funflick_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Inbox & Chat
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('funflick_chats');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  // Creator studio videos
  const [creatorVideos, setCreatorVideos] = useState(CREATOR_VIDEOS);

  // Admin payouts
  const [adminPayouts, setAdminPayouts] = useState(() => {
    const saved = localStorage.getItem('funflick_payouts');
    return saved ? JSON.parse(saved) : INITIAL_PAYOUTS;
  });

  // Global Influencer Subscription Plans (Admin Managed & Globally Synced)
  const [publishingPlans, setPublishingPlans] = useState(() => {
    const saved = localStorage.getItem('funflick_publishing_plans');
    return saved ? JSON.parse(saved) : (INFLUENCER_SUBSCRIPTION_PLANS || PUBLISHING_PLANS);
  });

  // User Registration & Influencer Subscription Transactions (Razorpay Test Payments)
  const [subscriptionTransactions, setSubscriptionTransactions] = useState(() => {
    const saved = localStorage.getItem('funflick_subscription_transactions');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('funflick_subscription_transactions', JSON.stringify(subscriptionTransactions));
  }, [subscriptionTransactions]);

  // Influencer Media Items (For Admin Review & Rewards)
  const [influencerMedia, setInfluencerMedia] = useState(() => {
    const saved = localStorage.getItem('funflick_influencer_media');
    return saved ? JSON.parse(saved) : INITIAL_INFLUENCER_MEDIA;
  });

  useEffect(() => {
    localStorage.setItem('funflick_influencer_media', JSON.stringify(influencerMedia));
  }, [influencerMedia]);

  // Ads & Promotions (For Admin Management & In-App Popups)
  const [adsList, setAdsList] = useState(() => {
    const saved = localStorage.getItem('funflick_ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  // Active Mobile Popup Ad
  const [activePopupAd, setActivePopupAd] = useState(null);

  // Admin pending video approvals
  const [pendingApprovals, setPendingApprovals] = useState(() => {
    const saved = localStorage.getItem('funflick_pending_approvals');
    return saved ? JSON.parse(saved) : ADMIN_PENDING_APPROVALS;
  });

  useEffect(() => {
    localStorage.setItem('funflick_pending_approvals', JSON.stringify(pendingApprovals));
  }, [pendingApprovals]);

  // Copyright & Plagiarism Dispute Reports
  const [copyrightReports, setCopyrightReports] = useState(() => {
    const saved = localStorage.getItem('funflick_copyright_reports');
    return saved ? JSON.parse(saved) : INITIAL_COPYRIGHT_REPORTS;
  });

  useEffect(() => {
    localStorage.setItem('funflick_copyright_reports', JSON.stringify(copyrightReports));
  }, [copyrightReports]);

  // Blocked users list (Instagram-style block feature)
  const [blockedUsers, setBlockedUsers] = useState(() => {
    const saved = localStorage.getItem('funflick_blocked');
    return saved ? JSON.parse(saved) : [];
  });

  // View frame & demo switcher state
  const [phoneFrame, setPhoneFrame] = useState(true);
  const [subscriptionGateModalOpen, setSubscriptionGateModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Active Story Viewer Modal
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  // App Theme state ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('funflick_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('funflick_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('funflick_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('funflick_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('funflick_payouts', JSON.stringify(adminPayouts));
  }, [adminPayouts]);

  useEffect(() => {
    localStorage.setItem('funflick_submissions', JSON.stringify(userSubmissions));
  }, [userSubmissions]);

  useEffect(() => {
    localStorage.setItem('funflick_publishing_plans', JSON.stringify(publishingPlans));
  }, [publishingPlans]);

  // Live Feed & Videos synchronization with AWS MySQL backend
  const fetchLiveVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
          const livePosts = data.videos.map(v => ({
            id: v.id,
            title: v.title,
            caption: v.description || v.title,
            category: v.category || 'Comedy',
            mediaType: 'video',
            mediaUrl: v.video_url,
            posterUrl: v.thumbnail_url || v.video_url,
            likesCount: Number(v.likes_count) || 0,
            viewsCount: v.views_count ? String(v.views_count) : '0',
            commentsCount: 0,
            sharesCount: 0,
            savesCount: 0,
            creator: {
              id: v.creator_id,
              name: v.creator_name || 'Creator',
              username: v.creator_username || 'creator',
              avatar: v.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
              isVerified: true,
              isPrivate: false
            },
            timeAgo: 'Just now',
            isLiked: false,
            isFollowing: false,
            isSaved: false,
            comments: []
          }));
          setPosts(livePosts);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live videos from AWS MySQL:', err);
    }
  };

  // Global Media showcase limits (Admin configured: Reels 30s default, Stories 15s default, Posts 30s)
  const [mediaLimits, setMediaLimits] = useState(() => {
    const saved = localStorage.getItem('funflick_media_limits');
    return saved ? JSON.parse(saved) : {
      maxReelDuration: 30,
      maxStoryDuration: 15,
      maxPostDuration: 30
    };
  });

  // Fetch settings from AWS MySQL backend
  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setMediaLimits(data.settings);
          try {
            localStorage.setItem('funflick_media_limits', JSON.stringify(data.settings));
          } catch (e) {}
        }
      }
    } catch (err) {}
  };

  const updateMediaLimits = async (newLimits) => {
    setMediaLimits(prev => {
      const next = { ...prev, ...newLimits };
      try {
        localStorage.setItem('funflick_media_limits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

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

  // Liked posts per user account (stored by username)
  const [userLikesMap, setUserLikesMap] = useState(() => {
    const saved = localStorage.getItem('funflick_user_likes');
    return saved ? JSON.parse(saved) : {};
  });

  // Keep posts in sync with current user's liked posts
  useEffect(() => {
    const username = currentUser?.username || 'me';
    const userLikes = userLikesMap[username] || [];
    setPosts(prev => prev.map(p => ({
      ...p,
      isLiked: userLikes.includes(p.id)
    })));
  }, [currentUser?.username]);

  // Toggle post like with per-account persistence
  const toggleLikePost = (postId) => {
    const username = currentUser?.username || 'me';
    const userLikes = userLikesMap[username] || [];
    const isCurrentlyLiked = userLikes.includes(postId);
    const newLikedStatus = !isCurrentlyLiked;

    const updatedUserLikes = newLikedStatus 
      ? [...userLikes, postId] 
      : userLikes.filter(id => id !== postId);

    const nextMap = { ...userLikesMap, [username]: updatedUserLikes };
    setUserLikesMap(nextMap);
    try {
      localStorage.setItem('funflick_user_likes', JSON.stringify(nextMap));
    } catch (e) {}

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: newLikedStatus,
          likesCount: newLikedStatus ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 1) - 1)
        };
      }
      return p;
    }));

    setInfluencerMedia(prev => prev.map(m => {
      if (m.id === postId || m.postId === postId) {
        const nextLikes = newLikedStatus ? (m.likesCount || 0) + 1 : Math.max(0, (m.likesCount || 1) - 1);
        const views = parseViews(m.viewsCount || 1);
        return {
          ...m,
          likesCount: nextLikes,
          engagementRate: ((nextLikes + (m.commentsCount || 0)) / Math.max(1, views) * 100).toFixed(1) + '%'
        };
      }
      return m;
    }));

    // Sync with AWS MySQL database
    const token = localStorage.getItem('funflick_token');
    if (token) {
      fetch(`/api/videos/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
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

  // Real-Time View Counter Increment (Triggered after 2.5s continuous watch)
  const recordPostView = (postId) => {
    // Sync with AWS MySQL database
    fetch(`/api/videos/${postId}/view`, { method: 'POST' }).catch(() => {});

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
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
      if (m.id === postId || m.postId === postId) {
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
      if (p.id === postId) {
        const isSaved = !p.isSaved;
        showToast(isSaved ? 'Saved to your collection' : 'Removed from saved', 'info');
        return { ...p, isSaved };
      }
      return p;
    }));
  };

  // Toggle follow creator
  const toggleFollowCreator = (username) => {
    let nowFollowing = false;
    setCreators(prev => prev.map(c => {
      if (c.username === username) {
        nowFollowing = !c.isFollowing;
        return { ...c, isFollowing: nowFollowing };
      }
      return c;
    }));

    setPosts(prev => prev.map(p => {
      if (p.creator.username === username) {
        return { ...p, isFollowing: nowFollowing };
      }
      return p;
    }));

    showToast(nowFollowing ? `Following @${username}` : `Unfollowed @${username}`, 'info');
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

  // Add Comment to Post (synced with AWS MySQL)
  const addComment = async (postId, text) => {
    if (!text.trim()) return;

    // Sync with AWS MySQL database
    const token = localStorage.getItem('funflick_token');
    if (token) {
      try {
        await fetch(`/api/videos/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: text })
        });
      } catch (err) {}
    }
    const newComment = {
      id: 'cm_' + Date.now(),
      user: currentUser.username,
      avatar: currentUser.avatar,
      text,
      likes: 0,
      time: 'Just now'
    };
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [newComment, ...p.comments]
        };
      }
      return p;
    }));

    setInfluencerMedia(prev => prev.map(m => {
      if (m.id === postId || m.postId === postId) {
        const nextComments = (m.commentsCount || 0) + 1;
        const views = parseViews(m.viewsCount || 1);
        return {
          ...m,
          commentsCount: nextComments,
          engagementRate: (((m.likesCount || 0) + nextComments) / Math.max(1, views) * 100).toFixed(1) + '%'
        };
      }
      return m;
    }));

    showToast('Comment posted! 💬');
  };

  // Delete Comment (Allowed by Author, Post Creator, or Admin)
  const deleteComment = (postId, commentId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: Math.max(0, (p.commentsCount || 1) - 1),
          comments: (p.comments || []).filter(c => c.id !== commentId)
        };
      }
      return p;
    }));

    setInfluencerMedia(prev => prev.map(m => {
      if (m.id === postId || m.postId === postId) {
        const nextComments = Math.max(0, (m.commentsCount || 1) - 1);
        const views = parseViews(m.viewsCount || 1);
        return {
          ...m,
          commentsCount: nextComments,
          engagementRate: (((m.likesCount || 0) + nextComments) / Math.max(1, views) * 100).toFixed(1) + '%'
        };
      }
      return m;
    }));

    showToast('🗑️ Comment deleted', 'info');
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

  // Influencer Subscription Purchase (Free uploads for all; Subscription unlocks Influencer status & analytics)
  const purchasePublishingSubscription = (planId) => {
    const plan = publishingPlans.find(p => p.id === planId) || publishingPlans[0] || INFLUENCER_SUBSCRIPTION_PLANS[1];
    setCurrentUser(prev => ({
      ...prev,
      isInfluencer: true,
      hasInfluencerSubscription: true,
      hasPublishingSubscription: true,
      accountStatus: 'Influencer',
      subscriptionPlan: plan.name,
      walletBalance: Math.max(0, (prev.walletBalance || 125430) - plan.price)
    }));

    // Record wallet transaction
    const newTx = {
      id: 'tx_' + Date.now(),
      title: `Influencer ${plan.name} Subscription`,
      desc: `FunFlick Influencer Tier (${plan.formattedPrice})`,
      type: 'debit',
      amount: plan.price,
      formattedAmount: `-${plan.formattedPrice}`,
      date: 'Today',
      status: 'Completed',
      category: 'Subscription'
    };
    setTransactions(prev => [newTx, ...prev]);

    setSubscriptionGateModalOpen(false);
    showToast(`🎉 Influencer Status Activated! Welcome to FunFlick Influencer Suite (${plan.name})`, 'success');
  };

  // Record Verified Razorpay Test Subscription Payment
  const recordSubscriptionPayment = ({ plan, paymentId, paymentMethod = 'Razorpay Test (UPI / Card)' }) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newTransaction = {
      id: 'pay_' + (paymentId || ('test_' + Date.now())),
      razorpayPaymentId: paymentId || `pay_test_${Math.random().toString(36).substring(2, 9)}`,
      user: currentUser.username || 'srilatha_16',
      userName: currentUser.name || 'Srilatha Reddy',
      userEmail: currentUser.email || 'srilatha@funflick.com',
      userAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      planId: plan.id,
      planName: plan.name,
      planDuration: plan.duration || '30 Days',
      amount: Number(plan.price),
      formattedAmount: `₹${Number(plan.price).toLocaleString()}`,
      currency: 'INR',
      paymentGateway: paymentMethod,
      status: 'Captured',
      date: now.toISOString(),
      formattedDate,
      category: 'User Registration / Influencer Plan'
    };

    setSubscriptionTransactions(prev => [newTransaction, ...prev]);

    // Activate Influencer Status for the user
    setCurrentUser(prev => ({
      ...prev,
      isInfluencer: true,
      hasInfluencerSubscription: true,
      hasPublishingSubscription: true,
      accountStatus: 'Influencer',
      subscriptionPlan: plan.name
    }));

    // Record in user's wallet history
    const walletTx = {
      id: 'tx_rzp_' + Date.now(),
      title: `Influencer ${plan.name} (Razorpay)`,
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
    showToast(`🎉 Razorpay Test Payment Successful! Influencer Plan Activated (${plan.name})`, 'success');
    return newTransaction;
  };

  // Admin: Update an existing plan globally
  const updatePublishingPlan = (updatedPlan) => {
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
    showToast(`✅ Plan "${updatedPlan.name}" updated globally!`, 'success');
  };

  // Admin: Toggle plan active/inactive status
  const togglePlanActiveStatus = (planId) => {
    setPublishingPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const nextActive = p.active === false ? true : false;
        showToast(`Plan "${p.name}" is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}`, 'info');
        return { ...p, active: nextActive };
      }
      return p;
    }));
  };

  // Admin: Add a new custom plan
  const addPublishingPlan = (newPlan) => {
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
    showToast(`🎉 New plan "${newPlan.name}" added to influencer plans!`, 'success');
  };

  // Admin: Delete a plan
  const deletePublishingPlan = (planId) => {
    setPublishingPlans(prev => prev.filter(p => p.id !== planId));
    showToast('Plan removed from user-side pricing.', 'info');
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

  // Admin: Create New Ad
  const createAd = (adData) => {
    const newAd = {
      ...adData,
      id: 'ad_' + Date.now(),
      impressions: 0,
      clicks: 0,
      active: adData.active !== undefined ? adData.active : true,
      duration: Number(adData.duration) || 15,
      allowCloseAfter: Number(adData.allowCloseAfter) || 0
    };
    setAdsList(prev => [newAd, ...prev]);
    showToast(`📢 Ad "${newAd.title}" published successfully!`, 'success');
    return newAd;
  };

  // Admin: Update Ad
  const updateAd = (id, adData) => {
    setAdsList(prev => prev.map(ad => ad.id === id ? { ...ad, ...adData } : ad));
    showToast('✅ Advertisement updated successfully!', 'success');
  };

  // Admin: Delete Ad
  const deleteAd = (id) => {
    setAdsList(prev => prev.filter(ad => ad.id !== id));
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

  // Mobile In-App Ad Popup Trigger
  const showMobileAd = (adId) => {
    const targetAd = adId ? adsList.find(a => a.id === adId) : adsList.find(a => a.active) || adsList[0];
    if (targetAd) {
      setActivePopupAd(targetAd);
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

  // Delete a User Post (Instagram-Style Post Deletion)
  const deleteUserPost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setUserSubmissions(prev => prev.filter(s => s.id !== postId && s.title !== postId));
    setPendingApprovals(prev => prev.filter(a => a.id !== postId));
    setCreatorVideos(prev => prev.filter(cv => cv.id !== postId));
    setCurrentUser(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        posts: Math.max(0, (prev.stats?.posts || 1) - 1)
      }
    }));
    showToast('🗑️ Post deleted successfully!', 'info');
  };

  // Delete / withdraw submission from Influencer Hub
  const deleteUserSubmission = (submissionId) => {
    setUserSubmissions(prev => prev.filter(s => s.id !== submissionId));
    setPendingApprovals(prev => prev.filter(a => a.id !== submissionId));
    setPosts(prev => prev.filter(p => p.id !== submissionId));
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

  // Send message in chat (supports text & media up to 5MB)
  const sendMessage = (conversationId, text, media = null) => {
    if (!text?.trim() && !media) return;
    const myMsg = {
      id: 'm_' + Date.now(),
      sender: 'me',
      text: text?.trim() || '',
      media: media || null,
      time: 'Just now'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: media ? (media.type === 'video' ? '🎥 Video' : '📷 Photo') : text,
          time: 'Just now',
          messages: [...conv.messages, myMsg]
        };
      }
      return conv;
    }));

    // Simulate smart mock auto-reply after 1.5 seconds
    setTimeout(() => {
      const replies = [
        'Haha totally agree! 😂 Let us make a video on this!',
        'Super cool! Check out the draft I just sent you 🎬',
        'Awesome!! FunFlick is blowing up right now 🔥',
        'Love that! Catch you at the studio tomorrow ☕'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const theirMsg = {
        id: 'm_reply_' + Date.now(),
        sender: 'them',
        text: randomReply,
        time: 'Just now'
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: randomReply,
            time: 'Just now',
            messages: [...conv.messages, theirMsg]
          };
        }
        return conv;
      }));
    }, 1500);
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

  // Admin Approve / Reject Pending Video
  const handlePendingApproval = (approvalId, action) => {
    const target = pendingApprovals.find(a => a.id === approvalId);
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));

    if (action === 'approve') {
      // Update status in user submissions if matching
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

      // If there's an item, add to public feed posts or stories
      if (target) {
        if (target.contentType === 'story') {
          const newStoryItem = {
            id: 'st_item_' + Date.now(),
            mediaUrl: target.mediaUrl,
            caption: target.caption || target.title,
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
        } else {
          const livePost = {
            id: 'post_' + Date.now(),
            creator: {
              name: target.creatorName || (target.creator === currentUser.username ? currentUser.name : target.creator),
              username: target.creator || currentUser.username,
              avatar: target.avatar || currentUser.avatar,
              isVerified: true,
              isPrivate: (target.creator === currentUser.username) ? !!currentUser.isPrivate : false
            },
            title: target.title || 'New FunFlick Post',
            caption: target.caption || `${target.title} ${target.hashtags || ''}`,
            mediaType: target.contentType === 'image' ? 'image' : 'video',
            mediaUrl: target.mediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41445-large.mp4',
            posterUrl: target.thumbnail || target.mediaUrl,
            audioTitle: target.audioTitle || ('🎵 Original Sound - ' + (target.creator || currentUser.username)),
            location: target.location || '',
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            savesCount: 0,
            viewsCount: '0',
            timeAgo: 'Just now',
            category: target.category || 'Comedy',
            isLiked: false,
            isSaved: false,
            isFollowing: false,
            comments: []
          };
          setPosts(prev => [livePost, ...prev]);

          // Persist approved video directly into AWS MySQL database
          const token = localStorage.getItem('funflick_token');
          if (token && target.mediaUrl) {
            fetch('/api/videos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                title: target.title || 'New FunFlick Video',
                description: target.caption || target.title || '',
                category: target.category || 'Comedy',
                video_url: target.mediaUrl,
                thumbnail_url: target.thumbnail || target.mediaUrl,
                duration: 30
              })
            }).then(r => r.json()).then(data => {
              if (data?.videoId) {
                fetchLiveVideos();
              }
            }).catch(() => {});
          }

          // Also register under influencerMedia for admin engagement tracking & rewards
          const isCreatorInfluencer = (target.creator === currentUser.username) ? !!currentUser.isInfluencer : true;
          const newInfluencerItem = {
            id: livePost.id,
            postId: livePost.id,
            influencerName: livePost.creator.name,
            username: livePost.creator.username,
            avatar: livePost.creator.avatar,
            isInfluencer: isCreatorInfluencer,
            followersCount: (target.creator === currentUser.username ? currentUser.stats?.followers : 1000) || 1000,
            title: livePost.title,
            contentType: livePost.mediaType,
            mediaUrl: livePost.mediaUrl,
            thumbnail: livePost.posterUrl,
            viewsCount: 0,
            likesCount: 0,
            commentsCount: 0,
            engagementRate: '0.0%',
            paymentStatus: isCreatorInfluencer ? 'Pending Reward' : 'Eligible for Reward',
            suggestedReward: 500,
            paidAmount: 0,
            publishedDate: 'Today'
          };
          setInfluencerMedia(prev => [newInfluencerItem, ...prev]);

          if (target.creator === currentUser.username) {
            setCurrentUser(prev => ({
              ...prev,
              stats: { ...prev.stats, posts: (prev.stats?.posts || 0) + 1 }
            }));
          }
        }

        // Add user notification
        const approvedNotif = {
          id: 'notif_' + Date.now(),
          type: 'like',
          user: 'Admin Approval Desk',
          avatar: '/brand/funflick-logo.png',
          text: `🎉 Good news! Your ${target.contentType || 'content'} "${target.title}" was verified & approved by Admin! It is now live on FunFlick.`,
          time: 'Just now',
          unread: true
        };
        setNotifications(prev => [approvedNotif, ...prev]);
      }

      showToast(`✅ ${target?.contentType === 'story' ? 'Story' : 'Content'} approved and published live to FunFlick!`, 'success');
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
  };

  // Reset demo data
  const resetDemoData = () => {
    localStorage.clear();
    setCurrentUser(CURRENT_USER);
    setUserSubmissions(INITIAL_USER_SUBMISSIONS);
    setPosts(INITIAL_POSTS);
    setStories(INITIAL_STORIES);
    setCreators(CREATORS);
    setTransactions(INITIAL_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setConversations(INITIAL_CONVERSATIONS);
    setAdminPayouts(INITIAL_PAYOUTS);
    setPendingApprovals(ADMIN_PENDING_APPROVALS);
    showToast('Demo data reset to factory state!', 'info');
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
        subscribeToCreator,
        addComment,
        deleteComment,
        blockedUsers,
        blockUser,
        unblockUser,
        purchasePublishingSubscription,
        recordSubscriptionPayment,
        subscriptionTransactions,
        setSubscriptionTransactions,
        toggleUserSubscriptionStatus,
        publishNewPost,
        deleteUserPost,
        deleteUserSubmission,
        publishNewStory,
        publishNewVideo,
        submitVideoForVerification,
        submitPostForVerification,
        submitStoryForVerification,
        sendPerformanceReward,
        sendMessage,
        processAdminPayout,
        processCustomAdminPayout,
        requestCreatorPayout,
        copyrightReports,
        resolveCopyrightReport,
        submitCopyrightReport,
        handlePendingApproval,
        publishingPlans,
        updatePublishingPlan,
        addPublishingPlan,
        deletePublishingPlan,
        togglePlanActiveStatus,
        resetPublishingPlansToDefault,
        influencerMedia,
        sendInfluencerReward,
        adsList,
        createAd,
        updateAd,
        deleteAd,
        toggleAdStatus,
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
        logoutUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
