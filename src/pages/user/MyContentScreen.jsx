import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Film, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Image as ImageIcon,
  UploadCloud,
  MapPin,
  Tag,
  Save,
  AlertTriangle
} from 'lucide-react';

const CATEGORIES = ['Comedy', 'Stand-up', 'Entertainment', 'Dance', 'Memes', 'Lifestyle', 'Regional'];

export const MyContentScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Posts';

  const { 
    posts, 
    creatorVideos, 
    deleteUserPost, 
    updateUserPost, 
    currentUser, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState(
    initialTab === 'liked' ? 'Liked' : initialTab === 'saved' ? 'Saved' : 'Posts'
  );

  // Modal states for Edit and Delete
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('Comedy');
  const [editLocation, setEditLocation] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const fileInputRef = useRef(null);

  const tabs = ['Posts', 'Videos', 'Stories', 'Drafts', 'Liked', 'Saved'];

  // Open Edit Modal with pre-filled item data
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditCaption(item.caption || '');
    setEditCategory(item.category || 'Comedy');
    setEditLocation(item.location || '');
    setEditHashtags(item.hashtags || '#funflick #post');
    setEditMediaUrl(item.posterUrl || item.mediaUrl || item.thumbnail || '');
  };

  // Handle Photo Replace in Edit Modal
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditMediaUrl(event.target.result);
        showToast('Photo replaced! 📸', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Edit Changes
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editCaption.trim() && !editTitle.trim()) {
      showToast('Please enter a title or caption', 'error');
      return;
    }

    updateUserPost(editingItem.id, {
      title: editTitle.trim() || editCaption.slice(0, 30),
      caption: editCaption.trim(),
      category: editCategory,
      location: editLocation.trim(),
      hashtags: editHashtags.trim(),
      posterUrl: editMediaUrl,
      mediaUrl: editMediaUrl,
      thumbnail: editMediaUrl
    });

    setEditingItem(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteUserPost(deletingItem.id);
    setDeletingItem(null);
  };

  const likedPosts = posts.filter(p => p.isLiked);
  const savedPosts = posts.filter(p => p.isSaved);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none relative">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          My Content Library
        </span>
        <button
          onClick={() => navigate('/create/post')}
          className="p-1.5 text-xs text-pink-400 font-bold hover:text-pink-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5">
        {tabs.map(t => {
          let count = 0;
          if (t === 'Posts') count = posts.length;
          else if (t === 'Videos') count = creatorVideos.length;
          else if (t === 'Liked') count = likedPosts.length;
          else if (t === 'Saved') count = savedPosts.length;

          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === t
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span>{t}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content List / Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
        {/* POSTS TAB */}
        {activeTab === 'Posts' && (
          posts.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-3">
              <ImageIcon className="w-10 h-10 text-pink-400/60 mx-auto" />
              <p className="font-bold text-white text-sm">No posts in your library</p>
              <p className="text-gray-400 text-xs">Create your first comedy post to manage it here.</p>
              <button
                onClick={() => navigate('/create/post')}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Post</span>
              </button>
            </div>
          ) : (
            posts.map(post => (
              <div
                key={post.id}
                className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between gap-3 hover:border-pink-500/30 transition shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative flex items-center justify-center">
                    <img
                      src={post.posterUrl || post.mediaUrl}
                      alt={post.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white font-heading truncate">
                      {post.title || post.caption?.slice(0, 30) || 'FunFlick Post'}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {post.caption || 'No caption'}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-pink-400" /> {post.viewsCount || '0'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400" /> {post.likesCount || '0'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-blue-400" /> {post.commentsCount || '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(post)}
                    title="Edit Post"
                    className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-pink-500/20 hover:border-pink-500/30 border border-transparent transition active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 text-pink-400" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(post)}
                    title="Delete Post"
                    className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent transition active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'Videos' && (
          creatorVideos.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-3">
              <Film className="w-10 h-10 text-pink-400/60 mx-auto" />
              <p className="font-bold text-white text-sm">No videos uploaded yet</p>
              <button
                onClick={() => navigate('/create/video')}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload a Reel</span>
              </button>
            </div>
          ) : (
            creatorVideos.map(video => (
              <div
                key={video.id}
                className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between gap-3 hover:border-pink-500/30 transition shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative flex items-center justify-center">
                    <img
                      src={video.thumbnail || video.mediaUrl}
                      alt={video.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold text-white">
                      {video.duration || '0:30'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white font-heading truncate">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        video.status === 'Published' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : video.status === 'Pending Approval'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {video.status}
                      </span>
                      <span className="text-[10px] text-gray-400">{video.views || '0'} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(video)}
                    title="Edit Video"
                    className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-pink-500/20 transition active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 text-pink-400" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(video)}
                    title="Delete Video"
                    className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-rose-400 hover:bg-rose-500/20 transition active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* LIKED TAB */}
        {activeTab === 'Liked' && (
          likedPosts.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-2">
              <Heart className="w-10 h-10 text-rose-400/50 mx-auto" />
              <p className="font-semibold text-white">No liked posts yet</p>
              <p className="text-[11px] text-gray-500">Like posts in your feed to bookmark them here.</p>
            </div>
          ) : (
            likedPosts.map(post => (
              <div
                key={post.id}
                className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={post.posterUrl || post.mediaUrl}
                    alt={post.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                    }}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{post.title || post.caption?.slice(0, 30)}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">by @{post.creator?.username || 'creator'}</p>
                  </div>
                </div>
                <Heart className="w-4 h-4 text-rose-400 fill-current shrink-0 mr-2" />
              </div>
            ))
          )
        )}

        {/* SAVED TAB */}
        {activeTab === 'Saved' && (
          savedPosts.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-2">
              <Film className="w-10 h-10 text-purple-400/50 mx-auto" />
              <p className="font-semibold text-white">No saved posts</p>
              <p className="text-[11px] text-gray-500">Bookmark posts to watch them anytime later.</p>
            </div>
          ) : (
            savedPosts.map(post => (
              <div
                key={post.id}
                className="p-3 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={post.posterUrl || post.mediaUrl}
                    alt={post.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                    }}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{post.title || post.caption?.slice(0, 30)}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">by @{post.creator?.username || 'creator'}</p>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {(activeTab === 'Stories' || activeTab === 'Drafts') && (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <Film className="w-8 h-8 text-pink-400 mx-auto opacity-60" />
            <p className="font-semibold text-white">No {activeTab.toLowerCase()} in your collection</p>
            <p className="text-[11px] text-gray-500">Create new comedy content to see them listed here.</p>
          </div>
        )}
      </div>

      {/* EDIT POST MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#130b24] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#190e30]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-white font-heading">
                  Edit Post Details
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar text-left">
              {/* Media Preview & Change Photo */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#0a0516] border border-white/5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 relative">
                  <img
                    src={editMediaUrl}
                    alt="Media preview"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-white block">Post Media</span>
                  <span className="text-[10px] text-gray-400 block mb-2">Change image or banner</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-pink-300 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 block">Post Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Comedy Set Highlight"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#0a0516] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 block">Caption</label>
                <textarea
                  rows={3}
                  required
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#0a0516] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none transition"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 block">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#0a0516] border border-white/10 text-white focus:outline-none focus:border-pink-500 transition"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#130b24] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location & Hashtags */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-pink-400" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#0a0516] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-pink-400" />
                    <span>Hashtags</span>
                  </label>
                  <input
                    type="text"
                    value={editHashtags}
                    onChange={(e) => setEditHashtags(e.target.value)}
                    placeholder="#funflick #comedy"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#0a0516] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-gray-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#130b24] border border-white/10 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-heading">
                Delete Post Permanently?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-white">"{deletingItem.title || deletingItem.caption?.slice(0, 25) || 'this post'}"</span>? This will permanently remove it from your library and feed.
              </p>
            </div>

            {/* Mini preview */}
            <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-3 text-left">
              <img
                src={deletingItem.posterUrl || deletingItem.mediaUrl || deletingItem.thumbnail}
                alt="thumbnail"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80';
                }}
                className="w-11 h-11 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate">
                  {deletingItem.title || deletingItem.caption?.slice(0, 25)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Category: {deletingItem.category || 'General'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="py-2.5 rounded-xl text-xs font-bold bg-white/10 text-gray-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 active:scale-95 transition"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
