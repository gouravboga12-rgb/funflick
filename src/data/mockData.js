// Realistic mock data for FunFlick Prototype matching the visual reference

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

// Creator Direct Subscription Plans (Fan subscriptions like Screen 7)
export const CREATOR_SUBSCRIPTION_PLANS = [
  {
    id: 'creator_monthly',
    name: 'Monthly',
    price: 99,
    formattedPrice: '₹99 / month',
    note: 'Cancel anytime',
    badge: null,
    popular: false
  },
  {
    id: 'creator_quarterly',
    name: 'Quarterly',
    price: 249,
    formattedPrice: '₹249',
    note: '(₹83/month)',
    badge: 'Save 16%',
    popular: true
  },
  {
    id: 'creator_yearly',
    name: 'Yearly',
    price: 899,
    formattedPrice: '₹899',
    note: '(₹75/month)',
    badge: 'Save 24%',
    popular: false
  }
];

export const CREATOR_BENEFITS = [
  { icon: 'Crown', title: 'Exclusive Videos', desc: 'Subscriber-only comedy clips & uncut bloopers' },
  { icon: 'Zap', title: 'Early Access', desc: 'Watch new releases 24 hours before anyone else' },
  { icon: 'Film', title: 'Behind the Scenes', desc: 'Exclusive rehearsal & set production footage' },
  { icon: 'Radio', title: 'Live Sessions', desc: 'Weekly live interactive Q&A and comedy jamming' },
  { icon: 'MessageCircle', title: 'Chat with Creator', desc: 'Direct access to subscriber chat room' },
  { icon: 'Star', title: 'Special Shoutouts', desc: 'Monthly subscriber shoutouts on creator stories' },
];

// Current logged in user (Srilatha as in Screen 6) - Unified Viewer & Influencer Account
export const CURRENT_USER = {
  id: 'usr_me',
  name: 'Srilatha',
  username: 'srilatha_16',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Living for laughs & entertainment 💃✨ | Film buff & foodie | FunFlick Creator',
  location: 'Hyderabad, India',
  stats: {
    posts: 128,
    following: 420,
    followers: '2.3K'
  },
  creatorStatus: 'Active Creator',
  creatorMetrics: {
    totalViews: '84.5K',
    totalReactions: '12.4K',
    engagementRate: '8.7%',
    performanceEarnings: '₹14,500',
    totalUploads: 6,
    subscribersCount: 340
  },
  hasPublishingSubscription: false, // can be toggled or purchased
  subscriptionPlan: null,
  walletBalance: 125430,
  availableBalance: 100430,
  pendingBalance: 25000,
  isVerified: false
};

// Initial User Video Submissions for the Unified Influencer Hub
export const INITIAL_USER_SUBMISSIONS = [
  {
    id: 'sub_1',
    title: 'Diet Starts From Monday - Expectation vs Reality',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    category: 'Comedy',
    date: 'Today, 2:15 PM',
    status: 'Pending Admin Verification',
    views: '0 (In Review)',
    likes: '0',
    adminNote: 'Sent to central admin desk for quality review',
    rewardGranted: null
  },
  {
    id: 'sub_2',
    title: 'Stand-up Comedy Open Mic Debut - Hyderabad Cafes',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80',
    category: 'Stand-up',
    date: 'Aug 24, 2026',
    status: 'Approved & Live',
    views: '84.5K',
    likes: '12.4K',
    adminNote: 'Approved & Viral! Reached high view milestone.',
    rewardGranted: 5000
  }
];

