import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Film, 
  Clock, 
  ArrowRight,
  Info
} from 'lucide-react';

export const CopyrightReportModal = ({ targetPost, isOpen, onClose }) => {
  const { currentUser, userSubmissions, submitCopyrightReport, showToast } = useApp();
  const [selectedOriginal, setSelectedOriginal] = useState(null);
  const [customOriginalTitle, setCustomOriginalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetPost) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide an explanation of how your content was copied', 'error');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      submitCopyrightReport({
        originalTitle: selectedOriginal ? selectedOriginal.title : (customOriginalTitle || 'My Original Video'),
        originalThumbnail: selectedOriginal?.thumbnail || currentUser?.avatar,
        accusedUsername: targetPost.creator || targetPost.username || 'user',
        accusedTitle: targetPost.title || targetPost.caption || 'Video Post',
        accusedThumbnail: targetPost.thumbnail || targetPost.mediaUrl,
        description
      });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#130d29] border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm font-heading">
                  Report Copied Content
                </h3>
                <p className="text-[10px] text-rose-300">FunFlick Creator Copyright Protection</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full bg-white/10 text-gray-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stolen Video Summary */}
          <div className="p-3 rounded-2xl bg-[#191136] border border-rose-500/20 flex items-center gap-3">
            <img 
              src={targetPost.thumbnail || targetPost.mediaUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80'} 
              alt="Accused post" 
              className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" 
            />
            <div className="text-xs truncate">
              <span className="text-[10px] text-rose-300 font-bold block uppercase tracking-wider">Accused Copied Post:</span>
              <span className="font-bold text-white block truncate">{targetPost.title || targetPost.caption || 'Video'}</span>
              <span className="text-[11px] text-gray-400">By @{targetPost.creator || targetPost.username || 'user'}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Step 1: Select Your Original Post */}
            <div>
              <label className="font-bold text-gray-200 block mb-1.5 flex items-center justify-between">
                <span>1. Select your original post:</span>
                <span className="text-[10px] text-gray-400">Uploaded from your account</span>
              </label>

              {userSubmissions && userSubmissions.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {userSubmissions.slice(0, 4).map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedOriginal(sub);
                        setCustomOriginalTitle('');
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                        selectedOriginal?.id === sub.id
                          ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Film className="w-4 h-4 text-pink-400 shrink-0" />
                      <div className="truncate flex-1">
                        <span className="block truncate text-xs">{sub.title}</span>
                        <span className="text-[10px] text-gray-400 block">{sub.date || 'Earlier Upload'}</span>
                      </div>
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
                  placeholder="Enter title or link of your original upload..."
                  className="w-full bg-[#181033] text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-rose-500"
                />
              )}
            </div>

            {/* Step 2: Description of Infringement */}
            <div>
              <label className="font-bold text-gray-200 block mb-1">
                2. Explain how this content was copied:
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. This creator downloaded my comedy sketch, cropped out my watermark, and posted it to his profile without credit..."
                rows={3}
                className="w-full bg-[#181033] text-white text-xs p-3 rounded-2xl border border-white/10 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Reassurance Banner */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-200 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                FunFlick verifies original ownership using cryptographic upload timestamps. If confirmed, the stolen post will be deleted and the copier struck.
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold hover:bg-white/15 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-bold hover:opacity-95 disabled:opacity-50 shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
