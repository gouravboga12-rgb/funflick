import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Flag, X, CheckCircle2 } from 'lucide-react';

export const ReportModal = ({ post, isOpen, onClose }) => {
  const { showToast } = useApp();
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !post) return null;

  const reasons = [
    'Inappropriate comedy or vulgar content',
    'Dangerous stunts or harassment',
    'Spam, misleading or bot engagement',
    'Intellectual property / copyright infringement',
    'Hate speech or discrimination'
  ];

  const handleSubmit = () => {
    if (!selectedReason) return;
    setSubmitted(true);
    setTimeout(() => {
      showToast('Thank you! Report received and sent to FunFlick Admin Moderation.', 'info');
      setSubmitted(false);
      setSelectedReason(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#160f2e] border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-rose-400">
            <Flag className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm font-heading">Report Content</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/10 text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300">
          Why are you reporting <span className="text-white font-semibold">@{post.creator.username}'s</span> post?
        </p>

        <div className="space-y-2">
          {reasons.map(reason => (
            <label
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                selectedReason === reason
                  ? 'bg-rose-950/40 border-rose-500/60 text-white font-medium'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>{reason}</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedReason === reason ? 'border-rose-500 bg-rose-500' : 'border-gray-500'
              }`}>
                {selectedReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedReason || submitted}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40"
          >
            {submitted ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
