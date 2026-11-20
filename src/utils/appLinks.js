export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.funflick.app';
export const PACKAGE_NAME = 'com.funflick.app';

/**
 * Builds the official Android Chrome/WebView Intent URL.
 * When an Android user taps or is redirected to this URI:
 * 1. If com.funflick.app IS installed: Android opens the native app directly to the given path.
 * 2. If com.funflick.app is NOT installed: Android follows S.browser_fallback_url and opens Google Play Store directly.
 */
export function getAndroidIntentUrl(path = '') {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const encodedFallback = encodeURIComponent(PLAY_STORE_URL);
  return `intent://funflick.in/${cleanPath}#Intent;scheme=https;package=${PACKAGE_NAME};S.browser_fallback_url=${encodedFallback};end`;
}

/**
 * Detects if the current user agent is on Android.
 */
export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

/**
 * Detects if opened inside common in-app browsers (WhatsApp, Instagram, Facebook, Messenger).
 */
export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|FB_IAB/i.test(ua);
}

/**
 * Attempts to launch the native app if on Android, or fall back to Play Store.
 */
export function openInAppOrStore(path = '') {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (isAndroidDevice()) {
    window.location.href = getAndroidIntentUrl(cleanPath);
  } else {
    // For iOS or desktop browsers, try custom scheme with fallback
    window.location.href = `funflick://${cleanPath}`;
  }
}

