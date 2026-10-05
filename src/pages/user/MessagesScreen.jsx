import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { 
  ChevronLeft, 
  Search, 
  Send, 
  Image as ImageIcon, 
  CheckCheck,
  X,
  FileVideo,
  Paperclip
} from 'lucide-react';

const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max limit

export const MessagesScreen = () => {
  const navigate = useNavigate();
  const { conversations, sendMessage, showToast } = useApp();

  const [activeConvId, setActiveConvId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState(null); // { type, url, name, size }
  const fileInputRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const filteredConvs = conversations.filter(c => 
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate 5 MB maximum limit
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      showToast('⚠️ File exceeds 5 MB limit. Please choose a media file under 5 MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      showToast('⚠️ Unsupported file format. Please upload JPG, PNG, WEBP images or MP4, WebM videos.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAttachedMedia({
      type: isVideo ? 'video' : 'image',
      url: objectUrl,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2)
    });

    showToast(`Attached ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`, 'info');
  };

  const removeAttachedMedia = () => {
    setAttachedMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedMedia) || !activeConvId) return;

    sendMessage(activeConvId, inputText, attachedMedia);
    setInputText('');
    setAttachedMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {activeConv ? (
        // Chat View
        <div className="flex-1 flex flex-col h-full bg-[#0a0618]">
          {/* Chat Header (Call & Video options removed as requested - messages only) */}
          <div className="sticky top-0 z-30 bg-[#0d081f]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => { setActiveConvId(null); removeAttachedMedia(); }} className="p-1 -ml-1 text-gray-300 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="relative">
                <img
                  src={activeConv.user.avatar}
                  alt={activeConv.user.name}
                  className="w-9 h-9 rounded-full object-cover border border-pink-500/40"
                />
                {activeConv.user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#090514]" />
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-white font-heading">
                  {activeConv.user.name}
                </h4>
                <span className="text-[10px] text-pink-300 block">
                  @{activeConv.user.username} {activeConv.user.isOnline ? '· Online' : ''}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-semibold">
                Direct Chat
              </span>
            </div>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 flex flex-col justify-end">
            {activeConv.messages.map(msg => {
              const isMe = msg.sender === 'me';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[78%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`p-2.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    isMe
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#1b1433] text-gray-200 border border-white/5 rounded-bl-none'
                  }`}>
                    {/* Media Attachment if present (max 5MB) */}
                    {msg.media && (
                      <div className="rounded-xl overflow-hidden max-w-[240px] bg-black/40">
                        {msg.media.type === 'video' ? (
                          <video
                            src={msg.media.url}
                            controls
                            playsInline
                            className="w-full max-h-56 object-cover rounded-xl"
                          />
                        ) : (
                          <img
                            src={msg.media.url}
                            alt="Chat attachment"
                            className="w-full max-h-56 object-cover rounded-xl"
                          />
                        )}
                        <div className="px-2 py-1 text-[9px] opacity-75 truncate">
                          {msg.media.name} {msg.media.size ? `(${msg.media.size}MB)` : ''}
                        </div>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.text && (
                      <p className="px-1">{msg.text}</p>
                    )}
                  </div>

                  <span className="text-[9px] text-gray-500 mt-1 px-1 flex items-center gap-1">
                    {msg.time}
                    {isMe && <CheckCheck className="w-3 h-3 text-pink-400" />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Attached Media Preview Bar */}
          {attachedMedia && (
            <div className="px-4 py-2 bg-[#120a24] border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-pink-300">
                {attachedMedia.type === 'video' ? (
                  <FileVideo className="w-4 h-4 text-pink-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                )}
                <span className="truncate max-w-[220px] font-medium">{attachedMedia.name}</span>
                <span className="text-[10px] text-gray-400">({attachedMedia.size} MB / max 5MB)</span>
              </div>
              <button 
                type="button" 
                onClick={removeAttachedMedia}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 bg-[#0d081f] border-t border-white/5 flex items-center gap-2">
            {/* Hidden File Input (5MB Image / Video) */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />

            {/* Media Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach media (Max 5 MB image or video)"
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-pink-400 transition"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Message (or attach image/video max 5MB)..."
              className="flex-1 bg-white/10 text-white placeholder-gray-400 text-xs px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-pink-500"
            />
            
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedMedia}
              className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        // Conversations List
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold text-white font-heading">
              Direct Messages
            </span>
            <div className="w-6" />
          </div>

          {/* Search Box */}
          <div className="px-4 py-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages & creators..."
                className="w-full bg-[#18122c] text-white placeholder-gray-400 text-xs pl-10 pr-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
            {filteredConvs.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className="p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                    {conv.user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#090514]" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-heading">
                      {conv.user.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 max-w-[200px]">
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">{conv.time}</span>
                  {conv.unreadCount > 0 && (
                    <span className="mt-1 px-1.5 py-0.2 bg-[#ff007a] text-[10px] font-bold text-white rounded-full inline-block">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Navigation */}
          <BottomNavigation />
        </div>
      )}
    </div>
  );
};
