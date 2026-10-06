import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export const StoryViewerModal = () => {
  const navigate = useNavigate();
  const { activeStoryGroup, setActiveStoryGroup, showToast } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    setCurrentIdx(0);
  }, [activeStoryGroup]);

  const stories = activeStoryGroup?.stories || [];
  const currentStory = stories[currentIdx] || stories[0];

  useEffect(() => {
    if (currentStory) {
      setIsLiked(Boolean(currentStory.isLiked));
      setLikesCount(Number(currentStory.likesCount) || 0);
    }
  }, [currentStory, currentIdx]);

  if (!activeStoryGroup || !activeStoryGroup.stories || activeStoryGroup.stories.length === 0) {
    return null;
  }

  const handleNext = () => {
    if (currentIdx < stories.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setActiveStoryGroup(null);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Real Story Like / Unlike linked with AWS MySQL database
  const handleToggleLike = async () => {
    if (!currentStory?.id) return;
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) {
      showToast('Please login to like stories', 'info');
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await fetch(`/api/stories/${currentStory.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(Boolean(data.liked));
        setLikesCount(Number(data.likesCount) || 0);
      }
    } catch (err) {
      console.warn('Story like error:', err);
    }
  };

  // Real Story Reply sending direct message to creator and redirecting to 1-to-1 conversation
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStoryGroup?.userId) return;

    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) {
      showToast('Please login to send message', 'info');
      return;
    }

    setIsSendingReply(true);
    const targetUserId = activeStoryGroup.userId;
    const targetUsername = activeStoryGroup.username;
    const textToSend = `Replied to story: "${replyText.trim()}"`;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: targetUserId,
          messageText: textToSend,
          mediaUrl: currentStory.mediaUrl
        })
      });

      if (res.ok) {
        showToast(`💬 Replied to @${targetUsername}'s story!`, 'success');
        setReplyText('');
        setActiveStoryGroup(null);
        navigate(`/messages?user=${targetUserId}`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to send story reply', 'error');
      }
    } catch (err) {
      console.error('Story reply error:', err);
      showToast('Could not send story reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 select-none">
      <div className="relative w-full max-w-[420px] h-full max-h-[920px] bg-black flex flex-col justify-between overflow-hidden sm:rounded-3xl shadow-2xl border border-white/10">
        
        {/* Story Media Background (Video or Image) */}
        <div className="absolute inset-0 z-0">
          {(currentStory.mediaType === 'video' || /\.(mp4|webm|mov|m4v)($|\?)/i.test(currentStory.mediaUrl || '')) ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={currentStory.mediaUrl} 
              alt="Story" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/brand/funflick-logo.png';
              }}
              className="w-full h-full object-cover" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Top Story Controls */}
        <div className="relative z-10 p-4 pt-3 space-y-3">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((st, i) => (
              <div key={st.id || i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-300 ${
                    i < currentIdx ? 'w-full' : i === currentIdx ? 'w-full animate-[progress_5s_linear]' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img 
                src={activeStoryGroup.avatar || '/brand/default-avatar.svg'} 
                alt={activeStoryGroup.username} 
                className="w-9 h-9 rounded-full object-cover border border-white/50" 
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  @{activeStoryGroup.username}
                </span>
                <span className="text-[10px] text-gray-300">
                  {currentStory.time || 'Active Story'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setActiveStoryGroup(null)}
              className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tap navigation hotzones */}
        <div className="relative z-0 flex-1 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* Bottom Story Footer with Caption and Reply */}
        <div className="relative z-10 p-4 pb-6 space-y-3">
          {currentStory.caption && (
            <div className="bg-black/40 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10">
              <p className="text-xs text-white leading-relaxed font-medium">
                {currentStory.caption}
              </p>
            </div>
          )}

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input 
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${activeStoryGroup.username}...`}
              className="flex-1 bg-white/15 backdrop-blur-md text-white placeholder-gray-300 text-xs px-4 py-2.5 rounded-full border border-white/20 focus:outline-none focus:border-pink-500"
            />
            
            {/* Story Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`p-2.5 rounded-full backdrop-blur-md transition flex items-center gap-1 active:scale-95 ${
                isLiked ? 'bg-[#ff007a] text-white shadow-lg shadow-pink-500/30' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title={isLiked ? 'Liked' : 'Like Story'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-white' : 'text-white'}`} />
              {likesCount > 0 && (
                <span className="text-[10px] font-bold pr-0.5">{likesCount}</span>
              )}
            </button>

            {/* Send Reply Button */}
            <button
              type="submit"
              disabled={!replyText.trim() || isSendingReply}
              className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-40 transition active:scale-95 shadow-md shadow-pink-500/25"
              title="Send reply message"
            >
              {isSendingReply ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
