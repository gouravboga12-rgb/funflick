import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, AlertCircle, Mail, CheckCircle2, ShieldAlert, Clock, HelpCircle } from 'lucide-react';

export const RefundPolicyScreen = () => {
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
          Cancellation & Refund Policy
        </span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 text-xs text-gray-300 leading-relaxed">
        
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-pink-950/40 via-purple-950/30 to-[#120d29] border border-pink-500/30 text-center space-y-2.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/30">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h1 className="text-base font-extrabold text-white font-heading">
            FunFlick Cancellation & Refund Policy
          </h1>
          <p className="text-[11px] text-gray-400">
            Effective Date: October 2026 · FunFlick Media & Entertainment Technologies Pvt. Ltd.
          </p>
        </div>

        {/* Core Non-Refundable Rule */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>General Policy: Non-Refundable Subscriptions</span>
          </div>
          <p className="text-[11px] text-gray-300">
            All purchases for FunFlick subscription plans (including Weekly Influencer, Monthly Influencer Pro, and Annual packages) are <strong className="text-white">strictly non-refundable</strong>. Once paid and processed, subscription fees cannot be refunded, exchanged, or transferred to another account under normal circumstances.
          </p>
        </div>

        {/* Sole Eligibility Exception */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Eligible Exception: Payment Successful but Account Access Failed</span>
          </div>
          <p className="text-[11px] text-gray-300">
            A refund will <strong className="text-emerald-300">only</strong> be evaluated and initiated in the specific case where a customer has successfully completed the payment transaction, but experienced a verified technical failure that completely prevented them from accessing or activating their account/subscription benefits.
          </p>
        </div>

        {/* Step-by-Step Claim Process */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            <span>How to Claim a Refund</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            If you were charged but unable to access your subscription or account, you must contact our official support desk via email within <strong className="text-white">48 hours</strong> of the transaction:
          </p>
          <div className="bg-[#150e2b] p-3 rounded-xl border border-white/10 space-y-1.5 text-[11px]">
            <p className="text-gray-400">Please send an email with the subject <span className="text-pink-300">"Refund Request - Account Access Issue"</span> including:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Your registered FunFlick Username (<span className="text-pink-400">@username</span>)</li>
              <li>Registered Email Address & Mobile Number</li>
              <li>Payment Transaction ID / Order ID / Receipt Screenshot</li>
              <li>Detailed description or screenshot of the access failure</li>
            </ul>
          </div>
        </div>

        {/* Contact Email Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-purple-500/30 space-y-3">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
            <Mail className="w-4 h-4 shrink-0" />
            <span>Official Refund Contact Desk</span>
          </div>
          <p className="text-[11px] text-gray-300">
            All refund disputes and inquiries are evaluated directly by the FunFlick Administration Team:
          </p>
          <a 
            href="mailto:funflick0308@gmail.com?subject=FunFlick%20Refund%20Concern" 
            className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-pink-500/30 transition text-pink-300 font-mono text-xs font-bold"
          >
            <span>funflick0308@gmail.com</span>
            <span className="text-[10px] text-white/70 font-sans font-normal underline">Send Email &rarr;</span>
          </a>
        </div>

        {/* Evaluation and Payout Mode */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Evaluation & Settlement Mode</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            Upon receipt of your concern, the Admin team will audit the system transaction logs. If the technical failure is validated, the refund will be approved and initiated to your original payment method or through verified online/offline bank transfer within 5 to 7 working days.
          </p>
        </div>

        {/* Cancellation of Subscriptions */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Subscription Auto-Renewals & Cancellation</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            FunFlick subscriptions do not lock you into involuntary long-term contracts. You may choose not to renew upon plan expiry. Cancellation prior to expiry will not entitle the user to a prorated refund of any remaining days.
          </p>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 pb-6 text-[10px] text-gray-500">
          FunFlick Media & Entertainment Technologies Pvt. Ltd. · India<br />
          Official Support: funflick0308@gmail.com
        </div>

      </div>
    </div>
  );
};
