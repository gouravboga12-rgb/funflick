import React, { useState } from 'react';
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
  UploadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreatePostScreen = () => {
  const navigate = useNavigate();
  const { currentUser, publishNewPost, setSubscriptionGateModalOpen, showToast } = useApp();

  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80');
  const [caption, setCaption] = useState('Behind the scenes of our new comedy episode! When you realize everyone forgot their lines 🤣🤣');
  const [hashtags, setHashtags] = useState('#funflick #comedy #bts #shootday #teluguhumor');
  const [location, setLocation] = useState('Hyderabad Film City');
  const [enableComments, setEnableComments] = useState(true);

  // Upload simulation states: 'idle' | 'uploading' | 'processing' | 'published'
  const [uploadState, setUploadState] = useState('idle');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaUrl(URL.createObjectURL(file));
      showToast('Media selected! 📸');
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!mediaUrl) return;

    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post media!', 'error');
      return;
    }

    setUploadState('uploading');
    setProgress(20);

    // Simulate progress
    const timer1 = setTimeout(() => {
      setProgress(65);
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setUploadState('processing');
    }, 800);

    const timer3 = setTimeout(() => {
      setUploadState('published');
      publishNewPost({
        caption,
        hashtags,
        mediaType: 'image',
        mediaUrl
      });
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      setTimeout(() => navigate('/'), 900);
    }, 1400);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          New Post
        </span>
        <button
          onClick={handlePublish}
          disabled={uploadState !== 'idle'}
          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
        >
          Publish
        </button>
      </div>

      {/* Upload Simulation Overlay Modal */}
      {uploadState !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#150f2e] border border-pink-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto animate-pulse">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-extrabold text-white text-base font-heading">
                {uploadState === 'uploading' && `Uploading Media (${progress}%)`}
                {uploadState === 'processing' && 'Optimizing video stream...'}
                {uploadState === 'published' && '🎉 Published Live to FunFlick!'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {uploadState === 'published' ? 'Redirecting to your feed...' : 'FunFlick media engine is preparing your content'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        {/* Media Preview Box */}
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-[#18122c] border border-white/10 shadow-lg group">
          <img
            src={mediaUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <label className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold cursor-pointer hover:bg-white/30 transition">
              Replace Media
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Caption</label>
          <textarea
            rows={3}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a hilarious caption..."
            className="w-full bg-[#18122c] text-white placeholder-gray-500 text-xs p-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 leading-relaxed"
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            placeholder="#comedy #funflick"
            className="w-full bg-[#18122c] text-pink-300 font-medium placeholder-gray-500 text-xs px-3.5 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Location</label>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-pink-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Add location..."
              className="w-full bg-[#18122c] text-white placeholder-gray-500 text-xs pl-10 pr-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Settings: Comments Toggle */}
        <div className="p-3.5 rounded-2xl bg-[#140e2b] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-xs font-bold text-white block">Allow Comments</span>
              <span className="text-[10px] text-gray-400">Viewers can react & reply to this post</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={enableComments}
            onChange={e => setEnableComments(e.target.checked)}
            className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
          />
        </div>

        {/* CTA Bottom Button */}
        <button
          onClick={handlePublish}
          disabled={uploadState !== 'idle'}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-pink-500/30 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
        >
          <span>Publish Post</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
