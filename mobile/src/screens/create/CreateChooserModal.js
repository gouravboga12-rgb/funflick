import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Video,
  Image,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Crown,
  ArrowRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const CreateChooserModal = ({ visible, onClose, onSelect }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 20) + 16;
  const [showMonetizationExplainer, setShowMonetizationExplainer] = useState(false);

  const handleModalClose = () => {
    setShowMonetizationExplainer(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleModalClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleModalClose}>
        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          {!showMonetizationExplainer ? (
            <>
              {/* Header */}
              <View style={styles.topBar}>
                <View>
                  <Text style={styles.title}>Create on FunFlick</Text>
                  <Text style={styles.subTitle}>Choose format or unlock creator rewards</Text>
                </View>
                <TouchableOpacity onPress={handleModalClose} style={styles.closeBtn}>
                  <X size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {/* 1. Create Post */}
                <TouchableOpacity
                  style={styles.optionCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleModalClose();
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
                    handleModalClose();
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
                    handleModalClose();
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

                {/* 4. High-Impact: Creator Monetization & Payouts */}
                <TouchableOpacity
                  style={styles.monetizationCard}
                  activeOpacity={0.85}
                  onPress={() => setShowMonetizationExplainer(true)}
                >
                  <LinearGradient
                    colors={['rgba(245, 158, 11, 0.2)', 'rgba(236, 72, 153, 0.15)', 'rgba(147, 51, 234, 0.15)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.monetizationGradient}
                  >
                    <LinearGradient colors={['#f59e0b', '#ec4899', '#9333ea']} style={styles.crownIconBox}>
                      <Crown size={20} color="#fef08a" />
                    </LinearGradient>
                    <View style={styles.textWrap}>
                      <View style={styles.badgeRow}>
                        <Text style={styles.monetizationTitle}>👑 Creator Monetization & Payouts</Text>
                        <View style={styles.earnBadge}>
                          <Text style={styles.earnBadgeText}>EARN CASH</Text>
                        </View>
                      </View>
                      <Text style={styles.monetizationDesc}>
                        Post videos with top likes & views to qualify for direct cash payouts from the Creator Fund.
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#f59e0b" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* In-Modal Explainer View */
            <View style={styles.explainerContainer}>
              {/* Top Navigation */}
              <View style={styles.explainerTopBar}>
                <TouchableOpacity
                  onPress={() => setShowMonetizationExplainer(false)}
                  style={styles.backBtn}
                >
                  <ChevronLeft size={18} color="#f472b6" />
                  <Text style={styles.backBtnText}>Back to options</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleModalClose} style={styles.closeBtn}>
                  <X size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Explainer Header */}
              <View style={styles.explainerHeader}>
                <LinearGradient colors={['#f59e0b', '#ec4899', '#8b5cf6']} style={styles.explainerCrownCircle}>
                  <Crown size={24} color="#fef08a" />
                </LinearGradient>
                <Text style={styles.explainerHeading}>FunFlick Creator Monetization 💰</Text>
                <Text style={styles.explainerSubheading}>
                  Turn your entertaining content into weekly cash payouts!
                </Text>
              </View>

              {/* 3 Steps */}
              <View style={styles.stepsList}>
                {/* Step 1 */}
                <View style={styles.stepItem}>
                  <View style={[styles.stepNumBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                    <Text style={[styles.stepNumText, { color: '#c084fc' }]}>1</Text>
                  </View>
                  <View style={styles.stepTextWrap}>
                    <Text style={styles.stepTitle}>Post Entertaining Reels & Videos (100% Free)</Text>
                    <Text style={styles.stepDesc}>
                      Upload comedy sketches, reels, or photo posts. Publishing is completely free for all creators.
                    </Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={[styles.stepItem, styles.stepItemHighlight]}>
                  <View style={[styles.stepNumBox, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                    <Text style={[styles.stepNumText, { color: '#fbbf24' }]}>2</Text>
                  </View>
                  <View style={styles.stepTextWrap}>
                    <Text style={[styles.stepTitle, { color: '#fef08a' }]}>High Views & Likes = Cash Payouts 💸</Text>
                    <Text style={styles.stepDesc}>
                      Central Admin reviews trending content. Posts with highest likes & engagement receive direct cash payouts from our Creator Fund!
                    </Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepItem}>
                  <View style={[styles.stepNumBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.stepNumText, { color: '#34d399' }]}>3</Text>
                  </View>
                  <View style={styles.stepTextWrap}>
                    <Text style={styles.stepTitle}>Direct UPI/Bank Payouts & VIP Badge</Text>
                    <Text style={styles.stepDesc}>
                      Upgrade to an Influencer Pass to unlock verified creator badge, 8-factor analytics & priority payout processing.
                    </Text>
                  </View>
                </View>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.ctaButtonWrap}
                activeOpacity={0.85}
                onPress={() => {
                  handleModalClose();
                  onSelect('Subscription');
                }}
              >
                <LinearGradient
                  colors={['#f59e0b', '#ec4899', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButton}
                >
                  <Crown size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.ctaButtonText}>Activate Influencer Pass & Payouts</Text>
                  <ArrowRight size={16} color="#fff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#120a22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    padding: 13,
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
    marginRight: 13,
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
  monetizationCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    overflow: 'hidden',
    marginTop: 4,
  },
  monetizationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },
  crownIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  monetizationTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  earnBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  earnBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  monetizationDesc: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  explainerContainer: {
    gap: 12,
  },
  explainerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '600',
  },
  explainerHeader: {
    alignItems: 'center',
    marginVertical: 4,
  },
  explainerCrownCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  explainerHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  explainerSubheading: {
    color: '#f472b6',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  stepsList: {
    gap: 8,
    marginVertical: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepItemHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  stepNumBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  ctaButtonWrap: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
