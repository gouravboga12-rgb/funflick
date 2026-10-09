import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, Image, Zap, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export const CreateChooserModal = ({ visible, onClose, onSelect }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 20) + 16;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          <View style={styles.topBar}>
            <Text style={styles.title}>Create Content</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsGrid}>
            {/* 1. Upload Reel */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                onSelect('UploadReel');
              }}
            >
              <LinearGradient colors={['#ff007a', '#7928ca']} style={styles.iconCircle}>
                <Video size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.optionTitle}>Upload Reel</Text>
              <Text style={styles.optionDesc}>Short viral videos & comedy sketches</Text>
            </TouchableOpacity>

            {/* 2. Photo Post */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                onSelect('CreatePost');
              }}
            >
              <LinearGradient colors={['#7928ca', '#0070f3']} style={styles.iconCircle}>
                <Image size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.optionTitle}>Photo Post</Text>
              <Text style={styles.optionDesc}>Share memes, posters & photos</Text>
            </TouchableOpacity>

            {/* 3. Story */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                onSelect('CreateStory');
              }}
            >
              <LinearGradient colors={['#f59e0b', '#ff007a']} style={styles.iconCircle}>
                <Zap size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.optionTitle}>Add Story</Text>
              <Text style={styles.optionDesc}>24-hour disappearing moment</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#130b26',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
