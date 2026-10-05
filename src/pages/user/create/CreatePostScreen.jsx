import React, { useState, useRef } from 'react';
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

const SAMPLE_POST_PHOTOS = [
  {
    id: 'photo_1',
    name: 'Behind the Scenes Comedy Set',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    category: 'Comedy'
  },
  {
    id: 'photo_2',
    name: 'Stand-up Open Mic Stage',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    category: 'Stand-up'
  },
  {
    id: 'photo_3',
    name: 'Cast Celebration Shoot',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    category: 'Entertainment'
  }
];

const SUGGESTED_CREATORS = [
  'pavani_official',
  'srilatha_16',
  'fun_bros',
  'chill_mammu',
  'rohan_comedy'
];

const SUGGESTED_LOCATIONS = [
  'Hyderabad Film City',
  'Jubilee Hills, Hyderabad',
  'Mumbai Comedy Central',
  'Bengaluru Studios'
];

export const CreatePostScreen = () => {
  const navigate = useNavigate();
  const { currentUser, submitPostForVerification, setSubscriptionGateModalOpen, showToast } = useApp();

  const fileInputRef = useRef(null);

  const [mediaUrl, setMediaUrl] = useState(SAMPLE_POST_PHOTOS[0].url);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('#funflick #post');
  const [location, setLocation] = useState('Hyderabad, India');
  const [category, setCategory] = useState('Comedy');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [enableComments, setEnableComments] = useState(true);

  // Upload simulation states: 'idle' | 'uploading' | 'submitted'
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submittedItem, setSubmittedItem] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaUrl(event.target.result);
        showToast('Photo selected from device! 📸', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleTag = (username) => {
    if (taggedUsers.includes(username)) {
      setTaggedUsers(prev => prev.filter(u => u !== username));
    } else {
      setTaggedUsers(prev => [...prev, username]);
    }
  };

  const handleAddHashtag = (tag) => {
    if (!hashtags.includes(tag)) {
      setHashtags(prev => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!mediaUrl) return;

    // 1. Subscription Check
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post media!', 'error');
      return;
    }

    // Caption is optional (social media post style)
    const finalCaption = caption.trim();

    setIsUploading(true);
    setProgress(30);

    setTimeout(() => setProgress(70), 300);
    setTimeout(() => {
      setProgress(100);
      const finalCaption = caption.trim();
      const res = submitPostForVerification({
        caption: finalCaption,
        hashtags,
        mediaType: 'image',
        mediaUrl,
        category,
        location,
        tags: taggedUsers
      });
      setIsUploading(false);

      if (res.success) {
        setSubmittedItem(res.submission);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) {}
        showToast('📤 Post submitted for Central Admin Verification!', 'success');
      }
    }, 850);
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
        <div className="space-y-2">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-[#150f2c] border border-white/10 shadow-xl group">
            <img
              src={mediaUrl}
              alt="Post preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 hover:bg-black/90 transition"
            >
              <UploadCloud className="w-3.5 h-3.5 text-pink-400" />
              <span>Change Photo</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Sample comedy shoot photos */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Or pick sample photo:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_POST_PHOTOS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setMediaUrl(p.url);
                    setCategory(p.category);
                  }}
                  className={`p-1 rounded-2xl border text-left transition ${
                    mediaUrl === p.url
                      ? 'bg-pink-500/20 border-pink-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <img src={p.url} alt={p.name} className="w-full h-12 rounded-xl object-cover mb-1" />
                  <span className="text-[10px] font-bold block truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
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
            {SUGGESTED_CREATORS.map(username => {
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
