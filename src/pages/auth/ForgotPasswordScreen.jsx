import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { KeyRound, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [identifier, setIdentifier] = useState('srilatha@funflick.com');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    showToast('Reset instructions sent to your email/phone! 📩', 'success');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-8 bg-[#090514] select-none text-center">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/login')}
          className="p-1 -ml-1 text-gray-300 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-xs font-bold text-gray-400">Password Recovery</span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="my-auto space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-500/20">
          <KeyRound className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white font-heading">
            Forgot Password?
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Enter your registered email or mobile number and we'll send you a password reset link.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <p className="font-semibold text-white">Reset Link Sent Successfully!</p>
            <p className="text-gray-300">
              Check your inbox for instructions to reset your FunFlick password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition text-xs"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Email or Mobile (+91)"
              className="w-full bg-[#160f2b] text-white placeholder-gray-500 text-xs px-4 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-[#ff007a] transition shadow-inner text-center"
            />

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm tracking-wide shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Send Reset Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-gray-400 py-2">
        Remember your password?{' '}
        <Link to="/login" className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
};
