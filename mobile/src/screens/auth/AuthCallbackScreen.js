import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';

export default function AuthCallbackScreen() {
  useEffect(() => {
    try {
      WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });
    } catch (e) {
      console.warn('Auth callback session complete error:', e);
    }

    // Auto-close browser popup on Web
    if (typeof window !== 'undefined' && window.opener) {
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {}
      }, 500);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Completing authentication...</Text>
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
  text: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
