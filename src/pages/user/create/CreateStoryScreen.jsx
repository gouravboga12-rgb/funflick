import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronLeft, 
  Sparkles, 
  Smile, 
  Music, 
  Type, 
  X, 
  Check, 
  ArrowRight,
  Camera,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Crown,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_STORY_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80'
];

export const CreateStoryScreen = () => {
  const navigate = useNavigate();
  const { currentUser, submitStoryForVerification, setSubscriptionGateModalOpen, showToast } = useApp();

  const fileInputRef = useRef(null);

  const [mediaUrl, setMediaUrl] = useState(SAMPLE_STORY_PHOTOS[0]);
  const [caption, setCaption] = useState('On set shooting episode 4! 🎬✨ #FunFlickStory');
  const [selectedMusic, setSelectedMusic] = useState('🎵 Telugu Comedy Beats - Trending');
  const [selectedSticker, setSelectedSticker] = useState('😂');

  const [isUploading, setIsUploading] = useState(false);
  const [submittedItem, setSubmittedItem] = useState(null);

  const stickers = ['😂', '🔥', '❤️', '🎉', '🍿', '💯', '✨', '☕'];
  const musicTracks = [
    '🎵 Telugu Comedy Beats - Trending',
    '🎵 Upbeat Chill Lofi - Mammu Mix',
    '🎵 Standup Crowd Punchline SFX'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaUrl(URL.createObjectURL(file));
      showToast('Story photo updated! 📸');
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post stories!', 'error');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const res = submitStoryForVerification({
        mediaUrl,
        caption
      });

      if (res.success) {
        setSubmittedItem(res.submission);
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        showToast('📤 Story submitted for Admin Review!', 'success');
      }
    }, 700);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-black min-h-full select-none justify-between">
      {/* Top Header Controls - Instagram Stories Style */}
      <div className="relative z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 -ml-1 text-white hover:bg-white/20 rounded-full transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <span className="text-sm font-bold text-white font-heading block">
            Add to Story
          </span>
          <span className="text-[10px] text-pink-400 font-semibold">
            Admin Verification Queue
          </span>
        </div>

        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 transition"
        >
          {isUploading ? 'Sending...' : 'Share'}
        </button>
      </div>

      {/* Center Story Visual Canvas */}
      <div className="relative flex-1 m-3 rounded-3xl overflow-hidden bg-gray-900 border border-white/10 flex items-center justify-center shadow-2xl">
        <img
          src={mediaUrl}
          alt="Story Canvas"
          className="w-full h-full object-cover"
        />

        {/* Floating Sticker */}
        {selectedSticker && (
          <div className="absolute top-1/4 right-8 text-5xl drop-shadow-2xl animate-bounce">
            {selectedSticker}
          </div>
        )}

        {/* Music Track Sticker */}
        {selectedMusic && (
          <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
            <Music className="w-3.5 h-3.5 text-pink-400" />
            <span className="truncate max-w-[180px]">{selectedMusic}</span>
          </div>
        )}

        {/* Caption Overlay */}
        <div className="absolute bottom-6 left-4 right-4 text-center">
          <span className="inline-block px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20">
            {caption}
          </span>
        </div>

        {/* Change Photo Floating Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-16 right-4 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-lg hover:scale-105 transition"
          title="Pick image from device"
        >
          <Camera className="w-5 h-5 text-pink-400" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Bottom Story Controls (Instagram Stories Toolbox) */}
      <div className="relative z-20 px-4 py-3 bg-gradient-to-t from-black via-black/90 to-transparent space-y-3">
        {/* Caption Input */}
        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Add story text..."
          className="w-full bg-white/10 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 placeholder-gray-400"
        />

        {/* Stickers bar */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            Sticker:
          </span>
          {stickers.map(st => (
            <button
              key={st}
              onClick={() => setSelectedSticker(selectedSticker === st ? '' : st)}
              className={`p-1.5 rounded-xl text-lg transition-transform ${
                selectedSticker === st ? 'scale-125 bg-white/20' : 'hover:scale-110'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Music Track selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {musicTracks.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMusic(m)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition ${
                selectedMusic === m 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Publishing Guard if not subscribed */}
        {!currentUser.hasPublishingSubscription && (
          <div 
            onClick={() => setSubscriptionGateModalOpen(true)}
            className="p-2.5 rounded-xl bg-pink-950/60 border border-pink-500/40 text-center text-xs text-pink-300 cursor-pointer font-semibold flex items-center justify-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Publishing Pass Required (Tap to Unlock)</span>
          </div>
        )}
      </div>

      {/* Submission Success Modal */}
      {submittedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#140d2d] border border-pink-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white font-heading">
                Story Sent for Admin Verification!
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Your 24h story has been sent to the Admin Moderation Desk. Once verified, it will be added to your profile's story ring for your followers.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate('/admin/content')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Go to Admin Moderation Desk to Approve</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white font-bold text-xs transition"
              >
                Return to Home Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
