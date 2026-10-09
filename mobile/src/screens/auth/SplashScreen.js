import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight, Play } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { isLoadingAuth, isAuthenticated } = useApp();

  // If already authenticated, jump straight to the feed
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [isLoadingAuth, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#07040d', '#130b26', '#090514']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Glows */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        {/* Top subtle badge */}
        <View style={styles.topBadge}>
          <Sparkles size={13} color="#f472b6" />
          <Text style={styles.topBadgeText}>India's Premier Comedy & Video Social Hub</Text>
        </View>

        {/* Center Brand Identity */}
        <View style={styles.centerArea}>
          <View style={styles.logoOuterGlow}>
            <LinearGradient
              colors={['#ff007a', '#7928ca', '#0070f3']}
              style={styles.logoBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image
                source={require('../../../assets/logo-white.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </LinearGradient>
          </View>

          <Text style={styles.tagline}>Comedy. Entertainment. Always On!</Text>
          <Text style={styles.subTagline}>Watch, Share & Monetize Short Videos</Text>
        </View>

        {/* Bottom CTA Area */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={['#ff007a', '#ff4b2b', '#7928ca']}
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Get Started</Text>
              <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.brandKeywordsRow}>
            <Text style={styles.keyword}>Watch</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.keyword}>Create</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.keyword}>Follow</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.keyword}>Earn</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07040d',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(121, 40, 202, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 8,
  },
  topBadgeText: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '600',
  },
  centerArea: {
    alignItems: 'center',
    width: '100%',
  },
  logoOuterGlow: {
    width: 136,
    height: 136,
    borderRadius: 36,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    marginBottom: 20,
  },
  logoBorder: {
    width: 136,
    height: 136,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    marginTop: 6,
  },
  subTagline: {
    fontSize: 12,
    color: '#f472b6',
    fontWeight: '600',
    marginTop: 4,
  },
  bottomArea: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  getStartedBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  gradientBtn: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  guestBtn: {
    paddingVertical: 8,
  },
  guestBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  brandKeywordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  keyword: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dot: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
  },
});
