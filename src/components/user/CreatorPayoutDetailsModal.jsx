import React, { useState, useEffect } from 'react';
import { X, Building2, Smartphone, Mail, CreditCard, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreatorPayoutDetailsModal = ({ isOpen, onClose, onSaved }) => {
  const { currentUser, showToast } = useApp();
  
  const [payoutMethod, setPayoutMethod] = useState('bank'); // 'bank' | 'upi'
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
          setPayoutMethod(d.payout_method || 'bank');
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
      setErrorMsg('Registered phone number is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Valid email address is required');
      return;
    }

    if (payoutMethod === 'bank') {
      if (!bankName.trim()) {
        setErrorMsg('Please enter Bank Name');
        return;
      }
      if (!accountNumber.trim() || accountNumber.length < 8) {
        setErrorMsg('Please enter a valid Bank Account Number (min 8 digits)');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        setErrorMsg('Bank Account Numbers do not match');
        return;
      }
      if (!ifscCode.trim() || ifscCode.trim().length !== 11) {
        setErrorMsg('Please enter an 11-character valid IFSC code (e.g. HDFC0001234)');
        return;
      }
    } else {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMsg('Please enter a valid UPI ID (e.g. yourname@oksbi or mobile@upi)');
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
          payout_method: payoutMethod,
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim().toUpperCase(),
          upi_id: upiId.trim(),
          phone: phone.trim(),
          email: email.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save payout details');
      }

      showToast('✅ Creator payout details saved securely in database!', 'success');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#120a26] border border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#170e30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white font-heading">
                Creator Payout Details
              </h3>
              <p className="text-[10px] text-pink-300">
                For Influencer Performance & View Payouts
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice for close/skip */}
        <div className="px-4 py-2 bg-pink-950/40 border-b border-pink-500/20 flex items-center gap-2 text-[11px] text-pink-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>If you close this now, you can update it anytime in Profile Settings. If not entered, admins will use your registered phone & email.</span>
        </div>

        {/* Method Selector Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2">
          <button
            type="button"
            onClick={() => { setPayoutMethod('bank'); setErrorMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              payoutMethod === 'bank'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setPayoutMethod('upi'); setErrorMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              payoutMethod === 'upi'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>UPI ID</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5 text-xs">
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
              {/* Contact details (common) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                  <span>Phone Number (for payment alerts)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-pink-400" />
                  <span>Email ID (for payment receipts)</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                />
              </div>

              {payoutMethod === 'bank' ? (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-pink-400" />
                      <span>Bank Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-pink-400" />
                      <span>Bank Account Number</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono tracking-wider"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-300">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={confirmAccountNumber}
                      onChange={e => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter Account Number"
                      className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono tracking-wider"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-300">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={ifscCode}
                      onChange={e => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0000123"
                      className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono uppercase"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                    <span>UPI ID / VPA</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                    className="w-full bg-[#181033] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono"
                  />
                  <span className="text-[10px] text-gray-400 block pt-1">
                    Supported: Google Pay, PhonePe, Paytm, BHIM, and all bank UPI handles.
                  </span>
                </div>
              )}

              {/* Security info */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] text-gray-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  FunFlick stores your payout information securely in the database. Payouts are reviewed and manually transferred by admin per view/like performance milestones.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Payout Details</span>
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
