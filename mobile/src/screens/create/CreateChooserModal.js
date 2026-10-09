import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, Image, Sparkles, X, ChevronRight, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const CreateChooserModal = ({ visible, onClose, onSelect }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 20) + 16;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          {/* Header */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.title}>Create on FunFlick</Text>
              <Text style={styles.subTitle}>Choose format to start creating</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {/* 1. Create Post */}
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect('CreatePost');
              }}
            >
              <LinearGradient colors={['#ff007a', '#ff4b2b']} style={styles.iconBox}>
                <Image size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.textWrap}>
                <Text style={styles.optionTitle}>Create Post</Text>
                <Text style={styles.optionDesc}>Share a photo or comedy clip to your feed</Text>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>

            {/* 2. Upload Video / Reel */}
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect('UploadReel');
              }}
            >
              <LinearGradient colors={['#7928ca', '#0070f3']} style={styles.iconBox}>
                <Video size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.textWrap}>
                <Text style={styles.optionTitle}>Upload Video / Reel</Text>
                <Text style={styles.optionDesc}>Publish vertical short video or sketch to FunFlick Reels</Text>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>

            {/* 3. Create Story */}
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect('CreateStory');
              }}
            >
              <LinearGradient colors={['#ff8a00', '#ff007a']} style={styles.iconBox}>
                <Sparkles size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.textWrap}>
                <Text style={styles.optionTitle}>Create Story</Text>
                <Text style={styles.optionDesc}>Share a 24-hour moment with music & stickers</Text>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>

            {/* 4. Free Upgrade Banner (Matching Web) */}
            <TouchableOpacity
              style={styles.upgradeBanner}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect('Subscription');
              }}
            >
              <View style={styles.starCircle}>
                <Text style={{ fontSize: 16 }}>⭐</Text>
              </View>
              <View style={styles.textWrap}>
                <View style={styles.freeBadgeRow}>
                  <Text style={styles.upgradeTitle}>Uploading is 100% Free for Everyone!</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                </View>
                <Text style={styles.upgradeDesc}>
                  Want deep 8-factor analytics & Admin cash rewards? Upgrade to Influencer
                </Text>
              </View>
              <ChevronRight size={18} color="#d946ef" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#120a22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  subTitle: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(121,40,202,0.15)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.3)',
    marginTop: 4,
  },
  starCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245,158,11,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  freeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  upgradeTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  freeBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  freeBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  upgradeDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
});
