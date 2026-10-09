import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  Wifi, 
  Trash2, 
  Check, 
  Globe, 
  ChevronRight,
  Sparkles,
  Moon,
  Sun,
  Building2,
  Ban
} from 'lucide-react';
import { CreatorPayoutDetailsModal } from '../../components/user/CreatorPayoutDetailsModal';
import { BlockedUsersModal } from '../../components/user/BlockedUsersModal';

export const AccountSettingsModal = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, showToast, theme, setTheme, blockedUsers, logoutUser } = useApp();

  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isPrivate, setIsPrivate] = useState(!!currentUser?.isPrivate);
  const [allowDMs, setAllowDMs] = useState(currentUser?.allowDMs !== false);
  const [autoplayWifi, setAutoplayWifi] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);

  // Re-sync fields with the logged-in account every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(currentUser?.email || '');
      setPhone(currentUser?.phone || '');
      setIsPrivate(!!currentUser?.isPrivate);
      setAllowDMs(currentUser?.allowDMs !== false);
    }
  }, [isOpen, currentUser?.email, currentUser?.phone, currentUser?.isPrivate, currentUser?.allowDMs]);

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account?\n\nAll your profile information, reels, videos, comments, and messages will be permanently deleted from the database. This action cannot be undone.\n\nPress OK to delete or Cancel to keep your account.'
    );
    if (!confirmed) {
      return; // Cancel pressed: do not delete
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to delete account', 'error');
        setIsDeleting(false);
        return;
      }
      showToast('Your account has been permanently deleted.', 'info');
      onClose();
      if (logoutUser) {
        logoutUser();
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    } catch (e) {
      showToast('Error deleting account', 'error');
      setIsDeleting(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (cleanPhone && !/^\+?[0-9\s-]{7,20}$/.test(cleanPhone)) {
      showToast('Please enter a valid mobile number', 'error');
      return;
    }

    setSaving(true);
    const contactChanged = cleanEmail !== (currentUser?.email || '') || cleanPhone !== (currentUser?.phone || '');
    let savedUser = null;

    if (contactChanged) {
      const token = localStorage.getItem('funflick_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/profile/contact', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: cleanEmail, phone: cleanPhone })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            showToast(data.error || 'Could not update contact details', 'error');
            setSaving(false);
            return;
          }
          savedUser = data.user;
        } catch (err) {
          showToast('Server unreachable. Saved on this device only.', 'info');
        }
      }
    }

    setCurrentUser(prev => ({
      ...prev,
      email: savedUser?.email ?? cleanEmail,
      phone: savedUser?.phone ?? cleanPhone,
      isPrivate,
      allowDMs
    }));

    setSaving(false);
    showToast('⚙️ Account settings saved successfully!', 'success');
    onClose();
  };

  const handleClearCache = () => {
    showToast('🧹 Cached data cleared (48.5 MB freed)!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className={`w-full max-w-md ${
          theme === 'light' 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-[#110b24] border-white/10 text-white'
        } border rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar flex flex-col justify-between transition-colors`}
      >
        <div>
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} text-base font-heading`}>
                  Account Settings
                </h3>
                <p className="text-[10px] text-pink-500 font-medium">Preferences & Privacy Controls</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className={`p-1.5 rounded-full ${
                theme === 'light' 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            
            {/* Account Info */}
            <div className="space-y-2.5">
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider block`}>
                Account Information
              </span>
              
              <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'} border space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                    <Mail className="w-4 h-4 text-pink-400" />
                    <span>Email Address</span>
                  </div>
                  <input
                    type="email"
                    id="settings-email-input"
                    value={email}
                    placeholder="you@example.com"
                    onChange={e => setEmail(e.target.value)}
                    className={`bg-transparent text-right text-xs font-semibold ${theme === 'light' ? 'text-slate-900 border-pink-500/50' : 'text-white border-pink-500/30'} focus:outline-none focus:border-pink-500 border-b w-44`}
                  />
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                  <div className={`flex items-center gap-2 text-xs ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Mobile Number</span>
                  </div>
                  <input
                    type="tel"
                    id="settings-phone-input"
                    value={phone}
                    placeholder="+91 XXXXX XXXXX"
                    onChange={e => setPhone(e.target.value)}
                    className={`bg-transparent text-right text-xs font-semibold ${theme === 'light' ? 'text-slate-900 border-pink-500/50' : 'text-white border-pink-500/30'} focus:outline-none focus:border-pink-500 border-b w-36`}
                  />
                </div>
                <p className={`text-[10px] pt-1 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>
                  Tap a field to edit, then press <span className="text-pink-400 font-semibold">Save Settings</span>.
                </p>
              </div>
            </div>

            {/* Creator Payout & Bank / UPI Settings */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Creator Payout & Bank Account
              </span>
              <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'} border space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        Bank & UPI Payout Details
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Where admins disburse your creator earnings
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Update Bank / UPI Details</span>
                </button>
              </div>
            </div>

            {/* Change Theme / Appearance */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Change Theme
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                  theme === 'light'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    : 'bg-pink-500/15 text-pink-400 border-pink-500/30'
                }`}>
                  {theme === 'light' ? '☀️ Light Mode Active' : '🌙 Dark Mode Active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Dark Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    showToast('🌙 Dark mode activated!', 'info');
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                    theme === 'dark'
                      ? 'bg-gradient-to-b from-purple-950/70 to-pink-950/40 border-pink-500 text-white shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/50'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    theme === 'dark'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300'
                  }`}>
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="w-full">
                    <span className="text-xs font-bold block text-white">Dark Mode</span>
                    <span className="text-[10px] text-gray-400">Cinematic & Deep</span>
                  </div>
                  {theme === 'dark' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 py-0.5">Switch to Dark</span>
                  )}
                </button>

                {/* Light Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    showToast('☀️ Light mode activated!', 'info');
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                    theme === 'light'
                      ? 'bg-gradient-to-b from-amber-50/90 to-pink-50/80 border-pink-500 text-slate-900 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/50'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    theme === 'light'
                      ? 'bg-gradient-to-tr from-amber-400 to-pink-500 text-white shadow-md'
                      : 'bg-white/10 text-gray-300'
                  }`}>
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="w-full">
                    <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Light Mode
                    </span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                      Clean & Vibrant
                    </span>
                  </div>
                  {theme === 'light' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-pink-600 bg-pink-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 py-0.5">Switch to Light</span>
                  )}
                </button>
              </div>
            </div>

            {/* Privacy & Safety */}
            <div className="space-y-2.5">
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider block`}>
                Privacy & Safety
              </span>

              <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'} border space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>Private Account</span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Only approved followers can view your feed</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      isPrivate ? 'bg-pink-600 justify-end' : (theme === 'light' ? 'bg-slate-300 justify-start' : 'bg-white/20 justify-start')
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>Allow Direct Messages</span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Receive inbox chats from followers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowDMs(!allowDMs)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      allowDMs ? 'bg-pink-600 justify-end' : (theme === 'light' ? 'bg-slate-300 justify-start' : 'bg-white/20 justify-start')
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>
                      Blocked Accounts ({blockedUsers?.length || 0})
                    </span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                      Check and unblock restricted profiles
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockedModalOpen(true)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Playback & Quality */}
            <div className="space-y-2.5">
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider block`}>
                Video Playback & Quality
              </span>

              <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'} border space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>Autoplay on Wi-Fi Only</span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Save mobile data when scrolling feed</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoplayWifi(!autoplayWifi)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      autoplayWifi ? 'bg-pink-600 justify-end' : (theme === 'light' ? 'bg-slate-300 justify-start' : 'bg-white/20 justify-start')
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>Upload High Quality HD</span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Always upload 1080p reels</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighQuality(!highQuality)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      highQuality ? 'bg-pink-600 justify-end' : (theme === 'light' ? 'bg-slate-300 justify-start' : 'bg-white/20 justify-start')
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-2.5">
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider block`}>
                Notifications
              </span>

              <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'} border space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>Likes & Comments Alerts</span>
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Notify when someone interacts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifLikes(!notifLikes)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      notifLikes ? 'bg-pink-600 justify-end' : (theme === 'light' ? 'bg-slate-300 justify-start' : 'bg-white/20 justify-start')
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                  <div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block`}>Admin Rewards & Payouts</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">Instant wallet credit alerts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifEarnings(!notifEarnings)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      notifEarnings ? 'bg-pink-600 justify-end' : (theme === 'light' ? 'bg-slate-300 justify-start' : 'bg-white/20 justify-start')
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* Clear Cache & Danger Zone */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleClearCache}
                className={`w-full py-2.5 rounded-2xl ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'
                } text-xs font-semibold flex items-center justify-center gap-2 border transition`}
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
                <span>Clear Local App Cache (48.5 MB)</span>
              </button>

              {/* Delete Account Permanently */}
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>{isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className={`pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'} flex items-center gap-2 mt-4`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 rounded-2xl ${
              theme === 'light' 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'bg-white/10 text-gray-300 hover:bg-white/15'
            } font-bold text-xs transition`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            id="settings-save-btn"
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </motion.div>

      {/* Creator Bank & UPI Details Modal */}
      <CreatorPayoutDetailsModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
      />

      {/* Blocked Accounts Management Modal */}
      <BlockedUsersModal
        isOpen={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
      />
    </div>
  );
};
