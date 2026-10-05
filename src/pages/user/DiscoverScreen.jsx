import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DISCOVER_CATEGORIES, TRENDING_DISCOVER_VIDEOS, TRENDING_HASHTAGS } from '../../data/mockData';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { SubscriptionGateModal } from '../../components/common/SubscriptionGateModal';
import { CreateChooserModal } from '../../components/user/create/CreateChooserModal';
import { 
  Search, 
  Flame, 
  Laugh, 
  Clapperboard, 
  Music2, 
  Mic2, 
  Zap, 
  Sparkles, 
  Languages, 
  Globe,
  Film,
  Smile,
  Play, 
  ChevronRight,
  TrendingUp,
  X,
  Eye,
  Heart
} from 'lucide-react';

export const DiscoverScreen = () => {
  const navigate = useNavigate();
  const { creators, posts, toggleFollowCreator } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');

  const getCategoryIcon = (iconName, isSelected, catColor) => {
    const iconClass = isSelected 
      ? "w-6 h-6 text-white drop-shadow-md stroke-[2.2] transition-transform duration-200 scale-110" 
      : "w-6 h-6 stroke-[2] transition-transform duration-200 group-hover:scale-110";

    switch (iconName) {
      case 'Flame': 
        return <Flame className={`${iconClass} ${isSelected ? 'text-white' : 'text-amber-400'}`} />;
      case 'Laugh': 
        return <Laugh className={`${iconClass} ${isSelected ? 'text-white' : 'text-pink-400'}`} />;
      case 'Clapperboard': 
        return <Clapperboard className={`${iconClass} ${isSelected ? 'text-white' : 'text-purple-400'}`} />;
      case 'Music2': 
        return <Music2 className={`${iconClass} ${isSelected ? 'text-white' : 'text-cyan-400'}`} />;
      case 'Mic2': 
        return <Mic2 className={`${iconClass} ${isSelected ? 'text-white' : 'text-yellow-400'}`} />;
      case 'Zap': 
        return <Zap className={`${iconClass} ${isSelected ? 'text-white' : 'text-emerald-400 fill-emerald-400/20'}`} />;
      case 'Sparkles': 
        return <Sparkles className={`${iconClass} ${isSelected ? 'text-white' : 'text-fuchsia-400'}`} />;
      case 'Languages': 
        return <Languages className={`${iconClass} ${isSelected ? 'text-white' : 'text-violet-400'}`} />;
      default: 
        return <Sparkles className={`${iconClass} ${isSelected ? 'text-white' : 'text-pink-400'}`} />;
    }
  };

  // Helper to parse string or number views into clean integer
  const parseViewsNum = (views) => {
    if (typeof views === 'number') return views;
    if (!views) return 0;
    const str = String(views).trim().toUpperCase();
    if (str.endsWith('M')) return Math.round(parseFloat(str) * 1000000);
    if (str.endsWith('K')) return Math.round(parseFloat(str) * 1000);
    return parseInt(str, 10) || 0;
  };

  // Algorithmic Trending Ranking:
  // Score = Views + (Likes * 2) + (Comments * 3) + (Shares * 2) + Recency Boost
  const calculateTrendingScore = (post) => {
    const views = parseViewsNum(post.viewsCount || post.views || 0);
    const likes = Number(post.likesCount || post.likes || 0);
    const comments = Number(post.commentsCount || (post.comments?.length) || 0);
    const shares = Number(post.sharesCount || 0);
    
    // Freshness/Recency bonus: brand-new posts get temporary boost to trend
    const isRecent = post.timeAgo === 'Just now' || post.date === 'Just now' || post.date === 'Today';
    const recencyBonus = isRecent ? 50 : 0;

    return (views * 1.0) + (likes * 2.0) + (comments * 3.0) + (shares * 2.0) + recencyBonus;
  };

  // Filtered creators when searching
  const filteredCreators = searchQuery.trim() 
    ? creators.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    : creators;

  // Filtered and Trending-Ranked Videos
  const filteredVideos = posts
    .filter(p => {
      // 1. Search Query filter (matches title, caption, tags, creator username, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchCaption = (p.caption || '').toLowerCase().includes(q);
        const matchCategory = (p.category || '').toLowerCase().includes(q);
        const matchCreator = (p.creator?.name || p.creator?.username || '').toLowerCase().includes(q);
        const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCaption && !matchCategory && !matchCreator && !matchTags) {
          return false;
        }
      }

      // 2. Category Filter (unless 'Trending' is selected)
      if (selectedCategory && selectedCategory !== 'Trending') {
        const pCat = (p.category || '').toLowerCase();
        const sCat = selectedCategory.toLowerCase();
        if (pCat !== sCat && !pCat.includes(sCat) && !sCat.includes(pCat)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Primary sort: Algorithmic Trending Score
      const scoreDiff = calculateTrendingScore(b) - calculateTrendingScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      // Fallback: Pure highest views
      return parseViewsNum(b.viewsCount || b.views) - parseViewsNum(a.viewsCount || a.views);
    });

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header with Prominent FunFlick Branding */}
      <div className="sticky top-0 z-30 bg-[#090514]/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-white/5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="FunFlick: Comedy. Entertainment. Always On!"
          >
            <img 
              src="/brand/funflick-logo.png" 
              alt="FunFlick" 
              className="w-7 h-7 rounded-xl object-contain shadow-md drop-shadow" 
            />
            <span className="font-extrabold text-lg tracking-tight text-white font-heading">
              fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
            Discover
          </span>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search comedy videos, creators, hashtags..."
            className="w-full bg-[#18122c] text-white placeholder-gray-400 text-xs pl-10 pr-9 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-pink-500 shadow-inner transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Discover Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        
        {/* Featured Hero Banner: "Trending Comedy Videos" (Screen 4 top) */}
        {!searchQuery && (
          <div 
            onClick={() => {
              if (filteredVideos[0]) {
                navigate(`/reels?id=${filteredVideos[0].id}`);
              } else {
                navigate('/reels');
              }
            }}
            className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-pink-700 to-amber-600 p-5 shadow-xl shadow-pink-500/15 cursor-pointer group"
          >
            <div className="relative z-10 max-w-[65%] space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/40 text-amber-300 backdrop-blur-md inline-block">
                🔥 #1 TRENDING NOW
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight font-heading group-hover:text-amber-200 transition-colors line-clamp-2">
                {filteredVideos[0]?.title || 'Trending Content Hub'}
              </h2>
              <p className="text-xs text-white/90 font-medium line-clamp-1">
                {filteredVideos[0] 
                  ? `By @${filteredVideos[0].creator?.username || 'creator'} • ${filteredVideos[0].viewsCount || filteredVideos[0].views || 0} views`
                  : "Watch India's most viral sketches & verified creator clips!"}
              </p>
            </div>

            {/* Right Character / Comedian Visual */}
            <div className="absolute -right-2 -bottom-2 w-32 h-32 pointer-events-none group-hover:scale-105 transition-transform duration-300">
              <img
                src={filteredVideos[0]?.posterUrl || filteredVideos[0]?.mediaUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                alt="Trending Content"
                className="w-full h-full object-cover rounded-2xl rotate-6 shadow-2xl border-2 border-white/20"
              />
            </div>
          </div>
        )}

        {/* Categories Row (Screen 4) - Rich, Vibrant, Glossy Interactive Category Icons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Explore Categories</span>
            </span>
            <span className="text-[10px] text-pink-400/80 font-medium">
              Swipe to explore →
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth">
            {DISCOVER_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="flex flex-col items-center gap-2 min-w-[70px] shrink-0 group focus:outline-none transition-transform duration-200 active:scale-95"
                >
                  {/* Icon Card Box */}
                  <div className={`relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-tr ${cat.color} shadow-xl shadow-pink-500/35 scale-105 border-2 border-white/50 ring-4 ${cat.activeRing || 'ring-pink-500/30'}`
                      : `${cat.bg || 'bg-[#18122c]'} border ${cat.border || 'border-white/10'} hover:border-white/30 hover:scale-105 shadow-md shadow-black/40 backdrop-blur-sm group-hover:shadow-pink-500/10`
                  }`}>
                    {/* Glowing background halo */}
                    <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                      isSelected 
                        ? 'opacity-40 bg-white/20 blur-sm' 
                        : 'opacity-0 group-hover:opacity-100 bg-white/5'
                    }`} />

                    {/* Category Icon */}
                    <div className="relative z-10">
                      {getCategoryIcon(cat.icon, isSelected, cat.color)}
                    </div>

                    {/* Small Corner Emoji Badge */}
                    <span className="absolute -bottom-1 -right-1 text-[11px] filter drop-shadow">
                      {cat.emoji}
                    </span>
                  </div>

                  {/* Category Name */}
                  <span className={`text-[11px] tracking-tight transition-all duration-200 text-center whitespace-nowrap ${
                    isSelected 
                      ? 'text-white font-extrabold font-heading scale-105 drop-shadow' 
                      : 'text-gray-300 font-medium group-hover:text-white'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trending Now Section (Screen 4) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-1.5">
              <span>{selectedCategory === 'Trending' ? '🔥 Top Trending Videos' : `${selectedCategory} Trending`}</span>
              <span className="text-[11px] font-semibold text-gray-400">({filteredVideos.length})</span>
            </h3>
            <button 
              onClick={() => navigate('/reels')}
              className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-0.5"
            >
              <span>Watch Reels</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#140c26] border border-white/5 text-center text-xs text-gray-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">No {selectedCategory !== 'Trending' ? selectedCategory : 'trending'} videos yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Upload your video now to claim the #1 trending spot on FunFlick!
                </p>
              </div>
              <button
                onClick={() => navigate('/create/video')}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition inline-flex items-center gap-1.5"
              >
                <span>+ Upload Video</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredVideos.slice(0, 6).map((video, idx) => (
                <div
                  key={video.id}
                  onClick={() => navigate(`/reels?id=${video.id}`)}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group shadow-lg hover:ring-2 hover:ring-pink-500/50 transition-all"
                >
                  <img
                    src={video.posterUrl || video.mediaUrl || video.image}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  
                  {/* Rank Badge & Views Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#ff007a] text-white flex items-center justify-center text-[10px] font-black shadow">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10">
                      <Eye className="w-2.5 h-2.5 text-pink-300" />
                      <span>{video.viewsCount || video.views || '0'}</span>
                    </div>
                  </div>

                  {/* Likes badge if any */}
                  {Number(video.likesCount || 0) > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10">
                      <Heart className="w-2.5 h-2.5 text-rose-500 fill-current" />
                      <span>{video.likesCount}</span>
                    </div>
                  )}

                  {/* Bottom Title, Creator & Tag */}
                  <div className="absolute bottom-2 left-2 right-2 text-left space-y-0.5">
                    <p className="text-[11px] font-bold text-white truncate font-heading group-hover:text-pink-200">
                      {video.title}
                    </p>
                    <p className="text-[10px] text-gray-300 truncate">
                      @{video.creator?.username || 'creator'}
                    </p>
                    <span className="text-[9px] text-pink-400 font-semibold block truncate">
                      {video.category ? `#${video.category.toLowerCase()}` : '#comedy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Creators Section (Screen 4) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Popular Creators
            </h3>
            <span className="text-xs font-bold text-pink-400">See All &gt;</span>
          </div>

          {filteredCreators.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#140c26] border border-white/5 text-center text-xs text-gray-400">
              <p>No creators registered yet. Start creating content to be featured here!</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              {filteredCreators.map(creator => (
                <div
                  key={creator.id}
                  className="w-32 bg-[#18122c] border border-white/10 rounded-2xl p-3 flex flex-col items-center text-center shrink-0 space-y-2 hover:border-pink-500/30 transition group"
                >
                  <div 
                    onClick={() => navigate(`/creator/${creator.username}`)}
                    className="w-14 h-14 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 to-purple-600 cursor-pointer group-hover:scale-105 transition-transform"
                  >
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-full h-full rounded-full object-cover border border-[#18122c]"
                    />
                  </div>

                  <div 
                    onClick={() => navigate(`/creator/${creator.username}`)}
                    className="cursor-pointer"
                  >
                    <h4 className="text-xs font-bold text-white truncate max-w-[100px] font-heading">
                      {creator.username}
                    </h4>
                    <span className="text-[10px] text-gray-400 block">
                      {creator.stats?.followers || '1.5M'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFollowCreator(creator.username)}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition ${
                      creator.isFollowing
                        ? 'bg-white/15 text-white'
                        : 'bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white hover:opacity-90'
                    }`}
                  >
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Hashtags Section */}
        <div>
          <h3 className="text-sm font-bold text-white font-heading mb-3">
            Trending Hashtags
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {TRENDING_HASHTAGS.map(ht => (
              <div
                key={ht.tag}
                onClick={() => setSearchQuery(ht.tag)}
                className="p-3 rounded-2xl bg-[#18122c] border border-white/5 hover:border-pink-500/30 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-pink-300 font-heading block">
                    {ht.tag}
                  </span>
                  <span className="text-[10px] text-gray-400">{ht.posts}</span>
                </div>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals */}
      <SubscriptionGateModal />
      <CreateChooserModal />
    </div>
  );
};
