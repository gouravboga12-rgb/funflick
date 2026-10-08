import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminLoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSessionExpired = location.state?.expired || searchParams.get('expired') === '1';
  const { showToast } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSessionExpired) {
      showToast('⚠️ Admin session expired. Please sign in again.', 'info');
    }
  }, [isSessionExpired]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter administrator email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        // Dedicated admin-only session bearer token for AWS API communication
        localStorage.setItem('funflick_admin_token', data.token);
        showToast('🛡️ Administrator identity verified on AWS. Welcome to Admin Center.', 'success');
        navigate('/admin');
      } else {
        showToast(data.error || 'Invalid administrator credentials', 'error');
      }
    } catch (err) {
      showToast('Could not reach AWS backend. Please check your network connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07040f] text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-pink-600/15 via-purple-600/15 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#0f0924] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 p-[2px] shadow-xl shadow-pink-500/20 mb-1">
            <div className="w-full h-full bg-[#0f0924] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-pink-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight">
              FunFlick Admin Center
            </h1>
            <p className="text-xs text-gray-400">
              Authorized personnel only · Strictly separate administrator portal
            </p>
          </div>
        </div>

        {/* Session Expired Banner */}
        {isSessionExpired && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div className="min-w-0">
              <p className="font-bold text-amber-200">Admin Session Expired</p>
              <p className="text-[11px] text-amber-300/80">Your security token has expired. Sign in to restore full administrative controls.</p>
            </div>
          </div>
        )}

        {/* Security Alert Badge */}
        <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-xs text-pink-300 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-pink-400" />
          <span>Restricted Portal: User app sessions cannot bypass this credential gateway.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleAdminLogin} autoComplete="off" className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin_sec_identifier" className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block">
              Admin Identifier / Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                id="admin_sec_identifier"
                name="admin_sec_identifier"
                type="text"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter admin identifier..."
                className="w-full bg-[#181033] text-white placeholder-gray-500 text-xs pl-10 pr-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin_sec_password" className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block">
              Admin Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                id="admin_sec_password"
                name="admin_sec_password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#181033] text-white placeholder-gray-500 text-xs pl-10 pr-10 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-gray-400 hover:text-white absolute right-2.5 rounded-lg transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-xl shadow-pink-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate & Access Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to User App Link */}
        <div className="text-center pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => navigate('/feed')}
            className="text-xs text-gray-400 hover:text-pink-400 font-medium transition"
          >
            ← Return to FunFlick User Feed
          </button>
        </div>
      </motion.div>
    </div>
  );
};