// Creators matching Screen 4, 5, 9, 12
export const CREATORS = [
  {
    id: 'c1',
    name: 'Pavani Official',
    username: 'pavani_official',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    badge: 'Verified Creator',
    isVerified: true,
    bio: 'Making you laugh every day 😄 | Comedy | Lifestyle | Entertainment | 📍 Hyderabad',
    tags: ['Comedy', 'Lifestyle', 'Entertainment'],
    stats: {
      videos: 324,
      followers: '2.1M',
      following: 150,
      subscribers: '24.3K',
      totalViews: '12.5M',
      totalLikes: '856K',
      estimatedEarnings: '₹45,320'
    },
    socials: {
      instagram: 'pavani_fun',
      youtube: 'PavaniComedyOfficial'
    },
    isFollowing: false,
    isSubscribed: false
  },
  {
    id: 'c2',
    name: 'Fun Bros',
    username: 'fun_bros',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    badge: 'Verified Creator',
    isVerified: true,
    bio: 'Two brothers making absurd sketches that will make you spit your chai ☕💥',
    tags: ['Comedy', 'Sketches', 'Memes'],
    stats: {
      videos: 189,
      followers: '1.6M',
      following: 88,
      subscribers: '18.7K',
      totalViews: '9.8M',
      totalLikes: '670K',
      estimatedEarnings: '₹38,200'
    },
    socials: {
      instagram: 'funbros_comedy',
      youtube: 'FunBrosTv'
    },
    isFollowing: false,
    isSubscribed: false
  },
  {
    id: 'c3',
    name: 'Comedy Raju',
    username: 'comedy_raju',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80',
    badge: 'Verified Creator',
    isVerified: true,
    bio: 'Stand-up comedian & punchline king 🎤 | Telugu & Hindi comedy',
    tags: ['Stand-up', 'Comedy', 'Regional'],
    stats: {
      videos: 215,
      followers: '1.5M',
      following: 110,
      subscribers: '15.2K',
      totalViews: '8.4M',
      totalLikes: '590K',
      estimatedEarnings: '₹32,150'
    },
    socials: {
      instagram: 'comedy_raju',
      youtube: 'RajuStandUp'
    },
    isFollowing: false,
    isSubscribed: false
  },
  {
    id: 'c4',
    name: 'Chill Mammu',
    username: 'chill_mammu',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
    badge: 'Popular Creator',
    isVerified: true,
    bio: 'Relatable life rants & hostel memories 🍕 Always chill, never serious.',
    tags: ['Memes', 'Lifestyle', 'College'],
    stats: {
      videos: 142,
      followers: '920K',
      following: 95,
      subscribers: '9.8K',
      totalViews: '5.1M',
      totalLikes: '410K',
      estimatedEarnings: '₹22,900'
    },
    socials: {
      instagram: 'chill_mammu',
      youtube: 'ChillMammu'
    },
    isFollowing: false,
    isSubscribed: false
  }
];

// Stories for the horizontal top bar (Screen 3 & 4)
export const INITIAL_STORIES = [
  {
    id: 'st_my',
    isUser: true,
    username: 'Your Story',
    avatar: CURRENT_USER.avatar,
    hasUnseen: false,
    stories: []
  },
  {
    id: 'st_1',
    creatorId: 'c1',
    username: 'pavani_official',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    hasUnseen: true,
    stories: [
      {
        id: 's1_1',
        mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        caption: 'Shooting Episode 3 today! You are not ready for this twist 🤫🔥',
        time: '2h ago'
      },
      {
        id: 's1_2',
        mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        caption: 'BTS with the team laughing at every retake 😂',
        time: '1h ago'
      }
    ]
  },
  {
    id: 'st_2',
    creatorId: 'c2',
    username: 'fun_bros',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    hasUnseen: true,
    stories: [
      {
        id: 's2_1',
        mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        caption: 'New sketch dropping at 6 PM! Tag that friend who is always late!',
        time: '3h ago'
      }
    ]
  },
  {
    id: 'st_3',
    creatorId: 'c3',
    username: 'comedy_raju',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    hasUnseen: true,
    stories: [
      {
        id: 's3_1',
        mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
        caption: 'Housefull show in Bangalore! Thank you all ❤️ Next up: Hyderabad!',
        time: '4h ago'
      }
    ]
  },
  {
    id: 'st_4',
    creatorId: 'c4',
    username: 'chill_mammu',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    hasUnseen: false,
    stories: [
      {
        id: 's4_1',
        mediaUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
        caption: 'Monday motivation: Chai + Samosa ☕',
        time: '8h ago'
      }
    ]
  }
];

