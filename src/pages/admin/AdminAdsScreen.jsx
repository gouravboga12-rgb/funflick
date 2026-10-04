import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { 
  Megaphone, 
  Plus, 
  Video, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Edit3, 
  Trash2, 
  Smartphone, 
  ExternalLink, 
  Eye, 
  MousePointer, 
  Sparkles,
  Calendar,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminAdsScreen = () => {
  const { adsList, createAd, updateAd, deleteAd, toggleAdStatus, showMobileAd, showToast, theme } = useApp();
  const isLight = theme === 'light';

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentAd, setCurrentAd] = useState({
    id: '',
    title: '',
    type: 'video',
    mediaUrl: '',
    thumbnailUrl: '',
    duration: 20,
    allowCloseAfter: 8,
    active: true,
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    frequency: 'Every 3 Reels',
    actionUrl: 'https://funflick.in',
    actionText: 'Learn More'
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentAd({
      id: '',
      title: 'Summer Fest Ad Campaign 🏖️',
      type: 'video',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-wearing-headphones-enjoying-music-40955-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
      duration: 20,
      allowCloseAfter: 8,
      active: true,
      startDate: '2026-10-01',
      endDate: '2026-11-30',
      frequency: 'Every 3 Reels',
      actionUrl: 'https://funflick.in',
      actionText: 'Shop Special Offer'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ad) => {
    setModalMode('edit');
    setCurrentAd({ ...ad });
    setModalOpen(true);
  };

  const handleSaveAd = (e) => {
    e.preventDefault();
    if (!currentAd.title || !currentAd.mediaUrl) {
      showToast('⚠️ Please provide an ad title and media URL', 'error');
      return;
    }

    if (modalMode === 'create') {
      createAd(currentAd);
    } else {
      updateAd(currentAd.id, currentAd);
    }
    setModalOpen(false);
  };

  const sampleMediaPresets = [
    {
      name: 'Young Guy Music (Video 20s)',
      type: 'video',
      duration: 20,
      closeAfter: 8,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-wearing-headphones-enjoying-music-40955-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'DJ Neon Festival (Video 15s)',
      type: 'video',
      duration: 15,
      closeAfter: 15,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-at-a-party-with-neon-lights-42995-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Delicious Food Deal (Image)',
      type: 'image',
      duration: 10,
      closeAfter: 0,
      url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      thumb: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <AdminLayout title="Ads & Promotions Management">
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ads & In-App Promotions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Mobile Overlay Engine
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} mt-1`}>
              Configure mobile popup advertisements. Set countdowns, unskippable times, frequency, and test them live.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-[#ff007a] to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:opacity-95 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Advertisement</span>
          </button>
        </div>

        {/* Ad Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Active Ads</span>
            <div className={`text-2xl font-black font-heading mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {(adsList || []).filter(a => a.active).length}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Live in user mobile feed</span>
          </div>

          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Total Impressions</span>
            <div className={`text-2xl font-black font-heading mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              20.4K
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 block">+15.8% reach increase</span>
          </div>

          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Total Click-Throughs</span>
            <div className={`text-2xl font-black font-heading mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              3,050
            </div>
            <span className="text-[10px] text-pink-400 font-semibold mt-1 block">14.9% CTR average</span>
          </div>

          <div className={`p-4 rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#120b24] border-white/5'} border shadow-sm`}>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} font-medium`}>Ad Formats</span>
            <div className={`text-2xl font-black font-heading mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Image & Video
            </div>
            <span className="text-[10px] text-purple-400 font-semibold mt-1 block">With close timers & rules</span>
          </div>
        </div>

        {/* Ads Cards List */}
        <div className="space-y-4">
          {(adsList || []).map(ad => (
            <div
              key={ad.id}
              className={`p-5 rounded-3xl ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#120b24] border-white/10'
              } border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}
            >
              {/* Media preview and details */}
              <div className="flex items-start gap-4 flex-1">
                <div className="relative w-24 h-28 rounded-2xl overflow-hidden bg-black/40 shrink-0 border border-white/10 group">
                  <img
                    src={ad.thumbnailUrl || ad.mediaUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-black/70 text-white backdrop-blur-sm flex items-center gap-1">
                    {ad.type === 'video' ? <Video className="w-3 h-3 text-pink-400" /> : <ImageIcon className="w-3 h-3 text-blue-400" />}
                    <span>{ad.type} Ad</span>
                  </span>
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
                      {ad.title}
                    </h3>

                    {ad.active ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Paused</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    Target: <span className="text-pink-300 font-medium">{ad.actionUrl}</span> · CTA: "{ad.actionText}"
                  </p>

                  {/* Rules and Behavior Specs */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <span className="flex items-center gap-1 text-purple-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration: {ad.duration}s</span>
                    </span>

                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {ad.type === 'image' || ad.allowCloseAfter === 0 
                          ? 'Close: Immediate (X)' 
                          : ad.allowCloseAfter >= ad.duration 
                            ? 'Close: Watch full video' 
                            : `Close: After ${ad.allowCloseAfter}s countdown`}
                      </span>
                    </span>

                    <span className="flex items-center gap-1 text-blue-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Freq: {ad.frequency}</span>
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-gray-500">
                    <span>👁️ {ad.impressions.toLocaleString()} Impressions</span>
                    <span>👆 {ad.clicks.toLocaleString()} Clicks</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                {/* Test in Mobile Screen */}
                <button
                  onClick={() => {
                    showMobileAd(ad.id);
                    showToast(`📱 Triggered Ad "${ad.title}" on Mobile Frame!`, 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Test how this Ad appears as an overlay inside the phone screen"
                >
                  <Smartphone className="w-4 h-4 text-pink-400" />
                  <span>Test on Mobile</span>
                </button>

                {/* Toggle status */}
                <button
                  onClick={() => toggleAdStatus(ad.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    ad.active
                      ? isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {ad.active ? 'Pause' : 'Activate'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleOpenEdit(ad)}
                  className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-gray-300'} border border-transparent transition`}
                  title="Edit Ad"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteAd(ad.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                  title="Delete Ad"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar p-6 rounded-3xl ${
                isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#140e2b] text-white border-white/10'
              } border shadow-2xl space-y-5`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-pink-500" />
                  <h2 className="text-lg font-bold font-heading">
                    {modalMode === 'create' ? 'Create In-App Advertisement' : 'Edit Advertisement'}
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAd} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Ad Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={currentAd.title}
                    onChange={(e) => setCurrentAd({ ...currentAd, title: e.target.value })}
                    placeholder="e.g. Swiggy Comedy Weekend Deal"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                      isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10'
                    } border focus:outline-none focus:border-pink-500`}
                  />
                </div>

                {/* Ad Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Format Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentAd({ ...currentAd, type: 'video', allowCloseAfter: 8 })}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        currentAd.type === 'video'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent'
                          : isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10 text-gray-400'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Ad (With Countdown)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentAd({ ...currentAd, type: 'image', allowCloseAfter: 0 })}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        currentAd.type === 'image'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent'
                          : isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10 text-gray-400'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Image Ad (Instant Close X)</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-gray-400 block font-semibold">Or pick a demo preset:</span>
                  <div className="flex flex-wrap gap-2">
                    {sampleMediaPresets.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCurrentAd({
                          ...currentAd,
                          type: preset.type,
                          mediaUrl: preset.url,
                          thumbnailUrl: preset.thumb,
                          duration: preset.duration,
                          allowCloseAfter: preset.closeAfter
                        })}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-pink-300 transition"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    {currentAd.type === 'video' ? 'Video File URL (MP4 / WebM)' : 'Image File URL (JPG / PNG)'}
                  </label>
                  <input
                    type="url"
                    required
                    value={currentAd.mediaUrl}
                    onChange={(e) => setCurrentAd({ ...currentAd, mediaUrl: e.target.value })}
                    placeholder="https://..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                      isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10'
                    } border focus:outline-none focus:border-pink-500`}
                  />
                </div>

                {/* Duration & Allow Close After (Requirement 4 & 5) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold block">Total Duration (Seconds)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={currentAd.duration}
                      onChange={(e) => setCurrentAd({ ...currentAd, duration: Number(e.target.value) })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10'
                      } border focus:outline-none focus:border-pink-500`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-400 block">
                      Allow Close After (Seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={currentAd.duration}
                      value={currentAd.allowCloseAfter}
                      onChange={(e) => setCurrentAd({ ...currentAd, allowCloseAfter: Number(e.target.value) })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                        isLight ? 'bg-slate-100 border-amber-300' : 'bg-[#0a0618] border-amber-500/40 text-amber-300'
                      } border focus:outline-none focus:border-amber-400`}
                    />
                    <span className="text-[10px] text-gray-400 block">
                      {currentAd.allowCloseAfter === 0 
                        ? '0 = Can close immediately' 
                        : currentAd.allowCloseAfter >= currentAd.duration
                          ? 'Must watch entire video'
                          : `Shows countdown "Close in ${currentAd.allowCloseAfter}s"`}
                    </span>
                  </div>
                </div>

                {/* Display Frequency & Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold block">Display Frequency</label>
                    <select
                      value={currentAd.frequency}
                      onChange={(e) => setCurrentAd({ ...currentAd, frequency: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10'
                      } border focus:outline-none`}
                    >
                      <option value="Every 3 Reels">Every 3 Reels</option>
                      <option value="On App Open">On App Open</option>
                      <option value="Once per session">Once per session</option>
                      <option value="Manual Demo Only">Manual Demo Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold block">Status</label>
                    <button
                      type="button"
                      onClick={() => setCurrentAd({ ...currentAd, active: !currentAd.active })}
                      className={`w-full py-2 rounded-xl text-xs font-bold border transition ${
                        currentAd.active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {currentAd.active ? 'Active (Displaying)' : 'Paused (Draft)'}
                    </button>
                  </div>
                </div>

                {/* CTA Action Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold block">CTA Button Label</label>
                    <input
                      type="text"
                      value={currentAd.actionText}
                      onChange={(e) => setCurrentAd({ ...currentAd, actionText: e.target.value })}
                      placeholder="e.g. Shop Now"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10'
                      } border focus:outline-none`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold block">Destination Link</label>
                    <input
                      type="url"
                      value={currentAd.actionUrl}
                      onChange={(e) => setCurrentAd({ ...currentAd, actionUrl: e.target.value })}
                      placeholder="https://sponsor.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0a0618] border-white/10'
                      } border focus:outline-none`}
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:opacity-95 transition cursor-pointer"
                  >
                    {modalMode === 'create' ? 'Publish Advertisement' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};
