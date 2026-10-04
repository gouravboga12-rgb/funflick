import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const GOOGLE_CLIENT_ID = '842418912992-vkqo3sndu53tukn0ou2u15rdee3586ff.apps.googleusercontent.com';

// Helper to decode JWT credential returned by Google Identity Services
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT:', e);
    return null;
  }
}

export const GoogleAuthButton = ({ 
  mode = 'login', // 'login' | 'signup'
  variant = 'full', // 'full' | 'icon'
  onSuccess
}) => {
  const navigate = useNavigate();
  const { loginUser, showToast } = useApp();
  const [loading, setLoading] = useState(false);

  // Process user data obtained from Google (via credential JWT or access_token userinfo)
  const handleGoogleSuccess = async (googleUser) => {
    setLoading(true);
    try {
      const email = googleUser.email;
      const name = googleUser.name || email.split('@')[0];
      const avatar = googleUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
      const googleId = googleUser.sub || googleUser.id || 'google_user';

      // 1. Send to Backend API if reachable
      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, picture: avatar, googleId })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            localStorage.setItem('funflick_token', data.token);
          }
        }
      } catch (apiErr) {
        console.warn('Backend API request skipped or offline:', apiErr);
      }

      // 2. Set client application session
      loginUser({
        name,
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
        email,
        avatar
      });

      showToast(
        mode === 'signup'
          ? `Welcome to FunFlick, ${name}! 🎉`
          : `Signed in as ${name} via Google ✨`,
        'success'
      );

      if (onSuccess) {
        onSuccess(googleUser);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      console.error('Google auth processing error:', err);
      showToast('Google authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google Identity Services OAuth popup
  const triggerGoogleSignIn = () => {
    if (typeof window === 'undefined' || !window.google?.accounts) {
      showToast('Loading Google Sign-In SDK... please wait a moment.', 'info');
      // If SDK not ready, retry in 500ms
      setTimeout(() => {
        if (window.google?.accounts) {
          initiateFlow();
        } else {
          showToast('Google Services could not be loaded. Check your connection.', 'error');
        }
      }, 500);
      return;
    }

    initiateFlow();
  };

  const initiateFlow = () => {
    setLoading(true);

    try {
      // Use modern tokenClient for instant popup dialog
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google Token error:', tokenResponse);
            setLoading(false);
            showToast(`Google login error: ${tokenResponse.error}`, 'error');
            return;
          }

          if (tokenResponse.access_token) {
            try {
              // Fetch user profile from Google UserInfo endpoint
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await userInfoRes.json();
              await handleGoogleSuccess(profile);
            } catch (err) {
              console.error('Error fetching Google profile:', err);
              setLoading(false);
              showToast('Could not fetch Google profile.', 'error');
            }
          }
        },
        error_callback: (err) => {
          console.warn('Google client error:', err);
          setLoading(false);
          if (err.type === 'popup_closed') {
            showToast('Google sign-in was cancelled.', 'info');
          } else {
            showToast('Google sign-in popup error. Please try again.', 'error');
          }
        }
      });

      client.requestAccessToken();
    } catch (err) {
      console.error('Error opening Google popup:', err);
      setLoading(false);
      showToast('Failed to open Google Sign-In.', 'error');
    }
  };

  // Also initialize Google One-Tap in the background if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              const decoded = parseJwt(response.credential);
              if (decoded) handleGoogleSuccess(decoded);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } catch (e) {
        console.warn('Google GSI initialize error:', e);
      }
    }
  }, []);

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={triggerGoogleSignIn}
        disabled={loading}
        title={mode === 'signup' ? 'Sign up with Google' : 'Log in with Google'}
        className="w-12 h-12 rounded-2xl bg-[#160f2b] border border-white/10 hover:border-pink-500/50 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm group disabled:opacity-50 cursor-pointer"
        aria-label={mode === 'signup' ? 'Sign up with Google' : 'Log in with Google'}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 group-hover:drop-shadow-md transition-transform" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
            <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9v-3.2z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 20.1 7.4 23 12 23z"/>
          </svg>
        )}
      </button>
    );
  }

  // Full-width button with Google colors and official styling
  return (
    <button
      type="button"
      onClick={triggerGoogleSignIn}
      disabled={loading}
      className="w-full py-3 px-4 rounded-2xl bg-[#140e2b] hover:bg-[#1c143c] border border-white/10 hover:border-pink-500/40 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition active:scale-[0.99] shadow-md group disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
          <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9v-3.2z"/>
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 20.1 7.4 23 12 23z"/>
        </svg>
      )}
      <span className="font-heading">
        {loading 
          ? 'Connecting to Google...' 
          : (mode === 'signup' ? 'Sign up with Google' : 'Continue with Google')}
      </span>
    </button>
  );
};
