import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Save, ShieldCheck, DollarSign, Bell, Sliders } from 'lucide-react';

export const AdminSettingsScreen = () => {
  const { showToast } = useApp();

  const [platformName, setPlatformName] = useState('FunFlick');
  const [tagline, setTagline] = useState('Comedy. Entertainment. Always On!');
  const [commissionRate, setCommissionRate] = useState('15');
  const [minPayout, setMinPayout] = useState('1000');
  const [requireSubscription, setRequireSubscription] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Platform settings saved successfully! ⚙️', 'success');
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
