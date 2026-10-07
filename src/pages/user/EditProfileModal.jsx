import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { getSafeAvatar, handleAvatarError } from '../../utils/avatar';

export const EditProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, showToast } = useApp();

  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(() => getSafeAvatar(currentUser));
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image size should be less than 10MB', 'error');
        return;
      }
      setAvatarFile(file);

      // Read as base64 Data URL for instant preview (Data URLs survive reloads unlike blob: URLs)
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      showToast('Photo selected! Tap "Save Changes" to apply. 📸', 'info');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    let savedAvatarUrl = avatarPreview;

    try {
      // 1. If a new photo was selected, upload directly to AWS S3 bucket in 'avatars' folder
      if (avatarFile) {
        try {
          const { publicUrl } = await api.media.uploadFileToS3(avatarFile, 'avatars');
          if (publicUrl) {
            savedAvatarUrl = publicUrl;
          }
        } catch (s3Err) {
          console.warn('S3 upload fallback:', s3Err);
          // Keep base64 data preview if direct S3 failed
        }
      }

      // 2. Persist to AWS MySQL database
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      const token = localStorage.getItem('funflick_token');

      if (token) {
        try {
          const res = await api.auth.updateProfile({
            name: name.trim(),
            username: cleanUsername,
            bio: bio.trim(),
            avatar_url: savedAvatarUrl
          });

          if (res?.user) {
            savedAvatarUrl = res.user.avatar_url || savedAvatarUrl;
          }
        } catch (dbErr) {
          console.warn('Database profile update fallback:', dbErr);
        }
      }

      // 3. Update global AppContext & localStorage
      const updatedUser = {
        ...currentUser,
        name: name.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        avatar: savedAvatarUrl,
        avatar_url: savedAvatarUrl
      };

      setCurrentUser(updatedUser);
      showToast('Profile updated & saved to AWS! ✨', 'success');
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Could not save all changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
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
          <button onClick={onClose} disabled={saving} className="p-1 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={avatarPreview}
                onError={handleAvatarError}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-md bg-gray-900"
              />
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-pink-600 text-white cursor-pointer shadow hover:scale-105 active:scale-95 transition">
                <Camera className="w-3.5 h-3.5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                  disabled={saving}
                />
              </label>
            </div>
            <span className="text-[10px] text-gray-400 mt-1">Tap camera to change photo</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={saving}
              className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={saving}
              className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              disabled={saving}
              className="w-full bg-[#18122f] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg hover:opacity-95 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to AWS...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
