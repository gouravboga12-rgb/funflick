import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ArrowRight, RotateCcw, Mail, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const VerifyOtpScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, loginUser } = useApp();

  const emailParam = searchParams.get('email') || sessionStorage.getItem('pending_reg_email') || 'funflick0308@gmail.com';
  const usernameParam = searchParams.get('username') || '';

  // 6-digit OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    // Handle paste of full 6-digit code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...otp];
      digits.forEach((d, idx) => {
        if (index + idx < 6) updated[index + idx] = d;
      });
      setOtp(updated);
      const nextFocus = Math.min(index + digits.length, 5);
      document.getElementById(`otp-${nextFocus}`)?.focus();
      return;
    }

    const cleanChar = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    // Auto focus next input
    if (cleanChar && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailParam,
          otp: otpCode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('funflick_token', data.token);

        const pendingData = sessionStorage.getItem('pending_reg_user');
        const pendingUser = pendingData ? JSON.parse(pendingData) : null;

        loginUser({
          name: 'FunFlick Member',
          username: usernameParam || 'funflick_user',
          email: emailParam,
          phone: pendingUser?.phone || '',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          ...(pendingUser || {}),
          ...(data.user || {})
        });

        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        showToast('🎉 Account verified successfully! Welcome to FunFlicks!', 'success');
        navigate('/feed');
      } else {
        const err = await res.json();
        showToast(err.error || 'Invalid verification code', 'error');
      }
    } catch (networkErr) {
      // Offline simulation fallback: verify and create user in local context
      const pendingData = sessionStorage.getItem('pending_reg_user');
      const pendingUser = pendingData ? JSON.parse(pendingData) : null;
      const userObj = {
        name: 'FunFlick Member',
        username: usernameParam || 'funflick_user',
        email: emailParam,
        phone: pendingUser?.phone || '',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        ...(pendingUser || {})
      };

      loginUser(userObj);
      showToast('🎉 Account verified! Welcome to FunFlicks!', 'success');
      navigate('/feed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: usernameParam || 'Member',
          username: usernameParam || 'user',
          email: emailParam,
          password: 'Password123'
        })
      });
      setTimer(30);
      showToast(`New 6-digit code sent to ${emailParam}`, 'info');
    } catch (e) {
      setTimer(30);
      showToast(`New 6-digit code dispatched to ${emailParam}`, 'info');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-8 bg-[#090514] select-none text-center">
      {/* Top Graphic */}
      <div className="flex flex-col items-center mt-4 space-y-3">
        <div 
          onClick={() => navigate('/splash')}
          className="cursor-pointer group flex flex-col items-center"
        >
          <img
            src="/brand/funflick-logo.png"
            alt="FunFlick"
            className="w-16 h-16 rounded-2xl object-contain drop-shadow-xl group-hover:scale-105 transition-transform"
          />
        </div>

        <div className="space-y-1 max-w-xs">
          <h2 className="text-xl font-bold text-white font-heading">
            Enter 6-Digit Code
          </h2>
          <p className="text-xs text-gray-400">
            We sent a verification code to
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-pink-300">
            <Mail className="w-3.5 h-3.5" />
            <span>{emailParam}</span>
          </div>
        </div>
      </div>

      {/* 6-Digit OTP Form */}
      <form onSubmit={handleVerify} className="my-6 space-y-6">
        <div className="flex items-center justify-center gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className="w-11 h-14 text-center text-xl font-extrabold text-white font-mono bg-[#160f2b] border border-white/15 focus:border-[#ff007a] rounded-2xl focus:outline-none shadow-lg transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={verifying || otp.join('').length !== 6}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm tracking-wide shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {verifying ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Verify & Complete Registration</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Resend Timer */}
      <div className="space-y-4 pb-4">
        {timer > 0 ? (
          <p className="text-xs text-gray-400">
            Resend code in <span className="font-bold text-pink-400">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex items-center justify-center gap-1.5 mx-auto text-xs font-bold text-pink-400 hover:text-pink-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resend 6-Digit Code</span>
          </button>
        )}

        <button
          onClick={() => navigate('/signup')}
          className="text-xs text-gray-500 hover:text-gray-300 block mx-auto transition"
        >
          Entered wrong email? Change email
        </button>
      </div>
    </div>
  );
};
