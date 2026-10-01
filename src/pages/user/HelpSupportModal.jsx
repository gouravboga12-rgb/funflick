import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { 
  X, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  CheckCircle2,
  Send
} from 'lucide-react';

export const HelpSupportModal = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How do I become an Influencer / Creator?',
      a: 'Any FunFlick user can become an influencer. Go to your Profile and tap "Influencer Hub". Get a publishing subscription to unlock video uploading.'
    },
    {
      q: 'How do Admin Performance Rewards work?',
      a: 'When your videos reach high viewership and engagement, FunFlick Admin grants monetary bonuses sent directly to your wallet.'
    },
    {
      q: 'Why are videos in "Pending Admin Verification"?',
      a: 'FunFlick centrally verifies all creator uploads for platform guidelines. Once approved by Admin, they appear live on the public feed.'
    },
    {
      q: 'How can I withdraw my wallet balance?',
      a: 'Go to Profile > Wallet & Payouts, tap "Withdraw", select your bank or UPI, and funds are disbursed.'
    }
  ];

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    setSent(true);
    setTimeout(() => {
      showToast('Support ticket #FF-9482 created! Support team will respond via inbox.', 'success');
      setSent(false);
      setTicketSubject('');
      setTicketMessage('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-md bg-[#110b24] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-heading">
                Help & Support Center
              </h3>
              <p className="text-[10px] text-cyan-300">FunFlick Creator Care</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact info cards */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <Mail className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-white block">Email Desk</span>
            <span className="text-[10px] text-gray-400 block">support@funflick.tv</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white block">Helpline</span>
            <span className="text-[10px] text-gray-400 block">1800-FUN-FLICK</span>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Frequently Asked Questions
          </span>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5 group text-xs">
                <summary className="font-semibold text-white cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 ml-2" />
                </summary>
                <p className="text-[11px] text-gray-300 mt-2 leading-relaxed pt-2 border-t border-white/5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Quick Ticket form */}
        <form onSubmit={handleSubmitTicket} className="space-y-2.5 pt-2 border-t border-white/10">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Send Support Message
          </span>
          <input
            type="text"
            required
            placeholder="Issue or question title..."
            value={ticketSubject}
            onChange={e => setTicketSubject(e.target.value)}
            className="w-full bg-[#18122c] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500"
          />
          <textarea
            rows={2}
            required
            placeholder="Describe what you need help with..."
            value={ticketMessage}
            onChange={e => setTicketMessage(e.target.value)}
            className="w-full bg-[#18122c] text-white text-xs p-3 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={sent}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sent ? 'Submitting...' : 'Send to FunFlick Care'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
