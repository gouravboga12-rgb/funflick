import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  Megaphone, 
  Phone, 
  MessageCircle, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  Save, 
  Edit3, 
  Filter, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Film, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminAdRequestsScreen = () => {
  const { 
    adminAdRequests, 
    fetchAdminAdRequests, 
    approveAdRequest, 
    rejectAdRequest, 
    deleteAdRequest,
    adContactSettings,
    updateAdContactSettings,
    theme,
    showToast 
  } = useApp();

  const isLight = theme === 'light';

  // Contact settings state (editable at top)
  const [email, setEmail] = useState(adContactSettings?.adContactEmail || 'ads@funflick.in');
  const [phone, setPhone] = useState(adContactSettings?.adContactPhone || '+91 98765 43210');
  const [whatsapp, setWhatsapp] = useState(adContactSettings?.adContactWhatsapp || '+91 98765 43210');
  const [timings, setTimings] = useState(adContactSettings?.adContactTimings || 'Mon - Sat, 9:00 AM - 7:00 PM IST');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Tab filter
  const [filter, setFilter] = useState('all'); // 'all' | 'Pending' | 'Approved' | 'Rejected'

  // Approve modal state
  const [selectedApproveRequest, setSelectedApproveRequest] = useState(null);
  const [approveFrequency, setApproveFrequency] = useState('After Every 5 Reels');
  const [approveDuration, setApproveDuration] = useState(20);
  const [approveCloseAfter, setApproveCloseAfter] = useState(8);
  const [isApproving, setIsApproving] = useState(false);

  // Reject modal state
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('Creative does not match platform community guidelines.');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (fetchAdminAdRequests) fetchAdminAdRequests();
  }, []);

  useEffect(() => {
    if (adContactSettings) {
      if (adContactSettings.adContactEmail) setEmail(adContactSettings.adContactEmail);
      if (adContactSettings.adContactPhone) setPhone(adContactSettings.adContactPhone);
      if (adContactSettings.adContactWhatsapp) setWhatsapp(adContactSettings.adContactWhatsapp);
      if (adContactSettings.adContactTimings) setTimings(adContactSettings.adContactTimings);
    }
  }, [adContactSettings]);

  const handleSaveContactSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateAdContactSettings({
        adContactEmail: email.trim(),
        adContactPhone: phone.trim(),
        adContactWhatsapp: whatsapp.trim(),
        adContactTimings: timings.trim()
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedApproveRequest) return;
    setIsApproving(true);
    try {
      await approveAdRequest(selectedApproveRequest.id, {
        frequency: approveFrequency,
        duration: Number(approveDuration) || 20,
        allowCloseAfter: Number(approveCloseAfter) || 8
      });
      setSelectedApproveRequest(null);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRejectRequest) return;
    setIsRejecting(true);
    try {
      await rejectAdRequest(selectedRejectRequest.id, rejectReason);
      setSelectedRejectRequest(null);
    } finally {
      setIsRejecting(false);
    }
  };

  const requestsList = adminAdRequests || [];
  const filteredRequests = requestsList.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requestsList.filter(r => r.status === 'Pending').length;
  const approvedCount = requestsList.filter(r => r.status === 'Approved').length;
  const rejectedCount = requestsList.filter(r => r.status === 'Rejected').length;

  return (
    <AdminLayout title="Ad Requests & Campaign Moderation">
      <div className="space-y-6">
        
        {/* ======================================================== */}
        {/* 1. TOP EDITABLE ADVERTISER CONTACT CONFIGURATION PANEL    */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-3xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#120a24] border-white/10 shadow-xl'
        } border space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading`}>
                  Public Advertiser Contact Information
                </h3>
                <p className="text-[11px] text-gray-400">
                  These contact details appear dynamically on the user profile screen for potential advertisers
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveContactSettings}
              disabled={isSavingSettings}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-[#ff007a] to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Contact Details'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveContactSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-purple-400" />
                <span>Contact Email ID</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ads@funflick.in"
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'
                } border focus:outline-none focus:border-pink-500 transition`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-400" />
                <span>Official Call Phone</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'
                } border focus:outline-none focus:border-pink-500 transition`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp Business Number</span>
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'
                } border focus:outline-none focus:border-pink-500 transition`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Operating / Support Timings</span>
              </label>
              <input
                type="text"
                required
                value={timings}
                onChange={(e) => setTimings(e.target.value)}
                placeholder="Mon - Sat, 9:00 AM - 7:00 PM IST"
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'
                } border focus:outline-none focus:border-pink-500 transition`}
              />
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* 2. OVERVIEW METRICS CARDS                                */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-4 rounded-3xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#120a24] border-white/10'
          } border shadow-sm space-y-1`}>
            <span className="text-[11px] font-bold text-gray-400 block">Total Requests</span>
            <span className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'} font-heading block`}>
              {requestsList.length}
            </span>
            <span className="text-[10px] text-pink-400 font-semibold">All submitted campaigns</span>
          </div>

          <div className={`p-4 rounded-3xl ${
            isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-500/20'
          } border shadow-sm space-y-1`}>
            <span className="text-[11px] font-bold text-amber-400 block">Pending Review</span>
            <span className="text-2xl font-black text-amber-400 font-heading block">
              {pendingCount}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">Requires admin action</span>
          </div>

          <div className={`p-4 rounded-3xl ${
            isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/20'
          } border shadow-sm space-y-1`}>
            <span className="text-[11px] font-bold text-emerald-400 block">Approved & Live</span>
            <span className="text-2xl font-black text-emerald-400 font-heading block">
              {approvedCount}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">Active in feeds & reels</span>
          </div>

          <div className={`p-4 rounded-3xl ${
            isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-500/20'
          } border shadow-sm space-y-1`}>
            <span className="text-[11px] font-bold text-rose-400 block">Rejected</span>
            <span className="text-2xl font-black text-rose-400 font-heading block">
              {rejectedCount}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">Declined submissions</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. FILTER TABS                                           */}
        {/* ======================================================== */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All Requests (${requestsList.length})` },
            { id: 'Pending', label: `Pending Review (${pendingCount})` },
            { id: 'Approved', label: `Approved & Published (${approvedCount})` },
            { id: 'Rejected', label: `Rejected (${rejectedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-200'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* 4. AD REQUESTS LIST                                      */}
        {/* ======================================================== */}
        {filteredRequests.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#120a24] border-white/10'
          } border space-y-3`}>
            <Megaphone className="w-12 h-12 text-gray-500 mx-auto" />
            <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              No ad requests in this category
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {filter === 'Pending' 
                ? 'All pending ad requests have been reviewed!' 
                : 'Advertiser submissions from the User Profile screen will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRequests.map(req => {
              const isApproved = req.status === 'Approved';
              const isRejected = req.status === 'Rejected';
              const isPending = req.status === 'Pending';
              const cleanPhone = (req.phone || '').replace(/\s+/g, '');
              const cleanWhatsapp = (req.whatsapp || req.phone || '').replace(/[^0-9]/g, '');
              const isVideo = req.adType === 'video' || /\.(mp4|webm|mov)($|\?)/i.test(req.mediaUrl || '');

              const waMessage = encodeURIComponent(
                `Hello ${req.contactPerson || req.brandName}, thank you for your ad submission "${req.title}" for ${req.brandName} on FunFlick! I am following up on your request regarding pricing, duration, and publishing details.`
              );

              return (
                <div 
                  key={req.id}
                  className={`p-4 rounded-3xl ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#120a24] border-white/10 shadow-xl'
                  } border space-y-3.5 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    {/* Header Row: Brand, Contact, Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} font-heading truncate`}>
                            {req.brandName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-400 border border-pink-500/30">
                            {req.adType === 'video' ? 'Video Ad' : 'Image Ad'}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          Contact: <strong className="text-white">{req.contactPerson}</strong> · {req.date}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isRejected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Creative Media Preview & Campaign Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Media container */}
                      <div className="sm:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                        {isVideo ? (
                          <video
                            src={req.mediaUrl}
                            controls
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={req.mediaUrl}
                            alt={req.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div className="sm:col-span-7 space-y-1.5 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Ad Headline</span>
                          <span className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} block line-clamp-2`}>
                            {req.title}
                          </span>
                        </div>

                        {req.description && (
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Notes / Offer</span>
                            <p className="text-[11px] text-gray-300 line-clamp-2">
                              {req.description}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Destination & CTA</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 text-[10px] font-bold">
                              {req.actionText || 'Learn More'}
                            </span>
                            {req.actionUrl && (
                              <a
                                href={req.actionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 truncate"
                              >
                                <span className="truncate">{req.actionUrl}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>

                        {req.adminNotes && (
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-300">
                            <strong>Admin Note:</strong> {req.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Contact Bar (Call & WhatsApp Buttons) */}
                    <div className={`p-2.5 rounded-2xl ${
                      isLight ? 'bg-slate-100' : 'bg-black/40'
                    } border border-white/5 flex flex-wrap items-center justify-between gap-2`}>
                      <span className="text-[11px] font-bold text-gray-400">
                        Direct Client Contact:
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Call Button */}
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                          title={`Call ${req.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call ({req.phone})</span>
                        </a>

                        {/* 1-Click WhatsApp Button with pre-filled message */}
                        <a
                          href={`https://wa.me/${cleanWhatsapp}?text=${waMessage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                          title="Open WhatsApp chat with client"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Email Button */}
                        {req.email && (
                          <a
                            href={`mailto:${req.email}?subject=FunFlick%20Ad%20Campaign%20-%20${encodeURIComponent(req.brandName)}`}
                            className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition"
                            title={`Email ${req.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row: Approve, Reject, Delete */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => deleteAdRequest(req.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition cursor-pointer"
                      title="Delete request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      {!isRejected && (
                        <button
                          onClick={() => setSelectedRejectRequest(req)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      )}

                      {!isApproved && (
                        <button
                          onClick={() => setSelectedApproveRequest(req)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Publish to Ads</span>
                        </button>
                      )}

                      {isApproved && (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>Live in Active Ads</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* APPROVE & PUBLISH CONFIGURATION MODAL                    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedApproveRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#120a24] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-heading">
                      Approve & Publish Ad Campaign
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Brand: <strong className="text-pink-300">{selectedApproveRequest.brandName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApproveRequest(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Display Placement & Frequency
                  </label>
                  <select
                    value={approveFrequency}
                    onChange={(e) => setApproveFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
                  >
                    <option value="After Every 5 Reels" className="bg-[#120a24]">After Every 5 Reels (Reels Sequential 5, 10, once per ad)</option>
                    <option value="Pop-up Ads" className="bg-[#120a24]">Pop-up Ads (In-App Overlay Pop-up)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Total Ad Duration (s)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={approveDuration}
                      onChange={(e) => setApproveDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Close Countdown (s)
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={approveCloseAfter}
                      onChange={(e) => setApproveCloseAfter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-gray-300 space-y-1">
                  <p>
                    ✓ This will instantly insert the ad into <strong>Platform Ads</strong>.
                  </p>
                  <p>
                    ✓ Viewers will watch for <strong>{approveCloseAfter} seconds</strong> before the Close button becomes available.
                  </p>
                  <p>
                    ✓ Status of request #{selectedApproveRequest.id} will be updated to <strong>Approved</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setSelectedApproveRequest(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  disabled={isApproving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproving ? 'Publishing...' : 'Confirm & Publish Live'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* REJECT REQUEST MODAL                                     */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedRejectRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#120a24] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-heading">
                      Reject Ad Request
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Brand: <strong className="text-pink-300">{selectedRejectRequest.brandName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRejectRequest(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[11px] font-bold text-gray-300 block">
                  Rejection Reason / Note for Advertiser
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs resize-none focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setSelectedRejectRequest(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isRejecting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <span>{isRejecting ? 'Rejecting...' : 'Reject Request'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
