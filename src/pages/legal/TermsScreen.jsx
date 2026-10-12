import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, CheckCircle2, ShieldAlert, Award, UserCheck, AlertTriangle } from 'lucide-react';

export const TermsScreen = () => {
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
          Terms & Conditions
        </span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 text-xs text-gray-300 leading-relaxed">
        
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-purple-950/40 via-pink-950/30 to-[#120d29] border border-purple-500/30 text-center space-y-2.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-base font-extrabold text-white font-heading">
            FunFlick Platform Terms of Service
          </h1>
          <p className="text-[11px] text-gray-400">
            Last Updated: October 2026 · FunFlick Media & Entertainment Technologies Pvt. Ltd.
          </p>
        </div>

        {/* Section 1: Acceptance */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
            <span>1. Acceptance of Terms</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            By downloading, accessing, or using the FunFlick mobile application or website (accessible at <span className="text-pink-300">funflick-theta.vercel.app</span>), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please refrain from using the platform.
          </p>
        </div>

        {/* Section 2: Eligibility & Registration */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>2. Account Eligibility & Security</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            Users must be at least 13 years of age. You agree to provide accurate, up-to-date registration information. You are solely responsible for maintaining the confidentiality of your account password and all activities conducted through your credentials.
          </p>
        </div>

        {/* Section 3: User Content & Intellectual Property */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>3. Content Ownership & Licensing</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            Creators retain complete intellectual property ownership over original comedy videos, reels, and photos uploaded to FunFlick. By uploading, you grant FunFlick a non-exclusive, worldwide, royalty-free license to host, display, transcode, and stream your content across platform feeds and promotional channels.
          </p>
        </div>

        {/* Section 4: Prohibited Activities */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
          <h2 className="text-xs font-bold text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>4. Community Standards & Prohibited Conduct</span>
          </h2>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
            <li>No posting of sexually explicit, abusive, harassing, or defamatory materials.</li>
            <li>No copyright infringement, pirated movies, or uncredited intellectual property.</li>
            <li>No automated bots, scrapers, view manipulation, or fake engagement tools.</li>
            <li>No fraudulent ad campaigns or malicious software distribution.</li>
          </ul>
          <p className="text-[10px] text-rose-300/80 pt-1">
            Violations will lead to immediate content takedown, account suspension, or permanent banning.
          </p>
        </div>

        {/* Section 5: Monetization & Subscriptions */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>5. Subscriptions, Payouts & Refunds</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            Subscription plans (Weekly Influencer, Monthly Influencer Pro) unlock exclusive platform badges, monetization capabilities, and promotional reach. All subscriptions are strictly subject to our <span className="text-pink-400 underline cursor-pointer" onClick={() => navigate('/refund')}>Cancellation & Refund Policy</span>. Payouts are verified by Admin against organic views and community guideline adherence.
          </p>
        </div>

        {/* Section 6: Account Termination */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <span>6. Account Termination</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            FunFlick reserves the right to suspend or permanently delete any user account that breaches these terms or endangers community safety. Users may also request voluntary account deletion at any time.
          </p>
        </div>

        {/* Contact Info */}
        <div className="p-4 rounded-2xl bg-[#150e2b] border border-white/10 text-center space-y-1.5">
          <p className="text-[11px] text-gray-300">Questions about our Terms & Conditions?</p>
          <a href="mailto:funflick0308@gmail.com" className="text-xs text-pink-400 font-bold underline font-mono">
            funflick0308@gmail.com
          </a>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-6 text-[10px] text-gray-500">
          FunFlick Media & Entertainment Technologies Pvt. Ltd. · India
        </div>

      </div>
    </div>
  );
};
