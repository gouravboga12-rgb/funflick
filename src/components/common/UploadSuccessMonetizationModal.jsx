import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Heart, 
  ArrowRight, 
  ExternalLink,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const UploadSuccessMonetizationModal = ({ 
  item, 
  type = 'Reel', 
  onClose 
}) => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  React.useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#120b29] border border-pink-500/40 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Icon */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Success Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white font-heading">
            {type} Submitted for Review!
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Your {type.toLowerCase()} <span className="text-pink-300 font-bold">"{item.title || 'Submission'}"</span> is safely submitted for Central Admin Verification.
          </p>
        </div>

        {/* IMPORTANT PROMINENT POP MESSAGE: HIGHLIGHT HIGH VIEWS/LIKES = PAYMENTS */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-pink-500/15 to-purple-950/40 border border-amber-500/40 text-left space-y-2.5 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white shrink-0 shadow">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white block font-heading">
                Earn Direct Payments From FunFlick! 💰
              </span>
              <span className="text-[10px] text-amber-300 font-semibold">
                High Views & Likes = Monetary Cash Rewards
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-200 leading-relaxed">
            FunFlick rewards viral content! If your media generates <strong className="text-white">high views, likes & engagement</strong>, central admin awards <strong className="text-emerald-400">cash payments directly to your wallet</strong>.
          </p>

          <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>High Views</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Viral Likes</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>₹ Admin Payouts</span>
            </div>
          </div>

          <div className="pt-0.5 border-t border-white/10 text-[10px] text-pink-200 leading-normal">
            ⭐ <strong>Subscribe to an Influencer Plan</strong> to activate deep 8-factor analytics (Views, Likes, Comments, Shares, Saves, Performance) & become eligible for reward payouts!
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2 pt-1">
          {!currentUser?.isInfluencer ? (
            <button
              onClick={() => {
                if (onClose) onClose();
                navigate('/subscription');
              }}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition active:scale-95 animate-pulse"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Subscribe & Unlock Creator Payments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <span>⭐</span>
              <span>Influencer Pass Active: Content is Monetization Eligible!</span>
            </div>
          )}


          <button
            onClick={() => {
              if (onClose) onClose();
              navigate('/my-content');
            }}
            className="w-full py-2 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200 text-xs transition"
          >
            Go to My Content Library
          </button>
        </div>

      </div>
    </div>
  );
};
