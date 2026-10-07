import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  X, 
  CheckCircle2, 
  Crown, 
  Eye, 
  Copy,
  ShieldCheck,
  Check,
  Loader2,
  Video,
  BellRing,
  Printer,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const getToken = () =>
  localStorage.getItem('funflick_admin_token') || localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

/**
 * Shared disbursal modal used by both /admin/payouts (creator-level) and
 * /admin/influencer-media (video-level milestone). When `video` is passed,
 * the payout is linked to that video and settles views incrementally.
 */
export const PayoutModal = ({ creator, video = null, isOpen, onClose, onPaidSuccess }) => {
  const { showToast } = useApp();
  const [payAmount, setPayAmount] = useState(2500);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [adminReference, setAdminReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [settleUpTo, setSettleUpTo] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const currentViews = Number(video?.viewsCount) || 0;
  const previousSettled = Number(video?.settledViews) || 0;

  useEffect(() => {
    if (!isOpen) return;
    setReceipt(null);
    setAdminReference('');
    setSettleUpTo(currentViews);
    setAdminNote(video ? `Reward for "${video.title}" — views ${fmt(previousSettled)} → ${fmt(currentViews)}` : '');
    const type = creator?.payoutDetails?.payout_type || creator?.payoutDetails?.payout_method;
    setPaymentMethod(type === 'upi' ? 'UPI Transfer' : 'Bank Transfer');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, creator?.id, video?.id]);

  if (!isOpen || !creator) return null;

  const d = creator.payoutDetails || null;
  const hasDetails = Boolean(
    creator.hasPayoutDetails ?? (d && ((d.account_number && d.ifsc_code) || d.upi_id))
  ) && Boolean(d);
  const detailType = d?.payout_type || d?.payout_method || (d?.upi_id && !d?.account_number ? 'upi' : 'bank');
  const isBank = detailType === 'bank' && d?.account_number;

  const settleNum = parseInt(settleUpTo, 10) || 0;
  const newlySettled = Math.max(0, settleNum - previousSettled);
  const milestoneInvalid = video && (settleNum <= previousSettled || settleNum > currentViews);

  const isSubscribed = Boolean(
    creator.isInfluencer ?? creator.is_influencer ?? (creator.planName && creator.planName !== 'Free User' && creator.subscriptionPlan !== 'Free User')
  );

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRemind = async () => {
    setReminding(true);
    try {
      const token = getToken();
      const res = await fetch('/api/payouts/admin/remind-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ creator_id: creator.id, video_id: video?.id || null })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send reminder');
      showToast(`🔔 ${data.message || 'Reminder sent'}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReminding(false);
    }
  };

  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    if (!isSubscribed) {
      showToast('⚠️ Payouts are strictly reserved for subscribed VIP creators. This creator is on a Free account.', 'error');
      return;
    }
    const num = parseInt(payAmount, 10);
    if (!num || num <= 0) {
      showToast('Please enter a valid payout amount', 'error');
      return;
    }
    if (milestoneInvalid) {
      showToast(`Settled views must be between ${fmt(previousSettled + 1)} and ${fmt(currentViews)}`, 'error');
      return;
    }

    setProcessing(true);
    const token = getToken();
    try {
      const res = await fetch('/api/payouts/admin/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          creator_id: creator.id,
          amount: num,
          payment_method: paymentMethod,
          payment_reference: adminReference.trim(),
          notes: adminNote.trim(),
          ...(video ? { video_id: video.id, settled_views: settleNum } : {})
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to mark payout as paid');

      showToast(`✅ ₹${fmt(num)} marked as paid to ${creator.username}. Creator notified.`, 'success');
      try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } }); } catch (_) {}

      setReceipt(data.payout);
      if (onPaidSuccess) onPaidSuccess(data.payout);
    } catch (err) {
      showToast(err.message || 'Payment mark failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!receipt) return;
    const w = window.open('', '_blank', 'width=640,height=760');
    if (!w) return;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rows = [
      ['Payout ID', `#${receipt.id}`],
      ['Date', receipt.date],
      ['Creator', `${creator.name} (${creator.username})`],
      ['Amount', `₹${fmt(receipt.amount)}`],
      ['Method', receipt.paymentMethod],
      ['UTR / Reference', receipt.paymentReference],
      ...(receipt.videoId ? [
        ['Video', receipt.videoTitle || `#${receipt.videoId}`],
        ['Views settled', `${fmt(receipt.previousSettledViews)} → ${fmt(receipt.settledViews)} (+${fmt(receipt.newlySettledViews)})`]
      ] : []),
      ['Destination', hasDetails ? (isBank ? `${d.bank_name} • ${d.account_number} • ${d.ifsc_code}` : d.upi_id) : 'Registered contact'],
      ['Notes', receipt.notes || '—']
    ];
    w.document.write(`<!doctype html><html><head><title>FunFlick Payout #${esc(receipt.id)}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin:0 0 4px}
      p{color:#666;font-size:12px;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:13px}
      td{padding:10px;border-bottom:1px solid #eee}td:first-child{color:#666;width:38%}
      .f{margin-top:28px;font-size:11px;color:#888}</style></head><body>
      <h1>FunFlick — Creator Payout Voucher</h1><p>Internal accounting record. Funds transferred outside the platform.</p>
      <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
      <div class="f">Generated ${esc(new Date().toLocaleString('en-IN'))}</div>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#110b24] border border-pink-500/30 rounded-3xl p-6 shadow-2xl space-y-4 my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#ff4b2b] to-[#7928ca] flex items-center justify-center text-white shadow-md shadow-pink-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-heading">
                {receipt ? 'Payout Recorded' : video ? 'Video Reward Disbursal' : 'Creator Payout Disbursal'}
              </h3>
              <p className="text-[11px] text-pink-300">Manual outside transfer → record & notify creator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {receipt ? (
          /* ===== Success receipt ===== */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-2xl font-black text-emerald-300 font-heading">₹{fmt(receipt.amount)}</div>
              <div className="text-xs text-gray-300">paid to <strong className="text-white">{creator.name}</strong> ({creator.username})</div>
            </div>
            <div className="text-xs text-gray-300 bg-black/30 rounded-2xl border border-white/10 divide-y divide-white/5">
              {[
                ['Payout ID', `#${receipt.id}`],
                ['UTR / Reference', receipt.paymentReference],
                ['Method', receipt.paymentMethod],
                ...(receipt.videoId ? [
                  ['Video', receipt.videoTitle],
                  ['Views settled', `${fmt(receipt.previousSettledViews)} → ${fmt(receipt.settledViews)} (+${fmt(receipt.newlySettledViews)})`]
                ] : []),
                ['Creator wallet now', `₹${fmt(receipt.walletBalance)}`]
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3.5 py-2">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-white text-right truncate max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 text-center">The creator has been notified and can see this credit in their Wallet.</p>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-200 font-bold text-xs hover:bg-white/15 transition flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Voucher
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs hover:brightness-110 transition">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Creator Info */}
            <div className="p-3.5 rounded-2xl bg-[#181033] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={creator.avatar || '/brand/default-avatar.svg'} 
                  alt={creator.name} 
                  onError={(e) => { e.currentTarget.src = '/brand/default-avatar.svg'; }}
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-pink-500/50 shrink-0" 
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-white text-xs">{creator.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>{creator.planName || creator.subscriptionPlan || 'Creator'}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-pink-300">{creator.username}</span>
                  {creator.metrics && (
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                      <span>Views: <strong className="text-white">{fmt(creator.metrics.totalViews)}</strong></span>
                      <span>Likes: <strong className="text-white">{fmt(creator.metrics.totalLikes)}</strong></span>
                      <span>Videos: <strong className="text-white">{fmt(creator.metrics.videosCount)}</strong></span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 block">Wallet Balance</span>
                <span className="text-sm font-extrabold text-emerald-400 font-heading">₹{fmt(creator.walletBalance)}</span>
              </div>
            </div>

            {/* Non-subscribed Creator Policy Alert */}
            {!isSubscribed && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="block text-white font-bold text-xs">Free Creator Account (Not Subscribed)</strong>
                  <p className="text-[11px] text-amber-300/90 leading-snug">
                    Per platform rules, milestone rewards are strictly reserved for creators with an active VIP Influencer Subscription. Disbursal is disabled.
                  </p>
                </div>
              </div>
            )}

            {/* Video milestone (video-level payouts only) */}
            {video && (
              <div className="p-3.5 rounded-2xl bg-[#181033] border border-cyan-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span className="truncate">{video.title}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-[9px] text-gray-400 block uppercase">Already rewarded</span>
                    <span className="text-xs font-extrabold text-gray-200">{fmt(previousSettled)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-[9px] text-gray-400 block uppercase">Current views</span>
                    <span className="text-xs font-extrabold text-cyan-300">{fmt(currentViews)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[9px] text-gray-400 block uppercase">Settling now</span>
                    <span className="text-xs font-extrabold text-emerald-300">+{fmt(newlySettled)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Settle views up to
                  </label>
                  <input
                    type="number"
                    min={previousSettled + 1}
                    max={currentViews}
                    value={settleUpTo}
                    onChange={e => setSettleUpTo(e.target.value)}
                    className={`w-full bg-[#0f0921] text-white text-xs px-3 py-2 rounded-xl border focus:outline-none font-mono ${milestoneInvalid ? 'border-red-500/60' : 'border-white/10 focus:border-cyan-500'}`}
                  />
                  {milestoneInvalid && (
                    <p className="text-[10px] text-red-300 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {currentViews <= previousSettled
                        ? 'No new views since the last reward on this video.'
                        : `Must be between ${fmt(previousSettled + 1)} and ${fmt(currentViews)}.`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Destination account */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-pink-950/30 border border-pink-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Transfer to</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-pink-300">
                  {hasDetails ? (isBank ? 'Bank Account' : 'UPI') : 'No payout details'}
                </span>
              </div>

              {hasDetails ? (
                <div className="space-y-1.5 text-xs text-gray-300 bg-black/40 p-3 rounded-xl border border-white/5">
                  {isBank ? (
                    <>
                      <div>Bank Name: <strong className="text-white">{d.bank_name}</strong></div>
                      {[['Account Number', d.account_number], ['IFSC Code', d.ifsc_code]].map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between">
                          <span>{label}: <strong className="text-white font-mono">{val}</strong></span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(val, label)}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-pink-300 flex items-center gap-1"
                          >
                            {copiedField === label ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy</span>
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>UPI ID: <strong className="text-white font-mono">{d.upi_id}</strong></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(d.upi_id, 'UPI ID')}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-pink-300 flex items-center gap-1"
                      >
                        {copiedField === 'UPI ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    Phone: {d.contact_phone || d.phone || creator.phone || '—'} • Email: {d.contact_email || d.email || creator.email || '—'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-200 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 space-y-2">
                  <p>This creator hasn't added a Bank Account or UPI ID yet.</p>
                  <p className="text-[11px] text-gray-300">Registered contact: <span className="font-mono text-white">{creator.phone || 'No phone'}</span> • {creator.email || 'No email'}</p>
                  <button
                    type="button"
                    onClick={handleRemind}
                    disabled={reminding}
                    className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {reminding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                    <span>Ask creator to add payout details</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleMarkAsPaid} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-200">Amount transferred (₹)</label>
                  <div className="flex items-center gap-1">
                    {[500, 1000, 2000, 5000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPayAmount(val)}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-pink-300 border border-white/10"
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full bg-[#181033] text-white text-base font-extrabold pl-8 pr-4 py-2.5 rounded-2xl border border-white/15 focus:outline-none focus:border-pink-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                  >
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="UPI Transfer">UPI Transfer (GPay/PhonePe)</option>
                    <option value="Direct Cash">Direct Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">UTR / Reference No.</label>
                  <input
                    type="text"
                    value={adminReference}
                    onChange={e => setAdminReference(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Note (visible in audit ledger)</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Reward for reaching 10,000 views"
                  className="w-full bg-[#181033] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || milestoneInvalid || !isSubscribed}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : !isSubscribed ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                      <span>Subscription Required</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Paid (₹{fmt(parseInt(payAmount || 0, 10))})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
