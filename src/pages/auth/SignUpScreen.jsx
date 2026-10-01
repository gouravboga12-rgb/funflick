import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Camera, User, AtSign, Mail, Smartphone, Lock, Check } from 'lucide-react';

export const SignUpScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
  const [fullName, setFullName] = useState('Srilatha Reddy');
  const [username, setUsername] = useState('srilatha_16');
  const [email, setEmail] = useState('srilatha@funflick.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [password, setPassword] = useState('••••••••');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      showToast('Profile photo updated! 📸');
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      showToast('Please accept the Terms & Conditions', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Account details verified! Sending 6-digit OTP...', 'info');
      navigate('/verify');
    }, 700);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-6 bg-[#090514] overflow-y-auto no-scrollbar select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center text-center space-y-1">
        <h2 className="text-xl font-bold text-white font-heading">
          Create FunFlick Account
        </h2>
        <p className="text-xs text-gray-400">
          Join India's fastest growing comedy community
        </p>

        {/* Avatar Upload Preview */}
        <div className="relative mt-4">
          <img
            src={avatar}
            alt="Profile preview"
            className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-xl"
          />
          <label className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSignUp} className="space-y-3.5 my-4">
        {/* Full Name */}
        <div className="relative flex items-center">
          <User className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
          />
        </div>

        {/* Username */}
        <div className="relative flex items-center">
          <AtSign className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            required
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username (e.g. srilatha_16)"
            className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
          />
        </div>

        {/* Email */}
        <div className="relative flex items-center">
          <Mail className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
          />
        </div>

        {/* Mobile Number */}
        <div className="relative flex items-center">
          <Smartphone className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Mobile Number (+91)"
            className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
          />
        </div>

        {/* Password */}
        <div className="relative flex items-center">
          <Lock className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
          />
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-2 pt-1 text-xs text-gray-300">
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded accent-[#ff007a] cursor-pointer"
          />
          <label htmlFor="terms" className="leading-snug cursor-pointer">
            I agree to FunFlick's{' '}
            <span className="text-pink-400 underline">Terms of Service</span> &{' '}
            <span className="text-pink-400 underline">Privacy Policy</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm tracking-wide shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Bottom Switch to Login */}
      <div className="text-center text-xs text-gray-400 py-2">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
};
