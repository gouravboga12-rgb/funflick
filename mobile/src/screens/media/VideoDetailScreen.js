import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, AlertCircle, Home } from 'lucide-react-native';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

export const VideoDetailScreen = ({ route, navigation }) => {
  const { id, videoId } = route.params || {};
  const activeId = id || videoId;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!activeId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    apiRequest(`/videos/${activeId}`)
      .then(data => {
        if (data && data.video) {
          setPost(data.video);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this reel on FunFlick! https://funflick-theta.vercel.app/video/${id}`,
        url: `https://funflick-theta.vercel.app/video/${id}`,
      });
    } catch (e) {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading video #{id}...</Text>
      </SafeAreaView>
    );
  }

  if (notFound || !post) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.errorIconCircle}>
          <AlertCircle size={36} color={colors.rose} />
        </View>
        <Text style={styles.errorTitle}>Post Unavailable</Text>
        <Text style={styles.errorDesc}>This video or post may have been removed or the link is incorrect.</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Home size={18} color="#fff" />
          <Text style={styles.homeBtnText}>Go to Feed</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post.title || 'Watch Video'}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardPadding}>
        <VideoPostCard post={post} isActive={true} navigation={navigation} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(244,63,94,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  errorDesc: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
  },
  homeBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    maxWidth: 220,
  },
  shareBtn: {
    padding: 6,
  },
  cardPadding: {
    padding: 12,
  },
});
