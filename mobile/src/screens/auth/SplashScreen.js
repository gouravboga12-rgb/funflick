import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export default function SplashScreen({ navigation }) {
  const { isLoadingAuth, isAuthenticated } = useApp();

  useEffect(() => {
    if (!isLoadingAuth) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('MainTabs'); // Allow guest viewing like web
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#07040d', '#130b26', '#1e0836']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.logoWrapper}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.logoBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={{ uri: 'https://funflick-theta.vercel.app/brand/funflick-logo.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </LinearGradient>
        <Text style={styles.brandTitle}>
          Fun<Text style={{ color: colors.primary }}>Flick</Text>
        </Text>
        <Text style={styles.brandTagline}>Comedy. Entertainment. Always On!</Text>
      </View>

      <View style={styles.loaderArea}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Lighting up your feed...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 104,
    height: 104,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 20,
  },
  logoImage: {
    width: 68,
    height: 68,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  loaderArea: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});
