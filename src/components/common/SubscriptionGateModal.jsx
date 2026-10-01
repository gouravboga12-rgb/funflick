import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PUBLISHING_PLANS } from '../../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, ShieldAlert, ArrowRight, Zap, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SubscriptionGateModal = () => {
  const { 
    subscriptionGateModalOpen, 
    setSubscriptionGateModalOpen, 
    purchasePublishingSubscription,
    publishingPlans = PUBLISHING_PLANS
  } = useApp();

  const activePlans = (publishingPlans && publishingPlans.length > 0) ? publishingPlans : PUBLISHING_PLANS;
  const [selectedPlanId, setSelectedPlanId] = useState(() => activePlans[0]?.id || 'monthly');
  const [processing, setProcessing] = useState(false);

  if (!subscriptionGateModalOpen) return null;

  const handleSubscribe = () => {
    setProcessing(true);
    setTimeout(() => {
      purchasePublishingSubscription(selectedPlanId);
      setProcessing(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-md bg-[#110c24] border border-pink-500/30 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl shadow-pink-500/10 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Unlock FunFlick Publishing
              </h2>
              <p className="text-[11px] text-pink-300">Creator Monetization Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSubscriptionGateModalOpen(false)}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice explaining the business rule */}
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-purple-950/40 border border-pink-500/25 flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-200 leading-relaxed">
            <strong className="text-white">Publishing requires a subscription.</strong> Browsing and enjoying content is free, but creators need an active plan to publish posts, reels & stories.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="mt-4 space-y-2.5">
          {activePlans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-950/60 to-purple-950/60 border-[#ff007a] shadow-lg shadow-pink-500/15'
                    : 'bg-[#18122f]/80 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white shadow-md">
                    MOST POPULAR
                  </span>
                )}
                {plan.savings && !plan.popular && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                    {plan.savings}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected ? 'border-[#ff007a] bg-[#ff007a]' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-heading">{plan.name}</span>
                        <span className="text-[11px] text-gray-400">({plan.label})</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{plan.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-white font-heading">{plan.formattedPrice}</span>
                    <span className="text-[10px] text-gray-400 block">/{plan.period}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits list */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
          <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2">
            Included with Publishing Pass:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unlimited video & reels</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>24h Stories with music</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Creator Studio Analytics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct fan subscriptions</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-5">
          <button
            onClick={handleSubscribe}
            disabled={processing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Secure Payment...</span>
              </div>
            ) : (
              <>
                <span>Unlock Publishing Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            Instant simulated activation · Demo mode allows testing immediately
          </p>
        </div>
      </motion.div>
    </div>
  );
};
