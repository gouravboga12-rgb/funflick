import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, Smile, Trash2 } from 'lucide-react';

export const CommentSheet = ({ post, isOpen, onClose }) => {
  const { currentUser, addComment, deleteComment } = useApp();
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState({});

  if (!isOpen || !post) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText('');
  };

  const toggleCommentLike = (commentId) => {
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const quickEmojis = ['😂', '🔥', '❤️', '👏', '🙌', '💯', '🤣', '✨'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 150 }}
        className="w-full max-w-md bg-[#130d29] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-4 shadow-2xl flex flex-col h-[75vh] max-h-[640px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="w-6" />
          <div className="text-center">
            <h3 className="text-sm font-bold text-white font-heading">
              Comments ({post.commentsCount || 0})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments Scrollable List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 no-scrollbar">
          {(!post.comments || post.comments.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-sm font-semibold text-white">No comments yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts on this fun flick!</p>
            </div>
          ) : (
            post.comments.map(c => {
              const isLiked = likedComments[c.id];
              return (
                <div key={c.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 flex-1">
                    <img
                      src={c.avatar}
                      alt={c.user}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-200">@{c.user}</span>
                        <span className="text-[10px] text-gray-400">{c.time}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <button className="text-[10px] font-semibold text-gray-400 hover:text-pink-400">
                          Reply
                        </button>
                        {(c.user === currentUser.username || post.creator?.username === currentUser.username || currentUser.role === 'admin') && (
                          <button
                            onClick={() => deleteComment(post.id, c.id)}
                            className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                            title="Delete vulgar or unwanted comment"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCommentLike(c.id)}
                    className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-pink-400 pt-1 shrink-0"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-pink-500 fill-current' : ''}`} />
                    <span className="text-[10px]">{(c.likes || 0) + (isLiked ? 1 : 0)}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Emoji Bar */}
        <div className="py-2 border-t border-white/5 flex items-center justify-around shrink-0">
          {quickEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => setCommentText(prev => prev + emoji)}
              className="text-base hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Bottom Input Form */}
        <form onSubmit={handleSend} className="pt-2 flex items-center gap-2 border-t border-white/10 shrink-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover border border-white/20"
          />
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={`Add a comment as @${currentUser.username}...`}
            className="flex-1 bg-white/10 text-white placeholder-gray-400 text-xs px-3.5 py-2.5 rounded-full border border-white/15 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
