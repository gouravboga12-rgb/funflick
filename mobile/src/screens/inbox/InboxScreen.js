import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Search,
  Send,
  ChevronLeft,
  Paperclip,
  Smile,
  X,
  MessageCircle,
  CheckCheck,
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Download,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { uploadMediaToS3 } from '../../services/s3Upload';
import { colors } from '../../theme/colors';

export const InboxScreen = ({ navigation, route }) => {
  const {
    currentUser,
    conversations,
    fetchLiveConversations,
    fetchConversationMessages,
    openOrCreateConversation,
    sendMessage,
    unsendMessage,
  } = useApp();

  const insets = useSafeAreaInsets();
  const [activeConvId, setActiveConvId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [dbUsers, setDbUsers] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const flatListRef = useRef(null);

  // Poll conversations
  useEffect(() => {
    fetchLiveConversations();
    const interval = setInterval(fetchLiveConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveConversations]);

  // Reset active conversation when user switches to Inbox tab from another tab
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      if (!route?.params?.user && !route?.params?.targetUser) {
        setActiveConvId(null);
      }
    });
    return unsubscribe;
  }, [navigation, route?.params]);

  // Handle route param to open direct chat with target user
  useEffect(() => {
    const target = route?.params?.targetUser || route?.params?.user;
    if (target) {
      const convId = openOrCreateConversation(target);
      if (convId) {
        setActiveConvId(convId);
        const partner = target.username || target;
        fetchConversationMessages(partner);
      }
      navigation?.setParams?.({ user: null, targetUser: null });
    }
  }, [route?.params, openOrCreateConversation, fetchConversationMessages, navigation]);

  // Load message history when entering active conversation
  useEffect(() => {
    if (!activeConvId) return;
    const conv = conversations.find(c => c.id === activeConvId);
    const partner = conv?.userId || conv?.user?.username;
    if (partner) {
      fetchConversationMessages(partner);
      const interval = setInterval(() => fetchConversationMessages(partner), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId, fetchConversationMessages]);

  // Live search users in database
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDbUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(trimmed)}&limit=10`);
        if (data && data.users) {
          setDbUsers(data.users.filter(u =>
            u.role !== 'moderator' &&
            !u.username?.toLowerCase().startsWith('moderator')
          ));
        }
      } catch (e) {
      } finally {
        setIsSearchingDb(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Automatically hide bottom tab bar when inside a direct chat conversation so chat floats cleanly
  useEffect(() => {
    const parent = navigation?.getParent?.();
    if (parent) {
      if (activeConv) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      } else {
        parent.setOptions({ tabBarStyle: undefined });
      }
    }
    return () => {
      navigation?.getParent?.()?.setOptions({ tabBarStyle: undefined });
    };
  }, [activeConv, navigation]);

  // Track keyboard events to position input bar right above soft keyboard
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredConvs = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChatWithUser = (user) => {
    const isSelf = user.username === currentUser?.username;
    const convId = openOrCreateConversation({
      id: user.id,
      username: user.username,
      name: isSelf ? `${user.name || user.username} (You)` : (user.name || user.username),
      avatar: user.avatar || user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });
    if (convId) {
      setActiveConvId(convId);
      setSearchQuery('');
      fetchConversationMessages(user.id || user.username);
    }
  };

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        const maxBytes = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        const maxLabel = isVideo ? '10MB' : '5MB';

        const fileSize = asset.fileSize || (asset.file ? asset.file.size : 0);
        if (fileSize && fileSize > maxBytes) {
          Alert.alert('File Too Large', `Please select a ${isVideo ? 'video under 10MB' : 'photo under 5MB'}.`);
          return;
        }
        setAttachedMedia({
          uri: asset.uri,
          file: asset.file,
          type: isVideo ? 'video' : 'image',
          name: isVideo ? 'video.mp4' : 'photo.jpg',
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not access media library');
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !attachedMedia) || !activeConvId || isSending) return;

    setIsSending(true);
    let finalMedia = null;

    try {
      if (attachedMedia) {
        const s3Url = await uploadMediaToS3(
          attachedMedia.file || attachedMedia.uri,
          `chat_${Date.now()}.${attachedMedia.type === 'video' ? 'mp4' : 'jpg'}`,
          attachedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg',
          'chat'
        );
        finalMedia = {
          type: attachedMedia.type,
          url: s3Url,
          name: attachedMedia.name,
        };
      }

      const text = inputText.trim();
      setInputText('');
      setAttachedMedia(null);

      await sendMessage(activeConvId, text, finalMedia);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadMedia = async (targetMedia) => {
    if (!targetMedia?.url && !targetMedia?.uri) return;
    const url = targetMedia.url || targetMedia.uri;
    const cleanName = targetMedia.name || (targetMedia.type === 'video' ? 'chat-video.mp4' : 'chat-image.jpg');
    setDownloading(true);

    try {
      if (Platform.OS === 'web') {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = objectUrl;
            a.download = cleanName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2000);
            setDownloading(false);
            return;
          }
        } catch (e) {}

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = cleanName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloading(false);
        return;
      }

      await Linking.openURL(url);
    } catch (e) {
      console.warn('Download error:', e);
      try {
        await Linking.openURL(url);
      } catch (err) {}
    } finally {
      setDownloading(false);
    }
  };

  const handleUnsendMessage = (item) => {
    const isMe = item.sender === 'me';
    // Strictly restrict delete option: users can ONLY delete/unsend messages they sent themselves!
    if (!isMe) return;

    const title = 'Unsend Message?';
    const message = 'Unsending will remove this message from the conversation.';
    const actionText = 'Unsend';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm(`${title}\n\n${message}`)
        : true;
      if (confirmed) {
        unsendMessage(activeConvId, item.id);
      }
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: 'destructive',
          onPress: () => {
            unsendMessage(activeConvId, item.id);
          },
        },
      ]
    );
  };

  // Render Active Chat View
  if (activeConv) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Chat Top Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setActiveConvId(null);
              setAttachedMedia(null);
            }}
          >
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.chatHeaderUser}>
            <Image
              source={{ uri: activeConv.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }}
              style={styles.chatHeaderAvatar}
            />
            <View>
              <Text style={styles.chatHeaderName} numberOfLines={1}>
                {activeConv.user?.name || activeConv.user?.username}
              </Text>
              <Text style={styles.chatHeaderSub} numberOfLines={1}>
                @{activeConv.user?.username} · Online
              </Text>
            </View>
          </View>

          <View style={styles.directPill}>
            <Text style={styles.directPillText}>Direct Chat</Text>
          </View>
        </View>

        {/* Messages Stream */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <FlatList
            ref={flatListRef}
            data={activeConv.messages || []}
            keyExtractor={(item, idx) => item.id || String(idx)}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMe = item.sender === 'me';
              return (
                <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => handleUnsendMessage(item)}
                    delayLongPress={220}
                    style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}
                  >
                    {Boolean(item.media || item.mediaUrl || item.media_url) && (() => {
                      const m = item.media || {
                        url: item.mediaUrl || item.media_url,
                        uri: item.mediaUrl || item.media_url,
                        type: item.mediaType || item.media_type || 'image',
                        name: item.mediaName || item.media_name,
                      };
                      return (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setViewingMedia(m)}
                          style={styles.msgMediaWrap}
                        >
                          <Image
                            source={{ uri: m.url || m.uri }}
                            style={styles.msgMediaImage}
                            resizeMode="cover"
                          />
                          {m.type === 'video' && (
                            <View style={styles.videoBadge}>
                              <Play size={16} color="#fff" fill="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })()}
                    {item.text ? (
                      <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                        {item.text}
                      </Text>
                    ) : null}
                  </TouchableOpacity>

                  <View style={styles.msgMetaRow}>
                    <Text style={styles.msgTime}>{item.time || 'Just now'}</Text>
                    {isMe && <CheckCheck size={12} color="#ff007a" style={{ marginLeft: 3 }} />}
                    {isMe && (
                      <TouchableOpacity
                        onPress={() => handleUnsendMessage(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ marginLeft: 6, opacity: 0.7 }}
                      >
                        <Trash2 size={11} color="#f43f5e" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyChatWrap}>
                <Text style={styles.emptyChatText}>No messages yet. Say hello! 👋</Text>
              </View>
            }
          />

          {/* Attached Media Preview */}
          {attachedMedia && (
            <View style={styles.attachPreviewBar}>
              <View style={styles.attachPreviewLeft}>
                {attachedMedia.type === 'video' ? (
                  <VideoIcon size={16} color="#ff007a" />
                ) : (
                  <ImageIcon size={16} color="#ff007a" />
                )}
                <Text style={styles.attachPreviewName} numberOfLines={1}>
                  {attachedMedia.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAttachedMedia(null)}>
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Emoji Bar (Toggled via Smile button) */}
          {showEmojiPicker && (
            <View style={styles.quickEmojiBar}>
              {['❤️', '😂', '🔥', '👍', '😍', '👏', '🙌', '✨', '💯', '🙏', '😊', '🎉'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiBtn}
                  onPress={() => {
                    setInputText(prev => prev + emoji);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* WhatsApp-Style Input Bar matching Reference image copy 53.png */}
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: keyboardVisible ? 6 : Math.max(insets.bottom, 10) },
            ]}
          >
            {/* Rounded Pill Container: [Smile] [Message TextInput] [Paperclip] */}
            <View style={styles.inputPill}>
              <TouchableOpacity
                onPress={() => setShowEmojiPicker(prev => !prev)}
                style={styles.pillIconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Smile size={23} color={showEmojiPicker ? '#ff007a' : '#9ca3af'} />
              </TouchableOpacity>

              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message..."
                placeholderTextColor="#6b7280"
                style={styles.pillInput}
                multiline
                maxHeight={110}
                onFocus={() => setShowEmojiPicker(false)}
              />

              <TouchableOpacity
                onPress={handlePickMedia}
                style={styles.pillIconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Paperclip size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Circular Send Action Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={(!inputText.trim() && !attachedMedia) || isSending}
              activeOpacity={0.8}
              style={[
                styles.sendCircle,
                (!inputText.trim() && !attachedMedia) && styles.sendCircleDisabled,
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={19} color="#fff" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Full-Screen Media Viewer Modal (Images & Videos with 1-click Download) */}
        <Modal
          visible={Boolean(viewingMedia)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setViewingMedia(null)}
        >
          <View style={styles.mediaModalOverlay}>
            {/* Header Bar */}
            <View style={styles.mediaModalHeader}>
              <View style={styles.mediaModalTitleWrap}>
                <Text style={styles.mediaModalTitle} numberOfLines={1}>
                  {viewingMedia?.name || (viewingMedia?.type === 'video' ? 'Video Attachment' : 'Photo Attachment')}
                </Text>
                <Text style={styles.mediaModalSub}>
                  {viewingMedia?.type === 'video' ? 'Video File' : 'Photo File'} · Tap Save to download
                </Text>
              </View>

              <View style={styles.mediaModalHeaderBtns}>
                <TouchableOpacity
                  style={styles.mediaModalDownloadBtn}
                  onPress={() => handleDownloadMedia(viewingMedia)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Download size={15} color="#fff" />
                      <Text style={styles.mediaModalDownloadText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaModalCloseBtn}
                  onPress={() => setViewingMedia(null)}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Media Body */}
            <View style={styles.mediaModalBody}>
              {viewingMedia?.type === 'video' ? (
                Platform.OS === 'web' ? (
                  <video
                    src={viewingMedia.url || viewingMedia.uri}
                    controls
                    autoPlay
                    playsInline
                    style={{
                      maxWidth: '94%',
                      maxHeight: '70vh',
                      borderRadius: 16,
                      backgroundColor: '#000',
                    }}
                  />
                ) : (
                  <View style={styles.nativeVideoWrap}>
                    <Image
                      source={{ uri: viewingMedia.url || viewingMedia.uri }}
                      style={styles.mediaModalImage}
                      resizeMode="contain"
                    />
                    <TouchableOpacity
                      style={styles.playCenterBtn}
                      onPress={() => Linking.openURL(viewingMedia.url || viewingMedia.uri)}
                    >
                      <Play size={32} color="#fff" fill="#fff" />
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <Image
                  source={{ uri: viewingMedia?.url || viewingMedia?.uri }}
                  style={styles.mediaModalImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Bottom Footer Action */}
            <View style={styles.mediaModalFooter}>
              <TouchableOpacity
                style={styles.mediaModalActionBtn}
                onPress={() => handleDownloadMedia(viewingMedia)}
                disabled={downloading}
              >
                <Download size={18} color="#fff" />
                <Text style={styles.mediaModalActionText}>
                  {downloading ? 'Downloading...' : 'Download / Save to Device'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Render Conversation List View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct Messages</Text>
        <View style={styles.chatBadge}>
          <Text style={styles.chatBadgeText}>{conversations.length}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages & creators..."
            placeholderTextColor="#6b7280"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Search Results from MySQL Database */}
      {searchQuery.trim() ? (
        <View style={styles.dbUsersSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Creators & Users</Text>
            {isSearchingDb && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          <FlatList
            data={dbUsers}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dbUserRow}
                onPress={() => handleStartChatWithUser(item)}
              >
                <Image
                  source={{ uri: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name || item.username}</Text>
                  <Text style={styles.userUsername}>@{item.username}</Text>
                </View>
                <View style={styles.chatPill}>
                  <MessageCircle size={13} color="#ff007a" />
                  <Text style={styles.chatPillText}>Chat</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !isSearchingDb ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
                </View>
              ) : null
            }
          />
        </View>
      ) : (
        /* Recent Conversations List */
        <FlatList
          data={filteredConvs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convItem}
              activeOpacity={0.8}
              onPress={() => setActiveConvId(item.id)}
            >
              <Image
                source={{ uri: item.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }}
                style={styles.convAvatar}
              />
              <View style={styles.convContent}>
                <View style={styles.convTopRow}>
                  <Text style={styles.convName} numberOfLines={1}>
                    {item.user?.name || item.user?.username}
                  </Text>
                  <Text style={styles.convTime}>{item.time || 'Recently'}</Text>
                </View>
                <Text style={styles.convLastMsg} numberOfLines={1}>
                  {item.lastMessage || 'Tap to chat'}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyHeading}>No Messages Yet</Text>
              <Text style={styles.emptySub}>
                Search for your favorite creators above and start chatting!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  chatBadge: {
    backgroundColor: 'rgba(255,0,122,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.3)',
  },
  chatBadgeText: {
    color: '#ff007a',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18122c',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  dbUsersSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dbUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1b1236',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  userUsername: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 1,
  },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,0,122,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.3)',
  },
  chatPillText: {
    color: '#ff007a',
    fontSize: 12,
    fontWeight: '700',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  convAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1b1236',
  },
  convContent: {
    flex: 1,
    marginLeft: 14,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '75%',
  },
  convTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  convLastMsg: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 3,
  },
  unreadBadge: {
    backgroundColor: '#ff007a',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,0,122,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
  },
  chatHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0d081f',
  },
  backBtn: {
    padding: 6,
  },
  chatHeaderUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1b1236',
  },
  chatHeaderName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  chatHeaderSub: {
    color: '#f472b6',
    fontSize: 11,
  },
  directPill: {
    backgroundColor: 'rgba(255,0,122,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,122,0.3)',
  },
  directPillText: {
    color: '#ff007a',
    fontSize: 10,
    fontWeight: '700',
  },
  messagesList: {
    padding: 16,
    gap: 10,
  },
  msgRow: {
    maxWidth: '80%',
    marginBottom: 4,
  },
  msgRowMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleMe: {
    backgroundColor: '#ff007a',
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: '#1b1433',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  msgText: {
    fontSize: 14,
    lineHeight: 19,
  },
  msgTextMe: {
    color: '#ffffff',
  },
  msgTextOther: {
    color: '#e5e7eb',
  },
  msgMediaWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  msgMediaImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoBadge: {
    position: 'absolute',
    top: 55,
    left: 80,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  msgTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  emptyChatWrap: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyChatText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  attachPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#120a24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  attachPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachPreviewName: {
    color: '#f472b6',
    fontSize: 12,
  },
  quickEmojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#120b29',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#090514',
    gap: 8,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1236',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    minHeight: 48,
  },
  pillIconBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 6,
    maxHeight: 110,
  },
  sendCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff007a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 4,
  },
  sendCircleDisabled: {
    opacity: 0.4,
  },
  mediaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  mediaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(15, 10, 28, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  mediaModalTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  mediaModalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mediaModalSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  mediaModalHeaderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaModalDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff007a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  mediaModalDownloadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mediaModalCloseBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
  },
  mediaModalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  mediaModalImage: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
  },
  nativeVideoWrap: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCenterBtn: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 10, 28, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  mediaModalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff007a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  mediaModalActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
