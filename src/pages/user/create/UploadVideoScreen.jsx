import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronLeft, 
  Video, 
  UploadCloud, 
  Sparkles, 
  Crown, 
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music2,
  MapPin,
  Tag,
  Hash,
  Users,
  Eye,
  Sliders,
  X,
  Check,
  Film,
  Info,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UploadSuccessMonetizationModal } from '../../../components/common/UploadSuccessMonetizationModal';
import { uploadFileToS3 } from '../../../services/s3UploadService';


const SUGGESTED_CREATORS_TO_TAG = [
  'pavani_official',
  'srilatha_16',
  'fun_bros',
  'chill_mammu',
  'rohan_comedy'
];

const POPULAR_LOCATIONS = [
  'Hyderabad, India',
  'Ramoji Film City',
  'Mumbai Comedy Club',
  'Bengaluru Studios',
  'Cyberabad IT Corridor'
];

const POPULAR_SOUNDS = [
  '🎵 Original Audio - You',
  '🎵 Viral Telugu Comedy Beats',
  '🎵 Standup Crowd Punchline SFX',
  '🎵 Upbeat FunFlick Chill Mix'
];

export const UploadVideoScreen = () => {
  const navigate = useNavigate();
  const { currentUser, creators, posts, setSubscriptionGateModalOpen, mediaLimits, showToast, fetchLiveVideos, fetchMyMedia } = useApp();

  const maxReelLimit = mediaLimits?.maxReelDuration || 30;
  const [videoDuration, setVideoDuration] = useState(0);

  const videoRef = useRef(null);
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
            // Filter out myself and staff moderator/admin accounts
            setTagSearchResults(data.users.filter(u =>
              u.username !== currentUser?.username &&
              u.role !== 'moderator' &&
              u.role !== 'admin' &&
              u.username !== 'super_admin' &&
              !u.username?.toLowerCase().startsWith('moderator')
            ));
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

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad, India');
  const [selectedSound, setSelectedSound] = useState(POPULAR_SOUNDS[0]);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [selectedTags, setSelectedTags] = useState(['funflick', 'reels']);
  const [tagSearchInput, setTagSearchInput] = useState('');

  // Extract base trending tags + dynamic tags from platform posts feed
  const baseTrendingTags = [
    'funflick', 'reels', 'comedy', 'viralreels', 'teluguhumor', 'standup', 
    'memes', 'entertainment', 'dance', 'music', 'trending', 'acting', 'bts'
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

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submittedItem, setSubmittedItem] = useState(null);

  // Handle local video file upload from device
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Enforce 10MB limit
      const MAX_BYTES = 10 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        showToast(`⚠️ Video size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Videos must be 10MB or less!`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
      const blobUrl = URL.createObjectURL(file);
      setVideoSrc(blobUrl);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
      showToast(`Selected "${file.name}" for upload! 🎥`, 'info');

      // Automatically capture first frame as visual thumbnail image
      try {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.src = blobUrl;
        tempVideo.onloadeddata = () => {
          tempVideo.currentTime = Math.min(0.5, (tempVideo.duration || 1) / 2);
        };
        tempVideo.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(640, tempVideo.videoWidth || 480);
            canvas.height = Math.min(1136, tempVideo.videoHeight || 854);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (dataUrl && dataUrl.length > 200) {
              setThumbnailUrl(dataUrl);
            }
          } catch (err) {}
        };
      } catch (e) {}
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= maxReelLimit) {
      videoRef.current.currentTime = 0;
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Add user to tagged list
  const handleAddTagUser = (user) => {
    if (!taggedUsers.includes(user.username)) {
      setTaggedUsers(prev => [...prev, user.username]);
      setTaggedUserObjects(prev => [...prev, user]);
      setTagSearchQuery('');
      setTagSearchResults([]);
    }
  };

  // Remove user from tagged list
  const handleRemoveTagUser = (username) => {
    setTaggedUsers(prev => prev.filter(u => u !== username));
    setTaggedUserObjects(prev => prev.filter(u => u.username !== username));
  };

  // Submit flow: Upload to S3, Save in MySQL, Publish live
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile && !videoSrc) {
      showToast('Please select a video file from your device first!', 'error');
      fileInputRef.current?.click();
      return;
    }

    setIsUploading(true);
    setProgress(5);

    try {
      let finalMediaUrl = videoSrc;

      // 1. Direct AWS S3 upload if selected from device
      if (selectedFile) {
        finalMediaUrl = await uploadFileToS3(selectedFile, 'videos', (pct) => {
          setProgress(pct);
        });
      }

      // Permanent media safety check: never commit temporary blob URLs
      if (!finalMediaUrl || finalMediaUrl.startsWith('blob:')) {
        throw new Error('Please wait for the media file to upload to AWS S3 storage before submitting.');
      }

      const finalTitle = title.trim() || description.trim().slice(0, 40) || 'Untitled Reel';
      const finalHashtags = selectedTags.map(t => `#${t}`).join(' ');

      // 2. Upload thumbnail frame to S3 if captured as base64 data URL
      let finalThumbnailUrl = finalMediaUrl;
      if (thumbnailUrl && thumbnailUrl.startsWith('data:image/')) {
        try {
          const thumbBlob = await (await fetch(thumbnailUrl)).blob();
          const thumbFile = new File([thumbBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
          finalThumbnailUrl = await uploadFileToS3(thumbFile, 'thumbnails');
        } catch (e) {
          console.warn('Fallback thumbnail upload:', e);
          finalThumbnailUrl = thumbnailUrl;
        }
      } else if (thumbnailUrl && !thumbnailUrl.startsWith('blob:')) {
        finalThumbnailUrl = thumbnailUrl;
      }

      // 3. Persist to MySQL database on AWS
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: finalTitle,
          description: description.trim(),
          category,
          video_url: finalMediaUrl,
          thumbnail_url: finalThumbnailUrl,
          duration: Math.round(videoDuration) || 30,
          media_type: 'video',
          hashtags: finalHashtags,
          location: selectedLocation,
          audio_title: selectedSound
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save video to database');
      }

      const resData = await res.json();
      setProgress(100);

      // 4. Immediately refresh live feed and personal library from MySQL
      await fetchLiveVideos();
      if (fetchMyMedia) await fetchMyMedia();

      setSubmittedItem({
        id: resData.videoId,
        title: finalTitle,
        mediaUrl: finalMediaUrl,
        contentType: 'video'
      });

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (resData.status === 'Approved') {
        showToast('🎉 Reel approved & published live to FunFlick!', 'success');
      } else {
        showToast('⏳ Reel submitted for Admin Verification! Once verified, it will be published live.', 'info');
      }
    } catch (err) {
      console.error('Upload video error:', err);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      
      {/* Top Header - Instagram Reel Style */}
      <div className="sticky top-0 z-30 bg-[#090514]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 -ml-1 text-gray-300 hover:text-white transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <span className="text-sm font-extrabold text-white font-heading block">
            New Reel
          </span>
          <span className="text-[10px] text-pink-400 font-semibold">
            Admin Verification Queue
          </span>
        </div>

        <button
          onClick={handleUpload}
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
                  Tap to unlock creator video uploads & monetization.
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
            <span className="text-[10px] text-gray-400">Ready to Upload</span>
          </div>
        )}

        {/* Video Player & Media Preview Box (Instagram Reel Style) */}
        <div className="space-y-2">
          {!videoSrc ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[9/16] max-h-[300px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#18122c] to-[#120a22] border-2 border-dashed border-white/15 hover:border-pink-500/60 transition cursor-pointer flex flex-col items-center justify-center p-6 text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-pink-400" />
              </div>
              <span className="text-sm font-bold text-white mb-1">
                Choose Video from Device / Gallery
              </span>
              <span className="text-xs text-gray-400 max-w-[240px]">
                MP4, WebM, MOV up to 10MB • Max 30s • 100% Free
              </span>
            </div>
          ) : (
            <div className="relative w-full aspect-[9/16] max-h-[340px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl mx-auto flex items-center justify-center group">
              <video
                ref={videoRef}
                src={videoSrc}
                poster={thumbnailUrl}
                loop
                playsInline
                muted={isMuted}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />

              {/* Platform Showcase Limit Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-bold text-pink-300 flex items-center gap-1 pointer-events-none">
                <Clock className="w-3 h-3 text-pink-400" />
                <span>Showcase Limit: {maxReelLimit}s</span>
              </div>

              {/* Play/Pause Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors"
              >
                {!isPlaying && (
                  <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl scale-100 hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5 text-pink-400" />
                  </div>
                )}
              </button>

              {/* Video Controls Pill */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400" />}
                </button>
              </div>

              {/* Bottom sound indicator */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="flex items-center gap-1.5 truncate">
                  <Music2 className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="truncate">{selectedSound}</span>
                </div>
                <span className="text-[10px] text-gray-300 shrink-0">Reel Preview</span>
              </div>
            </div>
          )}

          {/* Video Duration Notice for Lengthy Uploads */}
          {videoDuration > maxReelLimit && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 shadow-md">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-white block">
                  Video Duration Notice ({Math.round(videoDuration)}s total length)
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Your full video will be safely uploaded. Per platform showcase rules, viewers will play the first <strong className="text-pink-400 font-bold">{maxReelLimit} seconds</strong>. If admins update the platform duration limit in the future, more of your video will automatically become playable!
                </p>
              </div>
            </div>
          )}

          {/* Video Selector: Choose from Device */}
          <div className="pt-1">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="video/*" 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent hover:bg-white/10 border border-pink-500/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-pink-400" />
              <span>{selectedFile ? 'Choose Different Video from Device' : 'Choose Video from Device / Gallery'}</span>
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-1.5 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
              <span>Video limit: <strong className="text-pink-300">Maximum 10MB</strong> (MP4, MOV, WebM)</span>
            </p>
          </div>
        </div>

        {/* Video Title (Optional) */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-gray-300">
            Reel Title <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your reel a catchy comedy title... (optional)"
            className="w-full bg-[#150f2c] text-white text-xs px-3.5 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        {/* Description & Caption (Optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">
              Caption & Description <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <span className="text-[10px] text-gray-500">{description.length}/500</span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Write a caption... mention what happened! (optional)"
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
              placeholder="Search or add custom hashtag (e.g. comedy, dance)..."
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
            {selectedLocation && (
              <button
                type="button"
                onClick={() => setSelectedLocation('')}
                className="text-[10px] text-pink-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
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
            Upon submitting, your reel enters the <strong>Admin Content Moderation Desk</strong>. Once verified and approved, it will be published live to all users across FunFlick!
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-pink-500/30 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending to Admin Desk ({progress}%)...</span>
            </div>
          ) : (
            <>
              <span>Submit Reel for Admin Approval</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Submission Success Modal with Influencer & High Views/Likes Payments Pop Message */}
      {submittedItem && (
        <UploadSuccessMonetizationModal
          item={submittedItem}
          type="Reel"
          onClose={() => setSubmittedItem(null)}
        />
      )}
    </div>
  );
};
