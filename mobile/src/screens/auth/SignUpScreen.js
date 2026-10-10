import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { startGoogleOAuth } from '../../services/googleAuth';

export default function SignUpScreen({ route, navigation }) {
  const { register } = useApp();
  const initialEmail = route?.params?.initialEmail || '';
  const incomingProfile = route?.params?.googleProfile;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Google Sign-Up state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleVerified, setIsGoogleVerified] = useState(Boolean(initialEmail || incomingProfile?.email));

  useEffect(() => {
    if (incomingProfile?.email) {
      setEmail(incomingProfile.email.toLowerCase());
      if (incomingProfile.name && !name) {
        setName(incomingProfile.name);
      }
      if (!username) {
        setUsername(incomingProfile.email.split('@')[0].replace(/[^a-z0-9_]/g, ''));
      }
      setIsGoogleVerified(true);
    }
  }, [incomingProfile]);

  const handleSignUpWithGoogle = async () => {
    setGoogleLoading(true);
    setErrorMessage('');

    try {
      const result = await startGoogleOAuth('signup');

      if (result.type === 'cancelled') {
        return;
      }

      if (result.type === 'google_verified') {
        const cleanEmail = (result.email || '').toLowerCase().trim();
        setEmail(cleanEmail);
        if (result.name && !name) {
          setName(result.name);
        }
        if (!username && cleanEmail) {
          setUsername(cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, ''));
        }
        setIsGoogleVerified(true);
        Alert.alert(
          'Google Verified ✓',
          `Verified: ${cleanEmail}\nPlease set a password to finish creating your FunFlick account.`
        );
        return;
      }

      if (result.type === 'error') {
        Alert.alert('Google Sign-Up', result.error || 'Failed to authenticate with Google');
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      Alert.alert('Google Sign-Up Error', err.message || 'Failed to authenticate with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        email: email.trim().toLowerCase(),
        password,
      });

      Alert.alert('Account Created!', 'Welcome to FunFlick! Your account is ready.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Username or email may already be taken.');
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
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
        )}

        <View style={styles.headerArea}>
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            style={styles.logoIconCircle}
          >
            <UserPlus color="#fff" size={32} />
          </LinearGradient>
          <Text style={styles.title}>Join FunFlick</Text>
          <Text style={styles.subtitle}>Start sharing viral reels & moments today</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formArea}>
          {/* Sign Up with Google Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            onPress={handleSignUpWithGoogle}
            disabled={googleLoading}
          >
            <View style={styles.googleIconBadge}>
              <Text style={styles.googleG}>G</Text>
            </View>
            {googleLoading ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginLeft: 8 }} />
            ) : (
              <Text style={styles.googleBtnText}>
                {isGoogleVerified ? 'Google Verified ✓' : 'Sign up with Google'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputRow}>
            <User color="rgba(255,255,255,0.4)" size={20} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Username</Text>
          <View style={styles.inputRow}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="johndoe"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            Email Address {isGoogleVerified && <Text style={{ color: '#34A853' }}>(Google Verified ✓)</Text>}
          </Text>
          <View style={styles.inputRow}>
            <Mail color="rgba(255,255,255,0.4)" size={20} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
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

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <Lock color="rgba(255,255,255,0.4)" size={20} style={styles.fieldIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
    paddingTop: 50,
    paddingBottom: 40,
    flexGrow: 1,
  },
  backBtn: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.secondary,
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
    textAlign: 'center',
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
    marginBottom: 16,
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
    marginVertical: 12,
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
    marginBottom: 6,
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
  atSymbol: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
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
    marginTop: 18,
  },
  switchText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  switchLink: {
    color: colors.secondary,
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
});
