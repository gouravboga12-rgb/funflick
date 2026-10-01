import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../../data/mockData';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-[800px] flex-1 flex flex-col justify-between items-center px-6 py-12 bg-[#090514] overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#ff007a]/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-[#7928ca]/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0070f3]/15 rounded-full blur-[80px] pointer-events-none" />

      {/* Top subtle badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-pink-300 font-semibold"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>India's Premier Comedy & Video Social Hub</span>
      </motion.div>

      {/* Center Brand Identity (Screen 1) */}
      <div className="flex flex-col items-center text-center my-auto space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative group"
        >
          {/* Animated glow halo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#ff007a] via-[#7928ca] to-[#0070f3] rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition duration-700 animate-pulse" />
          
          <img
            src="/brand/funflick-logo.png"
            alt={BRAND.name}
            className="relative w-36 h-36 rounded-3xl object-contain drop-shadow-2xl"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-2 max-w-xs"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-heading">
            fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
          </h1>
          <p className="text-sm font-semibold text-gray-300 tracking-wide">
            {BRAND.tagline}
          </p>
        </motion.div>
      </div>

      {/* Bottom CTA & Tagline (Screen 1 Bottom) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full space-y-4 max-w-xs text-center"
      >
        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-pink-500/30 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="pt-2 text-xs font-medium text-gray-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <span>Watch</span>
          <span>·</span>
          <span>Create</span>
          <span>·</span>
          <span>Follow</span>
          <span>·</span>
          <span>Earn</span>
        </div>
      </motion.div>
    </div>
  );
};
