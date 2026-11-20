import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react-native';
import { apiRequest, setStoredUser } from '../../services/api';
import { useApp } from '../../context/AppContext';

export const CreatorPayoutDetailsModal = ({ 
  isOpen, 
  visible, 
  onClose, 
  onSuccess, 
  onSaved, 
  isFreePlanActivation = false, 
  initialPlanId = 'free_influencer' 
}) => {
  const isModalVisible = Boolean(isOpen !== undefined ? isOpen : visible);
  const handleSuccessCallback = onSuccess || onSaved;
  const { currentUser, setCurrentUser } = useApp();

  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isModalVisible) {
      loadExistingDetails();
    }
  }, [isModalVisible]);

  const loadExistingDetails = async () => {
    setIsFetching(true);
    try {
      const res = await apiRequest('/payouts/details').catch(() => null);
      if (res && res.payoutDetails) {
        const d = res.payoutDetails;
        if (d.upi_id) setUpiId(d.upi_id);
        if (d.account_holder_name) setAccountHolderName(d.account_holder_name);
        if (d.bank_name) setBankName(d.bank_name);
        if (d.account_number) {
          setAccountNumber(d.account_number);
          setConfirmAccountNumber(d.account_number);
        }
        if (d.ifsc_code) setIfscCode(d.ifsc_code);
      }
    } catch (e) {
      console.warn('Failed to fetch existing payout details:', e);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveAndActivate = async () => {
    const cleanUpi = upiId.trim();
    const cleanHolder = accountHolderName.trim();
    const cleanBank = bankName.trim();
    const cleanAcc = accountNumber.trim();
    const cleanConfirm = confirmAccountNumber.trim();
    const cleanIfsc = ifscCode.trim().toUpperCase();

    const hasUpi = cleanUpi.length > 0;
    const hasBank = cleanAcc.length > 0 || cleanIfsc.length > 0 || cleanHolder.length > 0;

    if (!hasUpi && !hasBank) {
      Alert.alert(
        'Payout Details Required',
        'Please enter either your PhonePe / UPI ID or your Bank Account details (or both) to receive performance cash rewards.'
      );
      return;
    }

    if (hasUpi && !cleanUpi.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid PhonePe / UPI ID (e.g., yourname@ybl, mobile@ibl).');
      return;
    }

    if (hasBank) {
      if (!cleanHolder) {
        Alert.alert('Account Holder Name Missing', 'Please enter the account holder name for your bank account.');
        return;
      }
      if (!cleanAcc || cleanAcc.length < 8) {
        Alert.alert('Invalid Account Number', 'Please enter a valid bank account number (at least 8 digits).');
        return;
      }
      if (cleanAcc !== cleanConfirm) {
        Alert.alert('Account Mismatch', 'Account number and confirmation do not match.');
        return;
      }
      if (!cleanIfsc || cleanIfsc.length < 4) {
        Alert.alert('Invalid IFSC Code', 'Please enter a valid bank IFSC code.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let payoutType = 'both';
      if (hasUpi && !hasBank) payoutType = 'upi';
      else if (hasBank && !hasUpi) payoutType = 'bank';

      // 1. Save payout details to backend
      const saveRes = await apiRequest('/payouts/details', {
        method: 'POST',
        body: JSON.stringify({
          payout_type: payoutType,
          payout_method: hasBank ? 'bank' : 'upi',
          upi_id: cleanUpi || null,
          account_holder_name: cleanHolder || null,
          bank_name: cleanBank || null,
          account_number: cleanAcc || null,
          ifsc_code: cleanIfsc || null,
        }),
      });

      if (!saveRes || saveRes.error) {
        throw new Error(saveRes?.error || 'Failed to save payout details');
      }

      // 2. Activate Free Influencer Pass if requested
      let subData = null;
      if (initialPlanId === 'free_influencer') {
        const actRes = await apiRequest('/subscriptions/activate-free', {
          method: 'POST',
          body: JSON.stringify({}),
        }).catch(() => null);
        subData = actRes;
      }

      // 3. Update local user context
      if (currentUser && setCurrentUser) {
        const updatedUser = {
          ...currentUser,
          isInfluencer: true,
          hasPayoutDetails: true,
          subscriptionPlan: subData?.subscription?.plan_name || 'Free Influencer Pass',
          subscriptionExpiresAt: subData?.subscription?.expires_at || null,
        };
        setCurrentUser(updatedUser);
        await setStoredUser(updatedUser);
      }

      Alert.alert(
        '🎉 Influencer Status Activated!',
        'Your payout details have been securely saved and your Free Influencer Pass is active! You are now eligible for Admin performance rewards.',
        [
          {
            text: 'Let’s Go!',
            onPress: () => {
              if (handleSuccessCallback) handleSuccessCallback();
              if (onClose) onClose();
            },
          },
        ]
      );
    } catch (err) {
      console.error('Save payout error:', err);
      Alert.alert('Error', err.message || 'Failed to save payout details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isModalVisible) return null;

  return (
    <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.headerIconBox}
              >
                <ShieldCheck size={20} color="#ffffff" />
              </LinearGradient>
              <View>
                <Text style={styles.modalTitle}>Influencer Payout Details</Text>
                <Text style={styles.modalSubtitle}>Required to receive Admin video rewards</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Explanatory Banner */}
            <View style={styles.infoBanner}>
              <Sparkles size={16} color="#fbbf24" style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={styles.infoBannerText}>
                <Text style={{ fontWeight: '700', color: '#fbbf24' }}>Flexible & Optional:</Text>{' '}
                You can enter your <Text style={{ color: '#ffffff', fontWeight: '700' }}>PhonePe / UPI ID</Text>, your{' '}
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Bank Account</Text>, or both. Entering at least one is enough to activate your Free Influencer status!
              </Text>
            </View>

            {isFetching ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#ff007a" />
                <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>Loading saved details...</Text>
              </View>
            ) : (
              <>
                {/* 1. PhonePe / UPI Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Smartphone size={18} color="#a855f7" />
                    <Text style={styles.sectionTitle}>Option 1: PhonePe / UPI ID</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Fastest</Text>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>UPI ID (PhonePe, GPay, Paytm, etc.)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 7989938718@ybl or name@upi"
                    placeholderTextColor="#64748b"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHint}>
                    Instant transfer directly to your UPI app when Admin disburses rewards.
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>AND / OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* 2. Bank Account Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Building2 size={18} color="#38bdf8" />
                    <Text style={styles.sectionTitle}>Option 2: Bank Account Details</Text>
                  </View>

                  <Text style={styles.inputLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full name as printed on bank passbook"
                    placeholderTextColor="#64748b"
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., State Bank of India, HDFC Bank"
                    placeholderTextColor="#64748b"
                    value={bankName}
                    onChangeText={setBankName}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bank Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter account number"
                    placeholderTextColor="#64748b"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                    secureTextEntry={false}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Confirm Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter account number"
                    placeholderTextColor="#64748b"
                    value={confirmAccountNumber}
                    onChangeText={setConfirmAccountNumber}
                    keyboardType="number-pad"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>IFSC Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., SBIN0001234"
                    placeholderTextColor="#64748b"
                    value={ifscCode}
                    onChangeText={t => setIfscCode(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
              </>
            )}

            {/* Security Note */}
            <View style={styles.securityRow}>
              <Lock size={14} color="#64748b" />
              <Text style={styles.securityText}>
                Your details are encrypted and only accessible to FunFlick Admin for payout processing.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSaveAndActivate}
              disabled={isLoading || isFetching}
              activeOpacity={0.85}
              style={{ marginTop: 16 }}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text style={styles.submitBtnText}>
                      Save Details & Activate Free Influencer
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  recommendedText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  inputHint: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  securityText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
