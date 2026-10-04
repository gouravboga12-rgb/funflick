import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight, UserCheck, X, ChevronRight } from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { showToast, loginUser } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Instagram-style Account Chooser Modal state (when multiple accounts match email/phone & password)
  const [matchingAccounts, setMatchingAccounts] = useState(null);
  const [googleAuthEmail, setGoogleAuthEmail] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter your username/email/phone and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      if (res.ok) {
        const data = await res.json();

        // Check if multiple accounts were found with the same credentials (Instagram Chooser)
        if (data.requiresAccountChoice && data.accounts?.length > 1) {
          setMatchingAccounts(data.accounts);
          setGoogleAuthEmail(null);
          setLoading(false);
          return;
        }

        if (data.token) {
          localStorage.setItem('funflick_token', data.token);
        }

        loginUser(data.user);
        showToast(`Welcome back, ${data.user?.name || identifier}! ✨`, 'success');
        navigate('/feed');
      } else {
        const err = await res.json();
        showToast(err.error || 'Invalid credentials', 'error');
      }
    } catch (networkErr) {
      // Offline simulation fallback
      loginUser({
        name: 'Srilatha Reddy',
        username: identifier.replace(/^@/, ''),
        email: identifier.includes('@') ? identifier : 'srilatha@funflick.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      });
      showToast('Welcome back! ✨', 'success');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseAccount = async (account) => {
    setLoading(true);
    try {
      let res;
      if (googleAuthEmail) {
        // Authenticated via Google OAuth
        res = await fetch('/api/auth/google-select-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: account.id, email: googleAuthEmail })
        });
      } else {
        // Authenticated via password
        res = await fetch('/api/auth/select-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: account.username, password })
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('funflick_token', data.token);
        loginUser(data.user || account);
        showToast(`Signed into @${account.username}! ✨`, 'success');
        navigate('/feed');
      } else {
        loginUser(account);
        navigate('/feed');
      }
    } catch (err) {
      loginUser(account);
      navigate('/feed');
    } finally {
      setMatchingAccounts(null);
      setGoogleAuthEmail(null);
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    loginUser({
      name: `User via ${platform}`,
      username: `user_${platform.toLowerCase()}`,
      email: `${platform.toLowerCase()}_user@funflick.com`
    });
    showToast(`Logged in via ${platform}!`, 'success');
    navigate('/feed');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-8 bg-[#090514] select-none relative overflow-y-auto no-scrollbar">
      {/* Top Brand & Heading (Screen 2) */}
      <div className="flex flex-col items-center text-center mt-2 space-y-3">
        <div 
          onClick={() => navigate('/splash')}
          className="cursor-pointer group flex flex-col items-center"
        >
          <img
            src="/brand/funflick-logo.png"
            alt="FunFlick"
            className="w-16 h-16 rounded-2xl object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
          />
          <span className="font-extrabold text-2xl text-white font-heading mt-1">
            fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white font-heading">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-400">
            Log in with your User ID, Email, or Mobile Number
          </p>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30 mt-1">
            ✨ Watch, Post Reels & Earn Payouts
          </span>
        </div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto py-4">
        
        {/* Flexible Identifier Input (Username, Email, or Phone) */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-300 block">
            User ID, Email, or Mobile Number
          </label>
          <div className="relative flex items-center">
            <Smartphone className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="@username, email, or +91..."
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
            />
          </div>
        </div>

        {/* Password with Eye Icon Toggle */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-300 block">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3.5 pr-11 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-gray-400 hover:text-white absolute right-3 rounded-lg transition"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-gray-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-[#ff007a] cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-gray-400 hover:text-pink-400 font-medium transition"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Gradient Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm tracking-wide shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Log In</span>
          )}
        </button>

        {/* Google One-Click Login Button */}
        <div className="pt-1">
          <GoogleAuthButton 
            mode="login" 
            variant="full" 
            onAccountChoice={(accounts, email) => {
              setMatchingAccounts(accounts);
              setGoogleAuthEmail(email);
            }}
          />
        </div>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#090514] px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider absolute">
            OTHER OPTIONS
          </span>
        </div>

        {/* Social Login Buttons (Google, Apple, Facebook) */}
        <div className="flex items-center justify-center gap-4">
          <GoogleAuthButton 
            mode="login" 
            variant="icon" 
            onAccountChoice={(accounts, email) => {
              setMatchingAccounts(accounts);
              setGoogleAuthEmail(email);
            }}
          />

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Apple')}
            className="w-12 h-12 rounded-2xl bg-[#160f2b] border border-white/10 hover:border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm text-white"
            aria-label="Apple Login"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.6-0.73 1.01-1.75.9-2.77-.87.04-1.92.58-2.54 1.31-.55.64-.99 1.68-.86 2.67.97.08 1.95-.49 2.5-1.21"/>
            </svg>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            className="w-12 h-12 rounded-2xl bg-[#160f2b] border border-white/10 hover:border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm text-[#1877F2]"
            aria-label="Facebook Login"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </div>
      </form>

      {/* Bottom Sign Up Link */}
      <div className="text-center text-xs text-gray-400 py-2">
        Don't have an account?{' '}
        <Link to="/signup" className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4">
          Sign Up
        </Link>
      </div>

      {/* Instagram-Style Account Chooser Modal (when multiple accounts match email/phone) */}
      <AnimatePresence>
        {matchingAccounts && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-sm bg-[#120b24] border border-white/10 rounded-t-[28px] sm:rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-pink-400" />
                  <h3 className="text-sm font-bold text-white font-heading">
                    Select Your Account
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setMatchingAccounts(null);
                    setGoogleAuthEmail(null);
                  }}
                  className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-300">
                {googleAuthEmail 
                  ? `Multiple accounts found with ${googleAuthEmail}. Select which account to access:`
                  : 'Multiple accounts match your credentials. Tap to select which profile to log in:'}
              </p>

              <div className="space-y-2">
                {matchingAccounts.map(acc => (
                  <div
                    key={acc.username}
                    onClick={() => handleChooseAccount(acc)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-pink-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white font-heading block group-hover:text-pink-300 transition">
                          @{acc.username}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {acc.name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
