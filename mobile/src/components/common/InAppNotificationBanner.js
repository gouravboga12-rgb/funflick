import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Bell, X } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { navigate } from '../../navigation/navigationService';

export function InAppNotificationBanner() {
  const insets = useSafeAreaInsets();
  const { inAppBanner, dismissInAppBanner } = useApp();
  const translateY = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (inAppBanner?.visible) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 50,
      }).start();

      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, 4500);
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inAppBanner?.visible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dismissInAppBanner?.();
    });
  };

  const handlePress = () => {
    handleDismiss();
    const data = inAppBanner?.data || {};

    try {
      if (data.type === 'chat' || data.type === 'message') {
        const partner = data.partnerId || data.senderId || data.targetUser?.id;
        const username = data.senderUsername || data.user;
        navigate('ChatRoom', {
          partnerId: partner,
          partnerUsername: username,
          partnerName: data.senderName || username || 'Chat',
          partnerAvatar: data.senderAvatar || data.avatar,
        });
      } else {
        navigate('Notifications');
      }
    } catch (e) {
      console.warn('Navigation error on banner tap:', e);
    }
  };

  if (!inAppBanner?.visible) return null;

  const isChat = inAppBanner.data?.type === 'chat' || inAppBanner.data?.type === 'message';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, Platform.OS === 'android' ? 16 : 8),
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.banner}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={styles.avatarWrap}>
          {inAppBanner.avatar && !inAppBanner.avatar.includes('default-avatar') ? (
            <Image source={{ uri: inAppBanner.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.iconBadge]}>
              {isChat ? <MessageSquare size={18} color="#fff" /> : <Bell size={18} color="#fff" />}
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {inAppBanner.title || 'New Message'}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {inAppBanner.body || 'You received a notification'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1333',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#ff007a',
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 100,
    gap: 12,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  iconBadge: {
    backgroundColor: '#ff007a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: '#d1d5db',
    fontSize: 12.5,
    lineHeight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
