import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  Crown,
  Sparkles,
  DollarSign,
  Heart,
  Eye,
  ArrowRight,
  X,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const UploadSuccessModal = ({
  visible,
  type = 'Reel',
  title = '',
  onClose,
  onUnlockMonetization,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Success Icon */}
          <LinearGradient
            colors={['#10b981', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successIconCircle}
          >
            <CheckCircle2 size={32} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>

          {/* Header Title */}
          <Text style={styles.title}>{type} Published! 🎉</Text>
          <Text style={styles.subtitle}>
            Your {type.toLowerCase()} {title ? `"${title}"` : ''} is live and submitted to Central Admin Verification.
          </Text>

          {/* Monetization Highlight Card */}
          <View style={styles.rewardCard}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.15)', 'rgba(217, 70, 239, 0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardCardGradient}
            >
              <View style={styles.rewardHeaderRow}>
                <View style={styles.coinIconBox}>
                  <DollarSign size={18} color="#f59e0b" strokeWidth={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardHeading}>Earn Direct Payments! 💰</Text>
                  <Text style={styles.rewardSubheading}>High Views & Likes = Cash Rewards</Text>
                </View>
              </View>

              <Text style={styles.rewardBodyText}>
                FunFlick rewards viral creators! Posts and reels with highest engagement qualify for weekly cash rewards paid directly from the Creator Fund.
              </Text>

              {/* 3 Metric Pills */}
              <View style={styles.metricsRow}>
                <View style={styles.metricPill}>
                  <Eye size={12} color="#a855f7" />
                  <Text style={styles.metricText}>High Views</Text>
                </View>
                <View style={styles.metricPill}>
                  <Heart size={12} color="#f43f5e" />
                  <Text style={styles.metricText}>Top Likes</Text>
                </View>
                <View style={[styles.metricPill, styles.metricPillCash]}>
                  <Sparkles size={12} color="#10b981" />
                  <Text style={[styles.metricText, { color: '#34d399', fontWeight: '800' }]}>Cash Out</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Action Button: Upgrade / Payouts */}
          <TouchableOpacity
            style={styles.ctaButtonWrap}
            activeOpacity={0.85}
            onPress={onUnlockMonetization}
          >
            <LinearGradient
              colors={['#f59e0b', '#ec4899', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Crown size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Unlock Creator Payouts</Text>
              <ArrowRight size={16} color="#fff" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button: Continue to Feed */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.doneBtnText}>Continue to Feed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: Math.min(width - 40, 380),
    backgroundColor: '#120b29',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.35)',
    padding: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  rewardCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 16,
  },
  rewardCardGradient: {
    padding: 14,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  rewardHeading: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  rewardSubheading: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  rewardBodyText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricPillCash: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  ctaButtonWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  doneBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneBtnText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
});
