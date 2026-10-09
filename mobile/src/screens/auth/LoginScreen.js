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
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, Lock, User, Eye, EyeOff, ArrowLeft, Mail, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle, selectGoogleAccount } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Google OAuth state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [accountChoices, setAccountChoices] = useState(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your username/email and password');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      await login(identifier.trim(), password);
      Alert.alert('Welcome Back!', 'Logged in successfully.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    if (!googleEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your Google account email');
      return;
    }
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle(googleEmail.trim());
      if (res && res.requiresAccountChoice) {
        setAccountChoices(res.accounts);
        return;
      }
      setShowGoogleModal(false);
      Alert.alert('Welcome!', 'Signed in successfully via Google.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      Alert.alert(
        'Google Login',
        err.message || 'No FunFlick account found with this Google email. Would you like to Sign Up?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Up',
            onPress: () => {
              setShowGoogleModal(false);
              navigation.navigate('SignUp', { initialEmail: googleEmail.trim() });
            },
          },
        ]
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSelectAccount = async (account) => {
    setGoogleLoading(true);
    try {
      await selectGoogleAccount(account.id, googleEmail.trim());
      setShowGoogleModal(false);
      setAccountChoices(null);
      Alert.alert('Welcome!', `Logged in as @${account.username}`);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to select account');
    } finally {
      setGoogleLoading(false);
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
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
        )}

        <View style={styles.headerArea}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logoIconCircle}
          >
            <LogIn color="#fff" size={32} />
          </LinearGradient>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your FunFlick account</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formArea}>
          {/* Continue with Google Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            onPress={() => {
              setAccountChoices(null);
              setShowGoogleModal(true);
            }}
          >
            <View style={styles.googleIconBadge}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.inputLabel}>Username or Email</Text>
          <View style={styles.inputRow}>
            <User color="rgba(255,255,255,0.4)" size={20} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. john or john@example.com"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputRow}>
            <Lock color="rgba(255,255,255,0.4)" size={20} style={styles.fieldIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
              {showPassword ? (
                <EyeOff color="rgba(255,255,255,0.5)" size={18} />
              ) : (
                <Eye color="rgba(255,255,255,0.5)" size={18} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
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
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.switchLink}> Create One</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Google Sign-In Modal */}
      <Modal visible={showGoogleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.googleIconBadge}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.modalTitle}>Sign in with Google</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)}>
                <X color="#9ca3af" size={20} />
              </TouchableOpacity>
            </View>

            {accountChoices ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.accountChoiceSubtitle}>
                  Multiple accounts found. Choose which account to sign into:
                </Text>
                {accountChoices.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={styles.accountRow}
                    onPress={() => handleSelectAccount(acc)}
                  >
                    <Image
                      source={{
                        uri: acc.avatar_url || 'https://funflick-theta.vercel.app/brand/default-avatar.svg',
                      }}
                      style={styles.accAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accName}>{acc.name || acc.username}</Text>
                      <Text style={styles.accUsername}>@{acc.username}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.modalSubtitle}>
                  Enter your Google account email to sign in to FunFlick:
                </Text>
                <View style={[styles.inputRow, { marginTop: 12 }]}>
                  <Mail color="rgba(255,255,255,0.4)" size={20} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={googleEmail}
                    onChangeText={setGoogleEmail}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 18 }]}
                  onPress={handleGoogleSubmit}
                  disabled={googleLoading}
                >
                  <LinearGradient
                    colors={['#4285F4', '#34A853']}
                    style={styles.gradientBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Continue with Google</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
  formArea: {
    width: '100%',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    height: 50,
    gap: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googleIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleBtnText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    marginTop: 22,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  switchText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  switchLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#18102d',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  accountChoiceSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  accAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2b1b4d',
  },
  accName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  accUsername: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
