import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const UploadVideoScreen = () => {
  const navigate = useNavigate();
  const { currentUser, submitVideoForVerification, setSubscriptionGateModalOpen, showToast } = useApp();

  const [title, setTitle] = useState('Office Appraisal Nightmare Part 3');
  const [description, setDescription] = useState('When the manager asks what you achieved this quarter and you only have memes to show!');
  const [category, setCategory] = useState('Comedy');
  const [hashtags, setHashtags] = useState('#funflick #officecomedy #viralreel #funbros');
  const [visibility, setVisibility] = useState('Public');
  const [mediaUrl, setMediaUrl] = useState('https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41445-large.mp4');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80');

  // Simulated upload progress & submission status
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submittedItem, setSubmittedItem] = useState(null);

  const handleUpload = (e) => {
    e.preventDefault();

    // Check publishing subscription requirement
    if (!currentUser.hasPublishingSubscription) {
      setSubscriptionGateModalOpen(true);
      showToast('⚠️ Creator Publishing Plan required to post videos!', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(30);

    setTimeout(() => setProgress(75), 400);
    setTimeout(() => {
      setProgress(100);
      const res = submitVideoForVerification({
        title,
        description,
        category,
        hashtags,
        mediaUrl,
        thumbnailUrl
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
        } catch (e) {}
        showToast('📤 Reel submitted for Central Admin Verification!', 'success');
      }
    }, 1000);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-white font-heading block">
            Upload Video / Reel
          </span>
          <span className="text-[10px] text-pink-400">
            Admin Verification Queue
          </span>
        </div>
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      {/* Main Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        
        {/* Publishing Subscription Callout */}
        {!currentUser.hasPublishingSubscription ? (
          <div 
            onClick={() => setSubscriptionGateModalOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/70 via-purple-950/60 to-amber-950/50 border border-pink-500/40 flex items-center justify-between cursor-pointer hover:border-pink-500 transition shadow-lg shadow-pink-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-white shrink-0 shadow">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-heading block">
                  Publishing Subscription Required
                </span>
                <p className="text-[10px] text-gray-300">
                  Tap to get a publishing plan (From ₹199) to unlock video uploads.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-pink-400 shrink-0" />
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <Crown className="w-4 h-4 text-amber-400" />
              Publishing Plan Active ({currentUser.subscriptionPlan || 'Monthly'})
            </span>
            <span className="text-[10px] text-gray-400">Unlimited Uploads</span>
          </div>
        )}

        {/* Video Thumbnail Preview */}
        <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-[#18122c] border border-white/10 shadow-lg">
          <img
            src={thumbnailUrl}
            alt="Thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Video className="w-6 h-6 text-pink-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Video Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#18122c] text-white text-xs px-3.5 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-[#18122c] text-white text-xs p-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 leading-relaxed"
          />
        </div>

        {/* Category & Visibility Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#18122c] text-white text-xs px-3 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            >
              <option value="Comedy">Comedy</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Stand-up">Stand-up</option>
              <option value="Memes">Memes</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Visibility</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="w-full bg-[#18122c] text-white text-xs px-3 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
            >
              <option value="Public">Public (Requires Admin Verification)</option>
              <option value="Private">Private Draft</option>
            </select>
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Tags & Mentions</label>
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            className="w-full bg-[#18122c] text-pink-300 font-medium text-xs px-3.5 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Central Admin Verification Notice */}
        <div className="p-3.5 rounded-2xl bg-[#140d2b] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Central Admin Verification Process</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Your video will be reviewed by FunFlick Admin. Once approved, it is broadcasted live to users. Videos reaching high view counts become eligible for cash rewards disbursed to your wallet!
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
              <span>Submitting for Admin Verification ({progress}%)...</span>
            </div>
          ) : (
            <>
              <span>Submit Reel for Admin Approval</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
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
                Reel Submitted for Verification!
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Your video <span className="text-pink-300 font-bold">"{submittedItem.title}"</span> has been sent to the FunFlick Central Admin Desk for review.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Current Status:</span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 text-[10px]">
                  ⏳ In Admin Review
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Monetization:</span>
                <span className="text-emerald-400 font-bold text-[10px]">
                  Eligible for Performance Rewards
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate('/profile?tab=influencer')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md"
              >
                Track in My Influencer Hub
              </button>

              <button
                onClick={() => navigate('/admin/content')}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>Test Approve in Admin Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
