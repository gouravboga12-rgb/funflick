import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Sparkles, Heart, Video, Trophy, Users } from 'lucide-react';

export const AboutScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#090514] text-white flex flex-col font-sans select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-white/10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 -ml-1 text-gray-300 hover:text-white transition cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          About FunFlick
        </span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 text-xs text-gray-300 leading-relaxed">
        
        {/* Hero Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-tr from-[#ff007a]/20 via-[#7928ca]/20 to-[#0070f3]/20 border border-pink-500/30 text-center space-y-3 shadow-xl">
          <img
            src="/brand/funflick-logo.png"
            alt="FunFlick"
            className="w-20 h-20 rounded-2xl mx-auto object-contain drop-shadow-xl"
          />
          <h1 className="text-lg font-extrabold text-white font-heading">
            fun<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca]">flick</span>
          </h1>
          <p className="text-xs text-pink-300 font-semibold">
            Comedy. Entertainment. Always On!
          </p>
          <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
            India's premier video-sharing and creator empowerment social network, connecting millions with top-tier humor, viral reels, and creator rewards.
          </p>
        </div>

        {/* Mission Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Our Mission</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            FunFlick was created to democratize short-form comedy and viral entertainment. We believe in providing every creator a fair stage with organic reach, instant video streaming, and transparent cash rewards for high-quality engagement.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-center">
            <Video className="w-5 h-5 text-pink-400 mx-auto" />
            <span className="text-xs font-bold text-white block">100% Free Uploads</span>
            <p className="text-[10px] text-gray-400">Upload unlimited comedy reels, videos & stories for free.</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto" />
            <span className="text-xs font-bold text-white block">Creator Rewards</span>
            <p className="text-[10px] text-gray-400">Influencer Pro members earn cash rewards for genuine views.</p>
          </div>
        </div>

        {/* Company Details */}
        <div className="p-4 rounded-2xl bg-[#150e2b] border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Corporate Identity</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            <strong className="text-white">FunFlick Media & Entertainment Technologies Pvt. Ltd.</strong><br />
            Incorporated in India 🇮🇳<br />
            Official Support: <span className="text-pink-300 font-mono">funflick0308@gmail.com</span>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-6 text-[10px] text-gray-500">
          FunFlick Platform v2.4.0 · Always On Entertainment
        </div>

      </div>
    </div>
  );
};
