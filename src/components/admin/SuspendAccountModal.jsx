import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Calendar, Clock, Loader2, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SuspendAccountModal = ({ isOpen, onClose, user, onSuspendSuccess }) => {
  const { showToast } = useApp();
  const [duration, setDuration] = useState('7d'); // '1d' | '3d' | '7d' | '30d' | 'custom' | 'permanent'
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('Violation of FunFlick community safety guidelines');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  // Compute calculated end date
  const computeEndDate = () => {
    const now = new Date();
    if (duration === '1d') return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    if (duration === '3d') return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (duration === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (duration === '30d') return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (duration === 'custom' && customDate) return new Date(customDate);
    return null; // permanent
  };

  const endDate = computeEndDate();
  const endDateFormatted = endDate 
    ? endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Permanent (Until manually lifted by Admin)';

  const handleConfirmSuspend = async (e) => {
    e.preventDefault();
    if (duration === 'custom' && !customDate) {
      showToast('Please select a custom suspension end date', 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token');

    try {
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          duration,
          customUntil: duration === 'custom' ? new Date(customDate).toISOString() : null,
          reason: reason.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `Account @${user.username} suspended`, 'success');
        if (onSuspendSuccess) onSuspendSuccess(data.user || data);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to suspend account', 'error');
      }
    } catch (err) {
      console.error('Suspension error:', err);
      showToast('Server communication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#130b29] border border-rose-500/30 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-950/60 to-[#180e35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-heading">
                Suspend User Account
              </h3>
              <p className="text-xs text-rose-300">
                Configure suspension duration and safety restrictions
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirmSuspend} className="p-5 overflow-y-auto no-scrollbar space-y-4 text-xs">
          {/* Target User Info */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <img 
              src={user.avatar || '/brand/default-avatar.svg'} 
              alt={user.name} 
              className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm truncate">{user.name}</span>
                <span className="text-[10px] text-pink-400">@{user.username}</span>
              </div>
              <span className="text-gray-400 text-[11px] block truncate">{user.email || 'No email on file'}</span>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-gray-300 font-bold mb-2">
              Select Suspension Duration:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: '1d', label: '1 Day', sub: '24 Hours' },
                { id: '3d', label: '3 Days', sub: '72 Hours' },
                { id: '7d', label: '7 Days', sub: '1 Week' },
                { id: '30d', label: '30 Days', sub: '1 Month' },
                { id: 'custom', label: 'Custom', sub: 'Pick Date' },
                { id: 'permanent', label: 'Permanent', sub: 'Indefinite' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDuration(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    duration === opt.id
                      ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{opt.label}</span>
                    {duration === opt.id && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input (if selected) */}
          {duration === 'custom' && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <label className="block text-gray-300 font-bold text-[11px]">
                Choose End Date & Time:
              </label>
              <input 
                type="datetime-local" 
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-[#1b1038] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          )}

          {/* Timeline Summary Box */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Suspension Starts:</span>
              </span>
              <strong className="text-white">Immediately (Now)</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>Automatically Restores:</span>
              </span>
              <strong className="text-rose-300">{endDateFormatted}</strong>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">
              Suspension Reason (Logged to Audit & Sent to User):
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter suspension reason..."
              className="w-full bg-[#1b1038] text-white text-xs p-3 rounded-2xl border border-white/15 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Warning Note */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <p>
              When suspended, the user cannot log in, post videos, upload stories, or interact. The database will automatically lift temporary suspensions when the duration expires.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Suspending...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confirm Suspension</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
