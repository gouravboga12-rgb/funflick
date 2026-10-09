import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'http://98.130.142.69/api';

const TOKEN_KEY = 'funflick_token';
const USER_KEY = 'funflick_user';

let memoryToken = null;
let memoryUser = null;

export async function getToken() {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(TOKEN_KEY) || 
                    window.localStorage.getItem('funflick_token') || 
                    window.localStorage.getItem('funflick_admin_token') ||
                    (window.sessionStorage ? window.sessionStorage.getItem('funflick_token') : null);
        if (val) return val;
      }
    } catch (e) {}
    return memoryToken;
  }
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) || memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setToken(token) {
  memoryToken = token;
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
          window.localStorage.setItem(TOKEN_KEY, token);
        } else {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem('funflick_token');
        }
      }
    } catch (e) {}
    return;
  }
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('SecureStore setToken error:', e);
  }
}

export async function getStoredUser() {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USER_KEY) || window.localStorage.getItem('funflick_user');
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return memoryUser;
  }
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : memoryUser;
  } catch {
    return memoryUser;
  }
}

export async function setStoredUser(user) {
  memoryUser = user;
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
          window.localStorage.removeItem(USER_KEY);
          window.localStorage.removeItem('funflick_user');
        }
      }
    } catch (e) {}
    return;
  }
  try {
    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (e) {
    console.warn('SecureStore setUser error:', e);
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}
