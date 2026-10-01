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
  INITIAL_USER_SUBMISSIONS
} from '../data/mockData';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Current user state (Unified Viewer + Influencer)
  // Ensure subscription is OFF by default for test account so user can test subscription flow fresh
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
      hasPublishingSubscription: false,
      subscriptionPlan: null
    };
    try {
      localStorage.setItem('funflick_user', JSON.stringify(freshState));
    } catch (e) {}
    return freshState;
  });

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

  // Global Publishing Subscription Plans (Admin Managed & Globally Synced)
  const [publishingPlans, setPublishingPlans] = useState(() => {
    const saved = localStorage.getItem('funflick_publishing_plans');
    return saved ? JSON.parse(saved) : PUBLISHING_PLANS;
  });

  // Admin pending video approvals
  const [pendingApprovals, setPendingApprovals] = useState(ADMIN_PENDING_APPROVALS);

  // View frame & demo switcher state
  const [phoneFrame, setPhoneFrame] = useState(true);
  const [subscriptionGateModalOpen, setSubscriptionGateModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Active Story Viewer Modal
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

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

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Toggle post like
  const toggleLikePost = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1
        };
      }
      return p;
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

  // Add Comment to Post
  const addComment = (postId, text) => {
    if (!text.trim()) return;
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
    showToast('Comment posted! 💬');
  };

  // FunFlick Platform Publishing Subscription Purchase
  const purchasePublishingSubscription = (planId) => {
    const plan = publishingPlans.find(p => p.id === planId) || publishingPlans[0] || PUBLISHING_PLANS[1];
    setCurrentUser(prev => ({
      ...prev,
      hasPublishingSubscription: true,
      subscriptionPlan: plan.name,
      walletBalance: Math.max(0, prev.walletBalance - plan.price)
    }));

    // Record wallet transaction
    const newTx = {
      id: 'tx_' + Date.now(),
      title: `Publishing ${plan.name} Subscription`,
      desc: `FunFlick Creator Plan (${plan.formattedPrice})`,
      type: 'debit',
      amount: plan.price,
      formattedAmount: `-${plan.formattedPrice}`,
      date: 'Today',
      status: 'Completed',
      category: 'Subscription'
    };
    setTransactions(prev => [newTx, ...prev]);

    setSubscriptionGateModalOpen(false);
    showToast(`🎉 Publishing Unlocked! Welcome to FunFlick Creator Suite (${plan.name} Plan)`, 'success');
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
    showToast(`✅ Plan "${updatedPlan.name}" updated globally across user side!`, 'success');
  };

  // Admin: Add a new custom plan
  const addPublishingPlan = (newPlan) => {
    const planId = newPlan.id || 'plan_' + Date.now();
    const formatted = {
      ...newPlan,
      id: planId,
      price: Number(newPlan.price),
      formattedPrice: `₹${Number(newPlan.price).toLocaleString()}`,
      popular: !!newPlan.popular,
      features: Array.isArray(newPlan.features) ? newPlan.features : ['Unlimited video uploads', 'Creator studio tools']
    };
    setPublishingPlans(prev => [...prev, formatted]);
    showToast(`🎉 New plan "${newPlan.name}" added to user subscription plans!`, 'success');
  };

  // Admin: Delete a plan
  const deletePublishingPlan = (planId) => {
    setPublishingPlans(prev => prev.filter(p => p.id !== planId));
    showToast('Plan removed from user-side pricing.', 'info');
  };

  // Admin: Reset plans to default
  const resetPublishingPlansToDefault = () => {
    setPublishingPlans(PUBLISHING_PLANS);
    localStorage.removeItem('funflick_publishing_plans');
    showToast('Publishing plans reset to default factory values!', 'info');
  };

  // Toggle user subscription for quick testing in prototype demo
  const toggleUserSubscriptionStatus = () => {
    setCurrentUser(prev => {
      const nextStatus = !prev.hasPublishingSubscription;
      showToast(nextStatus ? 'Publishing subscription: ACTIVE (Unlocked)' : 'Publishing subscription: INACTIVE (Locked)', 'info');
      return {
        ...prev,
        hasPublishingSubscription: nextStatus,
        subscriptionPlan: nextStatus ? 'Monthly' : null
      };
    });
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

  // Send message in chat
  const sendMessage = (conversationId, text) => {
    if (!text.trim()) return;
    const myMsg = {
      id: 'm_' + Date.now(),
      sender: 'me',
      text,
      time: 'Just now'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: text,
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

  // Submit Video for Central Admin Verification (Unified Influencer Workflow)
  const submitVideoForVerification = (videoData) => {
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post reels!', 'error');
      return { success: false, reason: 'subscription_required' };
    }

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

  // Submit Post (Photo / Clip) for Central Admin Verification (Instagram-Style Flow)
  const submitPostForVerification = (postData) => {
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post media!', 'error');
      return { success: false, reason: 'subscription_required' };
    }

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

  // Submit Story for Central Admin Verification
  const submitStoryForVerification = (storyData) => {
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post stories!', 'error');
      return { success: false, reason: 'subscription_required' };
    }

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
              isVerified: true
            },
            title: target.title || 'New FunFlick Post',
            caption: target.caption || `${target.title} ${target.hashtags || ''}`,
            mediaType: target.contentType === 'image' ? 'image' : 'video',
            mediaUrl: target.mediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41445-large.mp4',
            posterUrl: target.thumbnail || target.mediaUrl,
            audioTitle: target.audioTitle || ('🎵 Original Sound - ' + (target.creator || currentUser.username)),
            location: target.location || '',
            tags: target.tags || [],
            likesCount: 1,
            commentsCount: 0,
            sharesCount: 0,
            savesCount: 0,
            viewsCount: '1',
            timeAgo: 'Just now',
            category: target.category || 'Comedy',
            isLiked: false,
            isSaved: false,
            isFollowing: false,
            comments: []
          };
          setPosts(prev => [livePost, ...prev]);

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
        toggleSavePost,
        toggleFollowCreator,
        subscribeToCreator,
        addComment,
        purchasePublishingSubscription,
        toggleUserSubscriptionStatus,
        publishNewPost,
        publishNewStory,
        publishNewVideo,
        submitVideoForVerification,
        submitPostForVerification,
        submitStoryForVerification,
        sendPerformanceReward,
        sendMessage,
        processAdminPayout,
        handlePendingApproval,
        publishingPlans,
        updatePublishingPlan,
        addPublishingPlan,
        deletePublishingPlan,
        resetPublishingPlansToDefault,
        resetDemoData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
