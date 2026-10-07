import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Film, 
  ArrowRight, 
  AlertTriangle,
  Info 
} from 'lucide-react';

export const ReportModal = ({ post, isOpen, onClose }) => {
  const { showToast, userSubmissions, submitCopyrightReport } = useApp();
  const [selectedReason, setSelectedReason] = useState(null);
  const [isCopyrightFlow, setIsCopyrightFlow] = useState(false);
  const [selectedOriginal, setSelectedOriginal] = useState(null);
  const [customOriginalTitle, setCustomOriginalTitle] = useState('');
  const [copyrightDescription, setCopyrightDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !post) return null;

  const reasons = [
    { label: 'Intellectual property / Stolen copyright content', isCopyright: true },
    { label: 'Inappropriate comedy or vulgar content', isCopyright: false },
    { label: 'Dangerous stunts or harassment', isCopyright: false },
    { label: 'Spam, misleading or bot engagement', isCopyright: false },
    { label: 'Hate speech or discrimination', isCopyright: false }
  ];

  const handleSelectReason = (r) => {
    setSelectedReason(r.label);
    if (r.isCopyright) {
      setIsCopyrightFlow(true);
    } else {
      setIsCopyrightFlow(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedReason) return;

    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) {
      showToast('Please log in to report content', 'error');
      return;
    }

    setSubmitted(true);
    try {
      const detailsText = isCopyrightFlow 
        ? `Copyright claim: ${copyrightDescription || 'Stolen video reposted without permission'}. Original: "${selectedOriginal?.title || customOriginalTitle || 'My original post'}"`
        : `User reported: ${selectedReason}`;

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetVideoId: post.id,
          reason: selectedReason,
          details: detailsText
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Thank you! Report received and sent to FunFlick Admin Moderation.', 'success');
        if (isCopyrightFlow && submitCopyrightReport) {
          submitCopyrightReport({
            originalTitle: selectedOriginal ? selectedOriginal.title : (customOriginalTitle || 'My Original Video'),
            originalThumbnail: selectedOriginal?.thumbnail || post.thumbnail,
            accusedUsername: post.creator?.username || post.creator || 'user',
            accusedTitle: post.title || post.caption || 'Video Reel',
            accusedThumbnail: post.thumbnail || post.mediaUrl,
            description: copyrightDescription || 'User screen recorded and reposted my original content without permission.'
          });
        }
        setSelectedReason(null);
        setIsCopyrightFlow(false);
        setCopyrightDescription('');
        onClose();
      } else {
        showToast(data.error || 'Failed to submit report', 'error');
      }
    } catch (err) {
      console.error('Report submission error:', err);
      showToast('Network error submitting report. Please try again.', 'error');
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#140e2b] border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-rose-400">
            {isCopyrightFlow ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <Flag className="w-5 h-5" />}
            <h3 className="font-bold text-white text-sm font-heading">
              {isCopyrightFlow ? 'Copyright Infringement Claim' : 'Report Content'}
            </h3>
          </div>
          <button 
            onClick={() => {
              setIsCopyrightFlow(false);
              onClose();
            }} 
            className="p-1 rounded-full bg-white/10 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300">
          Reporting <span className="text-white font-semibold">@{post.creator?.username || post.creator || 'user'}'s</span> post:
        </p>

        {/* Reason Picker */}
        {!isCopyrightFlow ? (
          <div className="space-y-2">
            {reasons.map(r => (
              <label
                key={r.label}
                onClick={() => handleSelectReason(r)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition ${
                  selectedReason === r.label
                    ? 'bg-rose-950/40 border-rose-500 text-white font-medium'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span>{r.label}</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedReason === r.label ? 'border-rose-500 bg-rose-500' : 'border-gray-500'
                }`}>
                  {selectedReason === r.label && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </label>
            ))}
          </div>
        ) : (
          /* Copyright Specific Details Form */
          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-200">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Provide proof of your original upload. The admin will inspect timestamps and take down the copied video.
              </span>
            </div>

            {/* Select Original Post */}
            <div>
              <label className="font-bold text-gray-200 block mb-1">
                1. Select your original video:
              </label>

              {userSubmissions && userSubmissions.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {userSubmissions.slice(0, 3).map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedOriginal(sub);
                        setCustomOriginalTitle('');
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        selectedOriginal?.id === sub.id
                          ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Film className="w-4 h-4 text-pink-400 shrink-0" />
                      <span className="truncate flex-1 text-xs">{sub.title}</span>
                      {selectedOriginal?.id === sub.id && (
                        <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={customOriginalTitle}
                  onChange={e => {
                    setCustomOriginalTitle(e.target.value);
                    setSelectedOriginal(null);
                  }}
                  placeholder="Enter title or link of your original video..."
                  className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-rose-500"
                />
              )}
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-gray-200 block mb-1">
                2. Explain how this video was copied:
              </label>
              <textarea
                value={copyrightDescription}
                onChange={e => setCopyrightDescription(e.target.value)}
                placeholder="e.g. This creator downloaded my comedy sketch, cropped out my watermark, and posted it to his profile without credit..."
                rows={3}
                className="w-full bg-[#181033] text-white text-xs p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {isCopyrightFlow ? (
            <button
              type="button"
              onClick={() => setIsCopyrightFlow(false)}
              className="py-2.5 px-3 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/15 transition"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/15 transition"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedReason || submitted}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition disabled:opacity-40 shadow-lg shadow-rose-600/20"
          >
            {submitted ? 'Submitting...' : isCopyrightFlow ? 'Submit Copyright Claim' : 'Submit Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
