import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Lock, Eye, Database, Bell, UserX } from 'lucide-react';

export const PrivacyPolicyScreen = () => {
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
          Privacy Policy
        </span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 text-xs text-gray-300 leading-relaxed">
        
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-cyan-950/40 via-purple-950/30 to-[#120d29] border border-cyan-500/30 text-center space-y-2.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00c6ff] via-[#0072ff] to-[#7928ca] flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-base font-extrabold text-white font-heading">
            FunFlick Privacy & Data Policy
          </h1>
          <p className="text-[11px] text-gray-400">
            Last Updated: October 2026 · FunFlick Media & Entertainment Technologies Pvt. Ltd.
          </p>
        </div>

        {/* Section 1: Information Collected */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-pink-400 shrink-0" />
            <span>1. Information We Collect</span>
          </h2>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
            <li><strong className="text-white">Profile Data:</strong> Name, username, email address, phone number, and avatar image.</li>
            <li><strong className="text-white">Content Data:</strong> Videos, reels, stories, captions, comments, and direct messages you upload.</li>
            <li><strong className="text-white">Device & Usage:</strong> Log info, IP address, device model, viewing history, and interaction analytics.</li>
            <li><strong className="text-white">Transaction Logs:</strong> Subscription status and payment references (processed via secure PCI-compliant gateways; FunFlick never stores full payment card details).</li>
          </ul>
        </div>

        {/* Section 2: How We Use Information */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>2. How We Use Your Data</span>
          </h2>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
            <li>To deliver, personalize, and optimize your video feed and comedy discovery algorithms.</li>
            <li>To manage subscriptions, influencer payouts, and creator reward programs.</li>
            <li>To protect platform safety, detect fraud, and enforce community standards.</li>
            <li>To send essential transactional notifications and system alerts.</li>
          </ul>
        </div>

        {/* Section 3: Data Security */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>3. Cloud Storage & Security</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            All user media and credentials are secured using industry-standard AES-256 cloud encryption on Amazon Web Services (AWS S3) and secure database authentication protocols. Password data is hashed with bcrypt and never stored in plain text.
          </p>
        </div>

        {/* Section 4: Data Sharing */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span>4. Third-Party Sharing & Disclosure</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            We do <strong className="text-white">not sell</strong> your personal data to advertisers or third parties. We only share information when required by applicable law, or with trusted infrastructure service providers (e.g., AWS, payment aggregators) under strict confidentiality obligations.
          </p>
        </div>

        {/* Section 5: User Rights & Data Deletion */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-400 shrink-0" />
            <span>5. Your Rights & Permanent Account Deletion</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            You retain the right to edit your profile, block unwanted users, or request the permanent deletion of your account and all associated videos, stories, and data. You can delete your account via Profile Settings or by emailing <span className="text-pink-300 font-mono">funflick0308@gmail.com</span>.
          </p>
        </div>

        {/* Contact Info */}
        <div className="p-4 rounded-2xl bg-[#150e2b] border border-white/10 text-center space-y-1.5">
          <p className="text-[11px] text-gray-300">Privacy queries or data concerns?</p>
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
