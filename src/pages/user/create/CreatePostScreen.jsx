import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronLeft, 
  Image, 
  MapPin, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Crown,
  Hash,
  Smile,
  ShieldCheck,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UploadSuccessMonetizationModal } from '../../../components/common/UploadSuccessMonetizationModal';
import { uploadFileToS3 } from '../../../services/s3UploadService';

const SUGGESTED_LOCATIONS = [
  'Hyderabad Film City',
  'Jubilee Hills, Hyderabad',
  'Mumbai Comedy Central',
  'Bengaluru Studios'
];

export const CreatePostScreen = () => {
  const navigate = useNavigate();
  const { currentUser, setSubscriptionGateModalOpen, showToast, fetchLiveVideos } = useApp();

  const fileInputRef = useRef(null);

  // Real users for tagging from database (searched on-demand only)
  const [tagSearchResults, setTagSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [taggedUserObjects, setTaggedUserObjects] = useState([]); // [{ username, name, avatar }]

  // Live search users only when user types in search box
  useEffect(() => {
    const trimmed = tagSearchQuery.trim();
    if (!trimmed) {
      setTagSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.users && Array.isArray(data.users)) {
            setTagSearchResults(data.users.filter(u => u.username !== currentUser?.username));
          }
        }
      } catch (e) {
        console.warn('Failed to search users for tagging:', e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tagSearchQuery, currentUser]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('#funflick #post');
  const [location, setLocation] = useState('Hyderabad, India');
  const [category, setCategory] = useState('Comedy');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [enableComments, setEnableComments] = useState(true);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submittedItem, setSubmittedItem] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMediaUrl(URL.createObjectURL(file));
      showToast('Photo selected from device! 📸', 'info');
    }
  };

  const handleAddTagUser = (user) => {
    if (!taggedUsers.includes(user.username)) {
      setTaggedUsers(prev => [...prev, user.username]);
      setTaggedUserObjects(prev => [...prev, user]);
      setTagSearchQuery('');
      setTagSearchResults([]);
    }
  };

  const handleRemoveTagUser = (username) => {
    setTaggedUsers(prev => prev.filter(u => u !== username));
    setTaggedUserObjects(prev => prev.filter(u => u.username !== username));
  };

  const handleAddHashtag = (tag) => {
    if (!hashtags.includes(tag)) {
      setHashtags(prev => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handlePublish = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedFile && !mediaUrl) {
      showToast('Please select a photo from your device first!', 'error');
      return;
    }

    // 1. Subscription Check
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post media!', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(5);

    try {
      let finalMediaUrl = mediaUrl;

      // Upload real device file to AWS S3
      if (selectedFile) {
        finalMediaUrl = await uploadFileToS3(selectedFile, 'images', (pct) => {
          setProgress(Math.min(90, Math.max(5, pct)));
        });
      }

      // Save into MySQL database
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: caption.trim().slice(0, 45) || 'New Photo Post',
          description: caption.trim(),
          category,
          video_url: finalMediaUrl,
          thumbnail_url: finalMediaUrl,
          duration: 0,
          media_type: 'image',
          hashtags,
          location
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save post to database');
      }

      const resData = await res.json();
      setProgress(100);

      // Refresh live feed
      await fetchLiveVideos();

      setSubmittedItem({
        id: resData.videoId,
        title: caption.trim() || 'New Photo Post',
        mediaUrl: finalMediaUrl,
        contentType: 'image'
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      showToast('📸 Photo uploaded to AWS S3 & published live!', 'success');
    } catch (err) {
      console.error('Post upload error:', err);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      
      {/* Top Header - Instagram Post Style */}
      <div className="sticky top-0 z-30 bg-[#090514]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 -ml-1 text-gray-300 hover:text-white transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-sm font-extrabold text-white font-heading block">
            New Post
          </span>
          <span className="text-[10px] text-pink-400 font-semibold">
            Admin Verification Queue
          </span>
        </div>

        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white font-extrabold text-xs shadow-md shadow-pink-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition"
        >
          Share
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        
        {/* Publishing Subscription Banner Guard */}
        {!currentUser.hasPublishingSubscription ? (
          <div 
            onClick={() => setSubscriptionGateModalOpen(true)}
            className="p-3.5 rounded-3xl bg-gradient-to-r from-pink-950/80 via-purple-950/70 to-amber-950/60 border border-pink-500/40 flex items-center justify-between cursor-pointer hover:border-pink-500 transition shadow-lg shadow-pink-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-white shrink-0 shadow-md">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-heading block">
                  Publishing Subscription Required
                </span>
                <p className="text-[11px] text-pink-200">
                  Tap to unlock creator post publishing & analytics.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-pink-400 shrink-0" />
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <Crown className="w-4 h-4 text-amber-400" />
              Publishing Plan Active ({currentUser.subscriptionPlan || 'Monthly'})
            </span>
            <span className="text-[10px] text-gray-400">Ready to Post</span>
          </div>
        )}

        {/* Media Preview & Device File Picker */}
        <div className="space-y-3">
          {mediaUrl ? (
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-[#150f2c] border border-white/10 shadow-xl group">
              <img
                src={mediaUrl}
                alt="Post preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 hover:bg-black/90 transition shadow-lg"
              >
                <UploadCloud className="w-3.5 h-3.5 text-pink-400" />
                <span>Change Photo</span>
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-[#150f2c]/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition hover:bg-[#150f2c] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition border border-pink-500/30">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="text-sm font-bold text-white mb-1">Choose Photo from Device</span>
              <span className="text-xs text-gray-400">JPG, PNG, WEBP or GIF supported</span>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent hover:bg-white/10 border border-pink-500/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-pink-400" />
            <span>{selectedFile ? 'Select Different Photo from Device' : 'Select Photo from Gallery / Device'}</span>
          </button>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-pink-300">Uploading to AWS S3...</span>
                <span className="text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Caption & Description */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">Write a caption <span className="text-gray-500 font-normal">(optional)</span></label>
            <span className="text-[10px] text-gray-500">{caption.length}/500</span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption for your post... (optional)"
            className="w-full bg-[#150f2c] text-white text-xs p-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 leading-relaxed transition"
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-pink-400" />
            <span>Hashtags</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {['#funflick', '#comedy', '#bts', '#shootday', '#teluguhumor', '#memes'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleAddHashtag(t)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 text-[10px] font-semibold text-pink-300 transition"
              >
                + {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            className="w-full bg-[#150f2c] text-pink-300 font-medium text-xs px-3.5 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        {/* Tag People (Search-driven, optional) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Tag People / Creators</span>
              <span className="text-[10px] text-gray-500 font-normal">(optional)</span>
            </label>
            <span className="text-[10px] text-pink-300 font-semibold">{taggedUsers.length} tagged</span>
          </div>

          {/* User Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={tagSearchQuery}
              onChange={e => setTagSearchQuery(e.target.value)}
              placeholder="Search by username or name to tag..."
              className="w-full bg-[#150f2c] text-white text-xs pl-8 pr-3 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 placeholder-gray-500"
            />
            {isSearchingUsers && (
              <span className="text-[10px] text-pink-400 absolute right-3 top-3 animate-pulse">Searching...</span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {tagSearchQuery.trim() && (
            <div className="bg-[#120a24] rounded-2xl p-2 border border-white/10 space-y-1 shadow-lg max-h-48 overflow-y-auto no-scrollbar">
              {tagSearchResults.length > 0 ? (
                tagSearchResults.map(u => (
                  <div
                    key={u.id || u.username}
                    onClick={() => handleAddTagUser(u)}
                    className="p-2 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar || '/brand/default-avatar.svg'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-pink-300 block">
                          @{u.username}
                        </span>
                        {u.name && u.name !== u.username && (
                          <span className="text-[10px] text-gray-400 block">{u.name}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-semibold group-hover:bg-pink-500 group-hover:text-white"
                    >
                      + Add
                    </button>
                  </div>
                ))
              ) : (
                !isSearchingUsers && (
                  <div className="p-2 text-center text-xs text-gray-400">
                    No users found matching "{tagSearchQuery}"
                  </div>
                )
              )}
            </div>
          )}

          {/* Tagged Users Selected List (with delete button) */}
          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {taggedUsers.map(username => {
                const userObj = taggedUserObjects.find(u => u.username === username);
                return (
                  <span
                    key={username}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-500/20 border border-pink-500/30 text-white text-xs font-medium"
                  >
                    <img
                      src={userObj?.avatar || '/brand/default-avatar.svg'}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>@{username}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTagUser(username)}
                      title="Remove tag"
                      className="p-0.5 rounded-full hover:bg-pink-500/40 text-pink-300 hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Location & Category Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>Location</span>
            </label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-[#150f2c] text-white text-xs px-3 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            >
              {SUGGESTED_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#150f2c] text-white text-xs px-3 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            >
              <option value="Comedy">Comedy</option>
              <option value="Stand-up">Stand-up</option>
              <option value="Memes">Memes</option>
              <option value="Dance">Dance</option>
              <option value="Regional Comedy">Regional Comedy</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>
        </div>

        {/* Admin Verification Notice (Workflow Info) */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-[#120a26] border border-pink-500/25 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Central Admin Verification Policy</span>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed">
            All posts are submitted for <strong>Admin Review</strong>. Once verified and approved, it will be published live to the FunFlick home feed for all users.
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-pink-500/30 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting for Admin Verification ({progress}%)...</span>
            </div>
          ) : (
            <>
              <span>Share Post for Admin Review</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Submission Success Modal with Influencer & High Views/Likes Payments Pop Message */}
      {submittedItem && (
        <UploadSuccessMonetizationModal
          item={submittedItem}
          type="Post"
          onClose={() => setSubmittedItem(null)}
        />
      )}
    </div>
  );
};
