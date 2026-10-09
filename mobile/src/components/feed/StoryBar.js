import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export const StoryBar = ({ onAddStory, onStoryPress }) => {
  const { currentUser, posts } = useApp();

  // Distinct creator stories from feed
  const creators = [
    {
      id: 'my-story',
      isMe: true,
      name: 'Your Story',
      username: currentUser?.username || 'you',
      avatar: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    ...posts.slice(0, 10).map(p => ({
      id: `story-${p.id}`,
      name: p.creator?.name || 'Creator',
      username: p.creator?.username || 'creator',
      avatar: p.creator?.avatar,
      mediaUrl: p.mediaUrl,
      title: p.title,
    }))
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {creators.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={styles.storyItem}
            activeOpacity={0.8}
            onPress={() => (item.isMe ? onAddStory?.() : onStoryPress?.(item))}
          >
            {item.isMe ? (
              <View style={styles.myStoryWrapper}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.plusBadge}>
                  <Plus size={12} color="#fff" strokeWidth={3} />
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={['#ff007a', '#7928ca', '#0070f3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View style={styles.innerRing}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                </View>
              </LinearGradient>
            )}
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  gradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.background,
    overflow: 'hidden',
  },
  myStoryWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'visible',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: '#1b1236',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: '#d1d5db',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});
