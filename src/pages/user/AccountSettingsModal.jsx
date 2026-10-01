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
  Sparkles
} from 'lucide-react';

export const AccountSettingsModal = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, showToast } = useApp();

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
        className="w-full max-w-md bg-[#110b24] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base font-heading">
                  Account Settings
                </h3>
                <p className="text-[10px] text-pink-300">Preferences & Privacy Controls</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            
            {/* Account Info */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Account Information
              </span>
              
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Mail className="w-4 h-4 text-pink-400" />
                    <span>Email Address</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-transparent text-right text-xs font-semibold text-white focus:outline-none border-b border-pink-500/30 w-44"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Mobile Number</span>
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="bg-transparent text-right text-xs font-semibold text-white focus:outline-none border-b border-pink-500/30 w-36"
                  />
                </div>
              </div>
            </div>

            {/* Privacy & Safety */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Privacy & Safety
              </span>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Private Account</span>
                    <span className="text-[10px] text-gray-400">Only approved followers can view your feed</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      isPrivate ? 'bg-pink-600 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-bold text-white block">Allow Direct Messages</span>
                    <span className="text-[10px] text-gray-400">Receive inbox chats from followers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowDMs(!allowDMs)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      allowDMs ? 'bg-pink-600 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* Playback & Content */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Video Playback & Language
              </span>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">Content Languages</span>
                  </div>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-[#18122c] text-white text-xs px-2.5 py-1 rounded-xl border border-white/10 focus:outline-none"
                  >
                    <option value="Telugu & Hindi">Telugu & Hindi</option>
                    <option value="Telugu, Hindi & English">Telugu, Hindi & English</option>
                    <option value="All Indian Languages">All Indian Languages</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-bold text-white block">Autoplay on Wi-Fi Only</span>
                    <span className="text-[10px] text-gray-400">Save mobile data when scrolling feed</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoplayWifi(!autoplayWifi)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      autoplayWifi ? 'bg-pink-600 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-bold text-white block">Upload High Quality HD</span>
                    <span className="text-[10px] text-gray-400">Always upload 1080p reels</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighQuality(!highQuality)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      highQuality ? 'bg-pink-600 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Notifications
              </span>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Likes & Comments Alerts</span>
                    <span className="text-[10px] text-gray-400">Notify when someone interacts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifLikes(!notifLikes)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      notifLikes ? 'bg-pink-600 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-xs font-bold text-white block">Admin Rewards & Payouts</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Instant wallet credit alerts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifEarnings(!notifEarnings)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      notifEarnings ? 'bg-pink-600 justify-end' : 'bg-white/20 justify-start'
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
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 transition"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
              <span>Clear Local App Cache (48.5 MB)</span>
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 transition"
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
