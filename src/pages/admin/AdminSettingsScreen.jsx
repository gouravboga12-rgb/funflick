import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Save, ShieldCheck, DollarSign, Bell, Sliders } from 'lucide-react';

export const AdminSettingsScreen = () => {
  const { mediaLimits, updateMediaLimits, showToast } = useApp();

  const [platformName, setPlatformName] = useState('FunFlick');
  const [tagline, setTagline] = useState('Comedy. Entertainment. Always On!');
  const [commissionRate, setCommissionRate] = useState('15');
  const [minPayout, setMinPayout] = useState('1000');
  const [requireSubscription, setRequireSubscription] = useState(true);

  // Dynamic Media length limits
  const [reelDuration, setReelDuration] = useState(mediaLimits?.maxReelDuration || 30);
  const [storyDuration, setStoryDuration] = useState(mediaLimits?.maxStoryDuration || 15);
  const [postDuration, setPostDuration] = useState(mediaLimits?.maxPostDuration || 30);

  // Sync if remote settings change
  React.useEffect(() => {
    if (mediaLimits) {
      if (mediaLimits.maxReelDuration) setReelDuration(mediaLimits.maxReelDuration);
      if (mediaLimits.maxStoryDuration) setStoryDuration(mediaLimits.maxStoryDuration);
      if (mediaLimits.maxPostDuration) setPostDuration(mediaLimits.maxPostDuration);
    }
  }, [mediaLimits]);

  const handleSave = (e) => {
    e.preventDefault();
    updateMediaLimits({
      maxReelDuration: Number(reelDuration) || 30,
      maxStoryDuration: Number(storyDuration) || 15,
      maxPostDuration: Number(postDuration) || 30
    });
    showToast('Platform & media showcase limits saved successfully! ⚙️', 'success');
  };

  return (
    <AdminLayout title="Global Platform Settings">
      <form onSubmit={handleSave} className="max-w-2xl space-y-5">
        
        {/* Brand & Identity */}
        <div className="p-5 rounded-3xl bg-[#130d29] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading">
            Platform Brand Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={e => setPlatformName(e.target.value)}
                className="w-full bg-[#191136] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full bg-[#191136] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Creator & Monetization Rules */}
        <div className="p-5 rounded-3xl bg-[#130d29] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading">
            Creator Monetization & Gate Settings
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <span className="text-xs font-bold text-white block">Enforce Publishing Subscription Gate</span>
              <p className="text-[10px] text-gray-400">Users must purchase a weekly/monthly plan to publish</p>
            </div>
            <input
              type="checkbox"
              checked={requireSubscription}
              onChange={e => setRequireSubscription(e.target.checked)}
              className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Platform Fee / Commission (%)</label>
              <input
                type="number"
                value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                className="w-full bg-[#191136] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Min. Creator Payout Threshold (₹)</label>
              <input
                type="number"
                value={minPayout}
                onChange={e => setMinPayout(e.target.value)}
                className="w-full bg-[#191136] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Global Media Length & Playback Limits (Dynamic Showcase Duration) */}
        <div className="p-5 rounded-3xl bg-[#130d29] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Global Video Length & Showcase Limits
                </h3>
                <p className="text-[11px] text-gray-400">
                  Controls the maximum duration played to viewers globally across the app
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400">
              Live Dynamic Playback
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base">🎬</span>
              <div className="flex-1 text-xs">
                <span className="font-bold text-white block">Dynamic Playback Engine</span>
                <p className="text-gray-300 text-[11px] leading-relaxed mt-0.5">
                  If users upload a video longer than the limit (e.g. 1 minute 30 seconds), it uploads safely and showcases up to the current limit. When you adjust the limit here (e.g. 30s to 60s), all videos dynamically play up to the new length!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Reels Max Showcase Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">Reels Maximum Length</span>
                <span className="font-bold text-pink-400 text-sm">{reelDuration}s</span>
              </div>
              <div className="flex items-center gap-2">
                {[15, 30, 45, 60, 90].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setReelDuration(sec)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                      Number(reelDuration) === sec
                        ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {sec}s {sec === 30 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={reelDuration}
                  onChange={e => setReelDuration(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Stories Max Showcase Limit */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">Stories Maximum Length</span>
                <span className="font-bold text-purple-400 text-sm">{storyDuration}s</span>
              </div>
              <div className="flex items-center gap-2">
                {[10, 15, 20, 30].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setStoryDuration(sec)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                      Number(storyDuration) === sec
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {sec}s {sec === 15 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={storyDuration}
                onChange={e => setStoryDuration(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Video Posts Max Showcase Limit */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">Feed Video Posts Maximum Length</span>
                <span className="font-bold text-amber-400 text-sm">{postDuration}s</span>
              </div>
              <div className="flex items-center gap-2">
                {[15, 30, 45, 60, 90, 120].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setPostDuration(sec)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                      Number(postDuration) === sec
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {sec}s {sec === 30 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg hover:opacity-95 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </form>
    </AdminLayout>
  );
};
