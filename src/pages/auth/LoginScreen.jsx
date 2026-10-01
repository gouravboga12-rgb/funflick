import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [identifier, setIdentifier] = useState('srilatha_16');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Welcome back, Srilatha! ✨', 'success');
      navigate('/');
    }, 700);
  };

  const handleSocialLogin = (platform) => {
    showToast(`Logged in via ${platform}!`, 'success');
    navigate('/');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-8 bg-[#090514] select-none">
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
            One Unified Account for Viewers & Influencers
          </p>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30 mt-1">
            ✨ Watch, Post Reels & Earn Payouts
          </span>
        </div>
      </div>

      {/* Form Fields (Screen 2) */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto py-4">
        {/* Mobile Number / Email input */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <Smartphone className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Mobile Number / Email"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <Lock className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-white"
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
            <span>Login</span>
          )}
        </button>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#090514] px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider absolute">
            OR
          </span>
        </div>

        {/* Social Login Buttons (Google, Apple, Facebook - Screen 2) */}
        <div className="flex items-center justify-center gap-4">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="w-12 h-12 rounded-2xl bg-[#160f2b] border border-white/10 hover:border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm"
            aria-label="Google Login"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9v-3.2z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 20.1 7.4 23 12 23z"/>
            </svg>
          </button>

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
    </div>
  );
};
