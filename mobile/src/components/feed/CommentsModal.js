import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Send, MessageCircle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

export const CommentsModal = ({
  visible,
  onClose,
  videoId,
  onCommentAdded,
}) => {
  const { currentUser } = useApp();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !videoId) return;

    setLoading(true);
    apiRequest(`/videos/${videoId}/comments`)
      .then((data) => {
        if (data && Array.isArray(data.comments)) {
          setComments(data.comments);
        } else {
          setComments([]);
        }
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [visible, videoId]);

  const handleSubmit = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setInputText('');

    // Optimistic local add
    const tempComment = {
      id: 'temp_' + Date.now(),
      text: trimmed,
      content: trimmed,
      user: currentUser?.username || 'you',
      name: currentUser?.name || 'You',
      avatar: currentUser?.avatar_url || currentUser?.avatar || 'https://funflick-theta.vercel.app/brand/default-avatar.svg',
      time: 'Just now',
    };
    setComments((prev) => [...prev, tempComment]);
    onCommentAdded?.();

    try {
      const res = await apiRequest(`/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: trimmed }),
      });
      if (res && res.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? res.comment : c))
        );
      }
    } catch (e) {
      console.warn('Post comment error:', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Handle bar */}
          <View style={styles.handleBarWrap}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.centerContainer}>
              <MessageCircle size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySub}>Be the first to share your thoughts!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const initial = (item.name || item.user || 'U').charAt(0).toUpperCase();
                return (
                  <View style={styles.commentRow}>
                    {item.avatar && !item.avatar.includes('default-avatar') ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.fallbackAvatar]}>
                        <Text style={styles.fallbackText}>{initial}</Text>
                      </View>
                    )}

                    <View style={styles.commentBody}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.userName}>{item.name || item.user}</Text>
                        <Text style={styles.timeText}>{item.time || 'Recently'}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.text || item.content}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Bottom Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                Boolean(inputText.trim()) && styles.sendBtnActive,
              ]}
              onPress={handleSubmit}
              disabled={!inputText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send
                  size={18}
                  color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.4)'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    height: '62%',
    backgroundColor: '#110b20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  fallbackAvatar: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  commentText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0c0717',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
});
