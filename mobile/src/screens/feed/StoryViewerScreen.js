import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoryViewerScreen({ route, navigation }) {
  const { story } = route.params || {};
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let anim;
    if (!isPaused) {
      anim = Animated.timing(progressAnim, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      });
      anim.start(({ finished }) => {
        if (finished) {
          navigation.goBack();
        }
      });
    } else {
      progressAnim.stopAnimation();
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [isPaused, navigation]);

  const handlePressIn = () => setIsPaused(true);
  const handlePressOut = () => setIsPaused(false);

  const displayMedia =
    story?.mediaUrl ||
    story?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  return (
    <View style={styles.container}>
      {/* Background Media */}
      <Image source={{ uri: displayMedia }} style={styles.mediaBackground} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Touch to pause overlay */}
      <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.touchArea} />
      </TouchableWithoutFeedback>

      <SafeAreaView style={styles.contentOverlay} edges={['top', 'bottom']}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Creator Info Header */}
        <View style={styles.header}>
          <View style={styles.creatorRow}>
            <Image
              source={{
                uri:
                  story?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.creatorName}>{story?.name || 'Creator'}</Text>
              <Text style={styles.timeAgo}>3h ago</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom Reply Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomBar}
        >
          <View style={styles.replyInputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Reply to ${story?.name || 'story'}...`}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={replyText}
              onChangeText={setReplyText}
            />
            {replyText.trim() ? (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => {
                  setReplyText('');
                  navigation.goBack();
                }}
              >
                <Send size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => setIsLiked(prev => !prev)}
            activeOpacity={0.7}
          >
            <Heart
              size={26}
              color={isLiked ? colors.primary : '#ffffff'}
              fill={isLiked ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaBackground: {
    width,
    height,
    position: 'absolute',
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentOverlay: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'space-between',
  },
  progressBarContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  replyInputRow: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  replyInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  sendBtn: {
    paddingLeft: 8,
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
