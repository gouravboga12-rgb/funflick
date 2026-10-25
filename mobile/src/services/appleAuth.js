import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

/**
 * Checks if Apple Authentication is available on this device.
 * (Returns true on iOS 13+ devices, false on Android/Web)
 */
export async function isAppleAuthAvailable() {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Initiates the native iOS Sign In with Apple sheet and authenticates with backend.
 *
 * @returns {Promise<{
 *   type: 'success' | 'cancelled' | 'error',
 *   token?: string,
 *   user?: any,
 *   error?: string
 * }>}
 */
export async function startAppleAuth() {
  try {
    if (Platform.OS !== 'ios') {
      return { type: 'error', error: 'Apple Sign In is only available on iOS devices.' };
    }

    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { type: 'error', error: 'Apple Sign In is not supported on this device.' };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential || !credential.identityToken) {
      return { type: 'cancelled' };
    }

    // Send credentials to FunFlick backend
    const response = await fetch(`${API_BASE_URL}/auth/apple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identityToken: credential.identityToken,
        appleUserId: credential.user,
        fullName: credential.fullName,
        email: credential.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        type: 'error',
        error: data.error || 'Apple authentication failed on server',
      };
    }

    return {
      type: 'success',
      token: data.token,
      user: data.user,
    };
  } catch (err) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { type: 'cancelled' };
    }
    console.error('[AppleAuth] Error:', err);
    return {
      type: 'error',
      error: err.message || 'Apple authentication failed',
    };
  }
}
