import React, { useState } from 'react';
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
  Camera 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreateStoryScreen = () => {
  const navigate = useNavigate();
  const { currentUser, publishNewStory, setSubscriptionGateModalOpen, showToast } = useApp();

  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
  const [caption, setCaption] = useState('On set today shooting episode 4! 🎬✨ #FunFlickStory');
  const [selectedMusic, setSelectedMusic] = useState('🎵 Telugu Comedy Beats - Trending');
  const [selectedSticker, setSelectedSticker] = useState('😂');

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
    publishNewStory({
      mediaUrl,
      caption
    });
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    navigate('/');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-black min-h-full select-none justify-between">
      {/* Top Header Controls */}
      <div className="relative z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-white hover:bg-white/20 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Create Story
        </span>
        <button
          onClick={handlePublish}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-95"
        >
          Share
        </button>
      </div>

      {/* Center Story Visual Canvas */}
      <div className="relative flex-1 m-4 rounded-3xl overflow-hidden bg-gray-900 border border-white/10 flex items-center justify-center">
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
            <span className="truncate max-w-[200px]">{selectedMusic}</span>
          </div>
        )}

        {/* Caption Overlay */}
        <div className="absolute bottom-6 left-6 right-6 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20">
          <p className="text-white text-xs font-bold leading-relaxed">{caption}</p>
        </div>

        {/* Replace photo floating button */}
        <label className="absolute bottom-20 right-6 p-3 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 cursor-pointer hover:bg-black/90 transition shadow-xl">
          <Camera className="w-5 h-5" />
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {/* Bottom Tool Panels: Music, Stickers, Caption Edit */}
      <div className="relative z-20 p-4 space-y-3 bg-[#0d081f] border-t border-white/10 rounded-t-3xl">
        {/* Caption Input */}
        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Add story text..."
          className="w-full bg-white/10 text-white placeholder-gray-400 text-xs px-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
        />

        {/* Sticker Picker */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-1">
          {stickers.map(st => (
            <button
              key={st}
              onClick={() => setSelectedSticker(st)}
              className={`text-2xl p-1 rounded-xl transition ${
                selectedSticker === st ? 'scale-125 bg-white/10' : 'hover:scale-110'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Share Story CTA */}
        <button
          onClick={handlePublish}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg hover:opacity-95 flex items-center justify-center gap-2"
        >
          <span>Share to Your Story (24h)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
