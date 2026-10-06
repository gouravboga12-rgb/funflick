import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PUBLISHING_PLANS } from '../../data/mockData';
import { BottomNavigation } from '../../components/common/BottomNavigation';
import { CreatorPayoutDetailsModal } from '../../components/user/CreatorPayoutDetailsModal';
import { 
  ChevronLeft, 
  Crown, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Razorpay Client Key ID (Public Key ID for Checkout SDK; Secret Key is kept securely on server only)
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TjWqonuTX5VmT8';

export const SubscriptionScreen = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    recordSubscriptionPayment,
    showToast,
    publishingPlans = PUBLISHING_PLANS,
    fetchSubscriptionPlans
  } = useApp();

  useEffect(() => {
    if (fetchSubscriptionPlans) fetchSubscriptionPlans();
  }, []);

  const activePlans = (publishingPlans && publishingPlans.length > 0) ? publishingPlans : PUBLISHING_PLANS;
  const [selectedPlanId, setSelectedPlanId] = useState(() => activePlans[0]?.id || 'monthly');
  const [processing, setProcessing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const handlePurchase = (planToPurchase) => {
    const selectedPlan = planToPurchase || activePlans.find(p => p.id === selectedPlanId) || activePlans[0];
    if (!selectedPlan) return;

    setSelectedPlanId(selectedPlan.id);
    setProcessing(true);

    // Check if Razorpay Checkout SDK is loaded
    if (typeof window !== 'undefined' && window.Razorpay) {
      try {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: Math.round(Number(selectedPlan.price) * 100), // amount in paise
          currency: 'INR',
          name: 'FunFlick Entertainment',
          description: `${selectedPlan.name} (${selectedPlan.label || 'Influencer Subscription'})`,
          image: '/brand/funflick-logo.png',
          prefill: {
            name: currentUser?.name || 'Srilatha Reddy',
            email: currentUser?.email || 'funflick0308@gmail.com',
            contact: currentUser?.phone || '+919876543210'
          },
          notes: {
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            user_handle: currentUser?.username || 'user'
          },
          theme: {
            color: '#ff007a'
          },
          handler: function (response) {
            setProcessing(false);
            const paymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
            recordSubscriptionPayment({
              plan: selectedPlan,
              paymentId,
              paymentMethod: 'Razorpay Test (Captured)'
            });
            setShowPayoutModal(true);
            try {
              confetti({
                particleCount: 120,
                spread: 90,
                origin: { y: 0.5 }
              });
            } catch (e) {}
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              showToast('Payment window closed.', 'info');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setProcessing(false);
          showToast(`Payment failed: ${response.error?.description || 'Transaction cancelled'}`, 'error');
        });
        rzp.open();
      } catch (err) {
        console.error('Razorpay popup error:', err);
        // Fallback simulation
        triggerSimulatedSuccess(selectedPlan);
      }
    } else {
      // Fallback if Razorpay SDK script is blocked or offline
      triggerSimulatedSuccess(selectedPlan);
    }
  };

  const triggerSimulatedSuccess = (selectedPlan) => {
    setTimeout(() => {
      const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      recordSubscriptionPayment({
        plan: selectedPlan,
        paymentId: mockPaymentId,
        paymentMethod: 'Razorpay Test (Simulated)'
      });
      setProcessing(false);
      setShowPayoutModal(true);
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    }, 900);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#090514] min-h-full select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090514]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-300 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-white font-heading">
          Influencer Subscription
        </span>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
        
        {/* Hero Tagline */}
        <div className="text-center space-y-2 py-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-500/25">
            <Crown className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Upgrade to Influencer Status
          </h2>
          <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
            <span className="text-emerald-400 font-semibold">Uploading is 100% Free for everyone!</span> Subscribe to become an Influencer, unlock deep engagement analytics, and earn cash rewards from Admin.
          </p>
        </div>

        {/* Current Active Plan Badge if subscribed */}
        {currentUser.isInfluencer && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  ⭐ Influencer Active: {currentUser.subscriptionPlan || 'Monthly Influencer Pro'}
                </span>
                <span className="text-[10px] text-emerald-300">Eligible for Admin Performance Cash Rewards</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
              INFLUENCER
            </span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="space-y-3">
          {activePlans.filter(p => p.active !== false).map(plan => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-4 rounded-3xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-950/70 via-purple-950/70 to-[#1b1236] border-[#ff007a] shadow-xl shadow-pink-500/20'
                    : 'bg-[#150f2c] border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white shadow-md">
                    MOST POPULAR
                  </span>
                )}
                {plan.savings && !plan.popular && (
                  <span className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow">
                    {plan.savings}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#ff007a] bg-[#ff007a]' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white text-base font-heading">
                          {plan.name}
                        </h3>
                        <span className="text-[11px] text-pink-300">({plan.label})</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{plan.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-extrabold text-white font-heading">
                      {plan.formattedPrice}
                    </span>
                    <span className="text-[10px] text-gray-400 block">/{plan.period}</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Direct 1-Click Pay & Subscribe Button for this Plan */}
                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400">Total payable</span>
                    <span className="text-base font-extrabold text-white font-heading">
                      {plan.formattedPrice}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(plan);
                    }}
                    disabled={processing && selectedPlanId === plan.id}
                    className="py-2.5 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff4b2b] to-[#7928ca] text-white font-extrabold text-xs tracking-wide shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.97] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {processing && selectedPlanId === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Opening Razorpay...</span>
                      </div>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                        <span>Pay {plan.formattedPrice}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits breakdown */}
        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Why Creators Subscribe to FunFlick</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Instant Video & Reel Publishing</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Priority Viral Discover Placement</span>
            </div>
            <div className="flex items-start gap-2">
              <Award className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>Monetize with Fan Subscriptions</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Safe Admin Moderation & Payouts</span>
            </div>
          </div>
        </div>

        {/* Security & Instant Razorpay Checkout Guarantee */}
        <div className="p-4 rounded-3xl bg-[#140e2b]/80 border border-white/10 space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-[10px]">
              🔒 Secured by Razorpay
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Test Mode Enabled (Key: rzp_test_...5VmT8)</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Tap <strong>Pay</strong> on any plan above for instant activation via UPI (GPay, PhonePe, Paytm), Cards, or NetBanking.
          </p>
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Creator Payout & Bank Details Registration Modal */}
      <CreatorPayoutDetailsModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
      />
    </div>
  );
};
