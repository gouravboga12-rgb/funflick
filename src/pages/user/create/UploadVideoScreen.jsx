import React, { useState, useRef } from 'react';
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
  Film
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UploadSuccessMonetizationModal } from '../../../components/common/UploadSuccessMonetizationModal';

const SAMPLE_COMEDY_VIDEOS = [
  {
    id: 'sample_1',
    name: 'Office Appraisal Comedy',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41445-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    duration: '0:32',
    category: 'Comedy'
  },
  {
    id: 'sample_2',
    name: 'Stand-up Open Mic Punchline',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    duration: '0:45',
    category: 'Stand-up'
  },
  {
    id: 'sample_3',
    name: 'Hostel Cooking Chaos',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-walking-on-the-street-at-night-42805-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    duration: '0:28',
    category: 'Memes'
  }
];

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
  const { currentUser, submitVideoForVerification, setSubscriptionGateModalOpen, showToast } = useApp();

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form State
  const [selectedVideo, setSelectedVideo] = useState(SAMPLE_COMEDY_VIDEOS[0]);
  const [videoSrc, setVideoSrc] = useState(SAMPLE_COMEDY_VIDEOS[0].videoUrl);
  const [thumbnailUrl, setThumbnailUrl] = useState(SAMPLE_COMEDY_VIDEOS[0].thumbnail);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad, India');
  const [selectedSound, setSelectedSound] = useState(POPULAR_SOUNDS[0]);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [hashtags, setHashtags] = useState('#funflick #reels');

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Upload progress simulation
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submittedItem, setSubmittedItem] = useState(null);

  // Handle local video file upload from device
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setVideoSrc(blobUrl);
      setSelectedVideo(null);
      showToast(`Selected "${file.name}" for upload! 🎥`, 'info');
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

  // Toggle Tag user
  const handleToggleTag = (username) => {
    if (taggedUsers.includes(username)) {
      setTaggedUsers(prev => prev.filter(u => u !== username));
    } else {
      setTaggedUsers(prev => [...prev, username]);
    }
  };

  // Quick append hashtag
  const handleAddHashtag = (tag) => {
    if (!hashtags.includes(tag)) {
      setHashtags(prev => (prev ? `${prev} ${tag}` : tag));
    }
  };

  // Submit flow
  const handleUpload = (e) => {
    e.preventDefault();

    // 1. Subscription Check
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post videos!', 'error');
      return;
    }

    if (!title.trim()) {
      showToast('Please enter a video title', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(25);

    setTimeout(() => setProgress(60), 350);
    setTimeout(() => setProgress(88), 700);

    setTimeout(() => {
      setProgress(100);
      const res = submitVideoForVerification({
        title,
        description,
        category,
        hashtags,
        mediaUrl: videoSrc,
        thumbnailUrl: thumbnailUrl || selectedVideo?.thumbnail,
        audioTitle: selectedSound,
        location: selectedLocation,
        tags: taggedUsers
      });

      setIsUploading(false);

      if (res.success) {
        setSubmittedItem(res.submission);
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        showToast('📤 Reel submitted for Central Admin Verification!', 'success');
      }
    }, 1100);
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
          <div className="relative w-full aspect-[9/16] max-h-[340px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl mx-auto flex items-center justify-center group">
            
            <video
              ref={videoRef}
              src={videoSrc}
              poster={thumbnailUrl}
              loop
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover cursor-pointer"
              onClick={togglePlay}
            />

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

          {/* Video Selector Options: Choose from Device or Pick FunFlick Sample */}
          <div className="flex items-center gap-2 pt-1">
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
              className="flex-1 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
            >
              <UploadCloud className="w-4 h-4 text-pink-400" />
              <span>Choose from Device / Gallery</span>
            </button>
          </div>

          {/* Quick Comedy Video Samples */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Or pick sample comedy clip:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_COMEDY_VIDEOS.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVideo(v);
                    setVideoSrc(v.videoUrl);
                    setThumbnailUrl(v.thumbnail);
                    setTitle(v.name);
                    setCategory(v.category);
                    setIsPlaying(false);
                  }}
                  className={`p-1.5 rounded-2xl border text-left transition ${
                    videoSrc === v.videoUrl
                      ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <img src={v.thumbnail} alt={v.name} className="w-full h-12 rounded-xl object-cover mb-1" />
                  <span className="text-[10px] font-bold block truncate">{v.name}</span>
                  <span className="text-[9px] text-pink-300">{v.duration}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Title */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-gray-300">Reel Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your reel a catchy comedy title..."
            className="w-full bg-[#150f2c] text-white text-xs px-3.5 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        {/* Description & Caption (Instagram Style) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">Caption & Description</label>
            <span className="text-[10px] text-gray-500">{description.length}/500</span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Write a caption... mention what happened!"
            className="w-full bg-[#150f2c] text-white text-xs p-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 leading-relaxed transition"
          />
        </div>

        {/* Quick Hashtags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-pink-400" />
            <span>Hashtags</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {['#funflick', '#comedy', '#viralreels', '#teluguhumor', '#standup', '#memes'].map(t => (
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

        {/* Category & Audio Grid */}
        <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Audio Track</label>
            <select
              value={selectedSound}
              onChange={e => setSelectedSound(e.target.value)}
              className="w-full bg-[#150f2c] text-white text-xs px-3 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 truncate"
            >
              {POPULAR_SOUNDS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tag People (Instagram Feature) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Tag People / Creators</span>
            </label>
            <span className="text-[10px] text-pink-300 font-semibold">{taggedUsers.length} tagged</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_CREATORS_TO_TAG.map(username => {
              const isTagged = taggedUsers.includes(username);
              return (
                <button
                  key={username}
                  type="button"
                  onClick={() => handleToggleTag(username)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isTagged
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <span>@{username}</span>
                  {isTagged && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-pink-400" />
            <span>Add Location</span>
          </label>
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="w-full bg-[#150f2c] text-white text-xs px-3 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          >
            {POPULAR_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
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
