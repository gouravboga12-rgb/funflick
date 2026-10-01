import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Bookmark, 
  Flag, 
  EyeOff, 
  Copy, 
  Send, 
  MessageCircle, 
  X,
  Check
} from 'lucide-react';

export const ShareSheet = ({ post, isOpen, onClose, onOpenReport }) => {
  const { toggleSavePost, showToast } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !post) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.origin + '/video/' + post.id);
    setCopied(true);
    showToast('Link copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTo = (platform) => {
    showToast(`Shared to ${platform}! 🚀`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 150 }}
        className="w-full max-w-md bg-[#130d29] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl space-y-5"
      >
        {/* Handle pill */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto -mt-1" />

        {/* Share apps row */}
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
            Share Video To
          </span>
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
            <button 
              onClick={() => handleShareTo('WhatsApp')} 
              className="flex flex-col items-center gap-1.5 min-w-[60px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-gray-300">WhatsApp</span>
            </button>

            <button 
              onClick={() => handleShareTo('Direct Message')} 
              className="flex flex-col items-center gap-1.5 min-w-[60px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-gray-300">Inbox</span>
            </button>

            <button 
              onClick={() => handleShareTo('Instagram Stories')} 
              className="flex flex-col items-center gap-1.5 min-w-[60px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <span className="text-[10px] text-gray-300">Stories</span>
            </button>

            <button 
              onClick={handleCopyLink} 
              className="flex flex-col items-center gap-1.5 min-w-[60px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </div>
              <span className="text-[10px] text-gray-300">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Video Actions matching Screen 8: Share, Save, Report, Not Interested */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 transition text-gray-300 hover:text-white"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium">Share</span>
          </button>

          <button
            onClick={() => {
              toggleSavePost(post.id);
              onClose();
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 transition text-gray-300 hover:text-white"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              post.isSaved ? 'bg-pink-600 text-white' : 'bg-white/10'
            }`}>
              <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[11px] font-medium">{post.isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenReport) onOpenReport(post);
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 transition text-gray-300 hover:text-rose-400"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium">Report</span>
          </button>

          <button
            onClick={() => {
              showToast("We'll show fewer videos like this", 'info');
              onClose();
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 transition text-gray-300 hover:text-amber-400"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium">Not Interested</span>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};
