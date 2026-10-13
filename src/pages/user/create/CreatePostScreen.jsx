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
  Tag,
  Search,
  ChevronRight,
  Trash2,
  Plus
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
  const { currentUser, posts, setSubscriptionGateModalOpen, showToast, fetchLiveVideos, fetchMyMedia } = useApp();

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
            // Filter out myself and staff moderator accounts
            setTagSearchResults(data.users.filter(u =>
              u.username !== currentUser?.username &&
              u.role !== 'moderator' &&
              !u.username?.toLowerCase().startsWith('moderator')
            ));
        }
      } catch (e) {
        console.warn('Failed to search users for tagging:', e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tagSearchQuery, currentUser]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState(['funflick', 'post']);
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [location, setLocation] = useState('Hyderabad, India');
  const [category, setCategory] = useState('Comedy');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [enableComments, setEnableComments] = useState(true);

  // Extract base trending tags + dynamic tags from platform posts feed
  const baseTrendingTags = [
    'funflick', 'post', 'comedy', 'bts', 'shootday', 'teluguhumor', 
    'memes', 'entertainment', 'photography', 'trending', 'creators'
  ];
  const dynamicFeedTags = (posts || []).flatMap(p => 
    (p.tags || []).map(t => t.replace(/^#/, '').toLowerCase())
  );
  const allAvailableTags = Array.from(new Set([...baseTrendingTags, ...dynamicFeedTags]));
  const cleanTagQuery = tagSearchInput.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '');
  const filteredHashtagSuggestions = cleanTagQuery
    ? allAvailableTags.filter(t => t.toLowerCase().includes(cleanTagQuery) && !selectedTags.includes(t))
    : allAvailableTags.filter(t => !selectedTags.includes(t)).slice(0, 8);
  const isExactTagMatch = allAvailableTags.some(t => t.toLowerCase() === cleanTagQuery);

  const handleAddTag = (tag) => {
    const clean = tag.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags(prev => [...prev, clean]);
    }
    setTagSearchInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [submittedItem, setSubmittedItem] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const validUrls = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`⚠️ "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Photos must be under 5MB!`, 'error');
        continue;
      }
      validFiles.push(file);
      validUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10));
      setMediaUrls(prev => [...prev, ...validUrls].slice(0, 10));
      showToast(`${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} added! 📸`, 'info');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaUrls(prev => prev.filter((_, i) => i !== idx));
    setPreviewIndex(prev => Math.max(0, Math.min(prev, mediaUrls.length - 2)));
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

  const handlePublish = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmittingRef.current || isUploading) return;

    if (selectedFiles.length === 0 && mediaUrls.length === 0) {
      showToast('Please select at least one photo from your device first!', 'error');
      return;
    }

    // 1. Subscription Check
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post media!', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setIsUploading(true);
    setProgress(5);

    try {
      // Upload all real device files to AWS S3
      const uploadedUrls = [];
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        const uploadedUrl = await uploadFileToS3(file, 'images', (pct) => {
          const stepBase = (i / totalFiles) * 85;
          const stepShare = ((pct / 100) / totalFiles) * 85;
          setProgress(Math.min(90, Math.max(5, Math.round(stepBase + stepShare))));
        });
        if (!uploadedUrl || uploadedUrl.startsWith('blob:')) {
          throw new Error('Failed to upload all photos to AWS S3 storage.');
        }
        uploadedUrls.push(uploadedUrl);
      }

      if (uploadedUrls.length === 0) {
        throw new Error('Please select at least one valid photo to publish.');
      }

      const finalVideoUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : JSON.stringify(uploadedUrls);
      const finalThumbnailUrl = uploadedUrls[0];
      const finalHashtags = selectedTags.map(t => `#${t}`).join(' ');

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
          video_url: finalVideoUrl,
          thumbnail_url: finalThumbnailUrl,
          duration: 0,
          media_type: 'image',
          hashtags: finalHashtags,
          location
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save post to database');
      }

      const resData = await res.json();
      setProgress(100);

      // Refresh live feed and user media library
      await fetchLiveVideos();
      if (fetchMyMedia) await fetchMyMedia();

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
      showToast('📸 Photo uploaded & submitted to Admin Approval Desk!', 'success');
    } catch (err) {
      console.error('Post upload error:', err);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      isSubmittingRef.current = false;
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
          {mediaUrls.length > 0 ? (
            <div className="space-y-2.5">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-[#150f2c] border border-white/10 shadow-xl group">
                <img
                  src={mediaUrls[previewIndex] || mediaUrls[0]}
                  alt="Post preview"
                  className="w-full h-full object-cover transition-transform duration-300"
                />

                {/* Left Preview Chevron */}
                {previewIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition shadow-lg active:scale-90"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right Preview Chevron */}
                {previewIndex < mediaUrls.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(prev => Math.min(mediaUrls.length - 1, prev + 1))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition shadow-lg active:scale-90"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Counter Badge */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-md">
                  Photo {previewIndex + 1} of {mediaUrls.length}
                </span>

                {/* Remove Current Photo */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(previewIndex)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white transition shadow-md active:scale-90 border border-white/20"
                  title="Remove this photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
                {mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                      idx === previewIndex ? 'border-pink-500 scale-105 shadow-md shadow-pink-500/30' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}

                {mediaUrls.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-[#150f2c]/50 flex flex-col items-center justify-center shrink-0 text-gray-400 hover:text-white transition"
                    title="Add more photos"
                  >
                    <Plus className="w-5 h-5 text-pink-400" />
                    <span className="text-[9px] font-bold mt-0.5">Add</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-[#150f2c]/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition hover:bg-[#150f2c] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition border border-pink-500/30">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="text-sm font-bold text-white mb-1">Choose Photos from Device</span>
              <span className="text-xs text-gray-400">Select up to 10 photos • JPG, PNG, WEBP</span>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            multiple
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
            <span>{mediaUrls.length > 0 ? `Add More Photos (${mediaUrls.length}/10 selected)` : 'Select Photos from Gallery / Device'}</span>
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

        {/* Hashtags Section - Search & Custom Tag Creation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-pink-400" />
              <span>Hashtags</span>
              <span className="text-[10px] text-gray-500 font-normal">({selectedTags.length} added)</span>
            </label>
            <span className="text-[10px] text-pink-400 font-medium">Trending Discovery</span>
          </div>

          {/* Selected Hashtags Chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-[#120b24] border border-white/5">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 font-semibold text-xs animate-in fade-in"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="p-0.5 rounded-full hover:bg-white/10 text-pink-300 hover:text-white transition"
                    title={`Remove #${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Hashtag Search & Create Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tagSearchInput}
              onChange={e => setTagSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (cleanTagQuery) handleAddTag(cleanTagQuery);
                }
              }}
              placeholder="Search or add custom hashtag (e.g. comedy, shootday)..."
              className="w-full bg-[#150f2c] text-white placeholder-gray-400 text-xs pl-9 pr-24 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition"
            />
            {cleanTagQuery && (
              <button
                type="button"
                onClick={() => handleAddTag(cleanTagQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white font-bold text-[10px] hover:brightness-110 transition shadow-sm"
              >
                + Add #{cleanTagQuery}
              </button>
            )}
          </div>

          {/* Hashtag Suggestions & Custom Tag Prompt */}
          {cleanTagQuery ? (
            <div className="p-2.5 rounded-2xl bg-[#120b24] border border-white/10 space-y-2">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                Matching Hashtags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filteredHashtagSuggestions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/40 text-[11px] font-semibold text-pink-300 transition flex items-center gap-1"
                  >
                    <span>#{tag}</span>
                    <span className="text-[9px] text-gray-400">+</span>
                  </button>
                ))}

                {/* Always offer custom hashtag addition if not an exact existing tag */}
                {!isExactTagMatch && (
                  <button
                    type="button"
                    onClick={() => handleAddTag(cleanTagQuery)}
                    className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 text-[11px] font-bold text-pink-200 transition flex items-center gap-1"
                  >
                    <span>✨ Add custom "#{cleanTagQuery}"</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1 pt-0.5">
              <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Trending on FunFlick (tap to add):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filteredHashtagSuggestions.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 text-[10px] font-medium text-gray-300 hover:text-pink-300 transition"
                  >
                    + #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category */}
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

        {/* Location Section with Search */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>Location</span>
              <span className="text-[10px] text-gray-500 font-normal">(optional)</span>
            </label>
            {location && (
              <button
                type="button"
                onClick={() => setLocation('')}
                className="text-[10px] text-pink-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Search area, colony, mandal, district, pincode (e.g. Madhapur, Hyderabad - 500081)..."
              className="w-full bg-[#150f2c] text-white placeholder-gray-500 text-xs px-3.5 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition"
            />
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
