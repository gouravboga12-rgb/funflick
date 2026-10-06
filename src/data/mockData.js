// Clean, Production-Ready Datasets for FunFlick / Fanplex
// All dummy posts, reels, stories, creators, and conversations removed.

export const BRAND = {
  name: 'FunFlick',
  tagline: 'Comedy. Entertainment. Always On!',
  logo: '/brand/funflick-logo.png',
};

// Influencer Subscription Plans (Free uploads for all; Subscription unlocks Influencer status & analytics)
export const INFLUENCER_SUBSCRIPTION_PLANS = [
  {
    id: 'weekly',
    name: 'Weekly Influencer',
    price: 99,
    formattedPrice: '₹99',
    period: 'week',
    duration: '7 Days',
    label: 'Starter Pass',
    description: 'Perfect for trying Influencer analytics & rewards for 7 days',
    popular: false,
    active: true,
    savings: null,
    features: [
      'Official Influencer status badge',
      'Advanced performance analytics (Views, Likes, Comments, Shares, Saves)',
      'Engagement rate analysis',
      'Eligible for Admin Content Cash Rewards',
      'Fast-track creator support'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly Influencer Pro',
    price: 199,
    formattedPrice: '₹199',
    period: 'month',
    duration: '30 Days',
    label: 'Most Popular',
    description: 'Billed monthly. Cancel anytime.',
    popular: true,
    active: true,
    savings: 'Save 45%',
    features: [
      'Official Influencer status badge',
      'Full in-depth video & reel analytics',
      'Views, Likes, Comments, Shares, Saves & Engagement %',
      'Eligible for Admin Performance Cash Rewards',
      'Direct wallet earnings transfer',
      'Priority content indexing in Discover'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Influencer Star',
    price: 499,
    formattedPrice: '₹499',
    period: '3 months',
    duration: '90 Days',
    label: 'Best Value',
    description: '₹166/month. Save more for consistent creators.',
    popular: false,
    active: true,
    savings: 'Save 60%',
    features: [
      'All Monthly Influencer Pro benefits',
      'Quarterly Influencer spotlight boost',
      'Top priority for Admin performance payouts',
      'Exclusive brand promotion opportunities',
      'Dedicated influencer manager'
    ]
  },
  {
    id: 'yearly',
    name: 'Annual VIP Influencer',
    price: 1499,
    formattedPrice: '₹1,499',
    period: 'year',
    duration: '365 Days',
    label: 'VIP Access',
    description: '₹125/month. For serious professional creators.',
    popular: false,
    active: true,
    savings: 'Save 70%',
    features: [
      'All Quarterly benefits included',
      'VIP Gold Influencer verification badge',
      'Maximum tier for Admin content cash rewards',
      'Invitation to FunFlick Creator Summits',
      'Early access to all upcoming monetization tools'
    ]
  }
];

// Alias for backwards compatibility
export const PUBLISHING_PLANS = INFLUENCER_SUBSCRIPTION_PLANS;

// Creator Direct Subscription Plans (Fan subscriptions)
export const CREATOR_SUBSCRIPTION_PLANS = [
  {
    id: 'creator_monthly',
    name: 'Fan Club Pass',
    price: 99,
    formattedPrice: '₹99',
    period: 'month',
    features: [
      'Access to exclusive behind-the-scenes videos',
      'Special fan badge in comment sections',
      'Early access to new weekly comedy drops',
      'Direct messaging priority'
    ]
  },
  {
    id: 'creator_quarterly',
    name: 'VIP Comedy Supporter',
    price: 249,
    formattedPrice: '₹249',
    period: '3 months',
    savings: 'Save 16%',
    popular: true,
    features: [
      'All Fan Club Pass perks',
      'Monthly live Q&A sessions with creator',
      'Shoutout in video credits',
      'Custom fan sticker pack'
    ]
  }
];

// Creator Benefits
export const CREATOR_BENEFITS = [
  'Earn 70% of subscription revenue directly to your wallet',
  'Weekly automatic payouts to verified bank accounts',
  'Exclusive creator analytics dashboard & audience insights',
  'Direct fan engagement tools and subscriber-only content'
];

export const DEFAULT_AVATAR = '/brand/default-avatar.svg';

// Current logged in user - Clean State
export const CURRENT_USER = {
  id: 'usr_me',
  name: 'New Creator',
  username: 'creator_1',
  email: 'creator@funflick.com',
  avatar: '/brand/default-avatar.svg',
  avatar_url: '/brand/default-avatar.svg',
  bio: 'FunFlick Creator | Living for laughs & entertainment 💃✨',
  location: 'Hyderabad, India',
  stats: {
    posts: 0,
    following: 0,
    followers: '0'
  },
  creatorStatus: 'Active Creator',
  creatorMetrics: {
    totalViews: '0',
    totalReactions: '0',
    engagementRate: '0%',
    performanceEarnings: '₹0',
    totalUploads: 0,
    subscribersCount: 0
  },
  hasPublishingSubscription: true, // Free upload for all users
  isInfluencer: false,
  hasInfluencerSubscription: false,
  subscriptionPlan: null,
  walletBalance: 0,
  availableBalance: 0,
  pendingBalance: 0,
  isVerified: false
};

// Initial User Video Submissions (Empty - Populated as user uploads)
export const INITIAL_USER_SUBMISSIONS = [];

// Creators (Empty - Populated as users publish content)
export const CREATORS = [];

// Stories for the horizontal top bar (Only User Story initially)
export const INITIAL_STORIES = [
  {
    id: 'st_my',
    isUser: true,
    username: 'Your Story',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    hasUnseen: false,
    stories: []
  }
];

// Feed & Reels Content (Empty - Populated when admin approves uploads)
export const INITIAL_POSTS = [];

// Discover Categories
export const DISCOVER_CATEGORIES = [
  { id: 'cat_all', name: 'Trending', icon: 'Flame', emoji: '🔥', color: 'from-amber-500 via-orange-500 to-red-500', activeRing: 'ring-amber-500/50', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  { id: 'cat_comedy', name: 'Comedy', icon: 'Laugh', emoji: '😂', color: 'from-pink-500 via-rose-500 to-red-500', activeRing: 'ring-pink-500/50', border: 'border-pink-500/40', bg: 'bg-pink-500/10' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Clapperboard', emoji: '🎬', color: 'from-purple-600 via-violet-600 to-indigo-600', activeRing: 'ring-purple-500/50', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  { id: 'cat_dance', name: 'Dance', icon: 'Music2', emoji: '💃', color: 'from-cyan-400 via-blue-500 to-indigo-600', activeRing: 'ring-cyan-500/50', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  { id: 'cat_standup', name: 'Stand-up', icon: 'Mic2', emoji: '🎙️', color: 'from-amber-400 via-yellow-500 to-orange-500', activeRing: 'ring-yellow-500/50', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  { id: 'cat_memes', name: 'Memes', icon: 'Zap', emoji: '🤪', color: 'from-emerald-400 via-teal-500 to-cyan-500', activeRing: 'ring-emerald-500/50', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
  { id: 'cat_lifestyle', name: 'Lifestyle', icon: 'Sparkles', emoji: '✨', color: 'from-fuchsia-500 via-pink-500 to-rose-400', activeRing: 'ring-fuchsia-500/50', border: 'border-fuchsia-500/40', bg: 'bg-fuchsia-500/10' },
  { id: 'cat_regional', name: 'Regional', fullName: 'Regional Comedy', icon: 'Languages', emoji: '🇮🇳', color: 'from-violet-600 via-purple-600 to-indigo-700', activeRing: 'ring-violet-500/50', border: 'border-violet-500/40', bg: 'bg-violet-500/10' }
];

// Trending Now Discover Cards (Empty - Populated from approved posts)
export const TRENDING_DISCOVER_VIDEOS = [];

// Trending Hashtags
export const TRENDING_HASHTAGS = [
  { tag: '#FunFlickComedy', posts: '0 videos' },
  { tag: '#TrendingReels', posts: '0 videos' },
  { tag: '#StandUpComedy', posts: '0 videos' },
  { tag: '#ViralMoments', posts: '0 videos' },
  { tag: '#TeluguComedy', posts: '0 videos' }
];

// Wallet Transactions (Empty initially)
export const INITIAL_TRANSACTIONS = [];

// Notifications (Live from AWS MySQL)
export const INITIAL_NOTIFICATIONS = [];

// Messages / Conversations (Live from AWS MySQL)
export const INITIAL_CONVERSATIONS = [];

// Creator Studio Videos List (Empty initially)
export const CREATOR_VIDEOS = [];

// Admin Platform KPI stats (Clean starting baseline)
export const ADMIN_STATS = {
  totalUsers: '1',
  activeUsers: '1',
  totalCreators: '0',
  totalVideos: '0',
  totalPosts: '0',
  totalStories: '0',
  activeSubscriptions: '0',
  subscriptionRevenue: '₹0',
  creatorPayments: '₹0',
  pendingApprovals: 0,
  reportedContent: 0,
  platformProfit: '₹0'
};

// Admin Creator Payouts (Empty initially)
export const INITIAL_PAYOUTS = [];

// Admin Reports list (Empty initially)
export const ADMIN_REPORTS = [];

// Copyright & Plagiarism Dispute Reports (Empty initially)
export const INITIAL_COPYRIGHT_REPORTS = [];

// Admin Pending Approvals (Empty initially)
export const ADMIN_PENDING_APPROVALS = [];

// Initial Media for Admin Influencer Review & Content Rewards (Empty initially)
export const INITIAL_INFLUENCER_MEDIA = [];

// Initial In-App Mobile Ads (Empty initially)
export const INITIAL_ADS = [];

// Initial Registration & Influencer Subscription Revenue Transactions (Empty initially)
export const INITIAL_SUBSCRIPTION_TRANSACTIONS = [];
