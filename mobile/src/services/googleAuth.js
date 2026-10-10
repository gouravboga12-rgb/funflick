import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

// Tell WebBrowser to complete any pending session on web/Android
WebBrowser.maybeCompleteAuthSession();

/**
 * Initiates the Google OAuth 2.0 Browser flow.
 * Opens Chrome / Safari via WebBrowser.openAuthSessionAsync.
 * Automatically intercepts the deep link return (funflick://auth/callback)
 *
 * @param {'login' | 'signup'} flow - Desired OAuth mode
 * @returns {Promise<{
 *   type: 'success' | 'cancelled' | 'error' | 'choose_account' | 'no_account' | 'google_verified',
 *   token?: string,
 *   user?: any,
 *   accounts?: any[],
 *   email?: string,
 *   name?: string,
 *   avatar?: string,
 *   error?: string
 * }>}
 */
export async function startGoogleOAuth(flow = 'login') {
  try {
    // Determine the deep-link callback route
    // In native standalone app: funflick://auth/callback
    // In Expo development/web: uses dynamic Linking URL
    let returnUrl = Linking.createURL('auth/callback');
    if (Platform.OS !== 'web' && !returnUrl.startsWith('exp://')) {
      returnUrl = 'funflick://auth/callback';
    }

    const authStartUrl = `${API_BASE_URL}/auth/google/start?flow=${flow}&returnUrl=${encodeURIComponent(returnUrl)}`;

    console.log(`[GoogleAuth] Starting ${flow} flow with returnUrl:`, returnUrl);

    // Open Custom Tab / Safari auth session
    const result = await WebBrowser.openAuthSessionAsync(authStartUrl, returnUrl);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { type: 'cancelled' };
    }

    if (result.type === 'success' && result.url) {
      return parseOAuthCallbackUrl(result.url);
    }

    return { type: 'cancelled' };
  } catch (err) {
    console.error('[GoogleAuth] Error in startGoogleOAuth:', err);
    return { type: 'error', error: err.message || 'Google authentication failed' };
  }
}

/**
 * Parses parameters returned from the OAuth deep link redirect
 */
export function parseOAuthCallbackUrl(url) {
  try {
    const parsed = Linking.parse(url);
    const params = parsed.queryParams || {};

    const status = params.status;

    if (status === 'success') {
      let userObj = null;
      try {
        userObj = params.user ? JSON.parse(params.user) : null;
      } catch (e) {
        userObj = params.user;
      }

      return {
        type: 'success',
        token: params.token,
        user: userObj,
      };
    }

    if (status === 'choose_account') {
      let accountsList = [];
      try {
        accountsList = params.accounts ? JSON.parse(params.accounts) : [];
      } catch (e) {}

      return {
        type: 'choose_account',
        email: params.email,
        accounts: accountsList,
      };
    }

    if (status === 'no_account') {
      return {
        type: 'no_account',
        email: params.email,
        name: params.name,
        avatar: params.avatar,
        googleId: params.googleId,
      };
    }

    if (status === 'google_verified') {
      return {
        type: 'google_verified',
        email: params.email,
        name: params.name,
        avatar: params.avatar,
        googleId: params.googleId,
      };
    }

    if (status === 'error' || params.error) {
      return {
        type: 'error',
        error: params.error || 'Authentication error',
      };
    }

    return { type: 'error', error: 'Unknown response status' };
  } catch (err) {
    console.error('[GoogleAuth] Error parsing callback url:', err);
    return { type: 'error', error: 'Failed to process authentication result' };
  }
}
