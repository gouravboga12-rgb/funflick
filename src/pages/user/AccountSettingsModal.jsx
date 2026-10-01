import React, { useState } from 'react';
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
  Sun
} from 'lucide-react';

export const AccountSettingsModal = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, showToast, theme, setTheme } = useApp();

  const [email, setEmail] = useState('srilatha@funflick.tv');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowDMs, setAllowDMs] = useState(true);
  const [autoplayWifi, setAutoplayWifi] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);
  const [language, setLanguage] = useState('Telugu & Hindi');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`bg-transparent text-right text-xs font-semibold ${theme === 'light' ? 'text-slate-900 border-pink-500/50' : 'text-white border-pink-500/30'} focus:outline-none border-b w-44`}
                  />
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                  <div className={`flex items-center gap-2 text-xs ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Mobile Number</span>
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={`bg-transparent text-right text-xs font-semibold ${theme === 'light' ? 'text-slate-900 border-pink-500/50' : 'text-white border-pink-500/30'} focus:outline-none border-b w-36`}
                  />
                </div>
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
              </div>
            </div>

            {/* Playback & Content */}
            <div className="space-y-2.5">
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider block`}>
                Video Playback & Language
              </span>

              <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'} border space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Content Languages</span>
                  </div>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className={`${
                      theme === 'light' 
                        ? 'bg-white text-slate-900 border-slate-300 shadow-sm' 
                        : 'bg-[#18122c] text-white border-white/10'
                    } text-xs px-2.5 py-1 rounded-xl border focus:outline-none`}
                  >
                    <option value="Telugu & Hindi">Telugu & Hindi</option>
                    <option value="Telugu, Hindi & English">Telugu, Hindi & English</option>
                    <option value="All Indian Languages">All Indian Languages</option>
                  </select>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
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

            {/* Clear Cache */}
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
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
