import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

function StoryAvatar({ avatar, name, username }) {
  const [hasError, setHasError] = React.useState(false);
  const initial = (name || username || 'F').charAt(0).toUpperCase();
  const isDefaultOrMissing = !avatar || String(avatar).includes('default-avatar') || hasError;

  if (isDefaultOrMissing) {
    const colorsList = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    const charCode = (name || username || 'A').charCodeAt(0);
    const bgColor = colorsList[charCode % colorsList.length];

    return (
      <View style={[styles.avatar, styles.initialFallback, { backgroundColor: bgColor }]}>
        <Text style={styles.initialText}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatar }}
      style={styles.avatar}
      onError={() => setHasError(true)}
    />
  );
}

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

  // 2. Add other stories from API if available (strictly real stories from followed accounts)
  const apiStories = (stories || [])
    .filter(s => !s.isUser && s.stories && s.stories.length > 0)
    .map(s => ({
      id: s.id,
      isMe: false,
      name: s.name || s.username?.replace('_official', '') || 'Creator',
      username: s.username,
      avatar: s.avatar || '',
      hasUnseen: s.hasUnseen !== false,
      stories: s.stories || [],
    }));

  const allStoryItems = [
    myStoryItem,
    ...apiStories,
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
                      <StoryAvatar avatar={item.avatar} name={item.name} username={item.username} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.plainRing}>
                    <StoryAvatar avatar={item.avatar} name={item.name} username={item.username} />
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
                  <StoryAvatar avatar={item.avatar} name={item.name} username={item.username} />
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
  initialFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
});
