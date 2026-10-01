import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { X, Camera, Check } from 'lucide-react';

export const EditProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, showToast } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  if (!isOpen) return null;

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      showToast('Avatar updated! 📸');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setCurrentUser(prev => ({
      ...prev,
      name,
      username,
      bio,
      avatar
    }));
    showToast('Profile updated successfully! ✨', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-md bg-[#120c26] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-bold text-white text-base font-heading">Edit Profile</h3>
          <button onClick={onClose} className="p-1 rounded-full bg-white/10 text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={avatar}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-md"
              />
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-pink-600 text-white cursor-pointer shadow hover:scale-105 transition">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg hover:opacity-95"
          >
            Save Changes
          </button>
        </form>
      </motion.div>
    </div>
  );
};
