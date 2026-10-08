import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Ban, 
  UserX, 
  ShieldCheck, 
  Unlock, 
  CheckCircle2, 
  User 
} from 'lucide-react';

export const BlockedUsersModal = ({ isOpen, onClose }) => {
  const { blockedUsers, unblockUser, theme } = useApp();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-sm rounded-[32px] p-5 shadow-2xl border flex flex-col space-y-4 max-h-[85vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#140c2a] border-white/15 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm font-heading">
                  Blocked Accounts
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {blockedUsers?.length || 0}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">
                Manage accounts you've restricted
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Note */}
        <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed flex items-start gap-2 ${
          isLight ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-rose-950/30 text-rose-200 border border-rose-500/20'
        }`}>
          <UserX className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>
            Blocked accounts cannot view your profile or posts, and their content is completely hidden from your feed and reels.
          </span>
        </div>

        {/* List of Blocked Users */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-72">
          {!blockedUsers || blockedUsers.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-xs">No Blocked Accounts</h4>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                You haven't blocked anyone yet. Users you block from post options will appear here.
              </p>
            </div>
          ) : (
            blockedUsers.map(username => (
              <div
                key={username}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs shadow shrink-0">
                    {username[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">
                      @{username}
                    </span>
                    <span className="text-[10px] text-rose-400 font-medium">
                      Blocked
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => unblockUser(username)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-[11px] shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unblock</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
