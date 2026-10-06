import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CREATORS } from '../../data/mockData';
import { CreatorSubscriptionModal } from '../../components/creator/CreatorSubscriptionModal';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { FollowListModal } from '../../components/user/FollowListModal';
import { 
  ChevronLeft, 
  Share2, 
  MoreVertical, 
  MapPin, 
  Grid, 
  Film, 
  Heart, 
  Info, 
  Play, 
  Crown, 
  CheckCircle2, 
  Lock,
  User
} from 'lucide-react';

export const CreatorProfileScreen = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { creators, currentUser, toggleFollowCreator, showToast } = useApp();

  const isOwner = username === currentUser?.username;

  const [liveFollowCounts, setLiveFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');

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
      console.warn('Could not fetch creator live follow counts:', e);
    }
  };

  React.useEffect(() => {
    fetchLiveCounts();
  }, [username]);

  const creator = isOwner 
    ? {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        bio: currentUser.bio,
        isPrivate: currentUser.isPrivate,
        isFollowing: false,
        isSubscribed: true,
        stats: { followers: liveFollowCounts.followers, following: liveFollowCounts.following, posts: currentUser.stats?.posts || 0 },
        socials: { instagram: currentUser.username, youtube: currentUser.username }
      }
    : (creators.find(c => c.username === username) || {
        name: username,
        username: username,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'FunFlick Creator | Entertaining India 🎬✨',
        isPrivate: false,
        stats: { followers: liveFollowCounts.followers, following: liveFollowCounts.following, posts: 0 }
      });

  const isAccountPrivate = isOwner ? !!currentUser.isPrivate : !!creator.isPrivate;
  const hasAccess = isOwner || creator.isFollowing || creator.isSubscribed;

  const [activeTab, setActiveTab] = useState('Videos');
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(searchParams.get('subscribe') === 'true');

  const videoThumbnails = [
    { id: 'v1', views: '1.2M', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', title: 'Diet From Monday' },
    { id: 'v2', views: '856K', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', title: 'Sunday Midnight Cravings' },
    { id: 'v3', views: '1.4M', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80', title: 'Hostel Roommate Drama' },
    { id: 'v4', views: '980K', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80', title: 'Best Friend Wedding' },
    { id: 'v5', views: '1.6M', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', title: 'Office Appraisal Reality' },
    { id: 'v6', views: '720K', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', title: 'Street Food Tour' }
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          @{creator.username}
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => showToast('Creator profile link copied! 📋')}
            className="p-1.5 text-gray-300 hover:text-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Profile Scroll View (Screen 5) */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Cover Banner */}
        <div className="relative h-28 w-full bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-950 overflow-hidden">
          <img
            src={creator.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090514] via-transparent to-transparent" />
        </div>

        {/* Profile Identity (Screen 5) */}
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
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#0070f3] border-2 border-[#090514] flex items-center justify-center text-white text-xs font-bold shadow">
                  ✓
                </span>
              )}
            </div>

            {/* Quick Stats: Videos, Followers, Following */}
            <div className="flex items-center gap-5 pb-2 text-center">
              <div>
                <span className="font-extrabold text-sm text-white block font-heading">
                  {creator.stats?.videos || 324}
                </span>
                <span className="text-[10px] text-gray-400">Videos</span>
              </div>
              <div 
                className="cursor-pointer hover:opacity-80 transition"
                onClick={() => { setFollowModalTab('followers'); setIsFollowModalOpen(true); }}
              >
                <span className="font-extrabold text-sm text-white block font-heading">
                  {creator.stats?.followers !== undefined ? creator.stats.followers : '0'}
                </span>
                <span className="text-[10px] text-gray-400">Followers</span>
              </div>
              <div 
                className="cursor-pointer hover:opacity-80 transition"
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

          {/* Social Links Row */}
          <div className="flex items-center gap-3 pt-1">
            <a 
              href={`https://instagram.com/${creator.socials?.instagram || ''}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-pink-400 hover:text-pink-300 font-medium"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>{creator.socials?.instagram}</span>
            </a>
            <a 
              href={`https://youtube.com/@${creator.socials?.youtube || ''}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-rose-400 hover:text-rose-300 font-medium"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>{creator.socials?.youtube}</span>
            </a>
          </div>

          {/* Action Buttons: Follow & Subscribe (Screen 5) */}
          <div className="flex items-center gap-3 pt-2">
            {isOwner ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-white/15 shadow-md active:scale-95"
              >
                <User className="w-4 h-4 text-pink-400" />
                <span>My Account</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Content Tabs (Videos, Shorts, Liked, About - Screen 5) */}
        <div className="mt-5 border-t border-white/10">
          <div className="flex items-center justify-around text-xs font-bold text-gray-400 border-b border-white/10">
            {['Videos', 'Shorts', 'Liked', 'About'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 flex-1 text-center relative transition ${
                  activeTab === tab ? 'text-white' : 'hover:text-gray-200'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content: Video Grid or Private Lock (Screen 5) */}
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
          ) : activeTab === 'Videos' || activeTab === 'Shorts' ? (
            <div className="grid grid-cols-3 gap-1 p-1">
              {videoThumbnails.map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate('/reels')}
                  className="relative aspect-[3/4] bg-gray-900 overflow-hidden cursor-pointer group"
                >
                  <img
                    src={v.img}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Play Count Badge */}
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold text-white drop-shadow">
                    <Play className="w-2.5 h-2.5 fill-current text-pink-400" />
                    <span>{v.views}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'About' ? (
            <div className="p-5 space-y-3 text-xs text-gray-300">
              <h4 className="font-bold text-white font-heading text-sm">About Creator</h4>
              <p>Top Comedy & Entertainment creator on FunFlick since 2025.</p>
              <div className="space-y-1.5 text-gray-400 pt-2">
                <p>📍 Location: Hyderabad, Telangana</p>
                <p>🎭 Genre: Standup & Sketch Comedy</p>
                <p>⭐ Total Video Views: 12.5 Million</p>
                <p>👑 Subscribers: 24,300 Fans</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2 opacity-50" />
              <p>Liked videos are private to creator</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Screen 7 Creator Subscription Modal */}
      <CreatorSubscriptionModal
        creator={creator}
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
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
