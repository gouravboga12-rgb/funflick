import React, { useState, useEffect } from 'react';
import { X, Building2, Smartphone, Mail, CreditCard, CheckCircle2, ShieldCheck, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';

export const CreatorPayoutDetailsModal = ({ isOpen, onClose, onSaved, isFreePlanActivation = false }) => {
  const { currentUser, loginUser, showToast } = useApp();
  
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadExistingDetails();
    }
  }, [isOpen]);

  const loadExistingDetails = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    try {
      const res = await fetch('/api/payouts/details', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const d = data.payoutDetails;
        if (d) {
          setPhone(d.phone || currentUser?.phone || '');
          setEmail(d.email || currentUser?.email || '');
          setBankName(d.bank_name || '');
          setAccountNumber(d.account_number || '');
          setConfirmAccountNumber(d.account_number || '');
          setIfscCode(d.ifsc_code || '');
          setUpiId(d.upi_id || '');
        } else {
          setPhone(currentUser?.phone || '');
          setEmail(currentUser?.email || '');
        }
      }
    } catch (err) {
      console.warn('Could not load payout details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone.trim()) {
      setErrorMsg('Registered contact phone number is required');
      return;
    }

    const hasBank = Boolean(accountNumber.trim() && ifscCode.trim());
    const hasUpi = Boolean(upiId.trim());

    if (!hasBank && !hasUpi) {
      setErrorMsg('Please enter at least one payout method: PhonePe UPI ID OR Bank Account details (or both).');
      return;
    }

    if (hasUpi && !upiId.includes('@')) {
      setErrorMsg('Please enter a valid PhonePe / UPI ID containing "@" (e.g. 9876543210@ybl or name@upi)');
      return;
    }

    if (hasBank) {
      if (!bankName.trim()) {
        setErrorMsg('Please enter Bank Name');
        return;
      }
      if (accountNumber.trim().length < 8) {
        setErrorMsg('Please enter a valid Bank Account Number (minimum 8 digits)');
        return;
      }
      if (confirmAccountNumber.trim() && accountNumber.trim() !== confirmAccountNumber.trim()) {
        setErrorMsg('Bank Account Numbers do not match');
        return;
      }
      if (ifscCode.trim().length !== 11) {
        setErrorMsg('Please enter an 11-character valid IFSC code (e.g. SBIN0001234 or HDFC0001234)');
        return;
      }
    }

    setIsSaving(true);
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');

    try {
      const res = await fetch('/api/payouts/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim().toUpperCase(),
          upi_id: upiId.trim().toLowerCase(),
          phone: phone.trim(),
          email: email.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save payout details');
      }

      // Also activate Free Influencer subscription
      await fetch('/api/subscriptions/activate-free', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => {});

      if (loginUser && currentUser) {
        loginUser({
          ...currentUser,
          isInfluencer: true,
          is_influencer: true,
          hasPayoutDetails: true,
          has_payout_details: true,
          subscriptionPlan: currentUser.subscriptionPlan || 'Free Influencer Pass'
        });
      }

      showToast('🎉 Payout details saved & Free Influencer Pass activated!', 'success');
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save payout details');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#120a26] border border-pink-500/30 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slide-up">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#170e30] via-[#1c1038] to-[#170e30]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white shadow-md shadow-pink-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white font-heading">
                {isFreePlanActivation ? 'Activate Free Creator Pass' : 'Creator Payout Details'}
              </h3>
              <p className="text-[10px] text-pink-300">
                Receive cash rewards from Admin on your video views & likes
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guidance Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-purple-950/50 via-pink-950/40 to-purple-950/50 border-b border-pink-500/20 text-[11px] text-pink-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Enter your <strong>PhonePe UPI ID</strong>, your <strong>Bank Account</strong>, or both. At least one method is required so the admin can transfer your video cash earnings.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mb-2" />
              <span>Loading saved details...</span>
            </div>
          ) : (
            <>
              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                    <span>Contact Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#181033] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-pink-400" />
                    <span>Email ID</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-[#181033] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Section 1: PhonePe / UPI */}
              <div className="p-3.5 rounded-2xl bg-[#160f2e] border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <span>Option 1: PhonePe / Google Pay / UPI ID</span>
                  </label>
                  <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Instant Transfer
                  </span>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@ybl or yourname@oksbi"
                  className="w-full bg-[#0d071e] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-gray-400">
                  Accepts PhonePe, Google Pay, Paytm, BHIM, or any UPI VPA.
                </p>
              </div>

              {/* Visual Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  OR Bank Account (Or Both)
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Section 2: Bank Account Details */}
              <div className="p-3.5 rounded-2xl bg-[#160f2e] border border-pink-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Building2 className="w-4 h-4 text-pink-400" />
                    <span>Option 2: Direct Bank Account Transfer</span>
                  </label>
                  <span className="text-[10px] text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full font-semibold">
                    IMPS / NEFT
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC Bank, ICICI"
                    className="w-full bg-[#0d071e] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full bg-[#0d071e] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Confirm Account Number</label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={e => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter Account Number"
                      className="w-full bg-[#0d071e] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300">IFSC Code (11 digits)</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234 or HDFC0001234"
                    className="w-full bg-[#0d071e] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Payout Details...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFreePlanActivation ? 'Activate Free Pass & Save Details' : 'Save Payout Details'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