// Rich Feed & Reels Content
export const INITIAL_POSTS = [
  {
    id: 'post_1',
    creator: {
      name: 'Pavani Official',
      username: 'pavani_official',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    title: 'When your friend says "Diet from Monday"',
    caption: 'When your friend says "Diet from Monday" 🤣🤣 and you catch them at midnight ordering biryani! Tag that foodie friend who can never resist! #comedy #funny #relatable #funflick #telugucomedy #foodmemes',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41445-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    audioTitle: '🎵 Original Audio - Pavani Official & Team',
    likesCount: 25420,
    commentsCount: 1240,
    sharesCount: 5630,
    savesCount: 5600,
    viewsCount: '1.2M',
    timeAgo: '2 hours ago',
    category: 'Comedy',
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    comments: [
      { id: 'cm_1', user: 'Rahul_Vibe', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', text: 'Literally happened with my roommate yesterday 😂😂', likes: 142, time: '1h ago' },
      { id: 'cm_2', user: 'Sneha_Laughs', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', text: 'The facial expression at 0:15 killed me lol!', likes: 89, time: '45m ago' },
      { id: 'cm_3', user: 'Kiran_K', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', text: 'Pavani your comic timing is unbeatable 🔥❤️', likes: 210, time: '30m ago' }
    ]
  },
  {
    id: 'post_2',
    creator: {
      name: 'Fun Bros',
      username: 'fun_bros',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    title: 'Office Comedy Part 2 - Work From Home vs Office',
    caption: 'Office boss vs Employee expectation vs reality! Watch till the end for the HR plot twist 👨‍💼📉 #officehumor #funbros #trendingcomedy #worklife',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-laughing-together-outdoors-42867-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    audioTitle: '🎵 Office Chaos Beats - Fun Bros Original',
    likesCount: 42100,
    commentsCount: 1300,
    sharesCount: 8500,
    savesCount: 6200,
    viewsCount: '2.4M',
    timeAgo: '5 hours ago',
    category: 'Comedy',
    isLiked: true,
    isSaved: false,
    isFollowing: true,
    comments: [
      { id: 'cm_4', user: 'Techie_Anil', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80', text: 'Sending this straight to my work WhatsApp group 😂', likes: 320, time: '3h ago' }
    ]
  },
  {
    id: 'post_3',
    creator: {
      name: 'Comedy Raju',
      username: 'comedy_raju',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    title: 'Tag that Foodie Friend 🍕🤤',
    caption: 'Every friend group has that ONE guy who calculates distance by restaurants! Tag him now! 😂 #standup #streetfood #foodie #comedyraju',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-the-rain-43093-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    audioTitle: '🎵 Street Food Symphony - Raju Standup Live',
    likesCount: 38900,
    commentsCount: 940,
    sharesCount: 4700,
    savesCount: 4100,
    viewsCount: '1.8M',
    timeAgo: '1 day ago',
    category: 'Stand-up',
    isLiked: false,
    isSaved: true,
    isFollowing: false,
    comments: [
      { id: 'cm_5', user: 'FoodLover_Maya', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80', text: 'I feel personally attacked by this reel haha!', likes: 78, time: '12h ago' }
    ]
  },
  {
    id: 'post_4',
    creator: {
      name: 'Chill Mammu',
      username: 'chill_mammu',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    title: 'Relatable Moments - Sunday Night Existential Crisis',
    caption: 'When 10 PM hits on Sunday and you realize the weekend is officially over 💀🛌 #chillmammu #relatable #weekendvibes #memesdaily',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-sharing-stories-and-laughing-42866-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    audioTitle: '🎵 Melancholy Sunday Remix - Chill Vibes',
    likesCount: 19800,
    commentsCount: 620,
    sharesCount: 3400,
    savesCount: 2900,
    viewsCount: '1.1M',
    timeAgo: '2 days ago',
    category: 'Memes',
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    comments: []
  }
];

// Discover Categories
export const DISCOVER_CATEGORIES = [
  { id: 'cat_all', name: 'Trending', icon: 'Flame', emoji: '🔥', color: 'from-amber-500 via-orange-500 to-red-600', activeRing: 'ring-orange-500/50', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  { id: 'cat_comedy', name: 'Comedy', icon: 'Laugh', emoji: '😂', color: 'from-pink-500 via-rose-500 to-red-500', activeRing: 'ring-pink-500/50', border: 'border-pink-500/40', bg: 'bg-pink-500/10' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Clapperboard', emoji: '🎬', color: 'from-purple-600 via-violet-600 to-indigo-600', activeRing: 'ring-purple-500/50', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  { id: 'cat_dance', name: 'Dance', icon: 'Music2', emoji: '💃', color: 'from-cyan-400 via-blue-500 to-indigo-600', activeRing: 'ring-cyan-500/50', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  { id: 'cat_standup', name: 'Stand-up', icon: 'Mic2', emoji: '🎙️', color: 'from-amber-400 via-yellow-500 to-orange-500', activeRing: 'ring-yellow-500/50', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  { id: 'cat_memes', name: 'Memes', icon: 'Zap', emoji: '🤪', color: 'from-emerald-400 via-teal-500 to-cyan-500', activeRing: 'ring-emerald-500/50', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
  { id: 'cat_lifestyle', name: 'Lifestyle', icon: 'Sparkles', emoji: '✨', color: 'from-fuchsia-500 via-pink-500 to-rose-400', activeRing: 'ring-fuchsia-500/50', border: 'border-fuchsia-500/40', bg: 'bg-fuchsia-500/10' },
  { id: 'cat_regional', name: 'Regional', fullName: 'Regional Comedy', icon: 'Languages', emoji: '🇮🇳', color: 'from-violet-600 via-purple-600 to-indigo-700', activeRing: 'ring-violet-500/50', border: 'border-violet-500/40', bg: 'bg-violet-500/10' }
];

// Trending Now Discover Cards
export const TRENDING_DISCOVER_VIDEOS = [
  {
    id: 'td_1',
    title: 'Office Comedy Part 2',
    views: '2.4M',
    tag: '#funny',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    creator: 'Fun Bros'
  },
  {
    id: 'td_2',
    title: 'Relatable Moments',
    views: '1.1M',
    tag: '#comedy',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    creator: 'Chill Mammu'
  },
  {
    id: 'td_3',
    title: 'Friends Forever',
    views: '3.2M',
    tag: '#entertainment',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    creator: 'Pavani Official'
  },
  {
    id: 'td_4',
    title: 'Street Food Challenge',
    views: '980K',
    tag: '#standup',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    creator: 'Comedy Raju'
  }
];

// Trending Hashtags
export const TRENDING_HASHTAGS = [
  { tag: '#DietFromMonday', posts: '42.8K videos' },
  { tag: '#FunFlickComedy', posts: '128.5K videos' },
  { tag: '#OfficeHumor', posts: '96.2K videos' },
  { tag: '#HostelLife', posts: '54.1K videos' },
  { tag: '#TeluguComedy', posts: '89.4K videos' },
  { tag: '#StandUpReels', posts: '31.7K videos' },
];

// Wallet Transactions
export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx_1',
    title: 'Comedy Video #102 Payout',
    desc: 'Ad revenue & creator bonus',
    type: 'credit',
    amount: 3000,
    formattedAmount: '+₹3,000',
    date: '20 Aug, 2026',
    status: 'Completed',
    category: 'Video Earnings'
  },
  {
    id: 'tx_2',
    title: 'Publishing Monthly Subscription',
    desc: 'FunFlick Creator Publishing Plan',
    type: 'debit',
    amount: 199,
    formattedAmount: '-₹199',
    date: '15 Aug, 2026',
    status: 'Completed',
    category: 'Subscription'
  },
  {
    id: 'tx_3',
    title: 'Bank Withdrawal to HDFC **4921',
    desc: 'Creator payout withdrawal',
    type: 'debit',
    amount: 25000,
    formattedAmount: '-₹25,000',
    date: '10 Aug, 2026',
    status: 'Completed',
    category: 'Withdrawal'
  },
  {
    id: 'tx_4',
    title: 'Fan Subscription Revenue (18 Subscribers)',
    desc: 'Direct fan subscriptions tier',
    type: 'credit',
    amount: 1782,
    formattedAmount: '+₹1,782',
    date: '05 Aug, 2026',
    status: 'Completed',
    category: 'Creator Subscriptions'
  },
  {
    id: 'tx_5',
    title: 'Top Comedy Reel Milestone Bonus',
    desc: 'Platform viral performance award',
    type: 'credit',
    amount: 5000,
    formattedAmount: '+₹5,000',
    date: '28 Jul, 2026',
    status: 'Completed',
    category: 'Bonus'
  }
];

// Notifications
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    type: 'like',
    user: 'Pavani Official',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    text: 'liked your comment: "Pavani your comic timing is unbeatable 🔥"',
    time: '5m ago',
    unread: true
  },
  {
    id: 'notif_2',
    type: 'follow',
    user: 'Fun Bros',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    text: 'started following you.',
    time: '25m ago',
    unread: true
  },
  {
    id: 'notif_3',
    type: 'subscription',
    user: 'FunFlick System',
    avatar: '/brand/funflick-logo.png',
    text: 'Your monthly publishing subscription renewal is scheduled for Sept 15.',
    time: '2h ago',
    unread: false
  },
  {
    id: 'notif_4',
    type: 'payout',
    user: 'Admin Payments',
    avatar: '/brand/funflick-logo.png',
    text: '₹3,000 has been credited to your FunFlick wallet for Comedy Video #102.',
    time: '1d ago',
    unread: false
  },
  {
    id: 'notif_5',
    type: 'comment',
    user: 'Comedy Raju',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    text: 'replied to your story with: "😂😂 Spot on!"',
    time: '2d ago',
    unread: false
  }
];

// Messages / Conversations
export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv_1',
    user: {
      name: 'Pavani Official',
      username: 'pavani_official',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
      isOnline: true
    },
    lastMessage: 'Hey! Loved your idea about the grocery shopping sketch 😂 Let’s collab!',
    time: '12:45 PM',
    unreadCount: 2,
    messages: [
      { id: 'm1', sender: 'them', text: 'Hey Srilatha! Saw your comment on my biryani reel 😄', time: '12:30 PM' },
      { id: 'm2', sender: 'me', text: 'Haha thank you Pavani! My friends and I were crying laughing!', time: '12:35 PM' },
      { id: 'm3', sender: 'them', text: 'Hey! Loved your idea about the grocery shopping sketch 😂 Let’s collab!', time: '12:45 PM' }
    ]
  },
  {
    id: 'conv_2',
    user: {
      name: 'Fun Bros',
      username: 'fun_bros',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
      isOnline: false
    },
    lastMessage: 'Thanks for subscribing to our creator tier! You get early access to episode 3 tonight!',
    time: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm4', sender: 'them', text: 'Thanks for subscribing to our creator tier! You get early access to episode 3 tonight!', time: 'Yesterday' }
    ]
  },
  {
    id: 'conv_3',
    user: {
      name: 'FunFlick Creator Desk',
      username: 'funflick_support',
      avatar: '/brand/funflick-logo.png',
      isVerified: true,
      isOnline: true
    },
    lastMessage: 'Congratulations! Your profile is trending in the Comedy Creator leaderboard this week 🚀',
    time: 'Aug 28',
    unreadCount: 0,
    messages: [
      { id: 'm5', sender: 'them', text: 'Congratulations! Your profile is trending in the Comedy Creator leaderboard this week 🚀', time: 'Aug 28' }
    ]
  }
];

// Creator Studio Videos List (Screen 10)
export const CREATOR_VIDEOS = [
  {
    id: 'cv_1',
    title: 'Office Comedy Part 2',
    views: '2.4M',
    likes: '142K',
    comments: '4.8K',
    date: '5 days ago',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80',
    status: 'Published',
    earnings: '₹8,450',
    duration: '0:58'
  },
  {
    id: 'cv_2',
    title: 'Relatable Moments',
    views: '1.1M',
    likes: '89K',
    comments: '2.1K',
    date: '1 week ago',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    status: 'Pending Approval',
    earnings: 'Pending',
    duration: '1:12'
  },
  {
    id: 'cv_3',
    title: 'Travel Vlog',
    views: '0',
    likes: '0',
    comments: '0',
    date: 'Draft',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    status: 'Draft',
    earnings: '₹0',
    duration: '0:45'
  },
  {
    id: 'cv_4',
    title: 'Funny Reels Compilation',
    views: '3.2M',
    likes: '215K',
    comments: '8.4K',
    date: '3 weeks ago',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80',
    status: 'Published',
    earnings: '₹14,200',
    duration: '1:45'
  }
];

// Admin Platform KPI stats (Screen 12) - Realistic startup launch metrics
export const ADMIN_STATS = {
  totalUsers: '142',
  activeUsers: '98',
  totalCreators: '24',
  totalVideos: '56',
  totalPosts: '74',
  totalStories: '18',
  activeSubscriptions: '38',
  subscriptionRevenue: '₹12,450',
  creatorPayments: '₹5,800',
  pendingApprovals: 3,
  reportedContent: 2,
  platformProfit: '₹6,650'
};

// Admin Creator Payouts (Matching Section 36 & Screen 12 & 11)
export const INITIAL_PAYOUTS = [
  {
    id: 'pay_user_srilatha',
    creator: 'Srilatha (Current User)',
    creatorUsername: 'srilatha_16',
    isSubscribed: true,
    subscriptionPlan: 'Monthly Influencer Pro',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    postTitle: 'Stand-up Comedy Open Mic Debut',
    postDate: 'Aug 24, 2026',
    requestedViews: 80000,
    requestedLikes: 9500,
    currentLiveViews: 84500,
    currentLiveLikes: 10200,
    views: '84.5K',
    paidUpToViews: 20000,
    approvedAmount: 5000,
    paidAmount: 2000,
    remainingAmount: 3000,
    status: 'Partially Paid',
    customRateNote: 'Base payout for 80k milestone with engagement bonus',
    paymentHistory: [
      { id: 'ph_sri1', date: 'Aug 27, 2026', amount: 2000, method: 'FunFlick Wallet Transfer', ref: 'FFW99214' }
    ]
  },
  {
    id: 'pay_102',
    creator: 'Pavani Official',
    creatorUsername: 'pavani_official',
    isSubscribed: true,
    subscriptionPlan: 'Quarterly Influencer Star',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    postTitle: 'Comedy Video #102',
    postDate: 'Aug 20, 2026',
    requestedViews: 2000000,
    requestedLikes: 180000,
    currentLiveViews: 2400000,
    currentLiveLikes: 215000,
    views: '2.4M',
    paidUpToViews: 1200000,
    approvedAmount: 5000,
    paidAmount: 3000,
    remainingAmount: 2000,
    status: 'Partially Paid',
    customRateNote: 'Multi-million view tier bonus applied',
    paymentHistory: [
      { id: 'ph_1', date: 'Aug 22, 2026', amount: 3000, method: 'IMPS Bank Transfer', ref: 'IMPS928174' }
    ]
  },
  {
    id: 'pay_103',
    creator: 'Fun Bros',
    creatorUsername: 'funbros_channel',
    isSubscribed: true,
    subscriptionPlan: 'Monthly Influencer Pro',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    postTitle: 'Funny Moments Vol 4',
    postDate: 'Aug 15, 2026',
    requestedViews: 1800000,
    requestedLikes: 145000,
    currentLiveViews: 1900000,
    currentLiveLikes: 152000,
    views: '1.9M',
    paidUpToViews: 1900000,
    approvedAmount: 3000,
    paidAmount: 3000,
    remainingAmount: 0,
    status: 'Paid',
    customRateNote: 'Fully settled up to 1.9M views',
    paymentHistory: [
      { id: 'ph_2', date: 'Aug 17, 2026', amount: 3000, method: 'UPI Instant Payout', ref: 'UPI448201' }
    ]
  },
  {
    id: 'pay_104',
    creator: 'Chill Mammu',
    creatorUsername: 'chill_mammu',
    isSubscribed: true,
    subscriptionPlan: 'Weekly Influencer',
    creatorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
    postTitle: 'Travel Comedy Series',
    postDate: 'Aug 12, 2026',
    requestedViews: 2000000,
    requestedLikes: 160000,
    currentLiveViews: 2100000,
    currentLiveLikes: 172000,
    views: '2.1M',
    paidUpToViews: 2100000,
    approvedAmount: 4000,
    paidAmount: 4000,
    remainingAmount: 0,
    status: 'Paid',
    customRateNote: 'Fully settled up to 2.1M views',
    paymentHistory: [
      { id: 'ph_3', date: 'Aug 14, 2026', amount: 4000, method: 'NEFT Transfer', ref: 'NEFT39108' }
    ]
  },
  {
    id: 'pay_105',
    creator: 'Comedy Raju',
    creatorUsername: 'raju_creator',
    isSubscribed: true,
    subscriptionPlan: 'Monthly Influencer Pro',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    postTitle: 'Street Food Live Standup',
    postDate: 'Aug 28, 2026',
    requestedViews: 1500000,
    requestedLikes: 120000,
    currentLiveViews: 1800000,
    currentLiveLikes: 145000,
    views: '1.8M',
    paidUpToViews: 800000,
    approvedAmount: 6000,
    paidAmount: 2000,
    remainingAmount: 4000,
    status: 'Partially Paid',
    customRateNote: 'Pending second milestone evaluation',
    paymentHistory: [
      { id: 'ph_4', date: 'Aug 29, 2026', amount: 2000, method: 'UPI Instant Payout', ref: 'UPI98317' }
    ]
  }
];

// Anti-Plagiarism & Copyright Dispute Claims
export const INITIAL_COPYRIGHT_REPORTS = [
  {
    id: 'CR-882',
    reporter: 'Srilatha Reddy',
    reporterUsername: 'srilatha_16',
    reporterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    originalTitle: 'Stand-up Comedy Open Mic Debut',
    originalUploadedAt: 'Oct 1, 2026 at 10:14 AM',
    originalViews: '84.5K',
    originalLikes: '10.2K',
    originalThumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    originalVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',

    accused: 'Vikram Star Official',
    accusedUsername: 'vikram_viral_star',
    accusedAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
    accusedTitle: 'College Open Mic Funniest Punchline 😂',
    accusedUploadedAt: 'Oct 3, 2026 at 04:32 PM',
    accusedViews: '142.0K',
    accusedLikes: '18.4K',
    accusedThumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    accusedVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',

    timeDifference: 'Original uploaded 2 days 6 hours BEFORE accused copy',
    description: 'This popular creator cropped my watermark, removed my intro, and re-uploaded my stand-up performance without my permission to get viral views and ad revenue.',
    status: 'Pending',
    adminAction: null,
    date: 'Oct 3, 2026'
  },
  {
    id: 'CR-883',
    reporter: 'Chill Mammu',
    reporterUsername: 'chill_mammu',
    reporterAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
    originalTitle: 'Hostel Room Maggi Championship',
    originalUploadedAt: 'Sep 25, 2026 at 02:00 PM',
    originalViews: '45.0K',
    originalLikes: '5.1K',
    originalThumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    originalVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41484-large.mp4',

    accused: 'Meme Central India',
    accusedUsername: 'memecentral_in',
    accusedAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    accusedTitle: 'Hostel Guys When Hungry at 2 AM',
    accusedUploadedAt: 'Sep 28, 2026 at 08:15 PM',
    accusedViews: '98.5K',
    accusedLikes: '12.0K',
    accusedThumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    accusedVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41484-large.mp4',

    timeDifference: 'Original uploaded 3 days 6 hours BEFORE accused copy',
    description: 'Direct screen recording of my hostel kitchen sketch posted without attribution.',
    status: 'Pending',
    adminAction: null,
    date: 'Sep 29, 2026'
  }
];


// Admin Pending Approvals for Screen 12 "Recent Videos for Approval"
export const ADMIN_PENDING_APPROVALS = [
  {
    id: 'appr_1',
    title: 'Comedy Viral Video',
    creator: 'raju_creator',
    creatorName: 'Comedy Raju',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    category: 'Comedy',
    date: 'Today, 11:30 AM',
    status: 'Pending'
  },
  {
    id: 'appr_2',
    title: 'Hostel Cooking Gone Wrong',
    creator: 'chill_mammu',
    creatorName: 'Chill Mammu',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    category: 'Memes',
    date: 'Yesterday',
    status: 'Pending'
  },
  {
    id: 'appr_3',
    title: 'Office Appraisal Nightmare',
    creator: 'fun_bros',
    creatorName: 'Fun Bros',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80',
    category: 'Comedy',
    date: '2 days ago',
    status: 'Pending'
  }
];

// Admin Reports list
export const ADMIN_REPORTS = [
  {
    id: 'rep_1',
    type: 'Video',
    targetTitle: 'Extreme Prank at Traffic Signal',
    targetCreator: 'Prankster_King',
    reporter: 'ananya_m',
    reason: 'Dangerous stunts & traffic safety violation',
    date: '28 Aug, 2026',
    status: 'Pending'
  },
  {
    id: 'rep_2',
    type: 'Comment',
    targetTitle: 'Hate speech in comment section',
    targetCreator: 'troll_acc99',
    reporter: 'pavani_official',
    reason: 'Abusive harassment & spamming',
    date: '27 Aug, 2026',
    status: 'Pending'
  }
];

// Initial Media for Admin Influencer Review & Content Rewards
export const INITIAL_INFLUENCER_MEDIA = [
  {
    id: 'med_1',
    influencerName: 'Pavani Official',
    username: 'pavani_official',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    isInfluencer: true,
    subscriptionPlan: 'Monthly Influencer Pro',
    contentType: 'video', // 'video', 'post', 'story'
    title: 'When parents catch you scrolling reels at 3 AM 😂',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    category: 'Comedy',
    date: '2 hours ago',
    views: '142.8K',
    viewsCount: 142800,
    likes: '28.4K',
    likesCount: 28400,
    comments: '1,840',
    commentsCount: 1840,
    shares: '6,210',
    sharesCount: 6210,
    saves: '3,450',
    savesCount: 3450,
    engagementRate: '27.9%',
    currentEarning: '₹4,500',
    paymentStatus: 'Pending Reward', // 'Pending Reward' | 'Paid'
    paidAmount: null,
    paidDate: null
  },
  {
    id: 'med_2',
    influencerName: 'Fun Bros Comedy',
    username: 'fun_bros',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isInfluencer: true,
    subscriptionPlan: 'Quarterly Influencer Star',
    contentType: 'video',
    title: 'Corporate Appraisal vs Real Life Expectations 💀',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-1230-large.mp4',
    category: 'Workplace Comedy',
    date: 'Yesterday',
    views: '98.5K',
    viewsCount: 98500,
    likes: '19.2K',
    likesCount: 19200,
    comments: '940',
    commentsCount: 940,
    shares: '4,100',
    sharesCount: 4100,
    saves: '2,100',
    savesCount: 2100,
    engagementRate: '26.7%',
    currentEarning: '₹3,200',
    paymentStatus: 'Pending Reward',
    paidAmount: null,
    paidDate: null
  },
  {
    id: 'med_3',
    influencerName: 'Srilatha Reddy',
    username: 'srilatha_16',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isInfluencer: true,
    subscriptionPlan: 'Monthly Influencer Pro',
    contentType: 'post',
    title: 'Hyderabad Sunday Biryani Trail with the gang! 🍗✨',
    thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    category: 'Food & Laughs',
    date: '3 days ago',
    views: '45.2K',
    viewsCount: 45200,
    likes: '8.9K',
    likesCount: 8900,
    comments: '412',
    commentsCount: 412,
    shares: '1,280',
    sharesCount: 1280,
    saves: '950',
    savesCount: 950,
    engagementRate: '25.5%',
    currentEarning: '₹1,800',
    paymentStatus: 'Paid',
    paidAmount: 1800,
    paidDate: '02 Oct, 2026'
  },
  {
    id: 'med_4',
    influencerName: 'Rohan Deshmukh',
    username: 'rohan_comedy',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    isInfluencer: true,
    subscriptionPlan: 'Annual VIP Influencer',
    contentType: 'video',
    title: 'Types of people during Engineering viva exams 😂',
    thumbnail: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=400&q=80',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-40068-large.mp4',
    category: 'College Life',
    date: '5 days ago',
    views: '210.4K',
    viewsCount: 210400,
    likes: '42.1K',
    likesCount: 42100,
    comments: '3,100',
    commentsCount: 3100,
    shares: '11.5K',
    sharesCount: 11500,
    saves: '7,800',
    savesCount: 7800,
    engagementRate: '30.6%',
    currentEarning: '₹7,500',
    paymentStatus: 'Paid',
    paidAmount: 7500,
    paidDate: '01 Oct, 2026'
  },
  {
    id: 'med_5',
    influencerName: 'Sneha Patel',
    username: 'sneha_laughs',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    isInfluencer: true,
    subscriptionPlan: 'Weekly Influencer',
    contentType: 'story',
    title: 'BTS rehearsals for tonight live show in Bengaluru! 🎤🔥',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    category: 'Behind The Scenes',
    date: '6 hours ago',
    views: '18.9K',
    viewsCount: 18900,
    likes: '3.4K',
    likesCount: 3400,
    comments: '180',
    commentsCount: 180,
    shares: '560',
    sharesCount: 560,
    saves: '290',
    savesCount: 290,
    engagementRate: '23.4%',
    currentEarning: '₹1,000',
    paymentStatus: 'Pending Reward',
    paidAmount: null,
    paidDate: null
  },
  {
    id: 'med_6',
    influencerName: 'Rahul Verma (User)',
    username: 'rahul_v',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isInfluencer: false,
    subscriptionPlan: null,
    contentType: 'post',
    title: 'First standup comedy open mic trial in Pune! 🎙️',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    category: 'Standup',
    date: '1 day ago',
    views: '3.2K',
    viewsCount: 3200,
    likes: '420',
    likesCount: 420,
    comments: '35',
    commentsCount: 35,
    shares: '12',
    sharesCount: 12,
    saves: '18',
    savesCount: 18,
    engagementRate: '15.1%',
    currentEarning: '₹0',
    paymentStatus: 'Regular User (No Sub)',
    paidAmount: null,
    paidDate: null
  }
];

// Initial In-App Mobile Ads for Admin "Ads & Promotions"
export const INITIAL_ADS = [
  {
    id: 'ad_1',
    title: 'Swiggy Weekend Comedy Bites - 50% OFF 🍔',
    type: 'image', // 'image' | 'video'
    mediaUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    duration: 10,
    allowCloseAfter: 0, // 0 = closeable immediately
    active: true,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    frequency: 'On App Open',
    actionUrl: 'https://swiggy.com',
    actionText: 'Order Food Now',
    impressions: 4820,
    clicks: 640
  },
  {
    id: 'ad_2',
    title: 'Noise Smart Wireless Earbuds - Bass Edition 🎧',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-wearing-headphones-enjoying-music-40955-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    duration: 20,
    allowCloseAfter: 8, // Close button available after 8s countdown
    active: true,
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    frequency: 'Every 3 Reels',
    actionUrl: 'https://gonoise.com',
    actionText: 'Shop Earbuds 40% Off',
    impressions: 12500,
    clicks: 1890
  },
  {
    id: 'ad_3',
    title: 'FunFlick Creator Fest Hyderabad 2026 🎟️',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-at-a-party-with-neon-lights-42995-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    duration: 15,
    allowCloseAfter: 15, // Unskippable: close only after video ends
    active: false,
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    frequency: 'Once per session',
    actionUrl: 'https://funflick.in/fest',
    actionText: 'Book VIP Pass',
    impressions: 3100,
    clicks: 520
  }
];

