import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export const StoryBar = ({ onAddStory, onStoryPress }) => {
  const { currentUser, posts, stories } = useApp();

  // 1. Resolve stories list: start with current user's story
  const myStoryItem = {
    id: 'my-story',
    isMe: true,
    name: 'Your Story',
    username: currentUser?.username || 'you',
    avatar: currentUser?.avatar_url || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    hasStories: stories?.find(s => s.isUser)?.stories?.length > 0,
  };

  // 2. Add other stories from API if available
  const apiStories = (stories || [])
    .filter(s => !s.isUser)
    .map(s => ({
      id: s.id,
      isMe: false,
      name: s.username?.replace('_official', '') || 'Creator',
      username: s.username,
      avatar: s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      hasUnseen: s.hasUnseen !== false,
      stories: s.stories || [],
    }));

  // 3. If API stories is empty, derive distinct unique creators from posts
  const uniqueCreatorStories = [];
  if (apiStories.length === 0) {
    const seenUsernames = new Set([currentUser?.username]);
    for (const p of posts) {
      const u = p.creator?.username;
      if (u && !seenUsernames.has(u)) {
        seenUsernames.add(u);
        uniqueCreatorStories.push({
          id: `creator-${u}`,
          isMe: false,
          name: p.creator?.name || u,
          username: u,
          avatar: p.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          hasUnseen: true,
          mediaUrl: p.mediaUrl,
          title: p.title,
        });
      }
      if (uniqueCreatorStories.length >= 10) break;
    }
  }

  const allStoryItems = [
    myStoryItem,
    ...(apiStories.length > 0 ? apiStories : uniqueCreatorStories),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {allStoryItems.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={styles.storyItem}
            activeOpacity={0.8}
            onPress={() => (item.isMe ? onAddStory?.() : onStoryPress?.(item))}
          >
            {item.isMe ? (
              <View style={styles.myStoryWrapper}>
                {item.hasStories ? (
                  <LinearGradient
                    colors={['#ff8a00', '#ff007a', '#7928ca']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientRing}
                  >
                    <View style={styles.innerRing}>
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.plainRing}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  </View>
                )}
                <View style={styles.plusBadge}>
                  <Plus size={11} color="#fff" strokeWidth={3} />
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={item.hasUnseen ? ['#ff8a00', '#ff007a', '#7928ca'] : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.25)']}
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
    backgroundColor: '#090514',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  scroll: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  gradientRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#090514',
    overflow: 'hidden',
    backgroundColor: '#1b1236',
  },
  plainRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    backgroundColor: '#1b1236',
  },
  myStoryWrapper: {
    width: 66,
    height: 66,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: '#1b1236',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#090514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 72,
  },
});
