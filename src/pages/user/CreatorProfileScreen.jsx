import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CreatorSubscriptionModal } from '../../components/creator/CreatorSubscriptionModal';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { FollowListModal } from '../../components/user/FollowListModal';
import { EditProfileModal } from './EditProfileModal';
import { 
  ChevronLeft, 
  Share2, 
  Film, 
  Heart, 
  Play, 
  Crown, 
  Lock,
  User,
  Edit3,
  Settings,
  Plus,
  Sparkles,
  Eye,
  CheckCircle2,
  Calendar,
  MapPin
} from 'lucide-react';

export const CreatorProfileScreen = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    creators, 
    currentUser, 
    toggleFollowCreator, 
    showToast,
    myMedia,
    fetchMyMedia,
    posts 
  } = useApp();

  const isOwner = Boolean(
    currentUser?.username && 
    username && 
    username.toLowerCase() === currentUser.username.toLowerCase()
  );

  const [creatorData, setCreatorData] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [liveFollowCounts, setLiveFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(searchParams.get('subscribe') === 'true');

  // Allowed tabs: Owner sees their own 'Liked' videos (private to them).
  // Other profiles NEVER show 'Liked' tab — user likes are strictly private!
  const tabs = isOwner ? ['Videos', 'Shorts', 'Liked', 'About'] : ['Videos', 'Shorts', 'About'];
  const [activeTab, setActiveTab] = useState('Videos');

  // Ensure activeTab is valid if switching accounts
  useEffect(() => {
    if (!isOwner && activeTab === 'Liked') {
      setActiveTab('Videos');
    }
  }, [isOwner, activeTab]);

  // Fetch follow counts
  const fetchLiveCounts = async () => {
    if (!username) return;
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [f1, f2] = await Promise.all([
        fetch(`/api/follows/${username}/followers`, { headers }),
        fetch(`/api/follows/${username}/following`, { headers })
      ]);
      if (f1.ok && f2.ok) {
        const d1 = await f1.json();
        const d2 = await f2.json();
        setLiveFollowCounts({
          followers: d1.count !== undefined ? d1.count : (d1.followers?.length || 0),
          following: d2.count !== undefined ? d2.count : (d2.following?.length || 0)
        });
      }
    } catch (e) {
      console.warn('Could not fetch live follow counts:', e);
    }
  };

  // Fetch creator profile and videos
  useEffect(() => {
    fetchLiveCounts();

    const loadProfileAndVideos = async () => {
      setIsLoadingVideos(true);
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isOwner) {
        // 1. Owner's own media library
        if (fetchMyMedia) fetchMyMedia();

        // 2. Owner's private liked videos
        try {
          if (token) {
            const likedRes = await fetch('/api/videos/liked', { headers });
            if (likedRes.ok) {
              const likedData = await likedRes.json();
              if (likedData.videos) {
                setLikedVideos(likedData.videos);
              }
            } else {
              // Fallback to local liked posts
              const localLiked = (posts || []).filter(p => p.isLiked);
              setLikedVideos(localLiked);
            }
          }
        } catch (err) {
          console.warn('Could not load liked videos:', err);
          const localLiked = (posts || []).filter(p => p.isLiked);
          setLikedVideos(localLiked);
        }

        setIsLoadingVideos(false);
      } else {
        // Fetch public creator profile
        try {
          const profileRes = await fetch(`/api/users/${username}`, { headers });
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.user) {
              setCreatorData(pData.user);
            }
          }
        } catch (e) {
          console.warn('Could not fetch public profile:', e);
        }

        // Fetch real public videos published by this creator
        try {
          const vRes = await fetch(`/api/videos?username=${encodeURIComponent(username)}`, { headers });
          if (vRes.ok) {
            const vData = await vRes.json();
            if (vData.videos) {
              setUserVideos(vData.videos);
            }
          } else {
            // Fallback to filtering feed posts by creator username
            const matchingPosts = (posts || []).filter(
              p => p.creator?.username?.toLowerCase() === username.toLowerCase()
            );
            setUserVideos(matchingPosts);
          }
        } catch (e) {
          console.warn('Could not fetch creator videos:', e);
          const matchingPosts = (posts || []).filter(
            p => p.creator?.username?.toLowerCase() === username.toLowerCase()
          );
          setUserVideos(matchingPosts);
        } finally {
          setIsLoadingVideos(false);
        }
      }
    };

    loadProfileAndVideos();
  }, [username, isOwner]);

  // Determine current active media list
  const ownerVideos = (myMedia && myMedia.length > 0) 
    ? myMedia 
    : (posts || []).filter(p => p.creator?.username === currentUser?.username);

  const displayedSourceVideos = isOwner ? ownerVideos : userVideos;

  // Active creator details
  const creator = isOwner 
    ? {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar || currentUser.avatar_url || '/brand/default-avatar.svg',
        bio: currentUser.bio || 'FunFlick Creator | Enjoying Comedy & Entertainment',
        isPrivate: Boolean(currentUser.isPrivate),
        isVerified: Boolean(currentUser.isInfluencer),
        isFollowing: false,
        isSubscribed: true,
        stats: { 
          followers: liveFollowCounts.followers, 
          following: liveFollowCounts.following, 
          videos: displayedSourceVideos.length 
        }
      }
    : (creatorData 
        ? {
            name: creatorData.name,
            username: creatorData.username,
            avatar: creatorData.avatar || '/brand/default-avatar.svg',
            bio: creatorData.bio || 'FunFlick Creator | Entertaining India 🎬✨',
            isPrivate: Boolean(creatorData.isPrivate),
            isVerified: Boolean(creatorData.isInfluencer),
            isFollowing: Boolean(creatorData.iFollowThem),
            isSubscribed: false,
            stats: { 
              followers: liveFollowCounts.followers || creatorData.followersCount || 0, 
              following: liveFollowCounts.following || creatorData.followingCount || 0, 
              videos: displayedSourceVideos.length || creatorData.postsCount || 0 
            }
          }
        : (creators.find(c => c.username?.toLowerCase() === username?.toLowerCase()) || {
            name: username,
            username: username,
            avatar: '/brand/default-avatar.svg',
            bio: 'FunFlick Creator | Entertaining India 🎬✨',
            isPrivate: false,
            isVerified: false,
            stats: { 
              followers: liveFollowCounts.followers, 
              following: liveFollowCounts.following, 
              videos: displayedSourceVideos.length 
            }
          })
      );

  const isAccountPrivate = isOwner ? !!currentUser.isPrivate : !!creator.isPrivate;
  const hasAccess = isOwner || creator.isFollowing || creator.isSubscribed;

  // Tab filtering: Videos vs Shorts vs Liked
  const filteredVideos = () => {
    if (activeTab === 'Shorts') {
      return displayedSourceVideos.filter(v => {
        const dur = Number(v.duration) || 0;
        return dur > 0 && dur <= 60;
      });
    }
    if (activeTab === 'Liked') {
      return isOwner ? likedVideos : [];
    }
    return displayedSourceVideos;
  };

  const currentTabItems = filteredVideos();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white font-heading">
            @{creator.username}
          </span>
          {isOwner && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              showToast('Profile link copied! 📋', 'info');
            }}
            className="p-1.5 text-gray-300 hover:text-white"
            title="Share profile"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Profile Scroll View */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Cover Banner */}
        <div className="relative h-28 w-full bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-950 overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-pink-500/30 via-purple-600/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090514] via-transparent to-transparent" />
        </div>

        {/* Profile Identity */}
        <div className="px-5 -mt-12 relative z-10 space-y-3">
          <div className="flex items-end justify-between">
            <div className="relative">
              <img
                src={creator.avatar || '/brand/default-avatar.svg'}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/brand/default-avatar.svg'; }}
                alt={creator.name}
                className="w-22 h-22 rounded-full object-cover border-4 border-[#090514] shadow-2xl bg-gray-900"
              />
              {creator.isVerified && (
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#0070f3] border-2 border-[#090514] flex items-center justify-center text-white text-xs font-bold shadow" title="Verified Creator">
                  ✓
                </span>
              )}
            </div>

            {/* Quick Stats: Real Videos, Followers, Following */}
            <div className="flex items-center gap-5 pb-2 text-center">
              <div>
                <span className="font-extrabold text-sm text-white block font-heading">
                  {creator.stats?.videos !== undefined ? creator.stats.videos : displayedSourceVideos.length}
                </span>
                <span className="text-[10px] text-gray-400">Videos</span>
              </div>
              <div 
                className="cursor-pointer hover:opacity-80 transition active:scale-95"
                onClick={() => { setFollowModalTab('followers'); setIsFollowModalOpen(true); }}
              >
                <span className="font-extrabold text-sm text-white block font-heading">
                  {creator.stats?.followers !== undefined ? creator.stats.followers : '0'}
                </span>
                <span className="text-[10px] text-gray-400">Followers</span>
              </div>
              <div 
                className="cursor-pointer hover:opacity-80 transition active:scale-95"
                onClick={() => { setFollowModalTab('following'); setIsFollowModalOpen(true); }}
              >
                <span className="font-extrabold text-sm text-white block font-heading">
                  {creator.stats?.following !== undefined ? creator.stats.following : '0'}
                </span>
                <span className="text-[10px] text-gray-400">Following</span>
              </div>
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-white font-heading">
                {creator.name}
              </h2>
              {isAccountPrivate && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" /> Private
                </span>
              )}
            </div>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              {creator.bio}
            </p>
          </div>

          {/* Action Buttons: Owner controls vs Follower controls */}
          <div className="pt-2">
            {isOwner ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/15 active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => navigate('/profile')}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-pink-500/30 active:scale-95 shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-400" />
                  <span>Account & Wallet</span>
                </button>

                <button
                  onClick={() => navigate('/create/video')}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white hover:opacity-95 transition shadow-md active:scale-95"
                  title="Upload New Video"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFollowCreator(creator.username)}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition shadow-md ${
                    creator.isFollowing
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white hover:opacity-95'
                  }`}
                >
                  {creator.isFollowing ? 'Following' : 'Follow'}
                </button>

                <button
                  onClick={() => setIsSubscribeModalOpen(true)}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 ${
                    creator.isSubscribed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-95'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{creator.isSubscribed ? 'Subscribed 👑' : 'Subscribe'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs (Videos, Shorts, [Liked - Owner only], About) */}
        <div className="mt-5 border-t border-white/10">
          <div className="flex items-center justify-around text-xs font-bold text-gray-400 border-b border-white/10">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 flex-1 text-center relative transition flex items-center justify-center gap-1 ${
                  activeTab === tab ? 'text-white' : 'hover:text-gray-200'
                }`}
              >
                <span>{tab}</span>
                {tab === 'Liked' && (
                  <span className="text-[10px] text-pink-400">🔒</span>
                )}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500" />
                )}
              </button>
            ))}
          </div>

          {/* Privacy Note for Liked Tab */}
          {activeTab === 'Liked' && isOwner && (
            <div className="mx-4 mt-3 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center gap-2 text-[11px] text-pink-300">
              <Lock className="w-3.5 h-3.5 shrink-0 text-pink-400" />
              <span>
                <strong>Private to you:</strong> Only you can see what videos you liked. Other users cannot see this tab.
              </span>
            </div>
          )}

          {/* Tab Content: Video Grid or Private Lock */}
          {isAccountPrivate && !hasAccess ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                <Lock className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">This Account is Private</h3>
              <p className="text-xs text-gray-400 max-w-xs mb-5">
                Follow or subscribe to @{creator.username} to view their photos, videos, and reels.
              </p>
              <button
                onClick={() => toggleFollowCreator(creator.username)}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white shadow-lg shadow-pink-500/20 hover:opacity-95"
              >
                Follow to View Content
              </button>
            </div>
          ) : activeTab === 'About' ? (
            <div className="p-5 space-y-3 text-xs text-gray-300">
              <h4 className="font-bold text-white font-heading text-sm">About Creator</h4>
              <p>{creator.bio || 'FunFlick Entertainment Creator.'}</p>
              <div className="space-y-2 text-gray-400 pt-2 border-t border-white/5">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span>Location: Hyderabad, India</span>
                </p>
                <p className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  <span>Total Content: {displayedSourceVideos.length} published uploads</span>
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Category: Comedy & Entertainment</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Member of FunFlick Creator Network</span>
                </p>
              </div>
            </div>
          ) : currentTabItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
                {activeTab === 'Liked' ? (
                  <Heart className="w-8 h-8 text-pink-500 opacity-60" />
                ) : (
                  <Film className="w-8 h-8 text-pink-500 opacity-60" />
                )}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {activeTab === 'Liked' 
                  ? 'No liked videos yet'
                  : isOwner 
                    ? 'No videos uploaded yet' 
                    : 'No videos published yet'}
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mb-4">
                {activeTab === 'Liked'
                  ? 'Videos and reels you like while browsing FunFlick will appear here privately.'
                  : isOwner 
                    ? 'Share your comedy videos, sketches and reels with the FunFlick audience.'
                    : `@${creator.username} hasn't published any videos in this section yet.`}
              </p>
              {isOwner && activeTab !== 'Liked' && (
                <button
                  onClick={() => navigate('/create/video')}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 active:scale-95 transition"
                >
                  Upload Your First Video
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1">
              {currentTabItems.map(v => {
                const mediaUrl = v.video_url || v.mediaUrl;
                const posterUrl = v.thumbnail_url || v.thumbnail || v.posterUrl;
                const isVideo = Boolean(
                  (v.media_type === 'video' || v.mediaType === 'video') ||
                  (typeof mediaUrl === 'string' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(mediaUrl))
                );

                return (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/video/${v.id}`)}
                    className="relative aspect-[3/4] bg-gray-900 rounded overflow-hidden cursor-pointer group border border-white/5"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={v.title || 'Video'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/brand/funflick-logo.png';
                        }}
                      />
                    ) : isVideo && mediaUrl ? (
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        preload="metadata"
                        muted
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-900/40 via-purple-900/40 to-slate-900 flex items-center justify-center p-2 text-center">
                        <Play className="w-6 h-6 text-pink-400" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Views & Likes Badge */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-bold text-white drop-shadow">
                      <div className="flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current text-pink-400" />
                        <span>{v.views_count || v.views || '0'}</span>
                      </div>
                      {(v.likes_count || v.likes) > 0 && (
                        <div className="flex items-center gap-0.5 text-pink-300 text-[9px]">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          <span>{v.likes_count || v.likes}</span>
                        </div>
                      )}
                    </div>

                    {/* Owner Status Badge (Pending / Approved) */}
                    {isOwner && v.status && v.status !== 'Approved' && (
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold shadow ${
                        v.status === 'Pending' ? 'bg-amber-500/90 text-black' : 'bg-rose-500/90 text-white'
                      }`}>
                        {v.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Creator Subscription Modal */}
      <CreatorSubscriptionModal
        creator={creator}
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
      />

      {/* Edit Profile Modal for Account Owner */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Real Followers & Following Modal */}
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        targetUsername={username}
        initialTab={followModalTab}
        currentUsername={currentUser?.username}
        onRelationshipChanged={fetchLiveCounts}
      />
    </div>
  );
};
