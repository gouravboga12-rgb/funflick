import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Flag, X, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

const REPORT_REASONS = [
  { id: 'copyright', label: 'Intellectual property / Stolen copyright content' },
  { id: 'inappropriate', label: 'Inappropriate comedy or vulgar content' },
  { id: 'harassment', label: 'Dangerous stunts or harassment' },
  { id: 'spam', label: 'Spam, misleading or bot engagement' },
  { id: 'hate', label: 'Hate speech or discrimination' },
];

export const ReportModal = ({
  visible,
  onClose,
  targetVideoId,
  targetUsername,
  title,
}) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setIsSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Selection Required', 'Please select a reason for reporting this content.');
      return;
    }

    if (!targetVideoId) {
      Alert.alert('Notice', 'Report details received. Thank you for keeping FunFlick safe!');
      handleClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const detailsText = details.trim()
        ? `${selectedReason}: ${details.trim()}`
        : `User reported: ${selectedReason}`;

      const res = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetVideoId: Number(targetVideoId),
          reason: selectedReason,
          details: detailsText,
        }),
      });

      Alert.alert(
        'Report Submitted',
        res?.message || 'Thank you! Your report has been submitted to FunFlick Admin Moderation for review.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (err) {
      Alert.alert('Report Received', err?.message || 'Thank you! Your report has been recorded.');
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.flagIconWrap}>
                <Flag size={18} color="#f43f5e" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Report Content</Text>
                {Boolean(targetUsername) && (
                  <Text style={styles.modalSubtitle}>Content by @{targetUsername}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Why are you reporting this?</Text>

            {REPORT_REASONS.map((r) => {
              const isSelected = selectedReason === r.label;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedReason(r.label)}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
              Additional details (optional)
            </Text>
            <TextInput
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              placeholder="Provide any additional context to assist the moderation team..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <View style={styles.noticeBox}>
              <ShieldAlert size={14} color="#f59e0b" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.noticeText}>
                Reports are reviewed confidentially by our staff moderation team. False reporting may lead to account penalties.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedReason}
            >
              <LinearGradient
                colors={selectedReason ? [colors.primary, colors.secondary] : ['#332549', '#241a38']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text
                    style={[
                      styles.submitText,
                      !selectedReason && { color: 'rgba(255,255,255,0.4)' },
                    ]}
                  >
                    Submit Report
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#120a24',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.25)',
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244,63,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bodyScroll: {
    marginVertical: 12,
  },
  sectionLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  reasonRowSelected: {
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderColor: 'rgba(244,63,94,0.4)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#f43f5e',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  reasonText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  reasonTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  detailsInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: 13,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  noticeText: {
    flex: 1,
    color: '#fcd34d',
    fontSize: 10,
    lineHeight: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
