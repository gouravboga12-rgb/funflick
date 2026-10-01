import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CREATOR_SUBSCRIPTION_PLANS, CREATOR_BENEFITS } from '../../data/mockData';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Crown, 
  Zap, 
  Film, 
  Radio, 
  MessageCircle, 
  Star, 
  Check, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreatorSubscriptionModal = ({ creator, isOpen, onClose }) => {
  const { subscribeToCreator } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState('creator_monthly');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !creator) return null;

  const handleSubscribe = () => {
    setProcessing(true);
    setTimeout(() => {
      subscribeToCreator(creator.username, selectedPlanId);
      setProcessing(false);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      onClose();
    }, 700);
  };

  const getBenefitIcon = (iconName) => {
    switch (iconName) {
      case 'Crown': return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-pink-400" />;
      case 'Film': return <Film className="w-4 h-4 text-purple-400" />;
      case 'Radio': return <Radio className="w-4 h-4 text-rose-400" />;
      case 'MessageCircle': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'Star': return <Star className="w-4 h-4 text-yellow-400" />;
      default: return <Crown className="w-4 h-4 text-pink-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-md bg-[#110c24] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-1 -ml-1 text-gray-300 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-sm font-bold text-white font-heading">
            Subscribe to Creator
          </h2>
          <div className="w-6" />
        </div>

        {/* Creator Identity Card (Screen 7 top) */}
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-xl"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 flex items-center justify-center text-black text-xs font-bold shadow">
              👑
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5">
            <h3 className="font-extrabold text-base text-white font-heading">
              {creator.username}
            </h3>
            {creator.isVerified && (
              <span className="w-4 h-4 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-[10px] font-bold">
                ✓
              </span>
            )}
          </div>

          <span className="text-xs text-gray-400">
            {creator.stats?.followers || '2.1M'} Followers
          </span>

          {/* Category tags */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {(creator.tags || ['Comedy', 'Lifestyle', 'Entertainment']).map(tag => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Choose a Plan Section */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-2.5">
            Choose a Plan
          </h4>

          <div className="grid grid-cols-3 gap-2">
            {CREATOR_SUBSCRIPTION_PLANS.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-pink-950/60 to-purple-950/60 border-[#ff007a] shadow-lg shadow-pink-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-white whitespace-nowrap shadow-sm">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <span className="text-[11px] font-bold text-gray-300 block">{plan.name}</span>
                    <div className="font-extrabold text-white text-sm font-heading mt-1">
                      {plan.formattedPrice.split('/')[0]}
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-400 mt-2 block">
                    {plan.note}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscriber Benefits */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-2.5">
            Subscriber Benefits
          </h4>

          <div className="space-y-2">
            {CREATOR_BENEFITS.map(benefit => (
              <div
                key={benefit.title}
                className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {getBenefitIcon(benefit.icon)}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white leading-none font-heading">
                    {benefit.title}
                  </h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-5 pt-2">
          <button
            onClick={handleSubscribe}
            disabled={processing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <span>Subscribing...</span>
            ) : (
              <>
                <span>Subscribe Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant simulated unlock · Cancel anytime in Profile</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
