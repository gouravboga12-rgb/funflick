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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export default function SignUpScreen({ navigation }) {
  const { register } = useApp();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Email Address</Text>
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
    marginBottom: 26,
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
    marginTop: 24,
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
    marginTop: 20,
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
});
