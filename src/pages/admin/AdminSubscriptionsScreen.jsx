import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Crown, DollarSign, Users, ArrowUpRight } from 'lucide-react';

export const AdminSubscriptionsScreen = () => {
  const [filter, setFilter] = useState('All');

  const subscriptions = [
    { id: 'sub_1', user: 'Srilatha Reddy', username: 'srilatha_16', plan: 'Monthly', price: '₹199', start: '15 Aug 2026', expiry: '15 Sep 2026', status: 'Active' },
    { id: 'sub_2', user: 'Pavani Official', username: 'pavani_official', plan: 'Yearly', price: '₹699', start: '01 Jan 2026', expiry: '01 Jan 2027', status: 'Active' },
    { id: 'sub_3', user: 'Fun Bros', username: 'fun_bros', plan: 'Quarterly', price: '₹499', start: '10 Jun 2026', expiry: '10 Sep 2026', status: 'Active' },
    { id: 'sub_4', user: 'Vikram Joshi', username: 'vikram_j', plan: 'Weekly', price: '₹1,599', start: '18 Aug 2026', expiry: '25 Aug 2026', status: 'Expired' },
    { id: 'sub_5', user: 'Sneha Patel', username: 'sneha_laughs', plan: 'Monthly', price: '₹199', start: '02 Aug 2026', expiry: '02 Sep 2026', status: 'Active' }
  ];

  const filtered = subscriptions.filter(s => {
    if (filter === 'Active') return s.status === 'Active';
    if (filter === 'Expired') return s.status === 'Expired';
    return true;
  });

  return (
    <AdminLayout title="Publishing Subscription Manager">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-1">
          <span className="text-xs text-gray-400">Total Active Subscribers</span>
          <div className="text-2xl font-extrabold text-white font-heading">25,430</div>
          <span className="text-[10px] text-emerald-400 font-bold">+1,240 this week</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-1">
          <span className="text-xs text-gray-400">Monthly Gross Revenue</span>
          <div className="text-2xl font-extrabold text-white font-heading">₹12,45,320</div>
          <span className="text-[10px] text-pink-400 font-bold">From Publishing Passes</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#140e2b] border border-white/5 space-y-1">
          <span className="text-xs text-gray-400">Avg. Retention Rate</span>
          <div className="text-2xl font-extrabold text-white font-heading">84.2%</div>
          <span className="text-[10px] text-blue-400 font-bold">High creator loyalty</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-2">
        {['All', 'Active', 'Expired'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === f
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#120c27] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181135] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">{s.user}</span>
                    <span className="text-[10px] text-pink-300">@{s.username}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{s.plan}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
