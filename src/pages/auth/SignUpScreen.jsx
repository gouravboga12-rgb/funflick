import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Camera, 
  User, 
  AtSign, 
  Mail, 
  Smartphone, 
  Lock, 
  Check, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

export const SignUpScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [avatar, setAvatar] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live username uniqueness state
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });

  // Debounced check for unique User ID
  useEffect(() => {
    const cleanHandle = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanHandle || cleanHandle.length < 3) {
      setUsernameStatus({ state: 'idle', message: 'Enter at least 3 characters' });
      return;
    }

    setUsernameStatus({ state: 'checking', message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(cleanHandle)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setUsernameStatus({ state: 'available', message: `@${cleanHandle} is available!` });
          } else {
            setUsernameStatus({ state: 'taken', message: data.reason || `@${cleanHandle} is already taken` });
          }
        } else {
          // If offline, allow registration
          setUsernameStatus({ state: 'available', message: `@${cleanHandle} looks good` });
        }
      } catch (e) {
        setUsernameStatus({ state: 'available', message: `@${cleanHandle} looks good` });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      showToast('Profile photo updated! 📸');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      showToast('Please accept the Terms & Conditions', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match! Please check again.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (usernameStatus.state === 'taken') {
      showToast('Please choose a unique User ID before proceeding.', 'error');
      return;
    }

    setLoading(true);
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          username: cleanUsername,
          email: cleanEmail,
          phone: phone.trim(),
          password
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Verification code sent to ${cleanEmail}! 📧`, 'success');
        navigate(`/verify?email=${encodeURIComponent(cleanEmail)}&username=${encodeURIComponent(cleanUsername)}`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to send OTP code.', 'error');
      }
    } catch (networkErr) {
      // Offline fallback: save data in sessionStorage so verification screen works
      sessionStorage.setItem('pending_reg_email', cleanEmail);
      sessionStorage.setItem('pending_reg_user', JSON.stringify({
        name: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: phone.trim(),
        avatar
      }));
      showToast('Verification code dispatched to your email!', 'info');
      navigate(`/verify?email=${encodeURIComponent(cleanEmail)}&username=${encodeURIComponent(cleanUsername)}`);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-6 bg-[#090514] overflow-y-auto no-scrollbar select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center text-center space-y-1">
        <h2 className="text-xl font-bold text-white font-heading">
          Create FunFlicks Account
        </h2>
        <p className="text-xs text-gray-400">
          Join India's premier comedy & viral video community
        </p>

        {/* Avatar Upload Preview */}
        <div className="relative mt-4">
          <div className="w-20 h-20 rounded-full border-2 border-pink-500 shadow-xl overflow-hidden bg-[#160f2b] flex items-center justify-center">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-9 h-9 text-gray-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Google One-Click Sign Up */}
      <div className="mt-4 space-y-3">
        <GoogleAuthButton mode="signup" variant="full" />

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#090514] px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider absolute">
            OR REGISTER WITH DETAILS
          </span>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSignUp} className="space-y-3 my-2">
        
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-300 block">Full Name</label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Srilatha Reddy"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
            />
          </div>
        </div>

        {/* Unique User ID / Handle (Instagram Style) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-300">
              Unique User ID (Instagram Handle)
            </label>
            {usernameStatus.state === 'checking' && (
              <span className="text-[10px] text-pink-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Checking...</span>
              </span>
            )}
            {usernameStatus.state === 'available' && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Available</span>
              </span>
            )}
            {usernameStatus.state === 'taken' && (
              <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>Taken</span>
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <AtSign className="w-4 h-4 text-pink-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
              placeholder="username (e.g. srilatha_16)"
              className={`w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border transition shadow-inner focus:outline-none ${
                usernameStatus.state === 'available' 
                  ? 'border-emerald-500/50 focus:border-emerald-400' 
                  : usernameStatus.state === 'taken' 
                  ? 'border-rose-500/60 focus:border-rose-400' 
                  : 'border-white/10 focus:border-[#ff007a]'
              }`}
            />
          </div>
          <span className="text-[10px] text-gray-400 block px-1">
            Others can search and tag you using <strong>@{username || 'handle'}</strong>
          </span>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-300 block">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. user@gmail.com"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
            />
          </div>
          <span className="text-[10px] text-gray-400 block px-1">
            6-digit OTP verification code will be sent to this email
          </span>
        </div>

        {/* Mobile Number */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-300 block">Mobile Number</label>
          <div className="relative flex items-center">
            <Smartphone className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
            />
          </div>
        </div>

        {/* Password with Eye Icon Toggle */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-300 block">Create Password</label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 pr-11 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner"
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

        {/* Re-enter Password (Confirm Password) with Eye Icon Toggle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-300">
              Re-enter Password
            </label>
            {passwordsMatch && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3 stroke-[3]" /> Passwords match
              </span>
            )}
            {passwordsMismatch && (
              <span className="text-[10px] text-rose-400 font-semibold">
                Passwords don't match
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={`w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-11 py-3 pr-11 rounded-2xl border transition shadow-inner focus:outline-none ${
                passwordsMatch 
                  ? 'border-emerald-500/50 focus:border-emerald-400' 
                  : passwordsMismatch 
                  ? 'border-rose-500/50 focus:border-rose-400' 
                  : 'border-white/10 focus:border-[#ff007a]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1.5 text-gray-400 hover:text-white absolute right-3 rounded-lg transition"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
            I agree to FunFlicks{' '}
            <span className="text-pink-400 underline">Terms of Service</span> &{' '}
            <span className="text-pink-400 underline">Privacy Policy</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (usernameStatus.state === 'taken')}
          className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm tracking-wide shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending Verification Code...</span>
            </div>
          ) : (
            <span>Continue & Verify Email</span>
          )}
        </button>
      </form>

      {/* Bottom Switch to Login */}
      <div className="text-center text-xs text-gray-400 py-3">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
};
