import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  KeyRound,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { apiRequest } from '../../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  // Step: 'identifier' | 'choose_account' | 'otp_reset' | 'success'
  const [step, setStep] = useState('identifier');

  const [identifier, setIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [accounts, setAccounts] = useState([]);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Send OTP via backend email service
  const handleLookup = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/forgot-password/lookup', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      if (data && data.success) {
        setTargetEmail(data.targetEmail || '');
        setMaskedEmail(data.emailMasked || data.targetEmail || '');

        if (data.accounts && data.accounts.length > 1) {
          setAccounts(data.accounts);
          setStep('choose_account');
        } else if (data.accounts && data.accounts.length === 1) {
          setSelectedUsername(data.accounts[0].username);
          setStep('otp_reset');
        } else {
          setSelectedUsername(identifier.trim().replace(/^@/, ''));
          setStep('otp_reset');
        }
      } else {
        setErrorMessage(data?.error || 'Failed to send reset code. Please check details.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'No account found with this email or username.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Select specific account if multiple accounts linked to email
  const handleSelectAccount = (account) => {
    setSelectedUsername(account.username);
    setStep('otp_reset');
  };

  // 3. Reset Password with OTP
  const handleResetPassword = async () => {
    if (!otp.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail,
          username: selectedUsername,
          otp: otp.trim(),
          newPassword,
        }),
      });

      if (data && data.success) {
        setStep('success');
      } else {
        setErrorMessage(data?.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#07040d', '#130b26', '#0a0515']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 'choose_account' || step === 'otp_reset') {
              setStep('identifier');
              setErrorMessage('');
            } else {
              navigation.goBack();
            }
          }}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

        {/* Header Icon & Title */}
        <View style={styles.headerArea}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logoIconCircle}
          >
            {step === 'success' ? (
              <CheckCircle2 color="#fff" size={32} />
            ) : (
              <KeyRound color="#fff" size={32} />
            )}
          </LinearGradient>
          <Text style={styles.title}>
            {step === 'success'
              ? 'Password Reset!'
              : step === 'choose_account'
              ? 'Select Your Account'
              : step === 'otp_reset'
              ? 'Enter Verification Code'
              : 'Forgot Password?'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'success'
              ? 'Your password has been reset successfully. You can now log in with your new credentials.'
              : step === 'choose_account'
              ? `Multiple accounts found for ${maskedEmail}. Which one would you like to recover?`
              : step === 'otp_reset'
              ? `We sent a 6-digit reset code to ${maskedEmail} for @${selectedUsername}.`
              : 'Enter your username or email and we will send you a 6-digit code to reset your password.'}
          </Text>
        </View>

        {/* Error message */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* STEP 1: Enter Username / Email */}
        {step === 'identifier' && (
          <View style={styles.formArea}>
            <View style={styles.inputContainer}>
              <Mail color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username or email address"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleLookup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send Reset Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Remembered your password?</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.switchLink}> Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: Choose Account */}
        {step === 'choose_account' && (
          <View style={styles.formArea}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={styles.accountCard}
                onPress={() => handleSelectAccount(acc)}
                activeOpacity={0.7}
              >
                <View style={styles.accountCardLeft}>
                  {acc.avatar_url ? (
                    <Image source={{ uri: acc.avatar_url }} style={styles.accountAvatar} />
                  ) : (
                    <View style={styles.accountAvatarFallback}>
                      <User color="#ffffff" size={18} />
                    </View>
                  )}
                  <View>
                    <Text style={styles.accountName}>{acc.name || acc.username}</Text>
                    <Text style={styles.accountUsername}>@{acc.username}</Text>
                  </View>
                </View>
                <ChevronRight color="#94a3b8" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 3: OTP Code & New Password */}
        {step === 'otp_reset' && (
          <View style={styles.formArea}>
            {/* 6-Digit OTP */}
            <View style={styles.inputContainer}>
              <ShieldCheck color="#34d399" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="6-digit code (e.g. 123456)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Lock color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password (min 6 characters)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                {showPassword ? (
                  <EyeOff color="rgba(255,255,255,0.5)" size={18} />
                ) : (
                  <Eye color="rgba(255,255,255,0.5)" size={18} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Lock color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Update Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleLookup}
              disabled={loading}
            >
              <Text style={styles.resendText}>Didn't receive code? Resend Email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: Success View */}
        {step === 'success' && (
          <View style={styles.formArea}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.btnText}>Back to Log In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07040d',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  formArea: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    height: '100%',
  },
  otpInput: {
    letterSpacing: 3,
    fontWeight: '700',
    fontSize: 17,
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  resendText: {
    color: '#f472b6',
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  switchLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  accountAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7928ca',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  accountUsername: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
