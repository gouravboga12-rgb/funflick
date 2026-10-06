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
import { UploadSuccessMonetizationModal } from '../../../components/common/UploadSuccessMonetizationModal';
import { uploadFileToS3 } from '../../../services/s3UploadService';

export const CreateStoryScreen = () => {
  const navigate = useNavigate();
  const { currentUser, setSubscriptionGateModalOpen, mediaLimits, showToast, fetchLiveStories } = useApp();

  const maxStoryDuration = mediaLimits?.maxStoryDuration || 15;
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedMusic, setSelectedMusic] = useState('🎵 Telugu Comedy Beats - Trending');
  const [selectedSticker, setSelectedSticker] = useState('😂');

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
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
      setSelectedFile(file);
      setMediaUrl(URL.createObjectURL(file));
      showToast('Story media selected from device! 📸');
    }
  };

  const handlePublish = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedFile && !mediaUrl) {
      showToast('Please select a photo or video from your device first!', 'error');
      return;
    }

    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post stories!', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(5);

    try {
      let finalMediaUrl = mediaUrl;
      if (selectedFile) {
        finalMediaUrl = await uploadFileToS3(selectedFile, 'stories', (pct) => {
          setProgress(Math.min(90, Math.max(5, pct)));
        });
      }

      // Permanent media safety check: never commit temporary blob URLs
      if (!finalMediaUrl || finalMediaUrl.startsWith('blob:')) {
        throw new Error('Please wait for the story media to upload to AWS S3 storage before submitting.');
      }

      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const isVideo = selectedFile?.type?.startsWith('video');

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          media_url: finalMediaUrl,
          media_type: isVideo ? 'video' : 'image',
          caption,
          music: selectedMusic,
          sticker: selectedSticker
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save story');
      }

      const resData = await res.json();
      setProgress(100);

      // Refresh live stories from MySQL
      if (fetchLiveStories) await fetchLiveStories();

      setSubmittedItem({
        id: resData.storyId,
        mediaUrl: finalMediaUrl,
        contentType: isVideo ? 'video' : 'image',
        title: caption || 'New Story'
      });

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showToast('📤 Story uploaded to AWS S3 & published live!', 'success');
    } catch (err) {
      console.error('Story upload error:', err);
      showToast(err.message || 'Story upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
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
            Max Length: {maxStoryDuration}s • Moderation
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
        {mediaUrl ? (
          <>
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
            {caption && (
              <div className="absolute bottom-6 left-4 right-4 text-center">
                <span className="inline-block px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                  {caption}
                </span>
              </div>
            )}

            {/* Change Photo Floating Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-16 right-4 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-lg hover:scale-105 transition"
              title="Pick media from device"
            >
              <Camera className="w-5 h-5 text-pink-400" />
            </button>
          </>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none group"
          >
            <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition">
              <Camera className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-white mb-1">Select Story Photo or Video</span>
            <span className="text-xs text-gray-400">Tap to upload from device gallery</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30">
            <div className="w-full max-w-xs p-4 rounded-2xl bg-[#150f2c] border border-pink-500/40 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-pink-300">Uploading Story to AWS S3...</span>
                <span className="text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
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

      {/* Submission Success Modal with Influencer & High Views/Likes Payments Pop Message */}
      {submittedItem && (
        <UploadSuccessMonetizationModal
          item={submittedItem}
          type="Story"
          onClose={() => setSubmittedItem(null)}
        />
      )}
    </div>
  );
};
