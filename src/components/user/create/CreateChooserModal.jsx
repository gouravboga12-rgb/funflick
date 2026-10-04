import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, Sparkles, X, ChevronRight } from 'lucide-react';

export const CreateChooserModal = () => {
  const { createModalOpen, setCreateModalOpen, currentUser, setSubscriptionGateModalOpen, showToast } = useApp();
  const navigate = useNavigate();

  if (!createModalOpen) return null;

  const options = [
    {
      title: 'Create Post',
      desc: 'Share a photo or comedy clip to your feed',
      icon: Image,
      color: 'from-pink-500 to-rose-600',
      path: '/create/post'
    },
    {
      title: 'Upload Video / Reel',
      desc: 'Publish vertical short video or sketch to FunFlick Reels',
      icon: Video,
      color: 'from-purple-600 to-indigo-600',
      path: '/create/video'
    },
    {
      title: 'Create Story',
      desc: 'Share a 24-hour moment with music & stickers',
      icon: Sparkles,
      color: 'from-amber-500 to-pink-500',
      path: '/create/story'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 120 }}
        className="w-full max-w-md bg-[#120c26] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white font-heading">Create on FunFlick</h2>
            <p className="text-xs text-pink-300">Choose format to start creating</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {options.map(opt => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.title}
                onClick={() => {
                  setCreateModalOpen(false);
                  navigate(opt.path);
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${opt.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading group-hover:text-pink-300 transition-colors">
                      {opt.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
