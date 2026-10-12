import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  CheckCircle2,
  Lock,
  Trash2,
  Copy,
  AlertTriangle,
  Send,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { CommentsModal } from './CommentsModal';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StandardPostCard = ({ post, navigation }) => {
  const {
    currentUser,
    toggleLikePost,
    toggleSavePost,
    toggleFollowCreator,
    deleteUserPost,
    fetchFeed,
  } = useApp();

  const isOwner =
    post?.creator?.username &&
    currentUser?.username &&
    post.creator.username.toLowerCase() === currentUser.username.toLowerCase();

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(Number(post.likesCount) || 0);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isFollowing, setIsFollowing] = useState(Boolean(post.isFollowing));
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [quickCommentText, setQuickCommentText] = useState('');
  const [isSubmittingQuickComment, setIsSubmittingQuickComment] = useState(false);

  // Sync props changes
  React.useEffect(() => {
    setIsLiked(Boolean(post.isLiked));
    setLikesCount(Number(post.likesCount) || 0);
    setIsSaved(Boolean(post.isSaved));
    setIsFollowing(Boolean(post.isFollowing));
  }, [post.isLiked, post.likesCount, post.isSaved, post.isFollowing]);

  // Double tap to like
  const lastTapRef = useRef(0);
  const handlePhotoPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toggleLikePost?.(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleToggleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount(prev => (next ? prev + 1 : Math.max(0, prev - 1)));
    toggleLikePost?.(post.id);
  };

  const handleToggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    toggleSavePost?.(post.id);
  };

  const handleToggleFollow = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    if (post?.creator?.username) {
      toggleFollowCreator?.(post.creator.username);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://funflick.in/post/${post.id}`;
      const title = post.title || post.caption || 'FunFlick Post';
      await Share.share({
        title: `${title} | FunFlick`,
        message: `Check out "${title}" by @${post.creator?.username || 'creator'} on FunFlick!\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {}
  };

  const handleQuickComment = async () => {
    if (!quickCommentText.trim() || isSubmittingQuickComment) return;
    setIsSubmittingQuickComment(true);
    try {
      await apiRequest(`/videos/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: quickCommentText.trim() }),
      });
      setQuickCommentText('');
      Alert.alert('Comment Posted', 'Your comment has been added!');
      fetchFeed?.();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not post comment.');
    } finally {
      setIsSubmittingQuickComment(false);
    }
  };

  const handleDeletePost = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (deleteUserPost) {
                await deleteUserPost(post.id);
              } else {
                await apiRequest(`/videos/${post.id}`, { method: 'DELETE' });
                fetchFeed?.();
              }
              Alert.alert('Deleted', 'Post removed successfully.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  const renderCaption = (text) => {
    if (!text) return null;
    const words = text.split(' ');
    return words.map((w, idx) => {
      const isTagOrMention = w.startsWith('#') || w.startsWith('@');
      return (
        <Text
          key={idx}
          style={isTagOrMention ? styles.mentionText : styles.normalText}
        >
          {w}{' '}
        </Text>
      );
    });
  };

  const photoUri =
    post.posterUrl ||
    post.mediaUrl ||
    post.thumbnailUrl ||
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80';

  const avatarUri =
    post.creator?.avatar ||
    currentUser?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

  return (
    <View style={styles.cardContainer}>
      {/* 1. Header (Instagram Style) */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.creatorInfo}
          activeOpacity={0.8}
          onPress={() => {
            if (navigation && post.creator?.username) {
              navigation.navigate('CreatorProfile', { username: post.creator.username });
            }
          }}
        >
          <LinearGradient
            colors={['#ff007a', '#ff4b2b', '#7928ca']}
            style={styles.avatarBorder}
          >
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          </LinearGradient>

          <View style={styles.creatorTextWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.creatorName} numberOfLines={1}>
                {post.creator?.name || 'FunFlick Creator'}
              </Text>
              {post.creator?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.handleRow}>
              <Text style={styles.creatorHandle} numberOfLines={1}>
                @{post.creator?.username || 'user'}
              </Text>
              {post.location ? (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <MapPin size={10} color="#f472b6" style={{ marginRight: 2 }} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {post.location}
                  </Text>
                </>
              ) : null}
              {post.timeAgo ? (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.timeAgoText}>{post.timeAgo}</Text>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* Right side: Follow Button or My Account Badge + 3 dots */}
        <View style={styles.headerRight}>
          {!isOwner ? (
            <TouchableOpacity
              onPress={handleToggleFollow}
              style={[
                styles.followBtn,
                isFollowing ? styles.followingBtn : styles.followBtnActive,
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.followBtnText,
                  isFollowing && styles.followingBtnText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.myAccountBadge}>
              <Text style={styles.myAccountText}>My Post</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => setShowOptionsMenu(true)}
            style={styles.moreBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreHorizontal size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Photo Area (Square Aspect Ratio with Double Tap) */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePhotoPress}
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: photoUri }}
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Category Pill */}
        {post.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{post.category}</Text>
          </View>
        ) : null}

        {/* Double-Tap Heart Burst */}
        {showHeartBurst && (
          <View style={styles.heartBurstOverlay} pointerEvents="none">
            <Heart size={84} color="#ff007a" fill="#ff007a" />
          </View>
        )}
      </TouchableOpacity>

      {/* 3. Action Row (Instagram Style: Left [Like, Comment, Share], Right [Save]) */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {/* Like */}
          <TouchableOpacity
            onPress={handleToggleLike}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Heart
              size={24}
              color={isLiked ? '#ff007a' : '#ffffff'}
              fill={isLiked ? '#ff007a' : 'transparent'}
            />
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            onPress={() => setShowComments(true)}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <MessageCircle size={23} color="#ffffff" />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Share2 size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Bookmark / Save */}
        <TouchableOpacity
          onPress={handleToggleSave}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <Bookmark
            size={23}
            color={isSaved ? '#fbbf24' : '#ffffff'}
            fill={isSaved ? '#fbbf24' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* 4. Engagement & Text Information */}
      <View style={styles.detailsContainer}>
        {/* Likes Count */}
        <Text style={styles.likesCountText}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Text>

        {/* Title (if present) */}
        {post.title && post.title !== post.caption ? (
          <Text style={styles.titleText}>{post.title}</Text>
        ) : null}

        {/* Caption */}
        <View style={styles.captionRow}>
          <Text
            style={styles.captionCreator}
            onPress={() => {
              if (navigation && post.creator?.username) {
                navigation.navigate('CreatorProfile', { username: post.creator.username });
              }
            }}
          >
            @{post.creator?.username || 'creator'}{' '}
          </Text>
          <Text
            style={styles.captionText}
            numberOfLines={captionExpanded ? undefined : 2}
          >
            {renderCaption(post.caption || post.title)}
          </Text>
        </View>

        {(post.caption || post.title)?.length > 70 && (
          <TouchableOpacity
            onPress={() => setCaptionExpanded(prev => !prev)}
            style={styles.moreLessBtn}
          >
            <Text style={styles.moreLessText}>
              {captionExpanded ? 'show less' : '...more'}
            </Text>
          </TouchableOpacity>
        )}

        {/* View all comments */}
        {(post.commentsCount > 0 || (post.comments && post.comments.length > 0)) && (
          <TouchableOpacity
            onPress={() => setShowComments(true)}
            style={styles.viewCommentsBtn}
          >
            <Text style={styles.viewCommentsText}>
              View all {post.commentsCount || post.comments?.length || 0} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick inline comment */}
        <View style={styles.quickCommentBar}>
          <Image
            source={{
              uri:
                currentUser?.avatar_url ||
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
            }}
            style={styles.quickCommentAvatar}
          />
          <TextInput
            value={quickCommentText}
            onChangeText={setQuickCommentText}
            placeholder="Add a comment..."
            placeholderTextColor="#64748b"
            style={styles.quickCommentInput}
          />
          {quickCommentText.trim() ? (
            <TouchableOpacity
              onPress={handleQuickComment}
              disabled={isSubmittingQuickComment}
              style={styles.quickCommentPostBtn}
            >
              <Text style={styles.quickCommentPostText}>Post</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setShowOptionsMenu(false);
                handleShare();
              }}
            >
              <Share2 size={18} color="#ffffff" />
              <Text style={styles.menuOptionText}>Share Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleToggleSave}
            >
              <Bookmark size={18} color={isSaved ? '#fbbf24' : '#ffffff'} />
              <Text style={styles.menuOptionText}>
                {isSaved ? 'Remove from Saved' : 'Save to Collection'}
              </Text>
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity
                style={[styles.menuOption, styles.destructiveOption]}
                onPress={handleDeletePost}
              >
                <Trash2 size={18} color="#f43f5e" />
                <Text style={[styles.menuOptionText, { color: '#f43f5e' }]}>
                  Delete Post
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuCloseBtn}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={styles.menuCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Comments Modal */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        videoId={post.id}
        onCommentAdded={() => {
          fetchFeed?.();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#130b26',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
    marginHorizontal: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#170e2f',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#000',
  },
  creatorTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0070f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  creatorHandle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  dotSeparator: {
    color: '#64748b',
    fontSize: 10,
    marginHorizontal: 4,
  },
  locationText: {
    color: '#94a3b8',
    fontSize: 10.5,
    maxWidth: 100,
  },
  timeAgoText: {
    color: '#64748b',
    fontSize: 10.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  followBtnActive: {
    backgroundColor: '#ff007a',
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#cbd5e1',
  },
  myAccountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  myAccountText: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '700',
  },
  moreBtn: {
    padding: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  categoryBadgeText: {
    color: '#f472b6',
    fontSize: 10.5,
    fontWeight: '700',
  },
  heartBurstOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  detailsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 4,
  },
  likesCountText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  captionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  captionCreator: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  captionText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  mentionText: {
    color: '#f472b6',
    fontWeight: '700',
  },
  normalText: {
    color: '#e2e8f0',
  },
  moreLessBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  moreLessText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '700',
  },
  viewCommentsBtn: {
    marginTop: 4,
  },
  viewCommentsText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  quickCommentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  quickCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#18122c',
  },
  quickCommentInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    paddingVertical: 2,
  },
  quickCommentPostBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quickCommentPostText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '800',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#170e2f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuOptionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  destructiveOption: {
    backgroundColor: 'rgba(244,63,94,0.1)',
  },
  menuCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  menuCloseText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
});
