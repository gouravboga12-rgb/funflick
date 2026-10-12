import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Heart } from 'lucide-react';

export const GuidelinesScreen = () => {
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
          Community Guidelines
        </span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 text-xs text-gray-300 leading-relaxed">
        
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-pink-950/40 via-purple-950/30 to-[#120d29] border border-pink-500/30 text-center space-y-2.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-base font-extrabold text-white font-heading">
            FunFlick Community Guidelines
          </h1>
          <p className="text-[11px] text-gray-400">
            Keeping FunFlick Safe, Fun & Inspiring for Everyone
          </p>
        </div>

        {/* What We Encourage */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>What We Encourage</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
            <li>Original comedy sketches, standup clips, and funny daily observations.</li>
            <li>Respectful interactions, positive comments, and constructive feedback.</li>
            <li>Crediting original creators, sound producers, and music artists.</li>
            <li>Supporting budding creators with genuine likes, shares, and follows.</li>
          </ul>
        </div>

        {/* What We Do Not Tolerate */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Zero Tolerance Violations</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
            <li><strong className="text-white">Harassment & Bullying:</strong> Targeted abuse, hate speech, or discrimination based on race, religion, gender, or orientation.</li>
            <li><strong className="text-white">Adult Content:</strong> Nudity, sexually suggestive materials, or graphic violence.</li>
            <li><strong className="text-white">Copyright Piracy:</strong> Uploading movies, TV shows, or uncredited third-party media.</li>
            <li><strong className="text-white">Fake Views & Engagement:</strong> Artificial bot traffic, spam comments, or fraudulent monetization attempts.</li>
          </ul>
        </div>

        {/* Reporting */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Reporting Content & Users</span>
          </div>
          <p className="text-[11px] text-gray-300">
            If you encounter content that violates our guidelines, tap the menu on the reel or post and select "Report Content". Our 24/7 moderation team reviews all reports promptly.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-6 text-[10px] text-gray-500">
          FunFlick Media & Entertainment Technologies Pvt. Ltd. · India<br />
          Contact Moderation: funflick0308@gmail.com
        </div>

      </div>
    </div>
  );
};
