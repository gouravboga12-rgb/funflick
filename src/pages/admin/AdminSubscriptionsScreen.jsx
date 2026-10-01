import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { 
  Crown, 
  DollarSign, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Smartphone, 
  Eye, 
  ArrowUpRight, 
  ShieldCheck, 
  Star, 
  AlertCircle, 
  X,
  ExternalLink,
  Layers,
  CheckCircle2,
  TrendingUp,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSubscriptionsScreen = () => {
  const navigate = useNavigate();
  const { 
    publishingPlans, 
    updatePublishingPlan, 
    addPublishingPlan, 
    deletePublishingPlan, 
    resetPublishingPlansToDefault,
    showToast,
    currentUser,
    purchasePublishingSubscription
  } = useApp();

  // Active top-level tab: 'plans' (Manage Plans globally) or 'subscribers' (Subscriber directory)
  const [activeTab, setActiveTab] = useState('plans');

  // Edit / Add Plan Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'create'
  const [editingPlan, setEditingPlan] = useState({
    id: '',
    name: '',
    price: 199,
    period: 'month',
    label: '',
    savings: '',
    popular: false,
    description: '',
    features: []
  });
  const [newFeatureText, setNewFeatureText] = useState('');

  // Subscriber Directory filter & search
  const [subscriberFilter, setSubscriberFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock subscribers list for reporting tab
  const [subscribers, setSubscribers] = useState([
    { id: 'sub_1', user: 'Srilatha Reddy', username: 'srilatha_16', plan: 'Monthly', price: '₹199', start: '15 Aug 2026', expiry: '15 Sep 2026', status: 'Active' },
    { id: 'sub_2', user: 'Pavani Official', username: 'pavani_official', plan: 'Yearly', price: '₹1,499', start: '01 Jan 2026', expiry: '01 Jan 2027', status: 'Active' },
    { id: 'sub_3', user: 'Fun Bros Comedy', username: 'fun_bros', plan: 'Quarterly', price: '₹499', start: '10 Jun 2026', expiry: '10 Sep 2026', status: 'Active' },
    { id: 'sub_4', user: 'Vikram Joshi', username: 'vikram_j', plan: 'Weekly', price: '₹99', start: '18 Aug 2026', expiry: '25 Aug 2026', status: 'Expired' },
    { id: 'sub_5', user: 'Sneha Patel', username: 'sneha_laughs', plan: 'Monthly', price: '₹199', start: '02 Aug 2026', expiry: '02 Sep 2026', status: 'Active' },
    { id: 'sub_6', user: 'Rohan Deshmukh', username: 'rohan_comedy', plan: 'Yearly', price: '₹1,499', start: '12 Feb 2026', expiry: '12 Feb 2027', status: 'Active' },
    { id: 'sub_7', user: 'Ananya Sharma', username: 'ananya_vines', plan: 'Monthly', price: '₹199', start: '28 Jul 2026', expiry: '28 Aug 2026', status: 'Expired' }
  ]);

  // Open modal to edit existing plan
  const handleOpenEdit = (plan) => {
    setModalMode('edit');
    setEditingPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      label: plan.label || '',
      savings: plan.savings || '',
      popular: !!plan.popular,
      description: plan.description || '',
      features: [...(plan.features || [])]
    });
    setNewFeatureText('');
    setModalOpen(true);
  };

  // Open modal to create a new plan
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingPlan({
      id: 'plan_' + Date.now(),
      name: 'Creator VIP Pass',
      price: 299,
      period: 'month',
      label: 'Billed monthly',
      savings: 'Save 25%',
      popular: false,
      description: 'Exclusive tier with verified creator badge & high bandwidth streaming.',
      features: [
        'Unlimited video & reel uploads',
        '24h stories with sound & effects',
        'Creator Studio analytics & metrics',
        'Direct fan subscriptions & badges'
      ]
    });
    setNewFeatureText('');
    setModalOpen(true);
  };

  // Save changes from modal
  const handleSavePlan = (e) => {
    e.preventDefault();
    if (!editingPlan.name.trim()) {
      showToast('Plan name is required', 'error');
      return;
    }
    if (editingPlan.price <= 0) {
      showToast('Price must be greater than 0', 'error');
      return;
    }

    if (modalMode === 'edit') {
      updatePublishingPlan(editingPlan);
    } else {
      addPublishingPlan(editingPlan);
    }
    setModalOpen(false);
  };

  // Toggle popular directly on a card
  const handleTogglePopular = (plan) => {
    updatePublishingPlan({
      ...plan,
      popular: !plan.popular
    });
  };

  // Add feature to current editing plan
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setEditingPlan(prev => ({
      ...prev,
      features: [...prev.features, newFeatureText.trim()]
    }));
    setNewFeatureText('');
  };

  // Remove feature from current editing plan
  const handleRemoveFeature = (idx) => {
    setEditingPlan(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  // Delete plan handler
  const handleDelete = (planId) => {
    if (publishingPlans.length <= 1) {
      showToast('You must keep at least 1 active subscription plan on the platform!', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to remove this plan from the user side?')) {
      deletePublishingPlan(planId);
    }
  };

  // Filtered subscribers list
  const filteredSubscribers = subscribers.filter(s => {
    const matchesFilter = subscriberFilter === 'All' ? true : s.status === subscriberFilter;
    const matchesSearch = s.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.plan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout title="Manage Subscriptions">
      <div className="space-y-6">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'plans'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Platform Publishing Plans</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-pink-200">
                {publishingPlans.length} Active
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'subscribers'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Subscriber Directory</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-gray-300">
                {subscribers.length}
              </span>
            </button>
          </div>

          {/* Quick Real-Time Sync Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Live Synced Globally with User App</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MANAGE PLATFORM PLANS (GLOBAL USER PRICING) */}
        {/* ============================================================== */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            
            {/* Action Bar & Info Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-[#120a26] border border-pink-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <h3 className="font-bold text-white text-sm font-heading">
                    User-Side Subscription Pricing Engine
                  </h3>
                </div>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Edit, add, or customize publishing subscription tiers. Any updates made here are reflected immediately on the mobile app's <strong>Publishing Gate Modal</strong> and <strong>Subscription Screen</strong> for all users.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={resetPublishingPlansToDefault}
                  title="Reset to original default pricing"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:brightness-110 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Plan</span>
                </button>
              </div>
            </div>

            {/* Main Section: Plan Cards Grid + Live Mobile Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Existing Platform Plans List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pink-400" />
                    <span>Active Platform Subscription Plans ({publishingPlans.length})</span>
                  </h4>
                  <span className="text-[11px] text-gray-400">Click Edit to alter price, period, or perks</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publishingPlans.map((plan) => {
                    const isPopular = plan.popular;
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-3xl p-5 border flex flex-col justify-between transition-all group ${
                          isPopular
                            ? 'bg-gradient-to-b from-[#1c1238] to-[#120a24] border-pink-500/60 shadow-xl shadow-pink-500/15 ring-1 ring-pink-500/30'
                            : 'bg-[#120c27] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Popular / Savings Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-semibold text-pink-300">
                            ID: <code className="text-gray-400">{plan.id}</code>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isPopular && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white shadow-sm flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> MOST POPULAR
                              </span>
                            )}
                            {plan.savings && !isPopular && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/80 text-white">
                                {plan.savings}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title and Price */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-baseline justify-between">
                            <h3 className="text-lg font-extrabold text-white font-heading">
                              {plan.name}
                            </h3>
                            <div className="text-right">
                              <span className="text-2xl font-extrabold text-white font-heading">
                                {plan.formattedPrice || `₹${plan.price}`}
                              </span>
                              <span className="text-xs text-gray-400 block -mt-1">
                                /{plan.period}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-pink-300 font-medium">
                            {plan.label || `Billed ${plan.period}`}
                          </p>
                          <p className="text-xs text-gray-400 pt-1 line-clamp-2">
                            {plan.description}
                          </p>
                        </div>

                        {/* Features List */}
                        <div className="py-3 border-t border-b border-white/10 space-y-1.5 my-2 flex-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Included Creator Perks:
                          </span>
                          {(plan.features || []).map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>

                        {/* Card Footer Controls */}
                        <div className="pt-3 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleTogglePopular(plan)}
                            title={isPopular ? 'Remove popular tag' : 'Set as most popular'}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                              isPopular
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isPopular ? 'fill-current text-pink-400' : ''}`} />
                            <span>{isPopular ? 'Featured' : 'Make Featured'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(plan)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 transition"
                              title="Delete Plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Live Mobile Paywall Preview Simulator */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Live User Paywall Simulator</span>
                  </h4>
                  <button 
                    onClick={() => navigate('/subscription')}
                    className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Simulated Phone Frame */}
                <div className="bg-[#090514] border-2 border-white/10 rounded-[36px] p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between max-w-sm mx-auto">
                  {/* Phone Notch & Status bar */}
                  <div className="flex items-center justify-between px-3 py-1 text-[10px] text-gray-400 border-b border-white/5 mb-3">
                    <span className="font-semibold text-white">9:41</span>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto" />
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-2.5 h-2 rounded-sm bg-gray-400" />
                    </div>
                  </div>

                  {/* Header in simulated app */}
                  <div className="text-center space-y-1 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff007a] to-[#7928ca] flex items-center justify-center text-white mx-auto shadow-md">
                      <Crown className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white font-heading">
                      Unlock FunFlick Creator Suite
                    </h5>
                    <p className="text-[10px] text-gray-400">
                      Live preview of dynamic plans on user device:
                    </p>
                  </div>

                  {/* Plans inside preview */}
                  <div className="space-y-2 mb-4">
                    {publishingPlans.slice(0, 3).map((p, idx) => (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-2xl border text-left transition ${
                          idx === 0
                            ? 'bg-gradient-to-r from-pink-950/60 to-purple-950/60 border-[#ff007a]'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              idx === 0 ? 'border-[#ff007a] bg-[#ff007a]' : 'border-gray-500'
                            }`}>
                              {idx === 0 && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{p.name}</span>
                                {p.popular && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-[#ff007a] text-white">
                                    POPULAR
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-gray-400">{p.label}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-white">{p.formattedPrice || `₹${p.price}`}</span>
                            <span className="text-[9px] text-gray-400 block -mt-1">/{p.period}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Simulator action button */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        const topPlan = publishingPlans[0];
                        purchasePublishingSubscription(topPlan?.id || 'monthly');
                        showToast(`Simulated subscription purchase with ${topPlan?.name || 'Monthly'} plan!`, 'success');
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
                    >
                      Subscribe & Unlock Publishing
                    </button>
                    <p className="text-[9px] text-center text-gray-400">
                      User Status: {currentUser.hasPublishingSubscription ? '✅ Active Member' : '🔒 Free Viewer'}
                    </p>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero Backend Friction</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Plan revisions persist in <code>localStorage</code> immediately. Any test viewer in the prototype can trigger publishing gates and experience live plan pricing.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SUBSCRIBER DIRECTORY & TRANSACTIONS */}
        {/* ============================================================== */}
        {activeTab === 'subscribers' && (
          <div className="space-y-5">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-1">
                <span className="text-xs text-gray-400">Total Active Subscribers</span>
                <div className="text-2xl font-extrabold text-white font-heading">38</div>
                <span className="text-[10px] text-emerald-400 font-bold">+4 new this week</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-1">
                <span className="text-xs text-gray-400">Monthly Gross Revenue</span>
                <div className="text-2xl font-extrabold text-white font-heading">₹12,450</div>
                <span className="text-[10px] text-pink-400 font-bold">From Publishing Passes</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-1">
                <span className="text-xs text-gray-400">Avg. Creator Retention</span>
                <div className="text-2xl font-extrabold text-white font-heading">92.4%</div>
                <span className="text-[10px] text-blue-400 font-bold">High publishing retention</span>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {['All', 'Active', 'Expired'].map(f => (
                  <button
                    key={f}
                    onClick={() => setSubscriberFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      subscriberFilter === f
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search user, username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#140e2b] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-[#120c27] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181135] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Plan Tier</th>
                      <th className="py-3.5 px-4">Price Paid</th>
                      <th className="py-3.5 px-4">Start Date</th>
                      <th className="py-3.5 px-4">Renewal / Expiry</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {filteredSubscribers.map(s => (
                      <tr key={s.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{s.user}</span>
                          <span className="text-[10px] text-pink-300">@{s.username}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white">{s.plan}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white font-heading">{s.price}</td>
                        <td className="py-3.5 px-4 text-gray-400">{s.start}</td>
                        <td className="py-3.5 px-4 text-gray-400">{s.expiry}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => showToast(`VIP Extension granted to @${s.username}!`, 'success')}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 hover:text-white transition"
                          >
                            Extend Pass
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* EDIT / CREATE PLAN MODAL */}
        {/* ============================================================== */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#140e2b] border border-pink-500/30 rounded-3xl p-6 shadow-2xl shadow-pink-500/20 max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base font-heading">
                        {modalMode === 'edit' ? 'Edit Publishing Plan' : 'Create New Subscription Plan'}
                      </h3>
                      <p className="text-[11px] text-pink-300">
                        Updates apply instantly to user-side paywalls
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSavePlan} className="mt-4 space-y-4">
                  
                  {/* Plan Name & ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300">Plan Name</label>
                      <input
                        type="text"
                        required
                        value={editingPlan.name}
                        onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        placeholder="e.g. Monthly Pass, Creator VIP"
                        className="w-full bg-[#1b1338] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300">Plan Identifier (Key)</label>
                      <input
                        type="text"
                        disabled={modalMode === 'edit'}
                        value={editingPlan.id}
                        onChange={e => setEditingPlan({ ...editingPlan, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        placeholder="e.g. monthly_pro"
                        className="w-full bg-[#1b1338] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 disabled:opacity-60 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Price & Billing Period */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300">Price (INR ₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          required
                          min="1"
                          value={editingPlan.price}
                          onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                          placeholder="199"
                          className="w-full bg-[#1b1338] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-bold font-heading focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300">Billing Period</label>
                      <select
                        value={editingPlan.period}
                        onChange={e => setEditingPlan({ ...editingPlan, period: e.target.value })}
                        className="w-full bg-[#1b1338] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="month">Per Month (month)</option>
                        <option value="quarter">Per Quarter (3 months)</option>
                        <option value="year">Per Year (year)</option>
                        <option value="week">Per Week (week)</option>
                        <option value="day">Per Day (day)</option>
                      </select>
                    </div>
                  </div>

                  {/* Subtitle Label & Savings text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300">Subtitle / Label</label>
                      <input
                        type="text"
                        value={editingPlan.label}
                        onChange={e => setEditingPlan({ ...editingPlan, label: e.target.value })}
                        placeholder="e.g. Billed annually, Save 35%"
                        className="w-full bg-[#1b1338] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300">Savings Badge Text</label>
                      <input
                        type="text"
                        value={editingPlan.savings}
                        onChange={e => setEditingPlan({ ...editingPlan, savings: e.target.value })}
                        placeholder="e.g. Save 35%"
                        className="w-full bg-[#1b1338] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  {/* Most Popular Badge Checkbox */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Feature as "MOST POPULAR"
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Adds a highlighted gradient ring & badge on user screens
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingPlan.popular}
                      onChange={e => setEditingPlan({ ...editingPlan, popular: e.target.checked })}
                      className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Plan Description</label>
                    <textarea
                      rows={2}
                      value={editingPlan.description}
                      onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      placeholder="Brief summary displayed under the plan header"
                      className="w-full bg-[#1b1338] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Included Features Editor */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 block">
                      Included Creator Features & Perks
                    </label>
                    
                    <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar pr-1">
                      {editingPlan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-200">
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-gray-400 hover:text-red-400 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newFeatureText}
                        onChange={e => setNewFeatureText(e.target.value)}
                        placeholder="Add new perk (e.g. 4K Video Quality)..."
                        className="flex-1 bg-[#1b1338] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:brightness-110 transition"
                    >
                      Save Plan Globally
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
};
