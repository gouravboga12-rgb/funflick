import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const VerifyOtpScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [otp, setOtp] = useState(['5', '8', '2', '9']);
  const [timer, setTimer] = useState(30);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showToast('🎉 Mobile verified successfully! Welcome to FunFlick!', 'success');
      navigate('/');
    }, 800);
  };

  const handleResend = () => {
    setTimer(30);
    showToast('New verification code sent to +91 98765 43210', 'info');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-8 bg-[#090514] select-none text-center">
      {/* Top Graphic */}
      <div className="flex flex-col items-center mt-6 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/20">
          <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h2 className="text-xl font-bold text-white font-heading">
          Verify Phone Number
        </h2>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
          We have sent a 4-digit verification code to <span className="text-white font-semibold">+91 98765 43210</span>
        </p>
      </div>

      {/* OTP Boxes */}
      <form onSubmit={handleVerify} className="my-auto space-y-6">
        <div className="flex items-center justify-center gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              className="w-13 h-14 bg-[#160f2b] text-white text-xl font-bold text-center rounded-2xl border-2 border-white/10 focus:border-[#ff007a] focus:bg-[#1f153a] outline-none transition shadow-inner"
            />
          ))}
        </div>

        {/* Resend Timer */}
        <div className="text-xs">
          {timer > 0 ? (
            <span className="text-gray-400">
              Resend code in <strong className="text-pink-400">0:{timer < 10 ? `0${timer}` : timer}</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="flex items-center justify-center gap-1.5 mx-auto font-bold text-pink-400 hover:text-pink-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend OTP Code</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={verifying}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm tracking-wide shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {verifying ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-[11px] text-gray-500 pb-2">
        Having trouble? Tap Resend OTP or contact FunFlick Support
      </p>
    </div>
  );
};
