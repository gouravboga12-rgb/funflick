import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Paperclip,
  UserPlus,
  MessageCircle,
  Loader2,
  Maximize2,
  Download,
  Play,
  Trash2,
  AlertTriangle
} from 'lucide-react';

import { uploadFileToS3 } from '../../services/s3UploadService';
import { ChatMediaViewerModal, downloadMediaFile } from '../../components/chat/ChatMediaViewerModal';

const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max limit

export const MessagesScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    conversations, 
    sendMessage, 
    unsendMessage,
    openOrCreateConversation, 
    fetchLiveConversations,
    fetchConversationMessages,
    currentUser, 
    showToast 
  } = useApp();

  const [activeConvId, setActiveConvId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState(null); // { file, type, url, name, size }
  const [viewingMedia, setViewingMedia] = useState(null); // Active media opened in full-screen modal
  const [isSending, setIsSending] = useState(false);
  const [unsendTargetMsg, setUnsendTargetMsg] = useState(null); // message to unsend
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null); // auto-scroll anchor

  // Database searched users
  const [dbUsers, setDbUsers] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Poll conversation list so incoming messages from other users appear in inbox
  useEffect(() => {
    if (fetchLiveConversations) fetchLiveConversations();
    const interval = setInterval(() => {
      if (fetchLiveConversations) fetchLiveConversations();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-open chat if navigated with ?user=username
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUsername = params.get('user');
    if (targetUsername) {
      const convId = openOrCreateConversation(targetUsername);
      if (convId) {
        setActiveConvId(convId);
        if (fetchConversationMessages) {
          fetchConversationMessages(targetUsername);
        }
      }
    }
  }, [location.search]);

  // Load message history when entering active conversation & poll for replies
  useEffect(() => {
    if (!activeConvId) return;
    const conv = conversations.find(c => c.id === activeConvId);
    const partner = conv?.userId || conv?.user?.username;
    if (!partner) return;

    if (fetchConversationMessages) {
      fetchConversationMessages(partner);
    }

    const interval = setInterval(() => {
      if (fetchConversationMessages) {
        fetchConversationMessages(partner);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  // Auto-scroll to bottom when messages change
  const activeConvMessages = conversations.find(c => c.id === activeConvId)?.messages;
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [activeConvMessages]);

  // Live search users in MySQL database when user types in search box
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDbUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      try {
        const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.users && Array.isArray(data.users)) {
            // Keep matching users excluding staff moderators
            setDbUsers(data.users.filter(u =>
              u.role !== 'moderator' &&
              !u.username?.toLowerCase().startsWith('moderator')
            ));
          }
        }
      } catch (err) {
        console.warn('Failed to search database users:', err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const filteredConvs = conversations.filter(c => 
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChatWithDbUser = (user) => {
    const isSelf = user.username === currentUser?.username;
    const convId = openOrCreateConversation({
      id: user.id,
      username: user.username,
      name: isSelf ? `${user.name || user.username} (You)` : (user.name || user.username),
      avatar: user.avatar || user.avatar_url || '/brand/default-avatar.svg'
    });
    if (convId) {
      setActiveConvId(convId);
      setSearchQuery('');
      if (fetchConversationMessages) {
        fetchConversationMessages(user.id || user.username);
      }
    }
  };

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
      file,
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

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedMedia) || !activeConvId || isSending) return;

    setIsSending(true);
    let finalMedia = null;

    try {
      if (attachedMedia) {
        if (attachedMedia.file) {
          try {
            const s3Url = await uploadFileToS3(attachedMedia.file, 'chat');
            finalMedia = {
              type: attachedMedia.type,
              url: s3Url,
              name: attachedMedia.name,
              size: attachedMedia.size
            };
          } catch (e) {
            console.warn('Direct upload fallback:', e);
            finalMedia = {
              type: attachedMedia.type,
              url: attachedMedia.url,
              name: attachedMedia.name,
              size: attachedMedia.size
            };
          }
        } else {
          finalMedia = attachedMedia;
        }
      }

      const textToSend = inputText;
      setInputText('');
      setAttachedMedia(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await sendMessage(activeConvId, textToSend, finalMedia);
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
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
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-2 flex flex-col gap-3">
            {activeConv.messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-10">
                <p className="text-xs text-gray-500 text-center">
                  No messages yet. Say hello! 👋
                </p>
              </div>
            )}
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
                    {/* Media Attachment with full-screen viewer and instant download (max 5MB) */}
                    {msg.media && (
                      <div className="relative rounded-xl overflow-hidden max-w-[260px] bg-black/60 border border-white/10 group shadow-lg">
                        {/* Clickable Media Preview - Opens Full-Screen Viewer for Sender, Recipient & Self */}
                        <div 
                          onClick={() => setViewingMedia(msg.media)}
                          className="cursor-pointer relative overflow-hidden flex items-center justify-center bg-black/80"
                        >
                          {msg.media.type === 'video' ? (
                            <div className="relative w-full">
                              <video
                                src={msg.media.url}
                                playsInline
                                preload="metadata"
                                className="w-full max-h-60 object-cover rounded-t-xl group-hover:scale-[1.02] transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition">
                                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                                  <Play className="w-5 h-5 fill-current ml-0.5 text-pink-400" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-full">
                              <img
                                src={msg.media.url}
                                alt={msg.media.name || "Chat attachment"}
                                className="w-full max-h-60 object-cover rounded-t-xl group-hover:scale-[1.02] transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 shadow-md">
                                  <Maximize2 className="w-3 h-3" /> View Photo
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Media Footer Bar: Title, Size, Direct Download & Fullscreen Controls */}
                        <div className="px-2.5 py-1.5 bg-[#0f071d] flex items-center justify-between text-[10px] text-gray-300 border-t border-white/5">
                          <span className="truncate max-w-[130px] font-medium" title={msg.media.name}>
                            {msg.media.name} {msg.media.size ? `(${msg.media.size}MB)` : ''}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* 1-Click Working Download */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadMediaFile(msg.media.url, msg.media.name, (status) => {
                                  if (status === 'success') showToast('Downloaded successfully', 'success');
                                });
                              }}
                              title="Download original uploaded file"
                              aria-label="Download media"
                              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition active:scale-95"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {/* Full-Screen Expand */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingMedia(msg.media);
                              }}
                              title="Open in expanded viewer"
                              aria-label="Open expanded viewer"
                              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition active:scale-95"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.text && (
                      <p className="px-1">{msg.text}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                      {msg.time}
                      {isMe && <CheckCheck className="w-3 h-3 text-pink-400" />}
                    </span>

                    {/* Instagram-style Unsend Option for Sent Messages / Delete Option for Received Messages */}
                    <button
                      type="button"
                      onClick={() => setUnsendTargetMsg({ ...msg, isSender: isMe })}
                      title={isMe ? "Unsend message" : "Delete message"}
                      className="opacity-70 hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-rose-400 transition ml-1 cursor-pointer flex items-center gap-0.5 text-[9px]"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span className="hover:underline">{isMe ? 'Unsend' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} className="h-0 shrink-0" />
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

          {/* Search Results from Real Database */}
          {searchQuery.trim() && (
            <div className="px-4 py-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold px-1">
                <span>All Users on FunFlick</span>
                {isSearchingDb && <Loader2 className="w-3 h-3 text-pink-400 animate-spin" />}
              </div>

              {dbUsers.length > 0 ? (
                <div className="bg-[#120a24] rounded-2xl p-1.5 border border-white/5 divide-y divide-white/5 space-y-0.5">
                  {dbUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleStartChatWithDbUser(u)}
                      className="p-2 rounded-xl hover:bg-white/5 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar || '/brand/default-avatar.svg'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-pink-500/50"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition">
                            {u.name || u.username}
                          </h4>
                          <span className="text-[10px] text-gray-400 block">
                            @{u.username} {u.followersCount ? `· ${u.followersCount} followers` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[11px] font-semibold group-hover:bg-pink-500 group-hover:text-white transition flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !isSearchingDb && (
                  <div className="p-3 rounded-2xl bg-[#140c26] text-center text-xs text-gray-400">
                    No matching users found for "{searchQuery}"
                  </div>
                )
              )}
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
            {!searchQuery.trim() && (
              <div className="px-2 py-1 text-[11px] font-semibold text-gray-400">
                Recent Chats
              </div>
            )}
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

      {/* Full-Screen Chat Media Viewer Modal (Large Viewer, Custom Video Controls & Downloads) */}
      <ChatMediaViewerModal 
        media={viewingMedia} 
        onClose={() => setViewingMedia(null)} 
      />

      {/* Instagram-style Unsend / Delete Message Confirmation Dialog */}
      {unsendTargetMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-xs bg-[#18122c] border border-white/10 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white font-heading">
                {unsendTargetMsg.isSender !== false ? 'Unsend Message?' : 'Delete Message?'}
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed px-2">
                {unsendTargetMsg.isSender !== false
                  ? 'Unsending will remove the message for everyone in this chat. People may have already seen or played it.'
                  : 'Deleting will remove this message from your chat history.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  const targetId = unsendTargetMsg.id;
                  const isSender = unsendTargetMsg.isSender !== false;
                  setUnsendTargetMsg(null);
                  await unsendMessage(activeConvId, targetId);
                  showToast(isSender ? 'Message unsent' : 'Message deleted', 'info');
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer"
              >
                {unsendTargetMsg.isSender !== false ? 'Unsend' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setUnsendTargetMsg(null)}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
