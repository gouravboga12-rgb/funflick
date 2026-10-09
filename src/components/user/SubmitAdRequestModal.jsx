import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  X, 
  Megaphone, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  MessageCircle, 
  Mail, 
  Globe, 
  Sparkles, 
  Film, 
  Image as ImageIcon,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubmitAdRequestModal = ({ isOpen, onClose }) => {
  const { currentUser, submitAdRequest, myAdRequests, adContactSettings, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'my_requests'
  const [brandName, setBrandName] = useState('');
  const [contactPerson, setContactPerson] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.phone || '');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adType, setAdType] = useState('video');
  const [actionUrl, setActionUrl] = useState('https://');
  const [actionText, setActionText] = useState('Learn More');

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (val) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (adType === 'video' && !isVideo) {
      showToast('Please select a valid video file (MP4, WebM, MOV)', 'error');
      return;
    }
    if (adType === 'image' && !isImage) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    const maxBytes = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = isVideo ? '10MB' : '5MB';
    if (file.size > maxBytes) {
      showToast(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${maxLabel} limit. Please select a ${isVideo ? 'video' : 'photo'} under ${maxLabel}.`, 'error');
      return;
    }

    setSelectedFile(file);
    setMediaPreview(URL.createObjectURL(file));

    // Upload directly to AWS S3
    try {
      setIsUploading(true);
      setUploadProgress(20);
      const folder = isVideo ? 'videos' : 'thumbnails';
      const result = await api.media.uploadFileToS3(file, folder);
      setUploadProgress(100);
      setUploadedUrl(result.publicUrl);
      showToast('Creative uploaded to AWS S3 successfully!', 'success');
    } catch (err) {
      console.error('S3 upload error:', err);
      showToast('Failed to upload file to S3. Please try again.', 'error');
      setSelectedFile(null);
      setMediaPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!brandName.trim()) {
      showToast('Please enter your Brand or Business Name', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your Contact Phone Number', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a Campaign Headline / Title', 'error');
      return;
    }
    if (!uploadedUrl) {
      showToast('Please upload your Ad Creative (Video or Photo)', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitAdRequest({
        brandName: brandName.trim(),
        contactPerson: contactPerson.trim() || brandName.trim(),
        phone: phone.trim(),
        whatsapp: (sameAsPhone ? phone : whatsapp).trim(),
        email: email.trim(),
        title: title.trim(),
        description: description.trim(),
        adType,
        mediaUrl: uploadedUrl,
        thumbnailUrl: uploadedUrl,
        actionUrl: actionUrl.trim() || 'https://funflick.in',
        actionText: actionText.trim() || 'Learn More'
      });

      if (res?.success) {
        // Reset form
        setBrandName('');
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setMediaPreview(null);
        setUploadedUrl('');
        setActiveTab('my_requests');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanPhone = (adContactSettings?.adContactPhone || '+91 98765 43210').replace(/\s+/g, '');
  const cleanWhatsapp = (adContactSettings?.adContactWhatsapp || '+91 98765 43210').replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-[#120a24] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-[#120a24]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white font-heading leading-tight">
                Advertise with FunFlick
              </h3>
              <p className="text-[10px] text-pink-300 font-semibold">
                Promote your brand to thousands of active viewers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/30 p-1">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'new' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Submit New Campaign
          </button>
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my_requests' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>My Ad Requests</span>
            {(myAdRequests?.length || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 text-white">
                {myAdRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Direct Admin Assistance Bar */}
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] font-bold text-white block">Need assistance or custom pricing?</span>
                  <span className="text-[9px] text-gray-300">Contact our advertising team directly</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=Hi%20FunFlick%20Ad%20Team%2C%20I%20want%20to%20advertise%20my%20brand`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow transition"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Brand & Contact Person */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Brand / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiggy, Nike, TechGuru"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-pink-400" />
                    <span>Mobile / Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={sameAsPhone}
                    placeholder="+91 98765 43210"
                    value={sameAsPhone ? phone : whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition ${
                      sameAsPhone ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Same as phone checkbox & Email */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 -mt-1 px-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) setWhatsapp(phone);
                    }}
                    className="accent-pink-500 rounded"
                  />
                  <span>WhatsApp number is same as mobile</span>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="contact@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              {/* Campaign Title & Description */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Campaign Headline / Ad Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Foodie Fiesta 🍕 (Up to 50% Off)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Campaign Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what your offer is, target audience, or special instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition resize-none"
                />
              </div>

              {/* Format Selection: Video vs Photo */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
                  Ad Format *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAdType('video'); setSelectedFile(null); setMediaPreview(null); setUploadedUrl(''); }}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      adType === 'video'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500 shadow-md'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video Ad (Reels & Popups)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAdType('image'); setSelectedFile(null); setMediaPreview(null); setUploadedUrl(''); }}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      adType === 'image'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500 shadow-md'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Image / Poster Ad</span>
                  </button>
                </div>
              </div>

              {/* AWS S3 File Uploader */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                  <span>Upload Creative to AWS S3 *</span>
                  {uploadedUrl && (
                    <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready on S3</span>
                    </span>
                  )}
                </label>

                <div className="relative border-2 border-dashed border-white/20 hover:border-pink-500/60 rounded-2xl p-4 text-center bg-white/5 transition flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept={adType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  {mediaPreview ? (
                    <div className="w-full flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/20">
                        {adType === 'video' ? (
                          <video src={mediaPreview} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <span className="text-xs font-bold text-white truncate block">
                          {selectedFile?.name || 'Uploaded File'}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : ''}
                        </span>
                        <span className="text-[10px] text-pink-400 font-semibold mt-0.5 block">
                          Click to choose a different file
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-pink-400 mb-1 animate-bounce" />
                      <span className="text-xs font-bold text-white block">
                        Tap to upload {adType === 'video' ? 'Video (MP4 / MOV)' : 'Photo (JPG / PNG)'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Direct upload to AWS S3 • Max {adType === 'video' ? '10 MB' : '5 MB'}
                      </span>
                    </>
                  )}

                  {isUploading && (
                    <div className="w-full mt-2.5">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-pink-300 mt-1 block">Uploading to S3...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Link & CTA Text */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>Destination / Action URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourbrand.com/offer"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Action Button Label
                  </label>
                  <select
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 transition"
                  >
                    <option value="Learn More" className="bg-[#120a24]">Learn More</option>
                    <option value="Shop Now" className="bg-[#120a24]">Shop Now</option>
                    <option value="Claim 50% Off" className="bg-[#120a24]">Claim 50% Off</option>
                    <option value="Visit Website" className="bg-[#120a24]">Visit Website</option>
                    <option value="Download App" className="bg-[#120a24]">Download App</option>
                    <option value="Book Now" className="bg-[#120a24]">Book Now</option>
                    <option value="Contact Us" className="bg-[#120a24]">Contact Us</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isUploading || isSubmitting || !uploadedUrl}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-[#ff007a] to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting Ad Campaign...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Campaign for Review</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* My Submitted Requests Tab */
            <div className="space-y-3">
              {(myAdRequests?.length || 0) === 0 ? (
                <div className="p-8 text-center space-y-2 bg-white/5 rounded-2xl border border-white/5">
                  <Megaphone className="w-10 h-10 text-gray-500 mx-auto" />
                  <p className="text-xs font-bold text-white">No ad requests submitted yet</p>
                  <p className="text-[10px] text-gray-400">
                    Switch to the "Submit New Campaign" tab to submit your brand advertisement.
                  </p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-2 px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs"
                  >
                    Create First Campaign
                  </button>
                </div>
              ) : (
                myAdRequests.map(req => {
                  const isApproved = req.status === 'Approved';
                  const isRejected = req.status === 'Rejected';
                  const isPending = !isApproved && !isRejected;

                  return (
                    <div 
                      key={req.id} 
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-white block truncate">
                            {req.title}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            Brand: <strong className="text-pink-300">{req.brandName}</strong> · {req.date}
                          </span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isRejected
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {/* Creative preview thumbnail & action details */}
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black shrink-0">
                          {req.adType === 'video' ? (
                            <video src={req.mediaUrl} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={req.mediaUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-[10px]">
                          <span className="text-gray-300 block truncate">
                            Link: <a href={req.actionUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">{req.actionUrl}</a>
                          </span>
                          <span className="text-gray-400 block">
                            Button: <strong className="text-white">{req.actionText}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Status note */}
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {isApproved
                          ? '🎉 Your ad has been approved by Admin and is active in live FunFlick video feeds and popups!'
                          : isRejected
                            ? `⚠️ Campaign not approved: ${req.adminNotes || 'Does not meet creative guidelines.'}`
                            : '⏳ Pending verification. FunFlick team will review your creative and contact you via WhatsApp / Phone to confirm publishing.'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
